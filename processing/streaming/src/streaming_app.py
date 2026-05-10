"""
Kafka -> Redis hot path processor.

Consumes contract v1 market events from Kafka, aggregates 1 minute OHLC
candles, persists the current and closed candles to Redis, and emits JSON
price alerts when a closed candle moves beyond a configured threshold.
"""

import json
import logging
import os
import signal
import sys
from dataclasses import dataclass, field
from decimal import Decimal
from pathlib import Path
from typing import Dict, Optional

from kafka import KafkaConsumer
from jsonschema import Draft202012Validator
from redis import Redis


logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("StreamingApp")

ROOT_DIR = Path(__file__).resolve().parents[3]
CONTRACT_PATH = ROOT_DIR / "docs" / "contracts" / "contract.v1.json"
MINUTE_MS = 60_000


def decimal_to_str(value: Decimal) -> str:
    normalized = value.normalize()
    if normalized == normalized.to_integral():
        return format(normalized, "f").split(".")[0]
    return format(normalized, "f").rstrip("0").rstrip(".")


def floor_to_minute(timestamp_ms: int) -> int:
    return (timestamp_ms // MINUTE_MS) * MINUTE_MS


@dataclass
class MinuteCandle:
    symbol: str
    exchange: str = "binance"
    interval: str = "1m"
    bucket_start_ms: int = 0
    source: str = "stream_ohlc_1m"
    open: Decimal = field(default_factory=lambda: Decimal("0"))
    high: Decimal = field(default_factory=lambda: Decimal("0"))
    low: Decimal = field(default_factory=lambda: Decimal("0"))
    close: Decimal = field(default_factory=lambda: Decimal("0"))
    volume: Decimal = field(default_factory=lambda: Decimal("0"))
    trade_count: int = 0
    first_event_time: int = 0
    last_event_time: int = 0

    @property
    def bucket_end_ms(self) -> int:
        return self.bucket_start_ms + MINUTE_MS - 1

    def update(self, event_time_ms: int, price: Decimal, quantity: Decimal) -> None:
        if self.trade_count == 0:
            self.bucket_start_ms = floor_to_minute(event_time_ms)
            self.open = price
            self.high = price
            self.low = price
            self.first_event_time = event_time_ms
        else:
            self.high = max(self.high, price)
            self.low = min(self.low, price)

        self.close = price
        self.volume += quantity
        self.trade_count += 1
        self.last_event_time = event_time_ms

    def to_payload(self, status: str, emitted_at_ms: int) -> dict:
        return {
            "schema_version": 1,
            "type": "ohlc_candle",
            "status": status,
            "exchange": self.exchange,
            "symbol": self.symbol,
            "interval": self.interval,
            "bucket_start": self.bucket_start_ms,
            "bucket_end": self.bucket_end_ms,
            "first_event_time": self.first_event_time,
            "last_event_time": self.last_event_time,
            "trade_count": self.trade_count,
            "open": decimal_to_str(self.open),
            "high": decimal_to_str(self.high),
            "low": decimal_to_str(self.low),
            "close": decimal_to_str(self.close),
            "volume": decimal_to_str(self.volume),
            "source": self.source,
            "emitted_at": emitted_at_ms,
        }


class StreamingApp:
    """Hot path processor that writes OHLC and alerts to Redis."""

    def __init__(self):
        self.kafka_broker = os.getenv("KAFKA_BROKER", "localhost:9094")
        self.kafka_topic = os.getenv("KAFKA_TOPIC", "market_events")
        self.kafka_group_id = os.getenv("KAFKA_GROUP_ID", "streaming-hot-path")
        self.auto_offset_reset = os.getenv("AUTO_OFFSET_RESET", "latest")

        self.redis_host = os.getenv("REDIS_HOST", "localhost")
        self.redis_port = int(os.getenv("REDIS_PORT", "6379"))
        self.redis_db = int(os.getenv("REDIS_DB", "0"))
        self.redis_password = os.getenv("REDIS_PASSWORD") or None

        self.redis_ohlc_prefix = os.getenv("REDIS_OHLC_PREFIX", "hotpath:ohlc:1m")
        self.redis_alert_list_key = os.getenv("REDIS_ALERT_LIST_KEY", "hotpath:alerts")
        self.redis_alert_channel = os.getenv(
            "REDIS_ALERT_CHANNEL",
            "hotpath:alerts:channel",
        )
        self.redis_history_limit = int(os.getenv("REDIS_HISTORY_LIMIT", "120"))
        self.alert_move_threshold_pct = Decimal(os.getenv("ALERT_MOVE_PCT", "0.5"))

        symbols = os.getenv("SYMBOLS", "")
        self.symbol_filter = {
            symbol.strip().upper()
            for symbol in symbols.split(",")
            if symbol.strip()
        }

        self.consumer: Optional[KafkaConsumer] = None
        self.redis: Optional[Redis] = None
        self.validator = self._load_contract_validator()
        self.active_candles: Dict[str, MinuteCandle] = {}

        self.running = False
        self._shutdown_reported = False

        self.processed_messages = 0
        self.invalid_messages = 0
        self.skipped_messages = 0
        self.late_messages = 0
        self.candles_closed = 0
        self.alerts_emitted = 0

    def _load_contract_validator(self):
        if not CONTRACT_PATH.exists():
            logger.warning("Contract file not found: %s", CONTRACT_PATH)
            return None

        with CONTRACT_PATH.open("r", encoding="utf-8") as file_handle:
            schema = json.load(file_handle)

        logger.info("✓ Loaded contract schema from %s", CONTRACT_PATH)
        return Draft202012Validator(schema)

    def _build_consumer(self):
        return KafkaConsumer(
            self.kafka_topic,
            bootstrap_servers=[self.kafka_broker],
            group_id=self.kafka_group_id,
            auto_offset_reset=self.auto_offset_reset,
            enable_auto_commit=True,
            value_deserializer=lambda payload: payload.decode("utf-8"),
            consumer_timeout_ms=1000,
        )

    def _build_redis(self):
        return Redis(
            host=self.redis_host,
            port=self.redis_port,
            db=self.redis_db,
            password=self.redis_password,
            decode_responses=True,
        )

    def _validate_event(self, event):
        if self.validator is None:
            return []

        return sorted(
            self.validator.iter_errors(event),
            key=lambda error: list(error.path),
        )

    def _matches_symbol_filter(self, event):
        if not self.symbol_filter:
            return True

        event_symbol = str(event.get("symbol", "")).upper()
        return event_symbol in self.symbol_filter

    def _print_banner(self):
        print("\n" + "=" * 86)
        print("STREAMING - KAFKA TO REDIS HOT PATH")
        print("=" * 86)
        print(f"Kafka broker        : {self.kafka_broker}")
        print(f"Kafka topic         : {self.kafka_topic}")
        print(f"Kafka group id      : {self.kafka_group_id}")
        print(f"Offset reset        : {self.auto_offset_reset}")
        print(f"Redis host          : {self.redis_host}:{self.redis_port}/{self.redis_db}")
        print(f"OHLC prefix         : {self.redis_ohlc_prefix}")
        print(f"Alert threshold pct : {decimal_to_str(self.alert_move_threshold_pct)}")
        if self.symbol_filter:
            print(f"Symbol filter       : {', '.join(sorted(self.symbol_filter))}")
        else:
            print("Symbol filter       : (disabled)")
        print("\nProcessing market_events -> 1m OHLC -> Redis + price alerts")
        print("Ctrl+C to stop")
        print("=" * 86 + "\n")

    def _redis_key_for_symbol(self, symbol: str, suffix: str) -> str:
        return f"{self.redis_ohlc_prefix}:{symbol}:{suffix}"

    def _write_redis_json(self, key: str, payload: dict) -> None:
        if self.redis is None:
            raise RuntimeError("Redis client is not initialized")

        encoded = json.dumps(payload, ensure_ascii=False)
        self.redis.set(key, encoded)

    def _append_history(self, key: str, payload: dict) -> None:
        if self.redis is None:
            raise RuntimeError("Redis client is not initialized")

        encoded = json.dumps(payload, ensure_ascii=False)
        pipe = self.redis.pipeline(transaction=False)
        pipe.rpush(key, encoded)
        pipe.ltrim(key, -self.redis_history_limit, -1)
        pipe.execute()

    def _persist_candle_snapshot(self, candle: MinuteCandle) -> None:
        emitted_at_ms = _now_ms()
        payload = candle.to_payload(status="partial", emitted_at_ms=emitted_at_ms)
        current_key = self._redis_key_for_symbol(candle.symbol, "current")
        encoded = json.dumps(payload, ensure_ascii=False)
        self._write_redis_json(current_key, payload)
        self.redis.publish(self.redis_ohlc_prefix + ":channel", encoded)
        logger.info(
            "[%s] partial candle updated open=%s high=%s low=%s close=%s volume=%s trades=%s",
            candle.symbol,
            payload["open"],
            payload["high"],
            payload["low"],
            payload["close"],
            payload["volume"],
            payload["trade_count"],
        )

    def _build_price_alert(self, candle: MinuteCandle, emitted_at_ms: int) -> dict:
        change_abs = candle.close - candle.open
        change_pct = (change_abs / candle.open) * Decimal("100") if candle.open != 0 else Decimal("0")
        direction = "up" if change_abs > 0 else "down" if change_abs < 0 else "flat"
        severity = "critical" if abs(change_pct) >= Decimal("2") else "warning" if abs(change_pct) >= Decimal("1") else "info"

        return {
            "schema_version": 1,
            "type": "price_alert",
            "alert_type": "price_move",
            "severity": severity,
            "exchange": candle.exchange,
            "symbol": candle.symbol,
            "interval": candle.interval,
            "bucket_start": candle.bucket_start_ms,
            "bucket_end": candle.bucket_end_ms,
            "open": decimal_to_str(candle.open),
            "close": decimal_to_str(candle.close),
            "change_abs": decimal_to_str(change_abs),
            "change_pct": decimal_to_str(change_pct),
            "direction": direction,
            "threshold_pct": decimal_to_str(self.alert_move_threshold_pct),
            "trade_count": candle.trade_count,
            "source": "stream_price_alert_1m",
            "message": (
                f"{candle.symbol} moved {decimal_to_str(change_pct)}% on {candle.interval} candle"
            ),
            "created_at": emitted_at_ms,
        }

    def _emit_closed_candle(self, candle: MinuteCandle) -> None:
        emitted_at_ms = _now_ms()
        payload = candle.to_payload(status="closed", emitted_at_ms=emitted_at_ms)
        latest_key = self._redis_key_for_symbol(candle.symbol, "latest")
        history_key = self._redis_key_for_symbol(candle.symbol, "history")

        self._write_redis_json(latest_key, payload)
        self._append_history(history_key, payload)
        self.redis.publish(self.redis_ohlc_prefix + ":channel", json.dumps(payload, ensure_ascii=False))

        self.candles_closed += 1
        logger.info(
            "[%s] closed 1m candle open=%s high=%s low=%s close=%s volume=%s trades=%s",
            candle.symbol,
            payload["open"],
            payload["high"],
            payload["low"],
            payload["close"],
            payload["volume"],
            payload["trade_count"],
        )

        change_pct = abs((candle.close - candle.open) / candle.open * Decimal("100")) if candle.open != 0 else Decimal("0")
        if change_pct >= self.alert_move_threshold_pct:
            alert_payload = self._build_price_alert(candle, emitted_at_ms)
            alert_encoded = json.dumps(alert_payload, ensure_ascii=False)
            pipe = self.redis.pipeline(transaction=False)
            pipe.rpush(self.redis_alert_list_key, alert_encoded)
            pipe.ltrim(self.redis_alert_list_key, -self.redis_history_limit, -1)
            pipe.publish(self.redis_alert_channel, alert_encoded)
            pipe.execute()

            self.alerts_emitted += 1
            logger.info(
                "[%s] price alert emitted change_pct=%s threshold=%s",
                candle.symbol,
                alert_payload["change_pct"],
                alert_payload["threshold_pct"],
            )

    def _process_trade_event(self, event):
        symbol = str(event["symbol"]).upper()
        event_time_ms = int(event["event_time"])
        bucket_start_ms = floor_to_minute(event_time_ms)
        price = Decimal(str(event["price"]))
        quantity = Decimal(str(event.get("quantity", "0")))

        candle = self.active_candles.get(symbol)

        if candle is None:
            candle = MinuteCandle(symbol=symbol, exchange=str(event.get("exchange", "binance")))
            candle.update(event_time_ms, price, quantity)
            self.active_candles[symbol] = candle
            self._persist_candle_snapshot(candle)
            return

        if bucket_start_ms < candle.bucket_start_ms:
            self.late_messages += 1
            logger.warning(
                "[%s] late trade ignored event_time=%s bucket_start=%s active_bucket=%s",
                symbol,
                event_time_ms,
                bucket_start_ms,
                candle.bucket_start_ms,
            )
            return

        if bucket_start_ms > candle.bucket_start_ms:
            self._emit_closed_candle(candle)
            candle = MinuteCandle(symbol=symbol, exchange=str(event.get("exchange", "binance")))
            candle.update(event_time_ms, price, quantity)
            self.active_candles[symbol] = candle
            self._persist_candle_snapshot(candle)
            return

        candle.update(event_time_ms, price, quantity)
        self._persist_candle_snapshot(candle)

    def _consume_messages(self):
        while self.running:
            batches = self.consumer.poll(timeout_ms=1000, max_records=100)
            if not batches:
                continue

            for _topic_partition, records in batches.items():
                for record in records:
                    raw_payload = record.value

                    try:
                        event = json.loads(raw_payload)
                    except json.JSONDecodeError:
                        self.invalid_messages += 1
                        logger.warning("Invalid JSON payload: %s", raw_payload)
                        continue

                    validation_errors = self._validate_event(event)
                    if validation_errors:
                        self.invalid_messages += 1
                        first_error = validation_errors[0]
                        logger.warning(
                            "Contract validation failed for symbol=%s: %s",
                            event.get("symbol", "unknown"),
                            first_error.message,
                        )
                        continue

                    if str(event.get("event_type", "")).lower() != "trade":
                        self.skipped_messages += 1
                        continue

                    if not self._matches_symbol_filter(event):
                        self.skipped_messages += 1
                        continue

                    self.processed_messages += 1
                    self._process_trade_event(event)

    def _flush_active_candles(self):
        for symbol, candle in list(self.active_candles.items()):
            if candle.trade_count > 0:
                self._emit_closed_candle(candle)

    def start(self):
        self.running = True
        self._print_banner()

        try:
            self.redis = self._build_redis()
            self.redis.ping()
            logger.info("✓ Connected to Redis")

            self.consumer = self._build_consumer()
            logger.info("✓ Connected to Kafka")

            self._consume_messages()
        except KeyboardInterrupt:
            print("\n\nShutting down...")
        except Exception as exc:
            logger.error("Error: %s", exc)
        finally:
            self.stop()

    def stop(self):
        if self._shutdown_reported:
            return

        self._shutdown_reported = True
        self.running = False

        try:
            if self.consumer is not None:
                self.consumer.close()
        finally:
            self.consumer = None

        try:
            self._flush_active_candles()
        except Exception as exc:
            logger.warning("Failed to flush active candles: %s", exc)

        try:
            if self.redis is not None:
                self.redis.close()
        finally:
            self.redis = None

        print(
            "✓ Streaming stopped. "
            f"processed={self.processed_messages}, invalid={self.invalid_messages}, skipped={self.skipped_messages}, "
            f"late={self.late_messages}, closed_candles={self.candles_closed}, alerts={self.alerts_emitted}"
        )


def _now_ms() -> int:
    return int(__import__("time").time() * 1000)


def main():
    app = StreamingApp()
    app.start()


if __name__ == "__main__":
    main()
