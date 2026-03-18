# LogPulse
### Real-time Multi-Tenant Application Monitoring Platform

> Built with React · Node.js · PostgreSQL · Redis · Socket.IO · Docker

---

## What is this?

LogPulse is a production-grade log monitoring platform — think simplified Datadog.

- Ship logs from any service via a single HTTP call
- Watch them stream into your dashboard in real time
- Filter, search, and analyze across time ranges
- Fully isolated per organization (multi-tenant)
- Role-based access for your whole team

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     REACT FRONTEND                           │
│   Dashboard · Logs · Analytics · API Keys · Team             │
│   React Query (caching) + Socket.IO (real-time stream)       │
└─────────────────────────┬────────────────────────────────────┘
                          │ HTTP / WebSocket
┌─────────────────────────▼────────────────────────────────────┐
│                  EXPRESS API (Node.js + TS)                  │
│                                                              │
│  POST /api/v1/logs/ingest   →  API Key auth                  │
│  GET  /api/v1/logs          →  JWT auth                      │
│  GET  /api/v1/analytics     →  JWT auth                      │
│  POST /api/v1/auth/login    →  public                        │
└──────────────┬──────────────────────────┬────────────────────┘
               │                          │
       ┌───────▼─────────┐        ┌────────▼────────┐
       │     REDIS       │        │   POSTGRESQL    │
       │                 │        │                 │
       │  • Log queue    │        │  • tenants      │
       │  • API key cache│        │  • users        │
       │  • Rate limits  │        │  • api_keys     │
       │  • Stats cache  │        │  • logs         │
       └───────┬─────────┘        └────────▲────────┘
               │                           │
       ┌───────▼───────────────────────────┤
       │           LOG WORKER              │
       │  polls Redis every 500ms          │
       │  batch inserts → PostgreSQL       │
       │  broadcasts → Socket.IO ──────────┘
       └───────────────────────────────────┘
```

---

## 🔄 Log Ingestion Flow

```
1. your app  →  POST /api/v1/logs/ingest  (X-API-Key header)
2. backend   →  validates + rate limits (1000/min per tenant)
3. redis     →  RPUSH to queue (async, non-blocking)
4. worker    →  LPOP batch of 50, insert to postgres, broadcast via ws
5. dashboard →  new log appears in real time via Socket.IO
```

No log is written synchronously to the DB. Everything goes through the queue.

---

## 🐳 Getting Started (Docker)

### Step 1 — configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` — only 3 things matter:

```dotenv
DATABASE_URL="postgresql://postgres:yourpassword@postgres:5432/logpulse?schema=public"
POSTGRES_PASSWORD=yourpassword
JWT_SECRET=any-long-random-string-minimum-32-characters
```

> If your password contains `@` — encode it as `%40`
> Example: `pass@word` → `pass%40word`

---

### Step 2 — start everything

```bash
docker compose up --build -d
```

This starts all 4 services automatically:

| Container | What it does | Port |
|-----------|-------------|------|
| `postgres` | stores all data | internal |
| `redis` | queue + cache | internal |
| `backend` | API server | 4000 |
| `frontend` | React dashboard | 3000 |

---

### Step 3 — create the database tables

```bash
docker compose exec backend npx prisma db push
```

---

### Step 4 — open the app

```
http://localhost:3000
```

Register your account. You'll be the Admin of your organization.

---

## 📡 Sending Logs

Get your API key from the **API Keys** page, then:

```bash
# single log
curl -X POST http://localhost:4000/api/v1/logs/ingest \
  -H "X-API-Key: lp_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"message":"User signed up","level":"info","source":"auth-service"}'

# with metadata
curl -X POST http://localhost:4000/api/v1/logs/ingest \
  -H "X-API-Key: lp_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Payment failed",
    "level": "error",
    "source": "payments",
    "metadata": { "userId": "u_123", "amount": 99.99, "reason": "insufficient_funds" }
  }'
```

**Log levels:** `info` · `warn` · `error` · `debug`

**Response:**
```json
{ "success": true, "data": { "queued": true, "queueSize": 1 } }
```

---

## 🐳 Docker Commands

