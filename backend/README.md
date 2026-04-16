# Backend Service

Thư mục này dành cho tầng backend/serving.

Nguyên tắc:
- Không khóa framework (có thể dùng FastAPI, NestJS, Spring Boot, ...)
- Chỉ làm API gateway + orchestration nhẹ
- Đọc dữ liệu từ MongoDB (historical) và Redis (real-time)
