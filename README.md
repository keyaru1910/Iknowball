# ⚽🏀 iKnowBall — Nền Tảng Phân Tích Định Lượng & Dự Đoán Thể Thao AI Thế Hệ Mới

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Web%20%26%20Mobile%20Responsive-blue?style=for-the-badge&logo=react" alt="Platform" />
  <img src="https://img.shields.io/badge/Next.js-16%20(React%2019)-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/NestJS-11%20(TypeScript)-E0234E?style=for-the-badge&logo=nestjs" alt="NestJS" />
  <img src="https://img.shields.io/badge/FastAPI-Python%203.11-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/AI%20Model-Elo%20%2B%20Poisson%20%2B%20ML-orange?style=for-the-badge" alt="AI Model" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL%2015%20%7C%20Redis%207-336791?style=for-the-badge&logo=postgresql" alt="Database" />
  <img src="https://img.shields.io/badge/Payment-Stripe%20%7C%20VietQR%20%7C%20MoMo%20%7C%20VNPay-green?style=for-the-badge" alt="Payment" />
  <img src="https://img.shields.io/badge/Deployment-Docker%20Compose-2496ED?style=for-the-badge&logo=docker" alt="Docker" />
</p>

---

## 📖 Giới Thiệu Tổng Quan

**iKnowBall** là nền tảng phân tích định lượng (Quantitative Sports Analytics) và dự đoán thể thao thông minh, kết hợp các mô hình toán học thống kê chuẩn xác (**Hệ số sức mạnh Elo**, **Phân phối xác suất Poisson**) cùng thuật toán **Học máy (Machine Learning)** và **Explainable AI (XAI)** nhằm cung cấp cho người hâm mộ, chuyên gia phân tích và nhà đầu tư dữ liệu cái nhìn minh bạch, khoa học và trực quan nhất về diễn biến và xác suất trận đấu.

Hệ thống hỗ trợ dữ liệu thể thao đa môn:
* ⚽ **Bóng đá đỉnh cao (Football)**: Premier League (Ngoại hạng Anh), UEFA Champions League, La Liga, Serie A, Bundesliga, Ligue 1,...
* 🏀 **Bóng rổ nhà nghề Mỹ (NBA)**: Toàn bộ 30 đội bóng thuộc 2 miền Đông/Tây với chỉ số sức mạnh và hiệu suất tấn công/phòng ngự chuyên sâu.

---

## ✨ Điểm Nhấn & Tính Năng Vượt Trội

### 1. 🤖 Động Cơ Phân Tích Xác Suất AI & Minh Bạch Thuật Toán (Explainable AI)
* **Probability Engine Đa Chiều**: Tự động tính toán phân phối xác suất Thắng – Hòa – Thua (1X2), xác suất tỷ số chính xác (Score Matrix) và tổng số bàn thắng kỳ vọng (xG / Total Points).
* **Mô Hình Elo & Phong Độ Thích Ứng**: Cập nhật chỉ số sức mạnh Elo động sau mỗi vòng đấu, tính toán trọng số sân nhà/sân khách, độ khó của lịch thi đấu (SoS - Strength of Schedule) và phong độ 5 trận gần nhất.
* **Đo Lường & Kiểm Chuẩn Độ Chuẩn Xác (Model Calibration)**:
  * Trực quan hóa **Brier Score** và **Log Loss** qua từng mùa giải để chứng minh độ tin cậy của mô hình.
  * Phân tích mức độ ảnh hưởng của từng biến số (Feature Importance) giúp người dùng hiểu rõ lý do đằng sau mỗi dự đoán.

### 2. ⚡ Trợ Lý VIP AI Copilot & Trình Mô Phỏng Tương Tác (Simulator)
* **Interactive AI Copilot**: Trợ lý phân tích thông minh giải đáp chi tiết về tương quan lực lượng, chiến thuật và kịch bản trận đấu.
* **Match Outcome Simulator**: Công cụ mô phỏng trận đấu với các thanh trượt kịch bản linh hoạt (tỷ lệ kiểm soát bóng, thẻ phạt, chấn thương cầu thủ chủ chốt) để tái tính toán xác suất theo thời gian thực.
* **Value Bet (+EV) Scanner**: Bộ lọc tự động phát hiện các cơ hội chênh lệch giá trị toán học dương so với tỷ lệ tham chiếu thị trường quốc tế.

