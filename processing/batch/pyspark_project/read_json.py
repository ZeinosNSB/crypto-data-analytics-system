import argparse
import os
from pathlib import Path

from pyspark.sql import SparkSession
from pyspark.sql.functions import col, from_json
from pyspark.sql.types import MapType, StringType


DEFAULT_KAFKA_PACKAGE = "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1"


def parse_args():
    project_dir = Path(__file__).resolve().parent

    parser = argparse.ArgumentParser(
        description="Read records from a Kafka topic and persist them as Parquet."
    )
    parser.add_argument(
        "--bootstrap-servers",
        default=os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"),
        help="Kafka bootstrap servers. Default: env KAFKA_BOOTSTRAP_SERVERS or localhost:9092",
    )
    parser.add_argument(
        "--topic",
        default=os.getenv("KAFKA_TOPIC", "ingest"),
        help="Kafka topic to read. Default: env KAFKA_TOPIC or ingest",
    )
    parser.add_argument(
        "--starting-offsets",
        default=os.getenv("KAFKA_STARTING_OFFSETS", "earliest"),
        help='Kafka starting offsets. Default: env KAFKA_STARTING_OFFSETS or "earliest"',
    )
    parser.add_argument(
        "--ending-offsets",
        default=os.getenv("KAFKA_ENDING_OFFSETS", "latest"),
        help='Kafka ending offsets. Default: env KAFKA_ENDING_OFFSETS or "latest"',
    )
    parser.add_argument(
        "--output",
        default=os.getenv("PARQUET_OUTPUT_PATH", str(project_dir / "output" / "parquet")),
        help="Destination folder for Parquet output",
    )
    parser.add_argument(
        "--mode",
        default=os.getenv("PARQUET_WRITE_MODE", "overwrite"),
        choices=["append", "overwrite", "ignore", "error", "errorifexists"],
        help='Parquet write mode. Default: env PARQUET_WRITE_MODE or "overwrite"',
    )
    parser.add_argument(
        "--app-name",
        default=os.getenv("SPARK_APP_NAME", "KafkaToParquetBatch"),
        help="Spark application name",
    )
    parser.add_argument(
        "--kafka-package",
        default=os.getenv("SPARK_KAFKA_PACKAGE", DEFAULT_KAFKA_PACKAGE),
        help="Spark Kafka connector package coordinate",
    )
    return parser.parse_args()


def create_spark_session(app_name, kafka_package):
    return (
        SparkSession.builder.appName(app_name)
        .config("spark.jars.packages", kafka_package)
        .getOrCreate()
    )


if __name__ == "__main__":
    args = parse_args()

    spark = create_spark_session(args.app_name, args.kafka_package)

    raw_df = (
        spark.read.format("kafka")
        .option("kafka.bootstrap.servers", args.bootstrap_servers)
        .option("subscribe", args.topic)
        .option("startingOffsets", args.starting_offsets)
        .option("endingOffsets", args.ending_offsets)
        .load()
    )

    kafka_records_df = raw_df.select(
        col("topic"),
        col("partition"),
        col("offset"),
        col("timestamp").alias("kafka_timestamp"),
        col("timestampType").alias("kafka_timestamp_type"),
        col("key").cast("string").alias("message_key"),
        col("value").cast("string").alias("message_value"),
    )

    output_df = kafka_records_df.withColumn(
        "payload",
        from_json(col("message_value"), MapType(StringType(), StringType())),
    ).cache()

    output_path = Path(args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    record_count = output_df.count()
    output_df.write.mode(args.mode).parquet(str(output_path))

    print(
        f"Wrote {record_count} record(s) from topic '{args.topic}' to Parquet at {output_path}"
    )

    spark.stop()
