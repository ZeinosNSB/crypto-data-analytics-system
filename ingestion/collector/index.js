const ccxt = require('ccxt');
const { Kafka } = require('kafkajs');
const express = require('express');
const client = require('prom-client');
require('dotenv').config();

// ==========================================
// 1. CẤU HÌNH BIẾN MÔI TRƯỜNG & KHAI BÁO
// ==========================================
const SYMBOL = process.env.SYMBOL || 'BTC/USDT';
const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
const TOPIC = process.env.KAFKA_TOPIC || 'market_events';
const PORT = process.env.PORT || 3000;

// Trạng thái để Health Check K8s biết app có đang ổn không
let isHealthy = false; 

// ==========================================
// 2. SETUP MONITORING (PROMETHEUS)
// ==========================================
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics(); // Thu thập RAM, CPU tự động

// Đếm số lượng message đã đẩy thành công vào Kafka
const messagesSent = new client.Counter({
    name: 'ingestion_messages_sent_total',
    help: 'Tổng số market events đã đẩy vào Kafka'
});

// Đếm số lần rớt mạng/lỗi của WebSocket
const wsErrors = new client.Counter({
    name: 'ingestion_ws_errors_total',
    help: 'Tổng số lần WebSocket gặp lỗi hoặc disconnect'
});

// ==========================================
// 3. SETUP KAFKA PRODUCER
// ==========================================
const kafka = new Kafka({
    clientId: 'binance-collector',
    brokers: [KAFKA_BROKER]
});
const producer = kafka.producer();

// ==========================================
// 4. HÀM CHUẨN HÓA DỮ LIỆU (CONTRACT V1)
// ==========================================
function formatToContractV1(trade) {
    return {
        schema_version: 1,
        exchange: "binance",
        event_type: "trade",
        symbol: trade.symbol.replace('/', ''),
        event_time: trade.timestamp,
        ingest_time: Date.now(),
        price: String(trade.price),   // Ép về String để chống sai số
        quantity: String(trade.amount),
        trade_id: trade.id ? parseInt(trade.id) : null,
        is_buyer_maker: trade.info && trade.info.m ? true : false,
        bid_price: null, bid_qty: null, ask_price: null, ask_qty: null, interval: null,
        source: "ws_trade" // Gắn mác lấy từ WebSocket
    };
}

// ==========================================
// 5. LUỒNG CHÍNH: CHẠY WEBSOCKET (HOT PATH)
// ==========================================
async function runCollector() {
    await producer.connect();
    console.log('✅ Đã kết nối Kafka');

    // Dùng ccxt.pro để lấy bản WebSocket hỗ trợ Realtime
    const exchange = new ccxt.pro.binance({ enableRateLimit: true });
    isHealthy = true; // Đánh dấu app đã sẵn sàng

    console.log(`🚀 Bắt đầu stream dữ liệu ${SYMBOL} từ Binance WebSocket...`);

    while (true) {
        try {
            // Lệnh watchTrades sẽ chờ liên tục, hễ có giao dịch là nó nhả data ra ngay
            const trades = await exchange.watchTrades(SYMBOL);
            
            for (let trade of trades) {
                const payload = formatToContractV1(trade);
                
                await producer.send({
                    topic: TOPIC,
                    messages: [{ value: JSON.stringify(payload) }],
                });
                
                messagesSent.inc(); // Tăng bộ đếm Prometheus lên 1
            }
        } catch (error) {
            console.error('❌ Lỗi WebSocket:', error.message);
            wsErrors.inc();
            isHealthy = false; // Báo cho K8s biết app đang ốm
            
            // Đợi 5 giây rồi thử kết nối lại
            await new Promise(resolve => setTimeout(resolve, 5000));
            isHealthy = true; 
        }
    }
}

// ==========================================
// 6. DỰNG EXPRESS SERVER (CHO K8S & MONITORING)
// ==========================================
const app = express();

// K8s Liveness/Readiness Probe: Trả về 200 nếu app khỏe, 500 nếu app lỗi kết nối
app.get('/health', (req, res) => {
    if (isHealthy) {
        res.status(200).send('OK');
    } else {
        res.status(500).send('Thở oxy');
    }
});

// Endpoint cho Prometheus vào kéo (scrape) dữ liệu metrics
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

const server = app.listen(PORT, () => {
    console.log(`🛡️ Server Health/Metrics chạy tại port ${PORT}`);
});

// ==========================================
// 7. GRACEFUL SHUTDOWN (HẠ CÁNH MỀM)
// ==========================================
async function shutdown() {
    console.log('\n🛑 Nhận tín hiệu tắt app (SIGINT/SIGTERM)...');
    isHealthy = false;
    
    // Đóng server Express
    server.close(() => console.log('Đã đóng API endpoints.'));
    
    // Ngắt Kafka an toàn (chờ đẩy nốt message cuối rồi mới tắt)
    await producer.disconnect();
    console.log('Đã ngắt kết nối Kafka.');
    
    process.exit(0);
}

process.on('SIGINT', shutdown);  // Bắt khi nhấn Ctrl+C
process.on('SIGTERM', shutdown); // Bắt khi Docker/K8s kill pod

// Bật công tắc khởi động
runCollector().catch(console.error);