### 3. 📊 Radar Biến Động Thị Trường & Cảnh Báo Telegram (Market Inefficiency Radar)
* **Theo dõi biến động tỷ lệ (Odds Volatility Feed)**: Giám sát biên độ dao động chỉ số dữ liệu theo thời gian thực, tự động gắn cờ cảnh báo khi có dòng tiền hoặc thông tin đột biến.
* **Telegram Analytics Alert Bot**: Gửi cảnh báo tự động tức thì vào kênh Telegram khi phát hiện trận đấu có chỉ số kỳ vọng (+EV) cao hoặc biến động tỷ lệ bất thường.

### 4. 🔄 Bộ Điều Phối Dữ Liệu Đa Nhà Cung Cấp (Multi-Provider Resilient Sync)
* **Cơ chế Dự phòng Tự Động (Zero-Downtime Failover)**:
  * **Bóng đá**: Zafronix API $\rightarrow$ API-Football $\rightarrow$ Football-Data.org.
  * **Bóng rổ**: Balldontlie API $\rightarrow$ API-Basketball (API-Sports).
* **Key Pool Manager**: Tự động xoay tua (Round-robin) danh sách API Key và đưa vào hàng chờ thông minh khi chạm ngưỡng giới hạn (HTTP 429 Rate Limit), đảm bảo luồng đồng bộ dữ liệu không bao giờ bị gián đoạn.

### 5. 💳 Cổng Thanh Toán Đa Kênh & Quản Lý Hội Viên Linh Hoạt
* **Các gói hội viên**:
  * 🆓 **Gói Free**: Tra cứu lịch thi đấu, bảng xếp hạng, kết quả và dự đoán xác suất cơ bản.
  * 🌟 **Gói Pro (149.000 đ/tháng)**: Mở khóa phân tích chuyên sâu, Radar +EV Index, thống kê H2H mở rộng, biểu đồ sức mạnh chi tiết.
  * 👑 **Gói VIP (1.490.000 đ/năm)**: Toàn quyền truy cập VIP AI Copilot, Simulator nâng cao, nhận tin Telegram Alert tức thời và cấp quyền truy cập Developer API Key.
* **Phương thức thanh toán**:
  * **Quốc tế**: Thanh toán thẻ toàn cầu qua **Stripe Checkout** an toàn chuẩn PCI-DSS.
  * **Nội địa Việt Nam**: Quét mã **VietQR** tự động (SeABank, Techcombank, VietinBank, MBBank) và các ví điện tử hàng đầu (**MoMo**, **VNPay**, **ZaloPay**).

### 6. 💬 Live Scoreboard, Bình Luận Cộng Đồng & Developer API
* **Live Match Center**: Tỷ số trực tiếp, sự kiện trận đấu và thống kê theo thời gian thực.
* **Không gian thảo luận**: Diễn đàn trao đổi nhận định chuyên sâu giữa các thành viên cộng đồng với hệ thống phân quyền (RBAC).
* **Cổng Nhà Phát Triển (Developer API Portal)**: Cung cấp API Key và tài liệu OpenAPI/Swagger dành cho các nhà nghiên cứu và lập trình viên tích hợp dữ liệu.

---

## 🏛 Kiến Trúc Hệ Thống (System Architecture)

Dự án được xây dựng theo mô hình **Microservices phân tầng**, phân tách rõ ràng giữa lớp giao diện, lớp điều hướng nghiệp vụ, dịch vụ tính toán AI và tầng lưu trữ phân tán:

