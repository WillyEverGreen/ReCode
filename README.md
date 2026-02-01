# ReCode - DSA Solution Generator & Revision Tracker

A modern web application that helps developers master Data Structures and Algorithms through AI-powered solution generation and smart revision tracking.

![ReCode](https://img.shields.io/badge/ReCode-DSA%20Solutions-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

🚀 **AI-Powered Solution Generation**
- Get brute force, better, and optimal solutions for any DSA problem
- Powered by Qubrid AI with multi-tier caching (Redis → MongoDB)
- Supports multiple programming languages

📚 **Smart Revision Tracking**
- Save and organize your solved problems
- Track patterns and categories
- Review time/space complexity

🔐 **Secure Authentication**
- Email verification with OTP
- Password reset functionality
- JWT-based session management

📊 **Admin Dashboard**
- User analytics
- Cache management
- Solution statistics

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- TailwindCSS

**Backend (Serverless):**
- Vercel Serverless Functions
- MongoDB (Mongoose)
- Upstash Redis

**AI:**
- Qubrid AI (Qwen3-Coder)

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB database
- Upstash Redis (optional, for faster caching)
- Qubrid API key

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
   
   Fill in your `.env` file:
   ```env
   # MongoDB
   MONGO_URI=mongodb+srv://...
   
   # JWT Secret
   JWT_SECRET=your-secret-key
   
   # Qubrid AI
   QUBRID_API_KEY=your-qubrid-api-key
   
   # Admin
   ADMIN_PASSWORD=your-admin-password
   
   # Redis (Optional - for faster caching)
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   ```

4. **Run development server**
   ```bash
   # Using Vercel CLI (recommended - tests serverless functions)
   vercel dev
   
   # Or using Vite only (frontend only)
   npm run dev
   ```

5. **Open http://localhost:3000**

## Local LLM (Optional)

If you want to run local LLMs (Ollama) for offline AI generation during development, follow these steps:

- Install and run Ollama separately and ensure models are available (e.g. `qwen2.5-coder:7b`, `qwen2.5:7b`, `deepseek-r1:7b`).
- In your local `.env` set:
```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434/v1
OLLAMA_MODEL_CODING=qwen2.5-coder:7b
OLLAMA_MODEL_EXPLANATION=qwen2.5:7b
OLLAMA_MODEL_REASONING=deepseek-r1:7b
VITE_API_URL=http://localhost:5000
```
- Start the backend and frontend in separate terminals:
```bash
npm run server   # starts Express API on port 5000
npm run dev      # starts Vite frontend on port 3000
```

The local Ollama integration is opt-in — by default the app uses the existing remote AI provider (Qubrid). This ensures your production deployment on Vercel is unaffected.

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

Note: The repository changes are backward compatible — if `AI_PROVIDER` is not set to `ollama` the deployed app will continue to use the existing remote AI provider. Do not commit your `.env` file; keep secrets in Vercel's dashboard.

### Environment Variables for Production

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | ✓ | MongoDB connection string |
| `JWT_SECRET` | ✓ | Secret for JWT tokens |
| `QUBRID_API_KEY` | ✓ | Qubrid AI API key |
| `ADMIN_PASSWORD` | ✓ | Admin panel password |
| `UPSTASH_REDIS_REST_URL` | | Upstash Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | | Upstash Redis token |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/auth/signup` | POST | User registration |
| `/api/auth/login` | POST | User login |
| `/api/auth/verify-email` | POST | Verify email OTP |
| `/api/auth/forgot-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Reset password |
| `/api/solution` | POST | Generate DSA solution |
| `/api/questions` | GET/POST | User's saved questions |
| `/api/admin/stats` | GET | Admin statistics |

## Project Structure

```
ReCode/
├── api/                    # Vercel Serverless Functions
│   ├── _lib/               # Shared utilities
│   ├── admin/              # Admin endpoints
│   ├── auth/               # Authentication endpoints
│   ├── questions/          # Questions CRUD
│   └── solution/           # Solution generation
├── components/             # React components
├── models/                 # MongoDB models
├── services/               # Frontend services
├── config/                 # Configuration
└── types/                  # TypeScript types
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

---

Made with ❤️ by [WillyEverGreen](https://github.com/WillyEverGreen)
