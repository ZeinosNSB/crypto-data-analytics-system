"""
Utility functions for Spark Streaming - Week 1
Basic line counting and data filtering utilities
"""


def filter_valid_lines(line):
    """
    Filter out empty or invalid lines.
    
    Args:
        line (str): Input line from stream
        
    Returns:
        bool: True if line is valid (non-empty), False otherwise
    """
    return line and len(line.strip()) > 0


def count_lines(rdd):
    """
    Count the number of lines in an RDD.
    
    Args:
        rdd: Spark RDD
        
    Returns:
        int: Number of lines in the RDD
    """
    return rdd.count()


def get_line_sample(rdd, num_samples=5):
    """
    Get sample lines from RDD for display.
    
    Args:
        rdd: Spark RDD
        num_samples (int): Number of samples to retrieve
        
    Returns:
        list: Sample lines from RDD
    """
    return rdd.take(num_samples)