```mermaid
flowchart TD
    subgraph Client_Layer["🖥️ Frontend Client (Next.js 16 + React 19)"]
        UI["Modern Web App (Dark Mode, Glassmorphism, Tailwind v4)"]
        Copilot["VIP AI Copilot & Match Simulator"]
        State["Zustand State & TanStack Query v5"]
    end

    subgraph Gateway_Layer["🛡️ Backend Gateway (NestJS 11 + TypeScript)"]
        AuthMod["Xác thực JWT / Google OAuth & RBAC"]
        PaymentMod["Cổng thanh toán (Stripe / VietQR / MoMo / VNPay)"]
        Coordinator["Multi-Provider Coordinator & Key Pool"]
        Queue["BullMQ Sync Jobs & Background Workers"]
        AlertService["Telegram Bot Alert Service"]
        CacheLayer["Redis Distributed Cache (Cache-Aside Pattern)"]
    end

    subgraph AI_Layer["🧠 Prediction Microservice (Python FastAPI :8001)"]
        MLApi["FastAPI Model Endpoints"]
        EloEngine["Dynamic Elo Rating Calculator"]
        PoissonEngine["Bivariate Poisson Probability Engine"]
        CalibEngine["Calibration & XAI Metrics (Brier / Log Loss)"]
    end

    subgraph Persistence_Layer["💾 Data Persistence"]
        Postgres[(PostgreSQL 15 Database)]
        RedisStore[(Redis 7 Cache & Queue)]
    end

    subgraph External_APIs["🌐 External Sports Providers Pool"]
        ZF["Zafronix Sports API"]
        AF["API-Football"]
        FD["Football-Data.org"]
        BDL["Balldontlie (NBA)"]
        AB["API-Basketball"]
        TelegramAPI["Telegram Bot Webhook API"]
    end

    Client_Layer -->|REST API / HTTPS| Gateway_Layer
    Gateway_Layer --> Persistence_Layer
    Gateway_Layer -->|Sync Tasks| Queue
    Queue --> Coordinator
    Coordinator --> External_APIs
    Gateway_Layer -->|Compute Probability| AI_Layer
    AI_Layer -.-> Postgres
    AlertService --> TelegramAPI
```

---

## 🛠️ Ngăn Xếp Công Nghệ (Tech Stack)

| Lớp (Layer) | Công nghệ chính | Vai trò kỹ thuật |
| :--- | :--- | :--- |
| **Giao diện (Frontend)** | `Next.js 16`, `React 19`, `Tailwind CSS v4`, `Lucide React`, `Recharts`, `Zustand`, `TanStack Query v5` | Dashboard phân tích dữ liệu, VIP AI Copilot, trình mô phỏng tương tác, giao diện Dark Mode cao cấp |
| **Dịch vụ Backend** | `NestJS 11`, `TypeScript`, `Prisma ORM 7`, `BullMQ`, `Passport JWT & Google OAuth` | REST API, xác thực bảo mật, quản lý thanh toán, điều phối dữ liệu đa nguồn và hàng đợi nền |
| **Dịch vụ AI (Machine Learning)** | `Python 3.11`, `FastAPI`, `NumPy`, `Scikit-Learn`, `SciPy`, `Uvicorn` | Tính toán ma trận xác suất Poisson, cập nhật hệ số Elo, phân tích Brier Score và Log Loss |
| **Cơ sở dữ liệu & Bộ nhớ đệm** | `PostgreSQL 15`, `Redis 7` | Lưu trữ dữ liệu quan hệ ACID bền vững, bộ nhớ đệm phân tán với độ trễ phản hồi < 5ms |
| **Nguồn dữ liệu thể thao** | `Zafronix`, `API-Football`, `Football-Data.org`, `Balldontlie`, `API-Basketball` | Thu thập lịch thi đấu, kết quả, bảng xếp hạng và chỉ số thị trường đa môn |
| **Hạ tầng & Đóng gói** | `Docker`, `Docker Compose`, `Git` | Đóng gói toàn bộ cụm dịch vụ đồng nhất, sẵn sàng triển khai trên Production |

---

## 📁 Cấu Trúc Thư Mục Dự Án (Project Structure)

