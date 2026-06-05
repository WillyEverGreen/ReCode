<div align="center">
  <img src="./components/Logo-With-Name%20cropped.png" alt="ReCode Logo" width="400"/>
  <br/><br/>
  <p><strong>Transform your raw DSA submissions into beautifully structured, exam-ready revision cards and code portfolios.</strong></p>
  <p>
    <img src="https://img.shields.io/badge/NVIDIA_NIM-Powered-76b900?style=for-the-badge&logo=nvidia&logoColor=white"/>
    <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=white"/>
    <img src="https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript&logoColor=white"/>
    <img src="https://img.shields.io/badge/MongoDB-Mongoose-47a248?style=for-the-badge&logo=mongodb&logoColor=white"/>
    <img src="https://img.shields.io/badge/Vercel-Serverless-000000?style=for-the-badge&logo=vercel&logoColor=white"/>
  </p>
</div>

---

## ✨ Screenshots & UI Preview

<details>
<summary><strong>📸 Desktop & Mobile App Previews</strong> — click to expand</summary>

<br/>

### 🖥️ Desktop Dashboard & Revision Hub

_View and search your solved problems, track progression tiers, and access AI-generated solutions._
<img src="./components/dashboard-preview.png" alt="ReCode Desktop Dashboard" width="100%" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); margin-bottom: 20px;"/>

### 📊 Deep Analysis Panel

_Visualize space/time complexity metrics, step-by-step logic breakdown, edge cases, and code improvement suggestions._
<img src="./components/dashboard-preview-2.png" alt="ReCode Analytics & Cache Panel" width="100%" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); margin-bottom: 20px;"/>

### 📱 Premium Mobile Experience

_Practice, review, and track your revision on the go with a fully responsive layout._

<p align="center">
  <img src="./components/mobile-preview-1.png" alt="ReCode Mobile Code Entry" width="48%" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); margin-right: 2%;"/>
  <img src="./components/mobile-preview-2.png" alt="ReCode Mobile Solution Detail" width="48%" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);"/>
</p>

</details>

---

## 🚀 Key Features

- **AI-Powered Solution Generator**: Instantly generates **Brute Force**, **Better**, and **Optimal** solutions with clean, compilable, and inline-commented code. Powered by **NVIDIA NIM** (`meta/llama-3.3-70b-instruct`).
- **Smart Revision Tracking**: Save your solved problems, categorize them by primary DSA patterns, and generate spaced-repetition revision notes automatically.
- **Dual Caching System**: Integrates **Upstash Redis** (for lightning-fast variant and base caching) and **MongoDB** (for persistent storage and recovery), minimizing API costs.
- **Complexity Validation Stack**: Features an advanced validation pipeline that checks AI time/space complexities against a database of **3,680+ verified LeetCode problems** to guarantee accuracy.
- **Secure Authentication**: Includes Email OTP verification, Google OAuth, GitHub OAuth, and session management using JWT.
- **Freemium & Payment Integration**: Daily usage rate limits for free tier, upgradeable to Pro using **Razorpay** payments.
- **Admin Control Center**: Built-in panel for cache invalidation, user usage analytics, and MongoDB status tracking.

---

## 🗺️ Architecture & Data Flow

<details>
<summary><strong>⚙️ System Architecture</strong> — click to expand</summary>

<br/>

```mermaid
graph TB
    subgraph Client["🌐 Client (Browser)"]
      UI["React 19 + TypeScript\n(Vite SPA)"]
      AS["aiService.ts\n(Analyze feature)"]
      UI --> AS
    end

    subgraph Vercel["☁️ Vercel Serverless Functions (api/)"]
        ROUTER["[...route].js\n(Catch-all Router)"]
        AUTH["_auth/\nJWT · Google OAuth · GitHub OAuth · OTP"]
        SOLUTION["_solution/index.js\nDSA Solution Generator"]
        AI_EP["_ai/analyze.js\nCode Analyzer"]
        QUESTIONS["_questions/\nCRUD – Saved Problems"]
        USAGE["_usage/\nDaily Rate Limiting"]
        ADMIN["_admin/\nStats & Cache Control"]
        PAYMENT["_payment/\nRazorpay Webhooks"]
        ROUTER --> AUTH
        ROUTER --> SOLUTION
        ROUTER --> AI_EP
        ROUTER --> QUESTIONS
        ROUTER --> USAGE
        ROUTER --> ADMIN
        ROUTER --> PAYMENT
    end

    subgraph AI["🤖 NVIDIA NIM API"]
        NIM["meta/llama-3.3-70b-instruct\nhttps://integrate.api.nvidia.com/v1"]
    end

    subgraph Data["🗄️ Data Layer"]
        MONGO[("MongoDB\n(Mongoose)\nUsers · Questions\nSolutionCache · Usage")]
        REDIS[("Upstash Redis\n7-day solution cache\nRate-limit locks")]
    end

    subgraph Email["📧 Email"]
        SMTP["Nodemailer\nOTP · Password Reset"]
    end

    subgraph Complexity["🧮 Complexity Engines (utils/)"]
        CE["complexityEngine.js\nStatic code analysis"]
        CEV2["complexityEngineV2.js\n3,680+ problem DB"]
        GT["problemGroundTruth.js\nVerified ground truth"]
        UV["ultimateValidator.js\nFinal validation layer"]
        CE --> UV
        CEV2 --> UV
        GT --> UV
    end

    %% Client → Vercel
    AS -->|"POST /api/ai/analyze\n(VITE_NVIDIA_API_KEY)"| AI
    UI -->|"REST API calls"| ROUTER

    %% Vercel → AI
    SOLUTION -->|"NVIDIA_API_KEY"| NIM
    AI_EP -->|"via aiConfig.js"| NIM

    %% Vercel → Data
    SOLUTION --> REDIS
    SOLUTION --> MONGO
    AUTH --> MONGO
    QUESTIONS --> MONGO
    USAGE --> MONGO

    %% Vercel → Complexity
    SOLUTION --> UV

    %% Vercel → Email
    AUTH --> SMTP

    style Client fill:#1a1a2e,color:#fff,stroke:#4361ee
    style Vercel fill:#0f0f1a,color:#fff,stroke:#7209b7
    style AI fill:#1a2e1a,color:#fff,stroke:#76b900
    style Data fill:#2e1a1a,color:#fff,stroke:#e63946
    style Complexity fill:#1a2a2e,color:#fff,stroke:#4cc9f0
    style Email fill:#2e2a1a,color:#fff,stroke:#f4a261
```

