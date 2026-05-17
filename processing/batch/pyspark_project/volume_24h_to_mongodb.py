import argparse
import os
from datetime import datetime, timezone
from decimal import Decimal

from bson.decimal128 import Decimal128
from pymongo import ASCENDING, DESCENDING, MongoClient, UpdateOne

from common import (
    create_spark_session,
    get_mongo_database,
    get_mongo_uri,
    get_mongo_volume_24h_collection,
    raw_events_path,
)
from volume_24h import build_volume_24h_dataframe, validate_args


def parse_args():
    parser = argparse.ArgumentParser(
        description="Calculate rolling 24h trading volume and upsert results to MongoDB."
    )
    parser.add_argument(
        "--input",
        default=raw_events_path(),
        help="Input raw Parquet path produced by kafka_to_minio.py.",
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
        default=os.getenv("VOLUME_24H_USE_MAX_EVENT_TIME", "").lower()
        in {"1", "true", "yes"},
        help="Use the latest event_timestamp in the input as the window end.",
    )
    parser.add_argument(
        "--symbols",
        default=os.getenv("VOLUME_SYMBOLS", ""),
        help="Optional comma-separated symbol filter, for example BTCUSDT,ETHUSDT.",
    )
    parser.add_argument(
        "--mongo-uri",
        default=get_mongo_uri(),
        help="MongoDB connection URI. Defaults to MONGO_URI or MONGO_* env vars.",
    )
    parser.add_argument(
        "--mongo-database",
        default=get_mongo_database(),
        help="MongoDB database for aggregate results.",
    )
    parser.add_argument(
        "--mongo-collection",
        default=get_mongo_volume_24h_collection(),
        help="MongoDB collection for 24h volume aggregates.",
    )
    parser.add_argument(
        "--mongo-batch-size",
        type=int,
        default=int(os.getenv("MONGO_BULK_BATCH_SIZE", "500")),
        help="Bulk upsert batch size.",
    )
    parser.add_argument(
        "--mongo-timeout-ms",
        type=int,
        default=int(os.getenv("MONGO_SERVER_SELECTION_TIMEOUT_MS", "10000")),
        help="MongoDB server selection timeout in milliseconds.",
    )
    parser.add_argument(
        "--app-name",
        default=os.getenv("SPARK_APP_NAME", "Volume24hMongoBatchJob"),
        help="Spark application name.",
    )
    return parser.parse_args()


def validate_mongo_args(args):
    validate_args(args)
    if args.mongo_batch_size <= 0:
        raise ValueError("--mongo-batch-size must be greater than 0")
    if not args.mongo_database:
        raise ValueError("--mongo-database must not be empty")
    if not args.mongo_collection:
        raise ValueError("--mongo-collection must not be empty")


def to_utc_datetime(value):
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def to_mongo_value(value):
    if isinstance(value, Decimal):
        return Decimal128(str(value))
    if isinstance(value, datetime):
        return to_utc_datetime(value)
    if isinstance(value, dict):
        return {
            key: to_mongo_value(nested_value)
            for key, nested_value in value.items()
        }
    if isinstance(value, list):
        return [to_mongo_value(item) for item in value]
    return value


def datetime_id_part(value):
    if isinstance(value, datetime):
        return (
            to_utc_datetime(value)
            .isoformat(timespec="seconds")
            .replace("+00:00", "Z")
        )
    return str(value)


def build_document_id(document):
    return ":".join(
        [
            str(document["exchange"]),
            str(document["symbol"]),
            str(document["lookback_hours"]),
            datetime_id_part(document["window_start"]),
            datetime_id_part(document["window_end"]),
        ]
    )


def row_to_document(row, updated_at):
    document = {
        key: to_mongo_value(value)
        for key, value in row.asDict(recursive=True).items()
    }
    document["metric"] = "volume_24h"
    document["updated_at"] = updated_at
    document["_id"] = build_document_id(document)
    return document


def ensure_indexes(collection):
    collection.create_index(
        [
            ("metric", ASCENDING),
            ("exchange", ASCENDING),
            ("symbol", ASCENDING),
            ("window_end", DESCENDING),
        ],
        name="volume_24h_lookup",
    )
    collection.create_index(
        [("computed_at", DESCENDING)],
        name="volume_24h_computed_at",
    )


def flush_operations(collection, operations):
    if operations:
        collection.bulk_write(operations, ordered=False)
        operations.clear()


def write_dataframe_to_mongodb(
    result_df,
    mongo_uri,
    mongo_database,
    mongo_collection,
    batch_size,
    timeout_ms,
):
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=timeout_ms)
    try:
        client.admin.command("ping")
        collection = client[mongo_database][mongo_collection]
        ensure_indexes(collection)

        updated_at = datetime.now(timezone.utc)
        operations = []
        row_count = 0

        for row in result_df.toLocalIterator():
            document = row_to_document(row, updated_at)
            document_id = document["_id"]
            update_document = {
                key: value for key, value in document.items() if key != "_id"
            }
            operations.append(
                UpdateOne(
                    {"_id": document_id},
                    {
                        "$set": update_document,
                        "$setOnInsert": {"created_at": updated_at},
                    },
                    upsert=True,
                )
            )
            row_count += 1

            if len(operations) >= batch_size:
                flush_operations(collection, operations)

        flush_operations(collection, operations)
        return row_count
    finally:
        client.close()


def main():
    args = parse_args()
    validate_mongo_args(args)

    spark = create_spark_session(args.app_name)
    spark.sparkContext.setLogLevel(os.getenv("SPARK_LOG_LEVEL", "WARN"))

    try:
        result_df, window_end_text = build_volume_24h_dataframe(spark, args)
        result_df = result_df.cache()

        try:
            result_count = write_dataframe_to_mongodb(
                result_df=result_df,
                mongo_uri=args.mongo_uri,
                mongo_database=args.mongo_database,
                mongo_collection=args.mongo_collection,
                batch_size=args.mongo_batch_size,
                timeout_ms=args.mongo_timeout_ms,
            )
        finally:
            result_df.unpersist()

        print(
            "Volume 24h -> MongoDB completed: "
            f"input={args.input}, database={args.mongo_database}, "
            f"collection={args.mongo_collection}, rows={result_count}, "
            f"window_end={window_end_text}, lookback_hours={args.lookback_hours}"
        )
    finally:
        spark.stop()


if __name__ == "__main__":
    main()
