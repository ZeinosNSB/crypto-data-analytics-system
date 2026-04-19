from pathlib import Path

from pyspark.sql import SparkSession

if __name__ == "__main__":
    mock_data_path = Path(__file__).with_name("mock_data.json")

    spark = SparkSession.builder.appName("ReadJSONMockData").getOrCreate()
    df = spark.read.option("multiline", "true").json(str(mock_data_path))
    df.show()
    spark.stop()
