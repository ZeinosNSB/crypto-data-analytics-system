# Crypto Data Analytics System

Hệ thống phân tích dữ liệu crypto theo kiến trúc Lambda:
- Ingestion: CCXT -> Kafka
- Processing: Batch (PySpark) + Streaming (Spark Structured Streaming)
- Storage/Serving: MinIO, MongoDB, Redis
- API: Backend service (không khóa framework)
- UI: Next.js

## Trạng thái hiện tại

- Hạ tầng local Tuần 1 đã chạy được bằng Docker Compose
- Tài liệu vận hành: `WEEK1_INFRA_GUIDE.md`
- Mặc định frontend dùng Next.js, backend để mở framework cho team lựa chọn

## Cấu trúc thư mục đề xuất

```text
.
├─ apps/                  
│  ├─ api/              # API gateway
│  └─ web/              # Next.js app
├─ ingestion/
│  └─ collector/             # CCXT producer -> Kafka
├─ processing/
│  ├─ batch/                 # PySpark jobs (cold path)
│  └─ streaming/             # Spark streaming jobs (hot path)
├─ storage/                  # Sink/connector configs (MinIO/Mongo/Redis)
├─ monitoring/               # Prometheus/Grafana config
├─ scripts/                  # Utility scripts
├─ docs/                     # Tài liệu kiến trúc/quy ước
├─ docker-compose.yaml
├─ .env.example
└─ WEEK1_INFRA_GUIDE.md
```

## Quy ước triển khai

- Backend chỉ làm serving/API gateway, không xử lý raw pipeline
- Cold path ghi kết quả tổng hợp vào MongoDB
- Hot path ghi dữ liệu thời gian thực vào Redis
- Frontend gọi backend qua API/WebSocket
