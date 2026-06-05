<div align="center">
  <img src="./components/Logo-With-Name cropped.png" alt="ReCode Logo" width="340"/>
  <br/><br/>
  <p><strong>AI-powered DSA Solution Generator & Revision Tracker</strong></p>
  <p>
    <img src="https://img.shields.io/badge/NVIDIA_NIM-Powered-76b900?style=flat-square&logo=nvidia&logoColor=white"/>
    <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=white"/>
    <img src="https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript&logoColor=white"/>
    <img src="https://img.shields.io/badge/MongoDB-Mongoose-47a248?style=flat-square&logo=mongodb&logoColor=white"/>
    <img src="https://img.shields.io/badge/Vercel-Serverless-000000?style=flat-square&logo=vercel&logoColor=white"/>
    <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square"/>
  </p>
</div>

---

## Features

🚀 **AI-Powered Solution Generation**

- Get brute force, better, and optimal solutions for any DSA problem
- Powered by **NVIDIA NIM** (`qwen/qwen2.5-coder-32b-instruct`) with multi-tier caching (Redis → MongoDB)
- Supports multiple programming languages (Python, Java, C++, JavaScript and more)

📚 **Smart Revision Tracking**

- Save and organise your solved problems
- Track patterns, categories, and complexity
- Auto-generated revision notes from your own code

🔐 **Secure Authentication**

- Email verification with OTP
- Google & GitHub OAuth
- JWT-based session management with password reset

💳 **Freemium Subscription**

- Free tier with daily usage limits
- Pro plan with expanded limits via Razorpay

📊 **Admin Dashboard**

- User analytics and cache statistics
- Manual cache invalidation
- Usage monitoring per user

---

<details>
<summary><strong>🗺️ Architecture Diagram</strong> — click to expand</summary>

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
        NIM["qwen/qwen2.5-coder-32b-instruct\nhttps://integrate.api.nvidia.com/v1"]
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

## Tech Stack

| Layer        | Technology                                      |
| ------------ | ----------------------------------------------- |
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS         |
| **Backend**  | Vercel Serverless Functions (Node.js)           |
| **AI**       | NVIDIA NIM — `qwen/qwen2.5-coder-32b-instruct`  |
| **Database** | MongoDB + Mongoose                              |
| **Cache**    | Upstash Redis                                   |
| **Auth**     | JWT, Google OAuth, GitHub OAuth, Nodemailer OTP |
| **Payments** | Razorpay                                        |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB database
- NVIDIA NIM API key — [Get one free at build.nvidia.com](https://build.nvidia.com)
- Upstash Redis (optional, for faster caching)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/WillyEverGreen/ReCode.git
   cd ReCode
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Fill in your `.env`:

   ```env
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=your-secret-key-min-32-chars

   # NVIDIA NIM (required)
   NVIDIA_API_KEY=nvapi-xxxxxxxxxxxx
   VITE_NVIDIA_API_KEY=nvapi-xxxxxxxxxxxx

   ADMIN_PASSWORD=your-admin-password
   ```

4. **Run development server**

   ```bash
   # Recommended — tests serverless functions locally
   vercel dev

   # Or Vite + Express separately
   npm run server   # Express API on port 5000
   npm run dev      # Vite frontend on port 3000
   ```

5. **Open http://localhost:3000**

---

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project at [vercel.com](https://vercel.com)
3. Add environment variables in the Vercel dashboard
4. Deploy

### Required Environment Variables

| Variable                   | Required | Description                           |
| -------------------------- | -------- | ------------------------------------- |
| `MONGO_URI`                | ✓        | MongoDB connection string             |
| `JWT_SECRET`               | ✓        | Secret for JWT tokens (min 32 chars)  |
| `NVIDIA_API_KEY`           | ✓        | NVIDIA NIM API key (backend)          |
| `VITE_NVIDIA_API_KEY`      | ✓        | NVIDIA NIM API key (frontend analyze) |
| `ADMIN_PASSWORD`           | ✓        | Admin panel password                  |
| `UPSTASH_REDIS_REST_URL`   |          | Upstash Redis URL                     |
| `UPSTASH_REDIS_REST_TOKEN` |          | Upstash Redis token                   |
| `NVIDIA_MODEL`             |          | Override default AI model             |

---

## API Endpoints

| Endpoint                    | Method   | Description            |
| --------------------------- | -------- | ---------------------- |
| `/api/health`               | GET      | Health check           |
| `/api/auth/signup`          | POST     | User registration      |
| `/api/auth/login`           | POST     | User login             |
| `/api/auth/verify-email`    | POST     | Verify email OTP       |
| `/api/auth/forgot-password` | POST     | Request password reset |
| `/api/auth/reset-password`  | POST     | Reset password         |
| `/api/solution`             | POST     | Generate DSA solution  |
| `/api/ai/analyze`           | POST     | Analyze user code      |
| `/api/questions`            | GET/POST | User's saved questions |
| `/api/usage`                | GET      | Check daily usage      |
| `/api/admin/stats`          | GET      | Admin statistics       |

---

## Project Structure

```
ReCode/
├── api/                        # Vercel Serverless Functions
│   ├── _lib/                   # Shared utilities
│   │   ├── aiConfig.js         # NVIDIA NIM configuration
│   │   ├── auth.js             # JWT helpers + CORS
│   │   ├── mongodb.js          # DB connection
│   │   ├── email.js            # Nodemailer setup
│   │   └── userId.js           # User ID resolution
│   ├── _ai/analyze.js          # Code analysis endpoint
│   ├── _auth/                  # Auth routes (JWT, Google, GitHub, OTP)
│   ├── _admin/                 # Admin endpoints
│   ├── _payment/               # Razorpay webhooks
│   ├── _questions/             # Questions CRUD
│   ├── _solution/index.js      # DSA solution generator (NVIDIA NIM)
│   ├── _usage/                 # Usage tracking & rate limiting
│   └── [...route].js           # Catch-all router
├── components/                 # React components
│   └── Auth/                   # Authentication UI
├── models/                     # MongoDB models
│   ├── User.js
│   ├── Question.js
│   ├── SolutionCache.js
│   ├── UserUsage.js
│   └── Otp.js
├── services/
│   └── aiService.ts            # Frontend AI service (NVIDIA NIM)
├── utils/                      # Complexity validation engines
│   ├── complexityEngine.js
│   ├── complexityEngineV2.js
│   ├── problemGroundTruth.js
│   ├── ultimateValidator.js
│   └── ...
├── scripts/                    # Dev/admin utility scripts
│   ├── test-nvidia.js          # Test NVIDIA API connectivity
│   └── ...
├── types.ts                    # TypeScript type definitions
└── vercel.json                 # Vercel routing config
```

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/WillyEverGreen">WillyEverGreen</a>
</div>
