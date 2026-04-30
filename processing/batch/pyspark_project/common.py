import os
from urllib.parse import urlparse

from pyspark.sql import SparkSession


DEFAULT_SPARK_PACKAGES = ",".join(
    [
        "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1",
        "org.apache.hadoop:hadoop-aws:3.3.4",
    ]
)

DEFAULT_MINIO_ENDPOINT = "http://localhost:9000"
DEFAULT_MINIO_ACCESS_KEY = "minioadmin"
DEFAULT_MINIO_SECRET_KEY = "minioadmin"
DEFAULT_MINIO_BUCKET = "crypto-lake"


def str_to_bool(value, default=False):
    if value is None:
        return default
    return str(value).strip().lower() in {"1", "true", "yes", "y", "on"}


def get_minio_endpoint():
    return os.getenv("MINIO_ENDPOINT", DEFAULT_MINIO_ENDPOINT)


def get_minio_access_key():
    return os.getenv("MINIO_ROOT_USER", os.getenv("MINIO_ACCESS_KEY", DEFAULT_MINIO_ACCESS_KEY))


def get_minio_secret_key():
    return os.getenv(
        "MINIO_ROOT_PASSWORD", os.getenv("MINIO_SECRET_KEY", DEFAULT_MINIO_SECRET_KEY)
    )


def get_minio_bucket():
    return os.getenv("MINIO_BUCKET", DEFAULT_MINIO_BUCKET)


def raw_events_path():
    return os.getenv("RAW_EVENTS_PATH", f"s3a://{get_minio_bucket()}/raw/market_events")


def volume_24h_output_path():
    return os.getenv(
        "VOLUME_24H_OUTPUT_PATH", f"s3a://{get_minio_bucket()}/aggregates/volume_24h"
    )


def is_s3a_path(path):
    return str(path).startswith("s3a://")


def s3a_bucket(path):
    parsed = urlparse(path)
    if parsed.scheme != "s3a" or not parsed.netloc:
        raise ValueError(f"Expected an s3a://bucket/path URI, got: {path}")
    return parsed.netloc


def create_spark_session(app_name, spark_packages=None):
    endpoint = get_minio_endpoint()
    access_key = get_minio_access_key()
    secret_key = get_minio_secret_key()
    packages = spark_packages or os.getenv("SPARK_PACKAGES", DEFAULT_SPARK_PACKAGES)

    builder = (
        SparkSession.builder.appName(app_name)
        .config("spark.jars.packages", packages)
        .config("spark.sql.session.timeZone", os.getenv("SPARK_SQL_TIME_ZONE", "UTC"))
        .config("spark.hadoop.fs.s3a.endpoint", endpoint)
        .config("spark.hadoop.fs.s3a.access.key", access_key)
        .config("spark.hadoop.fs.s3a.secret.key", secret_key)
        .config("spark.hadoop.fs.s3a.path.style.access", "true")
        .config("spark.hadoop.fs.s3a.connection.ssl.enabled", "false")
        .config("spark.hadoop.fs.s3a.impl", "org.apache.hadoop.fs.s3a.S3AFileSystem")
        .config(
            "spark.hadoop.fs.s3a.aws.credentials.provider",
            "org.apache.hadoop.fs.s3a.SimpleAWSCredentialsProvider",
        )
    )

    return builder.getOrCreate()


def ensure_bucket_for_path(path):
    if not is_s3a_path(path) or not str_to_bool(os.getenv("CREATE_MINIO_BUCKET"), True):
        return

    import boto3
    from botocore.config import Config
    from botocore.exceptions import ClientError

    bucket = s3a_bucket(path)
    client = boto3.client(
        "s3",
        endpoint_url=get_minio_endpoint(),
        aws_access_key_id=get_minio_access_key(),
        aws_secret_access_key=get_minio_secret_key(),
        region_name=os.getenv("AWS_REGION", "us-east-1"),
        config=Config(s3={"addressing_style": "path"}),
    )

    try:
        client.head_bucket(Bucket=bucket)
    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code")
        if error_code not in {"404", "NoSuchBucket"}:
            raise
        client.create_bucket(Bucket=bucket)