```plaintext
iknowball-project/
├── backend/                        # NestJS API Gateway & Business Logic
│   ├── src/
│   │   ├── config/                 # Cấu hình môi trường & hệ thống
│   │   ├── module/
│   │   │   ├── admin/              # Module Quản trị viên (Users, Sync, Diagnostics)
│   │   │   ├── alert/              # Module Radar phân tích (+EV, Market Inefficiency)
│   │   │   ├── auth/               # Xác thực JWT, Google OAuth & RBAC
│   │   │   ├── comments/           # Bình luận & thảo luận cộng đồng
│   │   │   ├── elo/                # Tính toán & cập nhật điểm Elo
│   │   │   ├── match/              # Quản lý trận đấu, tỷ số, đội bóng & giải đấu
│   │   │   ├── payment/            # Cổng thanh toán (Stripe, VietQR, MoMo, VNPay)
│   │   │   ├── prediction/         # Tích hợp & điều phối dự đoán AI
│   │   │   ├── sports-api/         # Key Pool Manager & Failover Coordinator
│   │   │   ├── sports-sync/        # BullMQ Background Workers đồng bộ dữ liệu
│   │   │   ├── telegram/           # Telegram Bot Alert Service
│   │   │   └── user/               # Quản lý thông tin tài khoản & gói hội viên
│   │   ├── prisma/                 # Prisma Schema & Database Migrations
│   │   └── scripts/                # CLI Scripts (Seed, Đồng bộ, Diagnostics)
│   ├── test/                       # Vitest Unit & E2E Tests
│   └── package.json
│
├── frontend/my-app/                # Next.js 16 Web Application
│   ├── app/
│   │   ├── (auth)/                 # Đăng nhập, Đăng ký, Quên mật khẩu
│   │   ├── (public)/               # Các trang công khai (Matches, Predictions, Alerts, VIP, Pricing...)
│   │   ├── admin/                  # Dashboard quản trị hệ thống
│   │   ├── components/             # React Components (Copilot, Simulator, Charts, OddsRadar...)
│   │   ├── context/                # AuthContext, NotificationContext
│   │   └── globals.css             # Tailwind CSS v4 Styles
│   └── package.json
│
├── prediction-service/             # Python FastAPI Machine Learning Microservice
│   ├── app/
│   │   ├── api/                    # FastAPI Endpoints (/predict, /evaluate, /health)
│   │   ├── core/                   # Cấu hình & Database Engine
│   │   ├── models/                 # Elo Rating, Bivariate Poisson, XAI Evaluator
│   │   └── services/               # Dịch vụ phân tích thống kê & dự đoán
│   ├── requirements.txt            # Python Dependencies
│   └── run.py                      # FastAPI Startup Entrypoint
│
└── infrastructure/                 # Cấu hình Hạ tầng & Docker
    ├── docker-compose.yml          # Đóng gói PostgreSQL, Redis, Backend, Prediction Service
    └── PRODUCTION_DEPLOY_CHECKLIST.md # Hướng dẫn triển khai Production
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy Nhanh (Quick Start)

### 📋 Yêu Cầu Tiền Đề (Prerequisites)
* **Node.js**: Phiên bản `>= 20.x` (khuyến nghị Node.js 22 LTS)
* **Python**: Phiên bản `>= 3.11`
* **Docker & Docker Compose** (Tùy chọn nếu muốn chạy qua container)
* **PostgreSQL 15+** và **Redis 7+** (nếu chạy local không qua Docker)

---

### Cách 1: Khởi Chạy Nhanh Bằng Docker Compose (Khuyến Nghị)

Toàn bộ Database, Redis, Backend Gateway và Prediction Service sẽ được khởi chạy tự động:

```bash
# 1. Di chuyển vào thư mục infrastructure
cd infrastructure

# 2. Khởi động tất cả các container
docker compose up -d

# 3. Kiểm tra trạng thái hoạt động của các container
docker compose ps
```

* **Backend API Gateway**: `http://localhost:4000`
* **Prediction AI Service**: `http://localhost:8001`
* **PostgreSQL**: `localhost:5432` (User: `iknowball`, DB: `iknowball`)
* **Redis**: `localhost:6379`

Sau đó khởi chạy Frontend:
```bash
cd ../frontend/my-app
npm install
npm run dev
```
Truy cập giao diện Web tại: `http://localhost:3000`

---

### Cách 2: Khởi Chạy Thủ Công Từng Dịch Vụ (Development Mode)

#### 1. Khởi chạy Dịch vụ AI (Prediction Service - Python)
```bash
cd prediction-service

# Tạo và kích hoạt môi trường ảo Python
python -m venv venv
# Trên Windows:
.\venv\Scripts\activate
# Trên Linux/macOS:
# source venv/bin/activate

# Cài đặt thư viện phụ thuộc
pip install -r requirements.txt

# Khởi chạy dịch vụ FastAPI trên cổng 8001
python run.py
```

