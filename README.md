# ⚽🏀 iKnowBall - Nền Tảng Phân Tích & Dự Đoán Thể Thao Đỉnh Cao

> **iKnowBall** là nền tảng phân tích dữ liệu thể thao chuyên sâu, cung cấp dự đoán xác suất kết quả trận đấu (Bóng đá, Bóng rổ) bằng mô hình Machine Learning kết hợp hệ số Elo rating, thống kê nâng cao, radar cảnh báo biến động tỷ lệ (Odds Fluctuation & Value Bet) và tích hợp cổng thanh toán đa kênh (Stripe, VietQR, MoMo, VNPay, ZaloPay).

---

## 📑 Mục lục
1. [🌟 Tính Năng Nổi Bật](#-tính-năng-nổi-bật)
2. [🏛 Kiến trúc Hệ thống](#-kiến-trúc-hệ-thống)
3. [🛠 Ngăn xếp Công nghệ (Tech Stack)](#-ngăn-xếp-công-nghệ)
4. [⚙ Cấu hình Biến Môi Trường](#-cấu-hình-biến-môi-trường)
5. [🚀 Hướng dẫn Khởi Chạy](#-hướng-dẫn-khởi-chạy)
   - [Cách 1: Chạy bằng Docker Compose (Khuyên dùng)](#cách-1-chạy-toàn-bộ-hệ-thống-với-docker-compose)
   - [Cách 2: Chạy cục bộ từng service (Local Dev)](#cách-2-chạy-cục-bộ-từng-service-local-development)
6. [💳 Phân Hệ Thanh Toán & Gói Cước](#-phân-hệ-thanh-toán--gói-cước)
7. [🌱 Khởi Tạo Dữ Liệu (Seed) & Đồng Bộ (Sync)](#-khởi-tạo-dữ-liệu-seed--đồng-bộ-sync)
8. [🩺 Giám Sát & Health Checks](#-giám-sát--health-checks)
9. [🧪 Các Lệnh Kiểm Thử (Testing)](#-các-lệnh-kiểm-thử-testing)
10. [📂 Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)

---

## 🌟 Tính Năng Nổi Bật

### 1. 🤖 Dự Đoán Thể Thao Bằng Trí Tuệ Nhân Tạo & Thống Kê
- **Mô hình xác suất đa chiều**: Dự đoán tỷ lệ Thắng - Hòa - Thua (1X2), Tài/Xỉu (Over/Under), Cả 2 đội ghi bàn (BTTS).
- **Hệ số Elo & Phong độ**: Tự động tính toán điểm Elo theo thời gian thực và trọng số phong độ 5 trận gần nhất.
- **Minh bạch AI (Explainable AI)**: Trực quan hóa các chỉ số tác động (Feature Importance/SHAP), độ tin cậy và lịch sử đánh giá mô hình qua Brier Score & Log Loss.

### 2. ⚡ Cảnh Báo Realtime & Value Bet Radar
- **Odds Fluctuation Feed**: Theo dõi biến động tỷ lệ cược trực tiếp và phát hiện dòng tiền bất thường.
- **Value Bet Finder**: Tự động so sánh xác suất từ mô hình ML với tỷ lệ của nhà cái để phát hiện các kèo có kỳ vọng toán học dương (+EV).
- **Telegram Bot Alert**: Gửi thông báo tức thì về kèo thơm và biến động mạnh tới kênh Telegram cá nhân/nhóm.

### 3. 🏟 Dữ Liệu Thể Thao Toàn Diện (Bóng Đá & Bóng Rổ)
- Lịch thi đấu, bảng xếp hạng (Standings), kết quả chi tiết, thống kê đối đầu (H2H) của các giải đấu hàng đầu: Ngoại Hạng Anh, La Liga, Champions League, Serie A, NBA,...
- Cập nhật tin tức thể thao mới nhất và hệ thống bình luận (Live Comments) theo từng trận đấu.

### 4. 💎 Quản Lý Gói Hội Viên & Thanh Toán Đa Cổng
- **Gói cước linh hoạt**:
  - **Miễn phí (Free)**: Xem lịch thi đấu, kết quả, dự đoán cơ bản.
  - **Gói Pro (149.000 đ / tháng)**: Mở khóa xác suất nâng cao, radar Value Bet, thống kê chuyên sâu.
  - **Gói VIP (1.490.000 đ / năm)**: Toàn quyền truy cập mọi tính năng, nhận cảnh báo sớm qua Telegram, API riêng cho nhà phát triển.
- **Đa dạng cổng thanh toán**:
  - **Quốc tế**: Thẻ tín dụng/ghi nợ quốc tế qua Stripe Checkout & Webhook an toàn.
  - **Nội địa Việt Nam**: VietQR (SeABank, Techcombank, VietinBank, MBBank), MoMo, VNPay, ZaloPay (hỗ trợ sandbox và tự động quét mã).

### 5. 🛡 Bảo Mật & Quản Trị Hệ Thống
- Xác thực kép: Email/Password với JWT & Refresh Token an toàn, tích hợp Google OAuth.
- Phòng chống tấn công Brute-force & DDOS bằng NestJS Throttler Rate Limiter và Helmet CSP.
- Trang quản trị Admin: Quản lý người dùng, duyệt nạp tiền, kích hoạt Job đồng bộ dữ liệu (BullMQ), giám sát chỉ số hệ thống.

---

## 🏛 Kiến trúc Hệ thống

Hệ thống được thiết kế theo kiến trúc Microservices phân lớp:

```mermaid
flowchart TD
    subgraph Client["Frontend Client (Next.js 16)"]
        UI["Web UI (React 19, Tailwind CSS v4)"]
        State["Zustand & TanStack Query v5"]
    end

    subgraph Core["Backend API Gateway (NestJS 11)"]
        API["REST API & Controllers"]
        Auth["Auth & JWT / Google OAuth"]
        PaymentMod["Payment Gateway (Stripe / VietQR / MoMo / VNPay / ZaloPay)"]
        SyncModule["Sports Sync & Ingestion"]
        Queue["BullMQ Job Processor"]
        AlertMod["Alerts & Telegram Bot"]
        Health["Health & Readiness Probes"]
    end

    subgraph ML["Prediction Microservice (FastAPI)"]
        MLApi["FastAPI Service (:8001)"]
        EloEngine["Elo & Probability Engine"]
    end

    subgraph Infra["Hạ Tầng & Lưu Trữ"]
        Postgres[(PostgreSQL 15)]
        Redis[(Redis 7 - Cache & Queue)]
    end

    subgraph External["External Services & APIs"]
        APIFootball["API-Football"]
        BallDontLie["BallDontLie (NBA)"]
        StripeAPI["Stripe API & Webhooks"]
        TeleAPI["Telegram Bot API"]
    end

    UI -->|HTTP / JSON| API
    API --> Postgres
    API --> Redis
    API -->|HTTP /predict| MLApi
    API --> StripeAPI
    AlertMod --> TeleAPI
    SyncModule --> APIFootball
    SyncModule --> BallDontLie
    Queue --> Redis
    MLApi -.-> Postgres
```

---

## 🛠 Ngăn xếp Công nghệ

| Thành phần | Công nghệ / Thư viện | Vai trò |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4, TanStack Query v5, Zustand, Lucide React, Recharts | Giao diện người dùng, hiển thị dashboard, tỷ lệ dự đoán, radar cảnh báo, bảng xếp hạng, thanh toán |
| **Backend** | NestJS 11, TypeScript, Prisma ORM 7, BullMQ, Passport (JWT, Google), Throttler, Helmet | Quản lý xác thực, thanh toán, xử lý dữ liệu thể thao, quản lý queue, bảo mật API |
| **Prediction Service** | Python 3.10+, FastAPI, Uvicorn, Pydantic v2, NumPy, Scikit-learn | Tính toán xác suất trận đấu dựa trên Elo rating, Poisson & phong độ |
| **Database** | PostgreSQL 15 | Lưu trữ dữ liệu quan hệ (Người dùng, Đội bóng, Trận đấu, Dự đoán, Giao dịch) |
| **Cache & Queue** | Redis 7, BullMQ | Cache phân tán (Cache-aside) và hàng đợi tiến trình đồng bộ bất đồng bộ |
| **Hạ tầng & Đóng gói**| Docker, Docker Compose | Đóng gói và chạy môi trường dev/staging/production chuẩn hóa |

---

## ⚙ Cấu hình Biến Môi Trường

### 1. Backend (`backend/.env`)

```env
# Server Config
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database & Cache
DATABASE_URL="postgresql://iknowball:iknowball123@localhost:5432/iknowball"
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT=6379
ENABLE_SYNC_QUEUE=false

# Microservice URL
PREDICTION_SERVICE_URL="http://localhost:8001"

# JWT Authentication
JWT_SECRET="iknowball_jwt_secret_dev_2026"
JWT_REFRESH_SECRET="iknowball_refresh_secret_dev_2026"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
EMAIL_VERIFY_SECRET="iknowball_email_verify_dev_2026"

# Sports Data API Keys
API_FOOTBALL_KEY="your_api_football_key"
API_BASKETBALL_KEY="your_api_basketball_key"

# Payment Gateways
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_MONTHLY_PRICE_ID="price_..."
STRIPE_PRO_YEARLY_PRICE_ID="price_..."

# Telegram Notifications
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
TELEGRAM_CHANNEL_ID="your_channel_id"
```

### 2. Frontend (`frontend/my-app/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
NEXT_PUBLIC_ENV=development
```

### 3. Prediction Service (`prediction-service/.env`)

```env
PORT=8001
REDIS_URL=redis://localhost:6379
POSTGRES_URL=postgresql://iknowball:iknowball123@localhost:5432/iknowball
```

---

## 🚀 Hướng dẫn Khởi Chạy

### Cách 1: Chạy toàn bộ hệ thống với Docker Compose

> Đảm bảo máy tính đã cài đặt **Docker Desktop**.

```bash
# 1. Chuyển vào thư mục infrastructure
cd infrastructure

# 2. Khởi động toàn bộ container
docker compose up --build -d

# 3. Xem logs hệ thống
docker compose logs -f
```

Hệ thống sẽ chạy trên các cổng:
- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000`
- **Prediction Service**: `http://localhost:8001`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`

---

### Cách 2: Chạy cục bộ từng service (Local Development)

#### Bước 1: Khởi động Cơ sở dữ liệu & Redis (qua Docker)
```bash
cd infrastructure
docker compose up -d postgres redis
```

#### Bước 2: Cài đặt & Chạy Backend (NestJS)
```bash
cd backend

# Cài đặt thư viện
npm install

# Sinh mã Prisma Client & cập nhật schema
npx prisma generate --schema=src/module/prisma/schema.prisma
npx prisma migrate dev --schema=src/module/prisma/schema.prisma

# Khởi tạo dữ liệu mẫu (Roles, Sports, Admin account)
npm run seed

# Chạy server ở chế độ phát triển
npm run dev
```
Backend sẽ khởi chạy tại: `http://localhost:4000`.

#### Bước 3: Cài đặt & Chạy Prediction Service (Python)
```bash
cd prediction-service

# Tạo và kích hoạt virtual environment
python -m venv venv
# Trên Windows:
.\venv\Scripts\activate
# Trên Linux / macOS:
source venv/bin/activate

# Cài đặt thư viện
pip install -r requirements.txt

# Khởi chạy service
python run.py
```
Prediction Service lắng nghe tại: `http://localhost:8001`.

#### Bước 4: Cài đặt & Chạy Frontend (Next.js 16)
```bash
cd frontend/my-app

# Cài đặt dependencies
npm install

# Chạy Next.js dev server
npm run dev
```
Giao diện người dùng truy cập tại: `http://localhost:3000`.

---

## 💳 Phân Hệ Thanh Toán & Gói Cước

| Gói Cước | Giá (VND) | Quyền Lợi Chính |
| :--- | :--- | :--- |
| **FREE** | 0 đ | Xem lịch thi đấu, kết quả, bảng xếp hạng, dự đoán cơ bản (1X2) |
| **PRO** | 149.000 đ / tháng | Xác suất đầy đủ (Tài Xỉu, BTTS), Radar Value Bet, Thống kê phong độ & H2H chuyên sâu |
| **VIP** | 1.490.000 đ / năm | Toàn quyền tính năng Pro + Nhận cảnh báo Telegram sớm + Truy cập Developer API Key |

### Các phương thức hỗ trợ:
- **Quốc tế**: Thanh toán thẻ qua Stripe Checkout an toàn chuẩn PCI-DSS.
- **Việt Nam**: Quét mã VietQR chuyển khoản ngân hàng (SeABank, Techcombank, VietinBank, MBBank), ví điện tử MoMo, VNPay, ZaloPay.

---

## 🌱 Khởi Tạo Dữ Liệu (Seed) & Đồng Bộ (Sync)

### 1. Seed dữ liệu nền tảng
Chạy lệnh sau tại thư mục `backend/` để tạo các Role (`guest`, `user`, `premium`, `admin`) và môn thể thao (`football`, `basketball`):
```bash
npm run seed --prefix backend
```

### 2. Các API Kích hoạt Đồng bộ Dữ liệu Thể thao (Admin)
Admin có thể kích hoạt các job đồng bộ dữ liệu bằng `curl` hoặc từ Dashboard Quản trị:

- **Đồng bộ toàn diện (Leagues -> Teams -> Matches -> Standings)**:
  ```bash
  curl -X POST http://localhost:4000/api/v1/admin/sync/trigger \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
    -d '{"type": "full", "sport": "football"}'
  ```

- **Đồng bộ Lịch thi đấu & Kết quả**:
  ```bash
  curl -X POST http://localhost:4000/api/v1/admin/sync/trigger \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
    -d '{"type": "matches", "sport": "football"}'
  ```

- **Kích hoạt sinh dự đoán AI cho các trận sắp tới**:
  ```bash
  curl -X POST http://localhost:4000/api/v1/predictions/generate \
    -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
  ```

- **Kiểm tra trạng thái hàng đợi BullMQ & Cron Jobs**:
  ```bash
  curl -X GET http://localhost:4000/api/v1/admin/sync/queues/status \
    -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
  ```

---

## 🩺 Giám Sát & Health Checks

Backend và Prediction Service đều được trang bị cơ chế kiểm tra sức khỏe hệ thống:

| Endpoint | Giao thức | Mô tả |
| :--- | :--- | :--- |
| `GET /health` | Backend | Kiểm tra chi tiết kết nối PostgreSQL, Redis, Prediction Service (HTTP 200 / 503) |
| `GET /health/live` | Backend | Kiểm tra liveness cơ bản của tiến trình server |
| `GET /api/v1/health` | Backend | Endpoint chuẩn trả về thông tin trạng thái cho Frontend |
| `GET /health` | Prediction Service | Kiểm tra trạng thái hoạt động của microservice Python (cổng 8001) |

---

## 🧪 Các Lệnh Kiểm Thử (Testing)

### 1. Backend Testing
```bash
# Chạy toàn bộ Unit Tests với Vitest
npm run test --prefix backend

# Chạy Test ở chế độ theo dõi (Watch mode)
npm run test:watch --prefix backend

# Chạy E2E Tests
npm run test:e2e --prefix backend
```

### 2. Frontend Validation
```bash
# Kiểm tra TypeScript và Build ứng dụng Next.js
npm run build --prefix frontend/my-app

# Chạy ESLint kiểm tra cú pháp và chất lượng mã nguồn
npm run lint --prefix frontend/my-app
```

---

## 📂 Cấu Trúc Thư Mục

```
iknowball/
├── backend/                         # NestJS API Backend Gateway
│   ├── src/
│   │   ├── common/                  # Middleware (RequestId, Logger, Filters)
│   │   ├── config/                  # Quản lý & xác thực biến môi trường
│   │   ├── module/                  # Các module nghiệp vụ
│   │   │   ├── admin/               # Quản trị hệ thống, users, transactions
│   │   │   ├── alert/               # Radar cảnh báo biến động & value bets
│   │   │   ├── auth/                # Xác thực JWT, Google OAuth & RBAC Guards
│   │   │   ├── comments/            # Bình luận trận đấu cộng đồng
│   │   │   ├── elo/                 # Thuật toán tính điểm Elo thể thao
│   │   │   ├── health/              # Health check probes (Postgres, Redis, ML)
│   │   │   ├── match/               # API Lịch thi đấu, Live Score & H2H
│   │   │   ├── news/                # Tin tức & bài viết phân tích thể thao
│   │   │   ├── payment/             # Tích hợp Stripe, VietQR, MoMo, VNPay, ZaloPay
│   │   │   ├── prediction/          # Tích hợp mô hình ML & đánh giá Brier/LogLoss
│   │   │   ├── prisma/              # Schema, Migrations & Seed script
│   │   │   ├── shared/              # CacheService (Redis Cache-aside), Shared utils
│   │   │   ├── sports-sync/         # BullMQ Workers đồng bộ dữ liệu thể thao
│   │   │   └── telegram/            # Tích hợp Telegram Bot gửi thông báo
│   │   ├── app.module.ts            # Root AppModule
│   │   └── main.ts                  # Entry point với Helmet, CORS, Validation
│   ├── package.json
│   └── vitest.config.ts
│
├── frontend/                        # Next.js 16 Frontend (App Router)
│   └── my-app/
│       ├── app/
│       │   ├── (auth)/              # Trang Login, Register, Verify Email
│       │   ├── (public)/            # Trang công khai & hội viên
│       │   │   ├── alerts/          # Radar cảnh báo biến động tỷ lệ kèo
│       │   │   ├── developer/       # Trang tài liệu Developer API Key
│       │   │   ├── matches/         # Chi tiết trận đấu & phân tích
│       │   │   ├── news/            # Trang tin tức thể thao
│       │   │   ├── predictions/     # Dashboard dự đoán & chỉ số mô hình ML
│       │   │   ├── pricing/         # Trang nâng cấp gói cước Pro & VIP
│       │   │   ├── standings/       # Bảng xếp hạng các giải đấu
│       │   │   ├── statistics/      # Thống kê hiệu suất & phong độ đội bóng
│       │   │   ├── teams/           # Thông tin câu lạc bộ / đội bóng
│       │   │   └── vip/             # Trung tâm phân tích chuyên sâu VIP Hub
│       │   ├── admin/               # Bảng điều khiển quản trị viên
│       │   ├── components/          # Reusable UI Components
│       │   ├── context/             # React Contexts (Auth, Realtime, Theme)
│       │   └── hooks/               # Custom React Hooks
│       ├── next.config.ts           # Cấu hình Next.js Turbopack
│       └── package.json
│
├── prediction-service/              # Microservice Dự đoán Thể thao bằng Python
│   ├── app/
│   │   └── main.py                  # FastAPI server & logic tính toán xác suất
│   ├── Dockerfile
│   ├── requirements.txt
│   └── run.py                       # Chạy server Uvicorn cổng 8001
│
├── infrastructure/                  # Cấu hình triển khai hạ tầng
│   └── docker-compose.yml           # Cấu hình multi-container (Postgres, Redis, API, ML)
│
└── README.md                        # Tài liệu hướng dẫn dự án (File này)
```

---

*© 2026 iKnowBall Team. All rights reserved.*
