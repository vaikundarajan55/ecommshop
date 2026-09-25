# Setup Guide

## Prerequisites
- Node.js 18+ and npm
- MySQL 8+
- Python 3.10+ (for the AI tracking service)

## 1. Database
```bash
mysql -u root -p ecommerce_db_live < E:/reactlive/ecommercefull/backend/database/schema.sql
mysql -u root -p ecommerce_db_live < E:/reactlive/ecommercefull/backend/database/procedures.sql
mysql -u root -p ecommerce_db_live < E:/reactlive/ecommercefull/backend/database/seed.sql   # optional sample data
```

## 2. Backend (Node.js / Express / Socket.IO)
```bash
cd backend
cp .env.example .env      # edit DB credentials, JWT secret, etc.
npm install
npm run dev                # nodemon, http://localhost:5000
```

## 3. Python AI Service (order-tracking predictions)
```bash
cd python-ai-service
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate # macOS/Linux
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

## 4. Admin Panel (React + Vite + Tailwind)
```bash
cd frontend/admin
cp .env.example .env
npm install
npm run dev                # http://localhost:5173
```
Default seeded login: `admin@example.com` / `Admin@123` (change the seed hash before using in real life).

## 5. Website (React + Vite + Tailwind)
```bash
cd frontend/website
cp .env.example .env
npm install
npm run dev                # http://localhost:5174
```

## Run order
Start MySQL → backend → python-ai-service → admin → website. The backend works fine
without the AI service running (predictions just fall back to `null`/skip gracefully).
