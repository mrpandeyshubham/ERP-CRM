# 🚀 Mini ERP CRM — Deployment Guide

## ✅ Pre-Deployment Checklist

- [ ] Node.js 20+ installed
- [ ] PostgreSQL 15+ available (Neon, Supabase, or self-hosted)
- [ ] `.env` file created with strong `JWT_SECRET` and correct `DATABASE_URL`

## 🔧 Step 1: Configure Environment

**`backend/.env`** (production example):

```env
PORT=4000
DATABASE_URL=postgresql://user:password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
JWT_SECRET=your-secure-64-char-secret
```

## 🌱 Step 2: Database Setup

```bash
cd backend
npx prisma db push
npx prisma generate
npm run prisma:seed
```

## 🏗️ Step 3: Build & Start Application

```bash
# Backend
cd backend
npm run build
npm start

# Frontend (Vercel)
cd frontend
npm run build
# Deploy `dist` folder to Vercel/Netlify
```

## 📦 Production Deployment Platforms

### Option A: Render / Railway (Backend) + Vercel (Frontend)
1. Deploy PostgreSQL on Neon/Supabase.
2. Deploy backend on Render, setting `DATABASE_URL` and `JWT_SECRET`. Set build command to `npm run build` and start command to `npm start`.
3. Deploy frontend on Vercel, pointing API URL to the Render endpoint.
