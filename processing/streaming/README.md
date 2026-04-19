# Spark Streaming - Hot Path Processing

## Overview
Xử lý hot path theo thời gian thực. **Week 1**: Khởi tạo project Spark Streaming, viết hàm đếm số dòng từ console.

**Team Member:** Ngô Thành Nam (Streaming Data Engineer)

## Architecture (Week 1)
```
Socket/Console Input
    ↓
Spark Streaming (DStream API)
    ├─ Parse lines
    ├─ Filter empty
    └─ Count lines
    ↓
Print to Console
```

## Tech Stack
- **Spark Structured Streaming**: Real-time processing engine
- **Kafka**: Message broker (source)
- **Redis**: Hot cache (sink)
- **Python**: Application code
- **jsonschema**: Data validation

## Week 1: Project Initialization & Setup ✅

### ✅ Deliverables Completed
- [x] Data contract definition (`contract.json`) - Unified schema
- [x] Spark Structured Streaming application (`streaming_app.py`)
- [x] OHLC windowing implementation (1-minute candles)
- [x] Redis output writer (foreachBatch)
- [x] Data validation utilities (`utils.py`)
- [x] Environment configuration (`.env.example`)
- [x] Dependencies specification (`requirements.txt`)

### 🔄 Architecture Updates (vs. Original Plan)
| Component | Original | Updated |
|-----------|----------|---------|
| Streaming API | DStream (RDD-based) | **Structured Streaming (DataFrame)** |
| Data Source | Socket (localhost:9999) | **Kafka Topic** |
| Windowing | Manual batching | **Native window() function** |
| Output | Console only | **Redis + Console** |
| Window Size | N/A | **1 minute (configurable)** |

## 🚀 Quick Start

### Prerequisites
```
✓ Python 3.9+
✓ Java 11+ (for Spark)
✓ Spark 3.5.0
✓ Kafka 3.x
✓ Redis 7.x
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
# Edit .env with your Kafka/Redis addresses
```

### Run the Application

**Terminal 1: Start Spark Streaming App**
```bash
cd src
python streaming_app.py
```

You should see:
```
======================================================================
SPARK STREAMING - LINE COUNTING FROM CONSOLE
======================================================================
Batch Interval: 2 seconds

Listening on localhost:9999
To send data, open another terminal and run:
  nc localhost 9999
Or on Windows:
  powershell -Command "New-Object Net.Sockets.TcpClient('localhost',9999)"

Then type data and press Enter (Ctrl+C to stop)
======================================================================
```

**Terminal 2: Send Test Data**

On Linux/macOS:
```bash
nc localhost 9999
```

On Windows (PowerShell):
```bash
$tcp = New-Object Net.Sockets.TcpClient('localhost', 9999)
$stream = $tcp.GetStream()
$writer = New-Object System.IO.StreamWriter($stream)
$writer.WriteLine('{"symbol":"BTCUSDT","price":45000.50}')
$writer.Flush()
```

Then type data and press Enter:
```
{"symbol":"BTCUSDT","price":45000.50}
{"symbol":"ETHUSDT","price":2250.75}
{"symbol":"BNBUSDT","price":320.00}
```

Expected output on Terminal 1:
```
>>> Batch received: 3 line(s)
Sample data:
  1. {"symbol":"BTCUSDT","price":45000.50}
  2. {"symbol":"ETHUSDT","price":2250.75}
  3. {"symbol":"BNBUSDT","price":320.00}
```

## Data Structure (contract.json)
All messages flowing through this system must match the contract schema:
```json
{
  "symbol": "BTCUSDT",
  "price": 45000.50,
  "volume": 10.5,
  "timestamp": 1692864000000,
  "ask": 45001.00,
  "bid": 45000.00
}
```

## Troubleshooting

### "No module named 'pyspark'"
```bash
pip install -r requirements.txt
```

### "Connection refused" on localhost:9999
The app is listening on port 9999. Make sure you're connecting from another terminal:
```bash
nc localhost 9999
```

### "Address already in use"
Port 9999 is already in use. Either:
1. Stop other processes using 9999
2. Or modify the port in `streaming_app.py` line: `lines = self.ssc.socketTextStream("localhost", 9999)`

### Checkpoint errors
Checkpoints can get corrupted. Safe to delete on development:
```bash
rm -rf checkpoint/
```

## References
- [Spark Streaming Guide](https://spark.apache.org/docs/latest/streaming-programming-guide.html)
- [DStream vs Structured Streaming](https://spark.apache.org/docs/latest/structured-streaming-programming-guide.html)
- [Socket Source](https://spark.apache.org/docs/latest/streaming-programming-guide.html#tcp-datasets)

## Status
- **Week 1:** ✅ Complete  
- **Team Lead:** Ngô Thành Nam
- **Last Updated:** 2024-08-24
