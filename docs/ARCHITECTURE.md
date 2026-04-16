# Architecture Notes

## Layers

- Ingestion: CCXT -> Kafka
- Processing (cold path): Kafka/MinIO -> PySpark -> MongoDB
- Processing (hot path): Kafka -> Spark Streaming -> Redis
- Serving: Backend service (framework-agnostic)
- Presentation: Next.js

## Important rule

Backend phải là gateway phục vụ dữ liệu, không xử lý pipeline nặng.