```bash
# start in background
docker compose up -d

# start + rebuild images
docker compose up --build -d

# stop everything
docker compose down

# stop + wipe database (full reset)
docker compose down -v

# view logs
docker compose logs backend
docker compose logs backend --tail=50 --follow

# run a command inside a container
docker compose exec backend sh

# restart one service
docker compose restart backend
```

---

## 🔐 Auth & Roles

| Role | Can do |
|------|--------|
| `ADMIN` | manage users, create/revoke API keys, view everything |
| `MEMBER` | read-only access to logs, analytics, dashboard |

JWT is stored in memory only (not localStorage) — safe against XSS.

---

## Redis Usage

| What | Key | TTL |
|------|-----|-----|
| Log queue | `logpulse:queue:logs` | none |
| API key cache | `logpulse:cache:apikey:{hash}` | 5 min |
| Recent logs cache | `logpulse:cache:logs:{tenantId}` | 60s |
| Analytics cache | `logpulse:stats:{tenantId}` | 30s |
| Rate limit | `logpulse:ratelimit:{ip}` | 60s window |

---

## 🛡 Resilience

| Failure | What happens |
|---------|-------------|
| Redis down | logs written directly to DB |
| Redis + DB down | request accepted, log dropped gracefully |
| Backend restart | Redis queue replays unprocessed logs |
| Rate limit exceeded | 429 returned, app never crashes |
| Bad API key | 401, checked against cache first |

---

## 🏢 Multi-Tenancy

Every single DB query is scoped by `tenantId`. No exceptions.

```typescript
// every log query looks like this
prisma.log.findMany({ where: { tenantId: req.user.tenantId } })

// JWT carries tenantId
{ userId, role, tenantId }

// WebSocket rooms are tenant-isolated
socket.join(`tenant:${tenantId}`)
io.to(`tenant:${tenantId}`).emit('log:new', data)
```

One tenant can never see another tenant's data.

---

## 📁 Project Structure

```
logpulse/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── .env.example
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── modules/
│       │   ├── auth/         # register, login, JWT
│       │   ├── logs/         # ingest + query
│       │   ├── tenants/      # API key management
│       │   ├── users/        # team management
│       │   └── analytics/    # stats + charts
│       ├── workers/
│       │   └── logWorker.ts  # Redis → Postgres pipeline
│       ├── middleware/
│       │   ├── auth.ts       # JWT guard
│       │   ├── apiKeyAuth.ts # API key guard + Redis cache
│       │   └── rateLimiter.ts# Redis-backed rate limiting
│       └── config/
│           ├── database.ts   # Prisma
│           ├── redis.ts      # Redis clients
│           └── socket.ts     # Socket.IO
└── frontend/
    ├── Dockerfile
    ├── nginx.conf            # proxies /api → backend
    └── src/
        ├── pages/            # Dashboard, Logs, Analytics, API Keys, Team
        ├── components/       # reusable UI
        ├── hooks/            # useLogs, useAnalytics, useSocketLogs
        └── context/          # AuthContext (in-memory JWT)
```

---

## 🧪 Testing Resilience

```bash
# flood the rate limiter (should see 429 after 1000)
for i in {1..1100}; do
  curl -s -o /dev/null -w "%{http_code} " \
    -X POST http://localhost:4000/api/v1/logs/ingest \
    -H "X-API-Key: your_key" \
    -H "Content-Type: application/json" \
    -d '{"message":"test","level":"info"}'
done

# kill redis and test failover
docker compose stop redis
curl -X POST http://localhost:4000/api/v1/logs/ingest \
  -H "X-API-Key: your_key" \
  -H "Content-Type: application/json" \
  -d '{"message":"redis is down","level":"warn"}'
docker compose start redis

# stress test — 100 parallel logs
for i in {1..100}; do
  curl -s -X POST http://localhost:4000/api/v1/logs/ingest \
    -H "X-API-Key: your_key" \
    -H "Content-Type: application/json" \
    -d "{\"message\":\"stress $i\",\"level\":\"info\"}" &
done
wait && echo "done"
```

---

## 🚀 Scaling

The system is already designed for horizontal scale.

```yaml
# scale backend workers in docker-compose.yml
backend:
  deploy:
    replicas: 3
```

Multiple backend instances share the same Redis queue — logs are processed once, never duplicated. Add instances, throughput scales linearly.
