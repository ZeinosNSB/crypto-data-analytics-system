"""
Spark Streaming Application - Week 1: Initialization & Line Counting
Author: Streaming Data Engineer (Ngô Thành Nam)
Purpose: Basic line counting from console input via socket
"""

from pyspark import SparkContext
from pyspark.streaming import StreamingContext
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger("StreamingApp")


class StreamingApp:
    """Basic Spark Streaming Application for counting console input lines"""
    
    def __init__(self, app_name="CryptoStreamingApp", batch_interval=2):
        """
        Initialize Spark Streaming context.
        
        Args:
            app_name (str): Application name
            batch_interval (int): Batch interval in seconds (default: 2s)
        """
        self.app_name = app_name
        self.batch_interval = batch_interval
        self.sc = None
        self.ssc = None
        
    def init_spark_context(self):
        """Initialize SparkContext"""
        self.sc = SparkContext(appName=self.app_name)
        self.sc.setLogLevel("WARN")
        logger.info("✓ SparkContext initialized")
        return self.sc
    
    def init_streaming_context(self):
        """Initialize StreamingContext"""
        if self.sc is None:
            self.init_spark_context()
        
        self.ssc = StreamingContext(self.sc, self.batch_interval)
        self.ssc.checkpoint("./checkpoint")
        logger.info(f"✓ StreamingContext initialized (batch interval: {self.batch_interval}s)")
        return self.ssc
    
    def start_socket_streaming(self):
        """
        Start reading from socket (localhost:9999) and count lines.
        Week 1 deliverable: Basic line counting from console.
        """
        if self.ssc is None:
            self.init_streaming_context()
        
        print("\n" + "=" * 70)
        print("SPARK STREAMING - LINE COUNTING FROM CONSOLE")
        print("=" * 70)
        print(f"Batch Interval: {self.batch_interval} seconds")
        print("\nListening on localhost:9999")
        print("To send data, open another terminal and run:")
        print("  nc localhost 9999")
        print("Or on Windows:")
        print("  powershell -Command \"New-Object Net.Sockets.TcpClient('localhost',9999)\"")
        print("\nThen type data and press Enter (Ctrl+C to stop)")
        print("=" * 70 + "\n")
        
        # Create stream from socket connection
        lines = self.ssc.socketTextStream("localhost", 9999)
        
        # Filter empty lines
        valid_lines = lines.filter(lambda x: len(x.strip()) > 0)
        
        # Count lines and print statistics
        valid_lines.foreachRDD(self._process_batch)
        
        return self.ssc
    
    def _process_batch(self, rdd):
        """
        Process each batch: count and log lines.
        
        Args:
            rdd: Spark RDD from current batch
        """
        if rdd.count() > 0:
            count = rdd.count()
            print(f"\n>>> Batch received: {count} line(s)")
            
            # Show sample data
            sample = rdd.take(3)
            print("Sample data:")
            for i, line in enumerate(sample, 1):
                # Truncate long lines to 80 chars
                display = line[:80] + "..." if len(line) > 80 else line
                print(f"  {i}. {display}")
    
    def start(self):
        """Start the streaming application"""
        try:
            self.start_socket_streaming()
            self.ssc.start()
            print("✓ Streaming started. Waiting for data...\n")
            self.ssc.awaitTermination()
        except KeyboardInterrupt:
            print("\n\nShutting down...")
            self.stop()
        except Exception as e:
            logger.error(f"Error: {e}")
            self.stop()
    
    def stop(self):
        """Stop the streaming application"""
        if self.ssc:
            self.ssc.stop(stopSparkContext=True)
        print("✓ Spark Streaming stopped.")


def main():
    """Main entry point"""
    # Configuration
    batch_interval = 2  # seconds
    
    # Create and start application
    app = StreamingApp(app_name="CryptoStreamingApp", batch_interval=batch_interval)
    app.start()


if __name__ == "__main__":
    main()
