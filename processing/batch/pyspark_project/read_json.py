from pyspark.sql import SparkSession

if __name__ == "__main__":
    spark = SparkSession.builder.appName("ReadJSONMockData").getOrCreate()
    df = spark.read.option("multiline", "true").json("mock_data.json")
    df.show()
    spark.stop()
