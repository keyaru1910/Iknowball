# Sổ Tay Hướng Dẫn Triển Khai & Vận Hành Production (Go-Live Checklist)

Tài liệu hướng dẫn kiểm tra, cấu hình môi trường và quy trình tự động hóa cho dự án **iKnowBall**.

---

## 1. Biến Môi Trường (Environment Variables)

### Backend (.env.production)
```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://<prod_user>:<prod_password>@<prod_host>:5432/<prod_db>?schema=public

# Bảo mật & JWT
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Frontend & CORS
FRONTEND_URL=https://iknowball.com

# Redis & Queue (Cần thiết cho tự động hóa 100%)
REDIS_URL=redis://<redis_host>:6379
ENABLE_SYNC_QUEUE=true
ENABLE_SYNC_CRON=true
CRON_TZ=Asia/Ho_Chi_Minh

# Cổng thanh toán (PayOS / Stripe)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYOS_CLIENT_ID=...
PAYOS_API_KEY=...
PAYOS_CHECKSUM_KEY=...

# Sports API
SPORTS_API_KEY=...
```

### Frontend (.env.production)
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.iknowball.com/api
NEXT_PUBLIC_SITE_URL=https://iknowball.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX # Mã đo lường Google Analytics 4
```

---

## 2. Tính Tự Động Hóa 100% (Automation Engine)

Khi `ENABLE_SYNC_QUEUE=true` và `ENABLE_SYNC_CRON=true`, hệ thống sẽ tự động chạy ngầm các tiến trình mà không cần quản trị viên can thiệp:
1. **01:00 AM (VN)**: Tự động cào kết quả các trận đấu bóng đá tối hôm trước & cập nhật điểm Elo, đánh giá độ chuẩn xác của AI prediction.
2. **03:00 AM (VN)**: Đồng bộ danh sách giải đấu, đội bóng và trận đấu mới nhất.
3. **04:00 AM (VN)**: Cập nhật kết quả các trận đấu muộn.
4. **07:00 AM (VN)**: Đồng bộ lịch thi đấu 7 ngày tới và tự động tạo xác suất dự đoán (AI Poisson + Elo).
5. **14:00 PM (VN)**: Đồng bộ kết quả giải bóng rổ NBA.

---

## 3. Quy Trình Sao Lưu & Khôi Phục (Backup & Rollback)

### Tạo bản Backup Database
- **Windows**: Chạy `infrastructure\scripts\backup_postgres.bat`
- **Linux/Docker**: Chạy `./infrastructure/scripts/backup_postgres.sh`
- File sao lưu dạng `.dump` sẽ được lưu trong `infrastructure/backups/`.

### Khôi Phục (Rollback) Khi Gặp Sự Cố
- **Windows**: `infrastructure\scripts\restore_postgres.bat "đường_dẫn_file.dump"`
- **Linux/Docker**: `./infrastructure/scripts/restore_postgres.sh <đường_dẫn_file.dump>`

---

## 4. Kiểm Tra Luồng Chính (Core Flow Verification)
1. **Đăng ký & Đăng nhập**: Test JWT token lưu trong cookie/storage, chuyển hướng login khi vào `/vip` hoặc `/admin`.
2. **Thanh toán gói VIP**: Test checkout tạo link thanh toán -> webhook cập nhật trạng thái -> tài khoản nhận huy hiệu VIP.
3. **Form Nhập Liệu & Tìm Kiếm**: Test bộ lọc trận đấu tại `/matches` và `/predictions`, validation form tại `/login`, `/register`.
4. **Trang lỗi**:
   - 404: Truy cập URL không tồn tại (vd: `/random-page-12345`).
   - 500: Tự động kích hoạt khi có runtime error, hiển thị nút *Thử lại ngay*.