### Data Flow: Get Solution

```
User Request
     │
     ▼
Variant Cache? ──(Redis HIT)──────────────────────────────► Return cached
     │ MISS
     ▼
Base Cache? ────(Redis HIT)──────────────────────────────► Return cached
     │ MISS
     ▼
MongoDB Cache? ─(Mongo HIT)──────────────────────────────► Return cached
     │ MISS
     ▼
Fuzzy Name Match? ─(Match + cache found)─────────────────► Return cached
     │ No match / dev mode
     ▼
Daily Limit Check? ─(Limit exceeded)─────────────────────► 429 Error
     │ OK
     ▼
NVIDIA NIM API ─────────────────────────────────────────► JSON Solution
     │
     ▼
Complexity Validation Stack
  ├─ Ground Truth DB (problemGroundTruth.js)
  ├─ V2 Engine (complexityEngineV2.js)
  ├─ Static Analyzer (complexityEngine.js)
  └─ Ultimate Validator (ultimateValidator.js)
     │
     ▼
Safe-to-Show Gate ─────────────────────────────────────► Final Response
     │
     ▼
Save to Redis + MongoDB caches
```

</details>

---

## 🛠️ Technology Stack

| Layer           | Technology                                 | Description                                    |
| --------------- | ------------------------------------------ | ---------------------------------------------- |
| **Frontend**    | React 19, TypeScript, Vite, TailwindCSS    | High-performance user interface                |
| **Backend**     | Vercel Serverless Functions (Node.js)      | Serverless API routes                          |
| **AI Engine**   | NVIDIA NIM (`meta/llama-3.3-70b-instruct`) | Context-aware code generation & logic analysis |
| **Database**    | MongoDB + Mongoose                         | Persistent revision storage & base caching     |
| **Cache Layer** | Upstash Redis                              | Fast, distributed, low-latency temporary cache |
| **Email**       | Nodemailer                                 | Password resets & OTP codes                    |
| **Payments**    | Razorpay                                   | Subscription order creation and webhooks       |

---

## 📦 Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB Instance (Atlas or Local)
- NVIDIA NIM API Key (Sign up at [build.nvidia.com](https://build.nvidia.com))
- Upstash Redis (Optional)

### Installation

1. **Clone the repo:**

   ```bash
   git clone https://github.com/WillyEverGreen/ReCode.git
   cd ReCode
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure the environment:**
   Create a `.env` file in the root based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

   Add your keys:

   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/recode
   JWT_SECRET=your_jwt_secret_at_least_32_characters
   NVIDIA_API_KEY=nvapi-xxxxxx
   VITE_NVIDIA_API_KEY=nvapi-xxxxxx
   ```

4. **Launch the development environments:**
   - **Recommended (tests serverless API + client simultaneously):**
     ```bash
     npm install -g vercel
     vercel dev
     ```
   - **Alternative (launches server and client independently):**
     ```bash
     npm run server   # Node Express server on port 5000
     npm run dev      # Vite Dev server on port 3000
     ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Configuration

| Variable                   | Type     | Description                                                    |
| -------------------------- | -------- | -------------------------------------------------------------- |
| `MONGO_URI`                | Required | Connection string for MongoDB                                  |
| `JWT_SECRET`               | Required | Used for token encryption (min 32 chars)                       |
| `NVIDIA_API_KEY`           | Required | Backend API key for NIM completion                             |
| `VITE_NVIDIA_API_KEY`      | Required | Frontend API key for browser-based code analysis               |
| `ADMIN_PASSWORD`           | Required | Admin dashboard credentials                                    |
| `UPSTASH_REDIS_REST_URL`   | Optional | Upstash Redis connection endpoint                              |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Upstash Redis connection token                                 |
| `NVIDIA_MODEL`             | Optional | Override NIM model (defaults to `meta/llama-3.3-70b-instruct`) |

---

## 📝 API Endpoints

| Endpoint                 | Method       | Authentication | Description                               |
| ------------------------ | ------------ | -------------- | ----------------------------------------- |
| `/api/health`            | `GET`        | Public         | System status check                       |
| `/api/auth/signup`       | `POST`       | Public         | Registers a new account                   |
| `/api/auth/login`        | `POST`       | Public         | Authenticates and returns JWT             |
| `/api/auth/verify-email` | `POST`       | Public         | Verifies account via Nodemailer OTP       |
| `/api/solution`          | `POST`       | User JWT       | Generates the 3-approach code solution    |
| `/api/ai/analyze`        | `POST`       | User JWT       | Analyzes code complexity and structure    |
| `/api/questions`         | `GET`/`POST` | User JWT       | Reads/writes saved user questions         |
| `/api/usage`             | `GET`        | User JWT       | Returns remaining daily rate limits       |
| `/api/admin/stats`       | `GET`        | Admin Pass     | Displays global analytics and cache rates |

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/WillyEverGreen">WillyEverGreen</a>
</div>
