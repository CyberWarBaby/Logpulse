# 🛠 LogPulse — Local Setup Guide

## Common Errors & Fixes

---

### ❌ `Cannot find module 'dotenv/config'`

This is fixed in the latest zip. If you have an older copy, run:

```bash
cd backend
npm install dotenv
```

Then in `src/index.ts`, change:
```ts
// OLD
import 'dotenv/config';

// NEW
import dotenv from 'dotenv';
dotenv.config();
```

---

### ❌ `P1000: Authentication failed` (PostgreSQL)

Your `DATABASE_URL` credentials don't match your local PostgreSQL. Fix it:

#### Step 1 — Find your PostgreSQL credentials

**Ubuntu/Debian:**
```bash
sudo -u postgres psql
# You're now in psql as superuser — no password needed
# Set a password if you want:
ALTER USER postgres WITH PASSWORD 'postgres';
\q
```

**macOS (Homebrew):**
```bash
psql postgres
# Your macOS username is likely the superuser, no password
```

**Check what users exist:**
```bash
sudo -u postgres psql -c "\du"
```

#### Step 2 — Create the database

```bash
# Option A (as postgres superuser):
sudo -u postgres createdb logpulse

# Option B (inside psql):
sudo -u postgres psql -c "CREATE DATABASE logpulse;"

# Option C (macOS/no-password setup):
createdb logpulse
```

#### Step 3 — Update your .env

```bash
# Edit backend/.env and set DATABASE_URL to match your setup:

# Most common Ubuntu setup:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/logpulse?schema=public"

# If postgres user has no password (macOS default, some Linux):
DATABASE_URL="postgresql://postgres@localhost:5432/logpulse?schema=public"

# If using your own Unix username (macOS Homebrew):
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/logpulse?schema=public"
```

#### Step 4 — Run migrations

```bash
npm run prisma:migrate
# When prompted for migration name, type: init
```

---

### ❌ Redis connection refused

Make sure Redis is running:

```bash
# Ubuntu/Debian:
sudo systemctl start redis-server
sudo systemctl status redis-server

# macOS (Homebrew):
brew services start redis

# Test it works:
redis-cli ping
# Should return: PONG
```

---

## ✅ Full Working Setup (in order)

```bash
# 1. Prerequisites check
psql --version          # PostgreSQL 12+
redis-cli ping          # Should say PONG
node --version          # Node 18+

# 2. Backend
cd backend
cp .env.example .env
# Edit .env — update DATABASE_URL with your postgres credentials

npm install
npm run prisma:migrate  # Creates tables (enter "init" as migration name)
npm run seed            # Populates demo data + prints API key
npm run dev             # Server starts on :4000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev             # App starts on :3000
```

## 🔐 Demo Login

After seeding, log in at http://localhost:3000:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@acme.com` | `password123` |
| Member | `member@acme.com` | `password123` |

## 📡 Test Log Ingestion

```bash
# Get an API key from the UI (API Keys page) then:
curl -X POST http://localhost:4000/api/v1/logs/ingest \
  -H "X-API-Key: lp_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"message":"Test log","level":"info","source":"curl"}'

# Expected response:
# {"success":true,"message":"Log accepted for processing","data":{"queued":true}}
```
