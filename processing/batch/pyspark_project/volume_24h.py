import argparse
import os
from datetime import datetime, timezone

from pyspark.sql.functions import (
    col,
    count,
    current_timestamp,
    expr,
    lit,
    max as spark_max,
    min as spark_min,
    sum as spark_sum,
    to_timestamp,
)
from pyspark.sql.types import DecimalType

from common import create_spark_session, ensure_bucket_for_path, raw_events_path, volume_24h_output_path


def parse_args():
    parser = argparse.ArgumentParser(
        description="Calculate rolling 24h trading volume from raw market-event Parquet data."
    )
    parser.add_argument(
        "--input",
        default=raw_events_path(),
        help="Input raw Parquet path produced by kafka_to_minio.py.",
    )
    parser.add_argument(
        "--output",
        default=volume_24h_output_path(),
        help="Output Parquet path for 24h volume aggregates.",
    )
    parser.add_argument(
        "--lookback-hours",
        type=int,
        default=int(os.getenv("VOLUME_LOOKBACK_HOURS", "24")),
        help="Rolling lookback window size in hours.",
    )
    parser.add_argument(
        "--window-end",
        default=os.getenv("VOLUME_24H_WINDOW_END", ""),
        help="Optional UTC window end, for example 2026-04-30T12:00:00Z.",
    )
    parser.add_argument(
        "--use-max-event-time",
        action="store_true",
        default=os.getenv("VOLUME_24H_USE_MAX_EVENT_TIME", "").lower() in {"1", "true", "yes"},
        help="Use the latest event_timestamp in the input as the window end.",
    )
    parser.add_argument(
        "--symbols",
        default=os.getenv("VOLUME_SYMBOLS", ""),
        help="Optional comma-separated symbol filter, for example BTCUSDT,ETHUSDT.",
    )
    parser.add_argument(
        "--mode",
        default=os.getenv("VOLUME_24H_WRITE_MODE", "overwrite"),
        choices=["append", "overwrite", "ignore", "error", "errorifexists"],
        help="Output write mode.",
    )
    parser.add_argument(
        "--app-name",
        default=os.getenv("SPARK_APP_NAME", "Volume24hBatchJob"),
        help="Spark application name.",
    )
    return parser.parse_args()


def parse_utc_datetime(value):
    normalized = value.strip()
    if normalized.endswith("Z"):
        normalized = f"{normalized[:-1]}+00:00"

    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc).replace(tzinfo=None)


def spark_timestamp_literal(value):
    return to_timestamp(lit(value.strftime("%Y-%m-%d %H:%M:%S")), "yyyy-MM-dd HH:mm:ss")


def resolve_window_end(raw_df, args):
    if args.window_end:
        return parse_utc_datetime(args.window_end)

    if args.use_max_event_time:
        latest_row = raw_df.select(spark_max("event_timestamp").alias("window_end")).first()
        if latest_row is None or latest_row["window_end"] is None:
            return None
        latest_event_time = latest_row["window_end"]
        if latest_event_time.tzinfo is not None:
            latest_event_time = latest_event_time.astimezone(timezone.utc).replace(tzinfo=None)
        return latest_event_time

    return None


def main():
    args = parse_args()
    spark = create_spark_session(args.app_name)
    spark.sparkContext.setLogLevel(os.getenv("SPARK_LOG_LEVEL", "WARN"))

    try:
        ensure_bucket_for_path(args.output)

        raw_df = spark.read.parquet(args.input)
        trade_df = raw_df.filter(
            (col("event_type") == "trade")
            & col("event_timestamp").isNotNull()
            & col("quantity_decimal").isNotNull()
            & col("volume_quote").isNotNull()
        )

        symbols = [symbol.strip().upper() for symbol in args.symbols.split(",") if symbol.strip()]
        if symbols:
            trade_df = trade_df.filter(col("symbol").isin(symbols))

        resolved_window_end = resolve_window_end(trade_df, args)
        if resolved_window_end is None:
            window_end_column = current_timestamp()
            window_end_text = "current_timestamp()"
        else:
            window_end_column = spark_timestamp_literal(resolved_window_end)
            window_end_text = resolved_window_end.isoformat(timespec="seconds") + "Z"

        windowed_df = (
            trade_df.withColumn("window_end", window_end_column)
            .withColumn("window_start", expr(f"window_end - INTERVAL {args.lookback_hours} HOURS"))
            .filter(col("event_timestamp") >= col("window_start"))
            .filter(col("event_timestamp") <= col("window_end"))
        )

        result_df = (
            windowed_df.groupBy("exchange", "symbol", "window_start", "window_end")
            .agg(
                spark_sum("quantity_decimal").cast(DecimalType(38, 18)).alias("volume_base_24h"),
                spark_sum("volume_quote").cast(DecimalType(38, 18)).alias("volume_quote_24h"),
                count("*").alias("trade_count_24h"),
                spark_min("event_timestamp").alias("first_event_timestamp"),
                spark_max("event_timestamp").alias("last_event_timestamp"),
            )
            .withColumn("lookback_hours", lit(args.lookback_hours))
            .withColumn("computed_at", current_timestamp())
        )

        result_count = result_df.count()
        result_df.write.mode(args.mode).partitionBy("symbol").parquet(args.output)

        print(
            "Volume 24h completed: "
            f"input={args.input}, output={args.output}, rows={result_count}, "
            f"window_end={window_end_text}, lookback_hours={args.lookback_hours}"
        )
    finally:
        spark.stop()


if __name__ == "__main__":
    main()
