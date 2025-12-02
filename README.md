# Revision Architect 🧠

An AI-powered LeetCode revision management system that helps developers master coding problems with structured insights, complexity analysis, and intelligent spaced repetition.

## Features

- **AI-Powered Analysis**: Paste your code and get instant structured insights with complexity analysis
- **Smart Revision System**: Spaced repetition algorithm to optimize your learning
- **Authentication**: Secure signup/login with email verification
- **Password Recovery**: OTP-based password reset system
- **Question Management**: Add, view, and organize your LeetCode solutions
- **Beautiful UI**: Modern, responsive design with smooth animations

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite
- Tailwind CSS
- Lucide Icons

### Backend
- Node.js + Express
- MongoDB
- JWT Authentication
- Nodemailer (Email service)
- Google Gemini AI

## Setup

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account or local MongoDB
- Gmail account for email service
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ReCode
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # MongoDB
   MONGO_URI=your_mongodb_connection_string
   
   # JWT
   JWT_SECRET=your_secure_jwt_secret
   
   # Server
   PORT=5000
   
   # Email (Gmail App Password)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_gmail_app_password
   
   # Frontend API URL
   VITE_API_URL=http://localhost:5000
   
   # Gemini AI
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start the backend server**
   ```bash
   node server/index.js
   ```

5. **Start the frontend (in a new terminal)**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## Environment Variables

### Backend (.env)
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `PORT`: Backend server port (default: 5000)
- `EMAIL_USER`: Gmail address for sending emails
- `EMAIL_PASS`: Gmail app password ([How to generate](https://support.google.com/accounts/answer/185833))

### Frontend (.env)
- `VITE_API_URL`: Backend API URL
- `GEMINI_API_KEY`: Google Gemini API key ([Get one here](https://ai.google.dev/))

## Production Deployment

### Frontend (Vercel/Netlify)
Set environment variable:
- `VITE_API_URL=https://your-backend-domain.com`

### Backend (Render/Railway/AWS)
Set all backend environment variables from the `.env` file

## Security Notes

⚠️ **Important**: Never commit `.env` file to version control
- `.env` is already in `.gitignore`
- Use `.env.example` as a template for team members
- Rotate secrets regularly in production

## Features Roadmap

- [ ] OAuth provider integration (Google, GitHub)
- [ ] Advanced filtering and search
- [ ] Performance analytics dashboard
- [ ] Mobile app version
- [ ] Team collaboration features

## License

Private Repository - All Rights Reserved
