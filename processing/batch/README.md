# Batch Processing (PySpark)

Cold path hien tai:

- `kafka_to_minio.py`: doc topic Kafka `market_events`, parse contract v1, ghi raw Parquet xuong MinIO.
- `volume_24h.py`: doc raw Parquet trong MinIO va tinh volume 24h theo `symbol`.
- `volume_24h_to_mongodb.py`: tai su dung logic tinh volume 24h va upsert ket qua vao MongoDB.

## MinIO layout

```text
s3a://crypto-lake/
  raw/market_events/             # parquet partitioned by event_date, symbol
  aggregates/volume_24h/         # parquet partitioned by symbol
```

## Chay voi Docker Compose

Start infra va ingestion:

```bash
docker compose -f docker-compose.yaml -f docker-compose.app.yaml up -d kafka redis mongodb minio kafka-ui
docker compose -f docker-compose.yaml -f docker-compose.app.yaml --profile ingestion up -d ingestion
```

Ghi Kafka -> MinIO:

```bash
docker compose -f docker-compose.yaml -f docker-compose.app.yaml run --rm batch
```

Tinh Volume 24h:

```bash
docker compose -f docker-compose.yaml -f docker-compose.app.yaml --profile batch run --rm batch-volume-24h
```

Mac dinh job volume dung `--use-max-event-time` de tien demo/backfill: cua so 24h ket thuc tai event moi nhat trong raw data.

Ghi ket qua Volume 24h vao MongoDB:

```bash
docker compose -f docker-compose.yaml -f docker-compose.app.yaml --profile batch build batch-volume-24h-mongo
docker compose -f docker-compose.yaml -f docker-compose.app.yaml --profile batch run --rm batch-volume-24h-mongo
```

MongoDB document duoc upsert theo `_id` on dinh:
`exchange:symbol:lookback_hours:window_start:window_end`.

## Environment

```text
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
KAFKA_TOPIC=market_events
MINIO_ENDPOINT=http://minio:9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_BUCKET=crypto-lake
RAW_EVENTS_PATH=s3a://crypto-lake/raw/market_events
VOLUME_24H_OUTPUT_PATH=s3a://crypto-lake/aggregates/volume_24h
MONGO_HOST=mongodb
MONGO_PORT=27017
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=admin123
MONGO_DATABASE=crypto_analytics
MONGO_AUTH_SOURCE=admin
MONGO_COLLECTION_VOLUME_24H=volume_24h
```
