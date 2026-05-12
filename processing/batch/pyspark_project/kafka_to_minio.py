import argparse
import os

from common import create_spark_session, ensure_bucket_for_path, raw_events_path
from schemas import (
    enrich_market_events,
    flatten_market_events,
    parse_kafka_market_events,
    valid_market_event_condition,
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Read market events from Kafka and persist raw Parquet files to MinIO."
    )
    parser.add_argument(
        "--bootstrap-servers",
        default=os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"),
        help="Kafka bootstrap servers.",
    )
    parser.add_argument(
        "--topic",
        default=os.getenv("KAFKA_TOPIC", "market_events"),
        help="Kafka topic to read.",
    )
    parser.add_argument(
        "--starting-offsets",
        default=os.getenv("KAFKA_STARTING_OFFSETS", "earliest"),
        help='Kafka starting offsets, for example "earliest" or a JSON offsets map.',
    )
    parser.add_argument(
        "--ending-offsets",
        default=os.getenv("KAFKA_ENDING_OFFSETS", "latest"),
        help='Kafka ending offsets, for example "latest" or a JSON offsets map.',
    )
    parser.add_argument(
        "--output",
        default=raw_events_path(),
        help="Destination Parquet path. Use s3a://bucket/path for MinIO.",
    )
    parser.add_argument(
        "--bad-record-output",
        default=os.getenv("BAD_RECORDS_PATH", ""),
        help="Optional path for invalid Kafka payloads.",
    )
    parser.add_argument(
        "--mode",
        default=os.getenv("PARQUET_WRITE_MODE", "append"),
        choices=["append", "overwrite", "ignore", "error", "errorifexists"],
        help="Parquet write mode.",
    )
    parser.add_argument(
        "--partition-by",
        default=os.getenv("RAW_PARTITION_COLUMNS", "event_date,symbol"),
        help="Comma-separated output partition columns.",
    )
    parser.add_argument(
        "--app-name",
        default=os.getenv("SPARK_APP_NAME", "KafkaToMinioRawMarketEvents"),
        help="Spark application name.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    spark = create_spark_session(args.app_name)
    spark.sparkContext.setLogLevel(os.getenv("SPARK_LOG_LEVEL", "WARN"))

    try:
        ensure_bucket_for_path(args.output)
        if args.bad_record_output:
            ensure_bucket_for_path(args.bad_record_output)

        raw_df = (
            spark.read.format("kafka")
            .option("kafka.bootstrap.servers", args.bootstrap_servers)
            .option("subscribe", args.topic)
            .option("startingOffsets", args.starting_offsets)
            .option("endingOffsets", args.ending_offsets)
            .load()
        )

        parsed_df = parse_kafka_market_events(raw_df)
        enriched_df = enrich_market_events(flatten_market_events(parsed_df)).cache()
        valid_df = enriched_df.filter(valid_market_event_condition()).cache()
        invalid_df = enriched_df.filter(~valid_market_event_condition())

        valid_count = valid_df.count()
        invalid_count = invalid_df.count()

        partition_columns = [
            column_name.strip()
            for column_name in args.partition_by.split(",")
            if column_name.strip()
        ]

        writer = valid_df.write.mode(args.mode)
        if partition_columns:
            writer = writer.partitionBy(*partition_columns)
        writer.parquet(args.output)

        if invalid_count > 0 and args.bad_record_output:
            invalid_df.write.mode("append").parquet(args.bad_record_output)

        print(
            "Kafka -> MinIO completed: "
            f"topic={args.topic}, valid_records={valid_count}, "
            f"invalid_records={invalid_count}, output={args.output}"
        )
    finally:
        spark.stop()


if __name__ == "__main__":
    main()
