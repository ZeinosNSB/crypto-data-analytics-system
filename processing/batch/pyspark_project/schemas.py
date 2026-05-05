from functools import reduce
from operator import and_

from pyspark.sql.functions import col, current_timestamp, expr, from_json, to_date
from pyspark.sql.types import (
    BooleanType,
    DecimalType,
    IntegerType,
    LongType,
    StringType,
    StructField,
    StructType,
)


MARKET_EVENT_SCHEMA = StructType(
    [
        StructField("schema_version", IntegerType(), True),
        StructField("exchange", StringType(), True),
        StructField("event_type", StringType(), True),
        StructField("symbol", StringType(), True),
        StructField("event_time", LongType(), True),
        StructField("ingest_time", LongType(), True),
        StructField("price", StringType(), True),
        StructField("quantity", StringType(), True),
        StructField("trade_id", StringType(), True),
        StructField("is_buyer_maker", BooleanType(), True),
        StructField("bid_price", StringType(), True),
        StructField("bid_qty", StringType(), True),
        StructField("ask_price", StringType(), True),
        StructField("ask_qty", StringType(), True),
        StructField("interval", StringType(), True),
        StructField("source", StringType(), True),
    ]
)

REQUIRED_COLUMNS = [
    "schema_version",
    "exchange",
    "event_type",
    "symbol",
    "event_time",
    "ingest_time",
    "price",
    "quantity",
    "source",
]


def parse_kafka_market_events(raw_df):
    kafka_records_df = raw_df.select(
        col("topic"),
        col("partition"),
        col("offset"),
        col("timestamp").alias("kafka_timestamp"),
        col("timestampType").alias("kafka_timestamp_type"),
        col("key").cast("string").alias("message_key"),
        col("value").cast("string").alias("message_value"),
    )

    return kafka_records_df.withColumn(
        "payload",
        from_json(col("message_value"), MARKET_EVENT_SCHEMA, {"mode": "PERMISSIVE"}),
    )


def flatten_market_events(parsed_df):
    return parsed_df.select(
        "topic",
        "partition",
        "offset",
        "kafka_timestamp",
        "kafka_timestamp_type",
        "message_key",
        "message_value",
        "payload.*",
    )


def enrich_market_events(events_df):
    return (
        events_df.withColumn("event_timestamp", expr("timestamp_millis(event_time)"))
        .withColumn("ingest_timestamp", expr("timestamp_millis(ingest_time)"))
        .withColumn("price_decimal", col("price").cast(DecimalType(38, 18)))
        .withColumn("quantity_decimal", col("quantity").cast(DecimalType(38, 18)))
        .withColumn(
            "volume_quote",
            (col("price_decimal") * col("quantity_decimal")).cast(DecimalType(38, 18)),
        )
        .withColumn("event_date", to_date(col("event_timestamp")))
        .withColumn("load_timestamp", current_timestamp())
    )


def valid_market_event_condition():
    base_condition = reduce(and_, [col(column_name).isNotNull() for column_name in REQUIRED_COLUMNS])
    return (
        base_condition
        & (col("schema_version") == 1)
        & col("price_decimal").isNotNull()
        & col("quantity_decimal").isNotNull()
        & col("event_timestamp").isNotNull()
        & col("event_date").isNotNull()
    )
