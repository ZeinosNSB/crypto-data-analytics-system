import os
import time
import json
import logging
import ccxt
from kafka import KafkaProducer

# Cấu hình Logging để dễ theo dõi trong Docker console
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 1. CẤU HÌNH BIẾN MÔI TRƯỜNG (Sẽ lấy từ docker-compose)
KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
KAFKA_TOPIC = os.getenv('KAFKA_TOPIC', 'market_events')
SYMBOL = os.getenv('SYMBOL', 'BTC/USDT')

def get_kafka_producer():
    """Khởi tạo Kafka Producer với cơ chế retry nếu Kafka chưa sẵn sàng"""
    while True:
        try:
            producer = KafkaProducer(
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                acks='all' # Đảm bảo dữ liệu được ghi xuống Kafka an toàn
            )
            logger.info("Kết nối thành công tới Kafka!")
            return producer
        except Exception as e:
            logger.error(f"Chưa kết nối được Kafka, đang thử lại... {e}")
            time.sleep(5)

def format_to_contract_v1(raw_trade):
    """Chuẩn hóa dữ liệu theo đúng contract.v1.json"""
    # Xử lý symbol: BTC/USDT -> BTCUSDT theo pattern ^[A-Z0-9]{5,20}$
    symbol_formatted = raw_trade.get('symbol', '').replace('/', '')
    
    # Lấy timestamp hiện tại (ms) cho ingest_time
    ingest_time_ms = int(time.time() * 1000)
    
    return {
        "schema_version": 1,               #
        "exchange": "binance",            #
        "event_type": "trade",            #
        "symbol": symbol_formatted,       #
        "event_time": raw_trade.get('timestamp'), #
        "ingest_time": ingest_time_ms,    #
        
        # Ép kiểu string để tránh sai số float
        "price": str(raw_trade.get('price')),
        "quantity": str(raw_trade.get('amount')),
        
        "trade_id": raw_trade.get('id'),
        "is_buyer_maker": raw_trade['info'].get('m') if 'info' in raw_trade else None,
        "bid_price": None,
        "bid_qty": None,
        "ask_price": None,
        "ask_qty": None,
        "interval": None,
        "source": "rest" # Sử dụng REST polling đơn giản
    }

def main():
    # Khởi tạo sàn Binance
    exchange = ccxt.binance({
        'enableRateLimit': True,
    })
    
    producer = get_kafka_producer()
    
    logger.info(f"Bắt đầu thu thập dữ liệu {SYMBOL} từ Binance...")
    
    last_trade_id = None

    while True:
        try:
            # Lấy danh sách các trade mới nhất
            trades = exchange.fetch_trades(SYMBOL, limit=10)
            
            for trade in trades:
                # Tránh gửi trùng dữ liệu đã gửi trước đó
                if last_trade_id is not None and trade['id'] <= last_trade_id:
                    continue
                
                # Chuẩn hóa dữ liệu theo Contract V1
                formatted_data = format_to_contract_v1(trade)
                
                # Bắn vào Kafka
                producer.send(KAFKA_TOPIC, value=formatted_data)
                last_trade_id = trade['id']
                
                logger.info(f"Sent: {formatted_data['symbol']} @ {formatted_data['price']}")

            # Nghỉ một chút để tránh bị sàn khóa IP (Rate limit)
            time.sleep(2) 
            
        except Exception as e:
            logger.error(f"Lỗi khi lấy dữ liệu: {e}")
            time.sleep(10)

if __name__ == "__main__":
    main()