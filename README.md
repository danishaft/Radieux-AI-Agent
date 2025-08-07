# SkincareAI - Redis AI Challenge MVP

An AI-powered skincare recommendation system built with Next.js, Redis vector search, and Rasa chatbot.

## 🚀 Features

- **AI-Powered Recommendations**: Vector similarity search using Redis HNSW
- **Smart Questionnaire**: Multi-step form with Server Actions
- **Chatbot Integration**: Rasa-powered chat for product queries
- **Video Reviews**: Instagram/TikTok video integration
- **Real-time Search**: Redis-powered product search

## 🏗️ Architecture

```
├── client/          # Next.js app (frontend + API routes + Server Actions)
├── rasa/            # Rasa chatbot service
├── data-pipeline/   # Data processing scripts
├── docker-compose.yml
└── README.md
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Redis Stack (vector search), SQLite
- **AI/ML**: Rasa chatbot, Redis vector similarity
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Redis Cloud account (or local Redis Stack)

### 1. Clone & Setup

```bash
git clone <repository-url>
cd skincareai
cp env.example .env.local
```

### 2. Configure Environment

Edit `.env.local` with your Redis Cloud credentials:

```env
REDIS_URL=redis://username:password@your-redis-cloud-endpoint:port
REDIS_PASSWORD=your-redis-password
```

### 3. Start Services

```bash
# Start Redis and Rasa
docker-compose up -d

# Install dependencies
cd client
yarn install
```

### 4. Run Development

```bash
# Start Next.js development server
cd client
yarn dev
```

Visit `http://localhost:3000`

## 📁 Project Structure

```
client/
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── questionnaire/
│   │   │   ├── routine/
│   │   │   ├── search/
│   │   │   └── chat/
│   │   ├── actions/       # Server Actions
│   │   ├── lib/           # Utilities
│   │   └── components/    # React components
│   └── types/
rasa/
├── data/                  # Training data
├── actions/               # Custom actions
└── models/               # Trained models
```

## 🔧 Development

### API Routes

- `POST /api/questionnaire` - Submit questionnaire
- `GET /api/routine/[id]` - Get generated routine
- `GET /api/search` - Product search
- `POST /api/chat` - Chat with Rasa

### Server Actions

- `submitQuestionnaire()` - Handle form submission
- `generateRoutine()` - Generate skincare routine

### Redis Integration

- **Vector Search**: Product similarity using HNSW
- **JSON Storage**: Product metadata
- **Caching**: Search results and sessions

## 🐳 Docker Services

- **Redis Stack**: Vector search and JSON storage
- **Rasa**: Chatbot service
- **Rasa Actions**: Custom actions server

## 📊 Database Schema

### Redis (Products)
```json
{
  "product_id": "cosrx_serum",
  "name": "Hyaluronic Acid Serum",
  "brand": "COSRX",
  "category": "serum",
  "effects": ["hydration", "plumping"],
  "ingredients": ["hyaluronic acid"],
  "price": 16.99,
  "effect_vector": [0.1, 0.2, ...] // 128D vector
}
```

### SQLite (Users)
```sql
CREATE TABLE questionnaires (
  id TEXT PRIMARY KEY,
  skin_type TEXT,
  goals TEXT, -- JSON array
  conditions TEXT, -- JSON array
  age INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 Deployment

### Vercel Deployment

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Environment Variables

```env
REDIS_URL=your-redis-cloud-url
RASA_ENDPOINT=your-rasa-endpoint
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📝 License

MIT License

## 🎯 Redis AI Challenge

This project demonstrates:
- ✅ Redis vector search for AI recommendations
- ✅ Redis JSON for product data
- ✅ Real-time chat with Rasa
- ✅ Modern Next.js architecture
- ✅ Production-ready deployment

---

Built with ❤️ for the Redis AI Challenge 