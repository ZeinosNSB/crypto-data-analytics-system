# Kafka Streaming - Hot Path Processing

## Overview
Xử lý hot path theo thời gian thực. **Week 1**: Consume `market_events` từ Kafka, tính OHLC 1m, ghi Redis và phát JSON alert giá.

**Team Member:** Ngô Thành Nam (Streaming Data Engineer)

## Architecture (Week 1)
```
Socket/Console Input
    ↓
  Python hot-path processor
    ├─ Parse JSON
    ├─ Validate contract v1
    ├─ Build 1m OHLC state
    ├─ Write Redis snapshot/history
    └─ Emit price alert JSON
    ↓
Redis + Console
```

## Tech Stack
  - **Python Kafka Consumer**: Real-time hot-path loop
- **Kafka**: Message broker (source)
  - **Redis**: Hot cache for latest candles and alerts
- **Python**: Application code
- **jsonschema**: Data validation
   - **redis**: Redis client

## Week 1: Project Initialization & Setup ✅

### ✅ Deliverables Completed
- [x] Data contract definition (`contract.json`) - Unified schema
- [x] Kafka consumer application (`streaming_app.py`)
- [x] Contract validation against `docs/contracts/contract.v1.json`
- [x] 1-minute OHLC aggregation for trade events
- [x] Redis candle snapshots and history list
- [x] Price alert JSON emitted to Redis list/channel
- [x] Environment configuration via `.env`
- [x] Dependencies specification (`requirements.txt`)

### 🔄 Architecture Updates (vs. Original Plan)
| Component | Original | Updated |
|-----------|----------|---------|
| Streaming API | Socket demo | **Kafka consumer loop** |
| Data Source | localhost:9999 | **Kafka topic `market_events`** |
| Data Shape | Raw lines | **JSON contract v1** |
| Output | Console only | **Redis + Console** |
| Validation | None | **JSON Schema validation** |

## 🚀 Quick Start

### Prerequisites
```
✓ Python 3.9+
✓ Kafka 3.x
✓ Redis 7.x
✓ Python 3.9+
✓ Docker Compose (recommended)
```

### Setup
```bash
# 1. Clone and navigate to streaming directory
cd processing/streaming

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env with your Kafka broker and topic
```

### Run the Application

**Terminal 1: Start streaming consumer**
```bash
cd src
python streaming_app.py
```

You should see:
```
======================================================================
STREAMING - KAFKA CONSUMER FOR MARKET EVENTS
======================================================================
Kafka broker : localhost:9094
Kafka topic  : market_events
Group id     : streaming-processor

Waiting for events from ingestion... Ctrl+C to stop
======================================================================
```

**Terminal 2: Run ingestion collector**

Start the collector so it publishes `market_events` into Kafka. The streaming app will consume and print summaries automatically.

### Redis Keys

- Latest candle: `hotpath:ohlc:1m:<SYMBOL>:latest`
- Current candle snapshot: `hotpath:ohlc:1m:<SYMBOL>:current`
- Candle history list: `hotpath:ohlc:1m:<SYMBOL>:history`
- Alert list: `hotpath:alerts`
- Alert channel: `hotpath:alerts:channel`

## Data Structure (contract.json)
All messages flowing through this system must match the contract schema:
```json
{
  "schema_version": 1,
  "exchange": "binance",
  "event_type": "trade",
  "symbol": "BTCUSDT",
  "event_time": 1692864000000,
  "ingest_time": 1692864000123,
  "price": "45000.50",
  "quantity": "0.01000000",
  "source": "ws_trade"
}
```

## Alert JSON

When a 1-minute candle moves enough to cross the configured threshold, the app pushes an alert payload like this to Redis. The canonical schema lives in [docs/contracts/price-alert.v1.json](../../docs/contracts/price-alert.v1.json).

```json
{
  "schema_version": 1,
  "type": "price_alert",
  "alert_type": "price_move",
  "severity": "warning",
  "exchange": "binance",
  "symbol": "BTCUSDT",
  "interval": "1m",
  "bucket_start": 1692864000000,
  "bucket_end": 1692864059999,
  "open": "45000.5",
  "close": "45280.1",
  "change_abs": "279.6",
  "change_pct": "0.62",
  "direction": "up",
  "threshold_pct": "0.5",
  "trade_count": 124,
  "source": "stream_price_alert_1m",
  "message": "BTCUSDT moved 0.62% on 1m candle",
  "created_at": 1692864060123
}
```

## Troubleshooting

### "No module named 'kafka'"
```bash
pip install -r requirements.txt
```

### "Connection refused" on localhost:9094
The consumer expects Kafka to be running on `localhost:9094` by default. Update `KAFKA_BROKER` if your environment uses a different port.

### No events printed
Check that the ingestion collector is running and that both services point to the same broker and topic.

### "No module named 'redis'"
```bash
pip install -r requirements.txt
```

## References
- [Kafka Python client](https://kafka-python.readthedocs.io/)
- [JSON Schema](https://json-schema.org/)
- [Contract v1](../../docs/contracts/contract.v1.json)

## Status
- **Week 1:** ✅ Complete  
- **Team Lead:** Ngô Thành Nam
- **Last Updated:** 2024-08-24
