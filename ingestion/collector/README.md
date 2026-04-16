# Ingestion Collector

Thành phần thu thập dữ liệu thị trường (CCXT) và publish event vào Kafka.

Nhiệm vụ chính:
- Kết nối Binance (REST/WebSocket)
- Chuẩn hóa payload event
- Producer sang Kafka topic ingest
