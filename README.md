# ⚽🏀 iKnowBall - Nền Tảng Phân Tích & Dự Đoán Thể Thao

> **iKnowBall** là nền tảng phân tích dữ liệu thể thao chuyên sâu và dự đoán xác suất kết quả trận đấu (Bóng đá, Bóng rổ) bằng mô hình Machine Learning kết hợp hệ số Elo và thống kê nâng cao.

---

## 📑 Mục lục
1. [Kiến trúc Hệ thống](#-kiến-trúc-hệ-thống)
2. [Ngăn xếp Công nghệ (Tech Stack)](#-ngăn-xếp-công-nghệ)
3. [Cấu hình Biến Môi Trường](#-cấu-hình-biến-môi-trường)
4. [Hướng dẫn Khởi Chạy](#-hướng-dẫn-khởi-chạy)
   - [Cách 1: Chạy bằng Docker Compose (Khuyên dùng)](#cách-1-chạy-toàn-bộ-hệ-thống-với-docker-compose)
   - [Cách 2: Chạy cục bộ từng service (Local Dev)](#cách-2-chạy-cục-bộ-từng-service-local-development)
5. [Khởi Tạo Dữ Liệu (Seed) & Đồng Bộ (Sync)](#-khởi-tạo-dữ-liệu-seed--đồng-bộ-sync)
6. [Giám Sát & Health Checks](#-giám-sát--health-checks)
7. [Các Lệnh Kiểm Thử (Testing)](#-các-lệnh-kiểm-thử-testing)
8. [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)

---

## 🏛 Kiến trúc Hệ thống

Hệ thống được thiết kế theo kiến trúc Microservices kết hợp Monorepo:

```mermaid
flowchart TD
    subgraph Client["Frontend Client (Next.js 16)"]
        UI["Web UI (React 19, Tailwind CSS v4)"]
        State["Zustand & TanStack Query"]
    end

    subgraph Core["Backend API Gateway (NestJS 11)"]
        API["REST API & Controllers"]
        Auth["Auth & JWT / Google OAuth"]
        SyncModule["Sports Sync & Ingestion"]
        Queue["BullMQ Job Processor"]
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

    subgraph External["External APIs"]
        APIFootball["API-Football"]
        BallDontLie["BallDontLie (NBA)"]
    end

    UI -->|HTTP / JSON| API
    API --> Postgres
    API --> Redis
    API -->|HTTP /predict| MLApi
    SyncModule --> APIFootball
    SyncModule --> BallDontLie
    Queue --> Redis
    MLApi -.-> Postgres
```

---

## 🛠 Ngăn xếp Công nghệ

| Thành phần | Công nghệ / Thư viện | Vai trò |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16 (Turbopack, App Router), React 19, Tailwind CSS v4, TanStack Query v5, Zustand | Giao diện người dùng, hiển thị dashboard, tỷ lệ dự đoán, BXH |
| **Backend** | NestJS 11, TypeScript, Prisma ORM 7, BullMQ, Passport (JWT, Google), Throttler | Quản lý xác thực, API dữ liệu, đồng bộ trận đấu, quản lý queue |
| **Prediction Service** | Python 3.10, FastAPI, Uvicorn, Pydantic v2 | Tính toán xác suất kết quả trận đấu dựa trên Elo rating & phong độ |
| **Database** | PostgreSQL 15 | Lưu trữ dữ liệu quan hệ (Người dùng, Đội bóng, Trận đấu, Dự đoán) |
| **Cache & Queue** | Redis 7, BullMQ | Cache phân tán (Cache-aside) và hàng đợi tiến trình đồng bộ bất đồng bộ |
| **Hạ tầng** | Docker, Docker Compose | Đóng gói và chạy môi trường dev/staging chuẩn hóa |

---

## ⚙ Cấu hình Biến Môi Trường

### 1. Backend (`backend/.env`)

| Tên biến | Giá trị mẫu / Mặc định | Mô tả |
| :--- | :--- | :--- |
| `PORT` | `4000` | Cổng HTTP của Backend server |
| `NODE_ENV` | `development` | Môi trường (`development` / `production`) |
| `DATABASE_URL` | `postgresql://iknowball:iknowball123@localhost:5432/iknowball` | Kết nối cơ sở dữ liệu PostgreSQL |
| `REDIS_URL` | `redis://localhost:6379` | URL kết nối Redis cache & queue |
| `REDIS_HOST` | `localhost` | Hostname Redis |
| `REDIS_PORT` | `6379` | Cổng Redis |
| `ENABLE_SYNC_QUEUE` | `false` (local) / `true` (compose) | Bật/tắt xử lý hàng đợi BullMQ ngầm |
| `PREDICTION_SERVICE_URL` | `http://localhost:8001` | Địa chỉ nội bộ gọi sang Prediction Service |
| `JWT_SECRET` | `iknowball_jwt_secret_dev` | Khóa bí mật ký Access Token |
| `JWT_REFRESH_SECRET` | `iknowball_refresh_secret_dev` | Khóa bí mật ký Refresh Token |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Thời hạn Access Token |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Thời hạn Refresh Token |
| `EMAIL_VERIFY_SECRET` | `iknowball_email_verify_dev` | Khóa bí mật tạo token xác thực email |
| `FRONTEND_URL` | `http://localhost:3000` | URL Frontend để cấu hình CORS |
| `API_FOOTBALL_KEY` | `your_api_football_key` | API Key lấy dữ liệu bóng đá |
| `API_BASKETBALL_KEY` | `your_api_basketball_key` | API Key lấy dữ liệu bóng rổ |

### 2. Frontend (`frontend/my-app/.env.local`)

| Tên biến | Giá trị mẫu | Mô tả |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Địa chỉ Backend API cho client fetch dữ liệu |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `your_client_id.apps.googleusercontent.com` | Google OAuth Client ID cho nút đăng nhập |
| `NEXT_PUBLIC_ENV` | `development` | Môi trường ứng dụng frontend |

### 3. Prediction Service (`prediction-service/.env`)

| Tên biến | Giá trị mẫu | Mô tả |
| :--- | :--- | :--- |
| `PORT` | `8001` | Cổng microservice Python |
| `REDIS_URL` | `redis://localhost:6379` | Kết nối Redis |
| `POSTGRES_URL` | `postgresql://iknowball:iknowball123@localhost:5432/iknowball` | Kết nối Postgres |

---

## 🚀 Hướng dẫn Khởi Chạy

### Cách 1: Chạy toàn bộ hệ thống với Docker Compose

> Đảm bảo máy đã cài đặt Docker Desktop.

```bash
# 1. Chuyển vào thư mục infrastructure
cd infrastructure

# 2. Khởi động toàn bộ container (Postgres, Redis, Prediction Service, Backend)
docker compose up --build -d

# 3. Xem logs hệ thống
docker compose logs -f
```

Hệ thống sẽ chạy trên các cổng:
- **Backend API**: `http://localhost:4000`
- **Prediction Service**: `http://localhost:8001`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`

---

### Cách 2: Chạy cục bộ từng service (Local Development)

#### Bước 1: Khởi động cơ sở dữ liệu & Redis (qua Docker)
```bash
# Khởi động riêng Postgres & Redis
cd infrastructure
docker compose up -d postgres redis
```

#### Bước 2: Cài đặt & Chạy Backend (NestJS)
```bash
cd backend

# Cài đặt dependencies
npm install

# Sinh mã Prisma Client
npx prisma generate --schema=src/module/prisma/schema.prisma

# Khởi chạy migration database
npx prisma migrate dev --schema=src/module/prisma/schema.prisma

# Seed dữ liệu mặc định (Roles & Sports)
npm run seed

# Chạy server ở chế độ phát triển
npm run dev
```
Backend lắng nghe tại: `http://localhost:4000`.

#### Bước 3: Cài đặt & Chạy Prediction Service (Python)
```bash
cd prediction-service

# Tạo và kích hoạt virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Cài đặt thư viện
pip install -r requirements.txt

# Khởi chạy service
python run.py
```
Prediction Service lắng nghe tại: `http://localhost:8001`.

#### Bước 4: Cài đặt & Chạy Frontend (Next.js)
```bash
cd frontend/my-app

# Cài đặt dependencies
npm install

# Chạy Next.js dev server
npm run dev
```
Frontend giao diện truy cập tại: `http://localhost:3000`.

---

## 🌱 Khởi Tạo Dữ Liệu (Seed) & Đồng Bộ (Sync)

### 1. Seed dữ liệu nền tảng
Chạy lệnh sau tại thư mục `backend/` để khởi tạo các quyền (`guest`, `user`, `premium`, `admin`) và môn thể thao (`football`, `basketball`):
```bash
npm run seed --prefix backend
```

### 2. Các API Kích hoạt Đồng bộ Dữ liệu Thể thao
Sau khi backend đã chạy, có thể gọi các API endpoint sau để đồng bộ dữ liệu:

- **Full Sync (Leagues -> Teams -> Matches)**:
  ```bash
  curl -X POST http://localhost:4000/api/v1/sync/full
  ```
- **Đồng bộ riêng Danh sách Giải đấu**:
  ```bash
  curl -X POST http://localhost:4000/api/v1/sync/leagues
  ```
- **Đồng bộ riêng Danh sách Đội bóng**:
  ```bash
  curl -X POST http://localhost:4000/api/v1/sync/teams
  ```
- **Đồng bộ riêng Lịch thi đấu & Kết quả**:
  ```bash
  curl -X POST http://localhost:4000/api/v1/sync/matches
  ```

---

## 🩺 Giám Sát & Health Checks

Backend và Prediction Service đều được trang bị cơ chế kiểm tra sức khỏe hệ thống:

| Endpoint | Giao thức | Mô tả |
| :--- | :--- | :--- |
| `GET /health` | Backend | Kiểm tra chi tiết kết nối PostgreSQL, Redis, Prediction Service (HTTP 200 / 503) |
| `GET /health/live` | Backend | Kiểm tra liveness cơ bản của tiến trình server |
| `GET /api/v1/health` | Backend | Endpoint định dạng chuẩn trả về cho frontend dashboard |
| `GET /health` | Prediction Service | Kiểm tra trạng thái hoạt động của microservice Python (cổng 8001) |

**Ví dụ phản hồi từ `GET http://localhost:4000/health`:**
```json
{
  "status": "healthy",
  "timestamp": "2026-09-09T13:30:00.000Z",
  "uptimeSeconds": 1250,
  "environment": "development",
  "queueEnabled": true,
  "services": {
    "database": { "status": "up", "latencyMs": 2 },
    "redis": { "status": "up", "latencyMs": 1 },
    "predictionService": { "status": "up", "latencyMs": 8, "url": "http://localhost:8001" }
  }
}
```

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
├── backend/                  # NestJS API Backend
│   ├── src/
│   │   ├── module/           # Các module nghiệp vụ (Auth, Match, Prediction, Health, Sync,...)
│   │   │   ├── auth/         # Xác thực JWT & Google OAuth
│   │   │   ├── elo/          # Thuật toán tính điểm Elo
│   │   │   ├── health/       # Health check probes (Postgres, Redis, Prediction)
│   │   │   ├── match/        # API Lịch thi đấu & kết quả
│   │   │   ├── prediction/   # Tích hợp mô hình ML & đánh giá Brier/LogLoss
│   │   │   ├── prisma/       # Schema, Migrations & Seed script
│   │   │   ├── shared/       # CacheService (Redis Cache-aside), utils
│   │   │   └── sports-sync/  # BullMQ Worker đồng bộ dữ liệu thể thao
│   │   ├── app.module.ts     # AppModule cấu hình
│   │   └── main.ts           # Entry point của ứng dụng
│   ├── package.json
│   └── vitest.config.ts
│
├── frontend/                 # Next.js Frontend
│   └── my-app/
│       ├── app/              # Next.js 16 App Router (Pages & Components)
│       │   ├── components/   # UI Components (MatchCard, ProbBar, LandingPage,...)
│       │   ├── matches/      # Trang chi tiết & danh sách trận đấu
│       │   └── predictions/  # Dashboard theo dõi hiệu năng mô hình ML
│       ├── next.config.ts    # Cấu hình Turbopack root
│       └── package.json
│
├── prediction-service/       # Microservice dự đoán kết quả bằng Python
│   ├── app/
│   │   └── main.py           # FastAPI server & logic tính toán xác suất
│   ├── Dockerfile
│   ├── requirements.txt
│   └── run.py                # Chạy server Uvicorn cổng 8001
│
├── infrastructure/           # Cấu hình triển khai hạ tầng
│   └── docker-compose.yml    # Cấu hình multi-container kèm healthchecks
│
└── README.md                 # Tài liệu hướng dẫn dự án (File này)
```
