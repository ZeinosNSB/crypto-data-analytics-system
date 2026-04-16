# Batch Processing (PySpark)

Thành phần xử lý cold path.

Luồng:
- Đọc dữ liệu raw từ MinIO
- Tính toán/tổng hợp theo lô
- Ghi kết quả lịch sử vào MongoDB
