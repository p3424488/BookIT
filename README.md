bash

cat > /mnt/user-data/outputs/README.md << 'EOF'
# 🎬 BookIt — Smart Event Booking & Recommendation System

> A production-grade full stack web application for booking movies, concerts, and sports events — with AI-powered recommendations, real-time seat locking, and integrated payment processing.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-bookit--frontend--ec38.onrender.com-E24B4A?style=for-the-badge)](https://bookit-frontend-ec38.onrender.com)
[![Backend](https://img.shields.io/badge/API-bookit--server--f7n4.onrender.com-0a0a0f?style=for-the-badge)](https://bookit-server-f7n4.onrender.com/health)
[![ML Service](https://img.shields.io/badge/ML-bookit--ml.onrender.com-7F77DD?style=for-the-badge)](https://bookit-ml.onrender.com/health)
[![GitHub](https://img.shields.io/badge/GitHub-p3424488%2FBookIT-181717?style=for-the-badge&logo=github)](https://github.com/p3424488/BookIT)

---

## 📌 Overview

BookIt is a **BookMyShow-inspired event booking platform** built with a modern full stack architecture. It combines real-time seat management, secure payment processing, and a machine learning recommendation engine — all deployed on cloud infrastructure.

Built over **13 days** from zero, this project covers the complete software development lifecycle:
- System design and database architecture
- RESTful API development with authentication
- Interactive frontend with real-time features
- Machine learning microservice
- Payment gateway integration
- Cloud deployment across multiple platforms

---

## 🌐 Live URLs

| Service | URL |
|---|---|
| 🎨 Frontend | https://bookit-frontend-ec38.onrender.com |
| ⚙️ Backend API | https://bookit-server-f7n4.onrender.com |
| 🤖 ML Service | https://bookit-ml.onrender.com |
| 📊 API Health | https://bookit-server-f7n4.onrender.com/health |

---

## ✨ Features

### Core Booking Flow
- 🎟️ Browse movies, concerts, and sports events with category and city filters
- 🪑 Interactive seat map with Gold / Silver / Bronze categories
- ⏱️ Redis-powered seat locking — seats held for 15 minutes during checkout
- 💳 Razorpay payment gateway with HMAC signature verification
- 📧 Booking confirmation email sent automatically after payment

### Real-time Experience
- 👥 Live viewer count — see how many people are viewing the same event
- 🔴 Instant seat locking — seats turn orange for other users the moment someone selects them
- ✅ Live booking confirmation — seats turn grey across all tabs when booked
- 🔌 Powered by Socket.io WebSockets

### AI Recommendations
- ✦ Content-based filtering using TF-IDF vectorization on event features
- 🤝 Collaborative filtering using Cosine Similarity on user booking history
- 🔀 Hybrid algorithm — 60% content-based + 40% collaborative
- 📈 Activity tracking — every view, search, and booking improves recommendations

### Security & Auth
- 🔐 JWT-based authentication with 7-day token expiry
- 🔒 bcrypt password hashing (salt rounds: 10)
- 🛡️ Protected routes via middleware
- 🚫 Review system enforces booking verification — only attended users can review

### Additional Features
- 🔍 Full-text search across title, venue, city, and description
- ⭐ Event review and rating system
- 🎫 My Tickets page with cancel booking option
- 📱 Responsive dark-themed UI inspired by BookMyShow and Netflix

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework with type safety |
| Vite | Lightning fast build tool |
| Tailwind CSS | Dark theme utility styling |
| Zustand | Lightweight global state management |
| TanStack React Query | Server state and API caching |
| Axios | HTTP client with interceptors |
| Socket.io Client | Real-time WebSocket connection |
| React Router DOM | Client-side navigation |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| TypeScript | Type-safe server code |
| Prisma ORM v6 | Type-safe database queries |
| PostgreSQL | Primary relational database |
| Redis | Seat locking and session cache |
| Socket.io | Real-time bidirectional events |
| JWT + bcrypt | Authentication and encryption |
| Razorpay | Payment gateway |
| Nodemailer | Booking confirmation emails |
| Crypto (Node.js) | HMAC payment signature verification |

### ML Microservice
| Technology | Purpose |
|---|---|
| Python 3.11 | ML service language |
| FastAPI | High-performance Python API |
| scikit-learn | TF-IDF and cosine similarity |
| pandas | Data manipulation |
| numpy | Mathematical computations |
| psycopg2 | PostgreSQL connection |

### Infrastructure
| Service | Platform |
|---|---|
| Frontend | Render Static Site |
| Backend API | Render Web Service |
| ML Service | Render Web Service |
| Database | Supabase (PostgreSQL) |
| Redis Cache | Upstash |
| Version Control | GitHub |

---

## 🗄️ Database Schema

```
User ──────────────── Booking ──────────────── Event
 │                       │                       │
 ├── Review ─────────────┤                       │
 │                       │                       │
 └── Activity ──────────────────────────────────┘
                                                 │
                                               Seat
```

### Tables

| Table | Description |
|---|---|
| `User` | Registered users with hashed passwords |
| `Event` | Movies, concerts, and sports events |
| `Seat` | Individual seats per event with category and price |
| `Booking` | Confirmed ticket purchases with payment ID |
| `Review` | User ratings (1-5) with comments |
| `Activity` | User behavior tracking for ML recommendations |

---

## 🔌 API Reference

### Authentication
```
POST /api/auth/register    → Create new account
POST /api/auth/login       → Login and get JWT token
```

### Events
```
GET  /api/events                  → List all events (with filters)
GET  /api/events/:id              → Get single event details
POST /api/events                  → Create new event
GET  /api/events/:id/seats        → Get seat map for event
```

### Bookings
```
POST /api/bookings/lock           → Lock seats (15 min Redis hold)
POST /api/bookings/confirm        → Confirm booking
GET  /api/bookings/my             → Get my bookings
PUT  /api/bookings/:id/cancel     → Cancel booking
```

### Payments
```
POST /api/payments/create-order   → Create Razorpay order
POST /api/payments/verify         → Verify payment + confirm booking
```

### Reviews
```
POST   /api/reviews               → Add review (booking required)
GET    /api/reviews/event/:id     → Get event reviews
GET    /api/reviews/my            → Get my reviews
DELETE /api/reviews/:id           → Delete my review
```

### Search
```
GET /api/search                   → Full-text search with filters
GET /api/search/filters           → Get available categories and cities
```

### Recommendations
```
GET /api/recommendations          → AI-powered event recommendations
GET /api/recommendations/similar/:id → Similar events
```

---

## 🤖 ML Recommendation Engine

The recommendation engine runs as a **separate Python microservice** on port 8000, called by the Node.js backend when needed.

### Content-Based Filtering
```
Events vectorized using TF-IDF on:
→ category (Movie, Concert, Sports)
→ city (Mumbai, Delhi, Chennai)
→ language (English, Hindi, Telugu)

Cosine similarity computed between
user's event history and all events.
Most similar events recommended.
```

### Collaborative Filtering
```
User-Event booking matrix created.
Cosine similarity computed between users.
Top 5 similar users identified.
Events booked by similar users
(not yet booked by current user) recommended.
```

### Hybrid Algorithm
```
Final Score = 0.6 × Content Score
            + 0.4 × Collaborative Score

Falls back to popular events
if user has no activity history.
```

---

## ⚡ Real-time Architecture

```
User A selects Seat A5
        │
        ▼
socket.emit('lock_seat', { eventId, seatId })
        │
        ▼
Socket.io Server receives event
        │
        ▼
socket.to(room).emit('seat_locked', { seatId })
        │
        ▼
All other users in same event room
receive update instantly
        │
        ▼
Seat A5 turns orange on their screen ✅
No page refresh needed
```

### Socket Events
| Event | Direction | Effect |
|---|---|---|
| `join_event` | Client → Server | User joins event room |
| `leave_event` | Client → Server | User leaves event room |
| `viewer_count` | Server → Clients | Updates live viewer count |
| `lock_seat` | Client → Server | Broadcasts seat as held |
| `unlock_seat` | Client → Server | Releases seat hold |
| `booking_confirmed` | Client → Server | Marks seats as permanently booked |
| `seats_booked` | Server → Clients | Triggers seat map refresh |

---

## 💳 Payment Flow

```
1. User selects seats
2. Clicks Pay button
3. POST /api/payments/create-order
   → Razorpay order created (amount in paise)
   → Order ID returned to frontend
4. Razorpay popup opens
5. User pays via UPI / Card / Netbanking
6. Razorpay returns payment response
7. POST /api/payments/verify
   → HMAC SHA256 signature verified
   → Seats marked as booked in PostgreSQL
   → Redis seat locks removed
   → Booking record created with payment ID
   → Confirmation email sent via Gmail SMTP
8. Booking confirmed screen shown ✅
```

---

## 🚀 Local Setup

### Prerequisites
```
Node.js v22+
Python 3.11+
PostgreSQL 18+
Redis (via WSL on Windows)
```

### Backend
```bash
cd server
npm install
cp .env.example .env
# Fill in your environment variables
npx prisma migrate dev
npm run seed
npm run dev
```

### Frontend
```bash
cd client
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm run dev
```

### ML Service
```bash
cd ml-service
pip install -r requirements.txt
# Set DATABASE_URL in .env
python -m uvicorn app.main:app --reload --port 8000
```

---

## 🌍 Environment Variables

### Backend (.env)
```
PORT
NODE_ENV
CLIENT_URL
DATABASE_URL
DIRECT_URL
JWT_SECRET
JWT_EXPIRES_IN
REDIS_URL
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
ML_SERVICE_URL
EMAIL_USER
EMAIL_PASSWORD
EMAIL_FROM
```

### Frontend (.env)
```
VITE_API_URL
```

### ML Service (.env)
```
DATABASE_URL
```

---

## 📁 Project Structure

```
bookit/
├── client/                    # React frontend
│   ├── src/
│   │   ├── api/               # Axios API functions
│   │   ├── components/        # Reusable UI components
│   │   ├── lib/               # Socket.io connection
│   │   ├── pages/             # Route pages
│   │   ├── store/             # Zustand state
│   │   ├── types/             # TypeScript interfaces
│   │   └── utils/             # Helper functions
│   └── public/
│
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── controllers/       # Route logic
│   │   ├── lib/               # Prisma, Redis, Email
│   │   ├── middleware/        # JWT auth middleware
│   │   ├── routes/            # Express routes
│   │   └── types/             # TypeScript types
│   └── prisma/
│       ├── schema.prisma      # Database schema
│       ├── migrations/        # Migration history
│       └── seed.ts            # Sample data
│
└── ml-service/                # Python ML microservice
    └── app/
        ├── main.py            # FastAPI server
        ├── recommender.py     # ML algorithms
        └── database.py        # PostgreSQL queries
```

---

## 🧠 Key Engineering Decisions

| Decision | Reasoning |
|---|---|
| PostgreSQL over MongoDB | Relational data — bookings need strict user + event relationships |
| Redis for seat locking | Built-in TTL for auto-expiry, millisecond response time |
| Python microservice for ML | Best ML ecosystem (scikit-learn, pandas) — keeps Node.js server clean |
| JWT over sessions | Stateless — works perfectly with REST and scales horizontally |
| Hybrid ML algorithm | Content-based works for new users, collaborative improves with data |
| Socket.io over plain WebSocket | Auto-reconnection, rooms, fallback transport built-in |
| Supabase over local PostgreSQL | Free managed PostgreSQL with connection pooling |
| Upstash over local Redis | Serverless Redis — works with Render's ephemeral filesystem |

---

## 👨‍💻 Developer

**Pathivada Pavan Kumar**
B.Tech Computer Science (Data Science)
Raghu Institute of Technology, Visakhapatnam

[![GitHub](https://img.shields.io/badge/GitHub-p3424488-181717?style=flat&logo=github)](https://github.com/p3424488)

---

## 🤖 Built With AI Assistance

This project was built end-to-end with **Claude AI (Anthropic)** serving as an AI pair programmer and technical mentor — guiding system design decisions, debugging 50+ errors, explaining concepts from scratch, and helping implement complex features including Redis seat locking, ML recommendations, Socket.io real-time updates, and Razorpay payment integration. Built from zero knowledge to production deployment in 13 days.

---