#### 2. Khởi chạy Dịch vụ Backend (NestJS)
```bash
cd backend

# Cài đặt dependencies
npm install

# Sao chép và cấu hình file môi trường
cp .env.example .env

# Đồng bộ lược đồ cơ sở dữ liệu Prisma
npx prisma db push

# (Tùy chọn) Nạp dữ liệu mẫu ban đầu
npm run seed:sports
npm run seed:basketball
npm run seed:admin

# Khởi chạy NestJS ở chế độ Watch/Dev
npm run dev
```

#### 3. Khởi chạy Dịch vụ Giao diện (Frontend - Next.js)
```bash
cd frontend/my-app

# Cài đặt dependencies
npm install

# Khởi chạy máy chủ phát triển
npm run dev
```

---

## ⚙️ Cấu Hình Biến Môi Trường (Environment Variables)

### Backend (`backend/.env`)
```ini
# Server Configuration
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database & Redis
DATABASE_URL="postgresql://iknowball:iknowball123@localhost:5432/iknowball?schema=public"
REDIS_URL="redis://localhost:6379"

# Security & Authentication
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Prediction AI Microservice URL
PREDICTION_SERVICE_URL="http://localhost:8001"

# Sports Data API Keys (Multi-provider)
ZAFRONIX_API_KEY="your-zafronix-key"
API_FOOTBALL_KEY="your-api-football-key"
FOOTBALL_DATA_ORG_KEY="your-football-data-key"
BALLDONTLIE_API_KEY="your-balldontlie-key"

# Payment Gateways
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
VIETQR_BANK_ID="970422"
VIETQR_ACCOUNT_NO="your-account-number"

# Telegram Bot Alert
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-or-channel-id"
```

### Prediction Service (`prediction-service/.env`)
```ini
PORT=8001
HOST=0.0.0.0
POSTGRES_URL=postgresql://iknowball:iknowball123@localhost:5432/iknowball
REDIS_URL=redis://localhost:6379
```

### Frontend (`frontend/my-app/.env.local`)
```ini
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 🛠️ Danh Sách Lệnh Tiện Ích & CLI Scripts

Hệ thống cung cấp sẵn các CLI Script mạnh mẽ trong thư mục `backend/` giúp quản trị viên dễ dàng thao tác dữ liệu:

| Lệnh (NPM Script) | Mô tả chức năng |
| :--- | :--- |
| `npm run seed:sports` | Khởi tạo dữ liệu bóng đá mẫu (Giải đấu, Đội bóng, Lịch thi đấu ban đầu) |
| `npm run seed:basketball` | Khởi tạo dữ liệu 30 đội bóng NBA và lịch thi đấu giải bóng rổ nhà nghề Mỹ |
| `npm run seed:admin` | Tạo tài khoản Quản trị viên (Admin) mặc định |
| `npm run sync:realtime` | Kích hoạt quét và đồng bộ dữ liệu thời gian thực từ API Thể thao |
| `npm run predict:all` | Kích hoạt AI tính toán xác suất cho tất cả các trận đấu sắp diễn ra |
| `npm run test` | Chạy bộ kiểm thử tự động (Unit Tests) với Vitest |
| `npm run test:e2e` | Chạy kiểm thử luồng tích hợp toàn diện (E2E Tests) |

---

## 🧪 Kiểm Thử & Đánh Giá Chất Lượng Mô Hình (Testing & Evaluation)

### Kiểm thử Backend (NestJS & Vitest)
```bash
cd backend
npm run test          # Chạy unit tests
npm run test:e2e      # Chạy end-to-end integration tests
```

### Kiểm thử Dịch vụ AI (Python Pytest)
```bash
cd prediction-service
pytest -v             # Kiểm tra thuật toán Elo, Poisson và độ hội tụ mô hình
```

---

## 🔒 Bản Quyền & Tuyên Bố Miễn Trừ Trách Nhiệm (Disclaimer)

* **Tuyên bố trách nhiệm**: iKnowBall là nền tảng nghiên cứu và phân tích dữ liệu thể thao định lượng thuần túy phục vụ mục đích thông tin, thống kê và học thuật. Nền tảng **không** cung cấp dịch vụ cá cược trực tiếp.
* **Bản quyền**: © 2026 **iKnowBall Team**. Toàn bộ mã nguồn và giải pháp thuật toán được phát triển và tối ưu bởi đội ngũ kỹ sư dữ liệu thể thao iKnowBall.
