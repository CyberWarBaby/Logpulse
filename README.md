## LogPulse — Multi-Tenant Application Monitoring Platform

A production-grade, full-stack application monitoring platform built with React, Node.js/Express, PostgreSQL (Prisma ORM), Redis, and Socket.IO.

---

## 🗺 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                       │
│  Auth → Dashboard → Logs → Analytics → API Keys → Users     │
│  React Query (cache) + Socket.IO (real-time)                │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP / WebSocket
┌────────────────────────▼────────────────────────────────────┐
│                   BACKEND (Express + TS)                    │
│                                                             │
│  POST /api/v1/logs/ingest  (API Key auth)                   │
│  GET  /api/v1/logs         (JWT auth)                       │
│  GET  /api/v1/analytics    (JWT auth)                       │
│  POST /api/v1/auth/login   (public)                         │
│  ...                                                        │
└───────────┬─────────────────────────┬───────────────────────┘
            │                         │
    ┌───────▼───────┐        ┌────────▼────────┐
    │    REDIS      │        │   PostgreSQL    │
    │               │        │                 │
    │  Log Queue    │        │  tenants        │
    │  (RPUSH/LPOP) │        │  users          │
    │               │        │  api_keys       │
    │ API Key Cache │        │  logs           │
    │  Rate Limits  │        │  audit_logs     │
    │  Stats Cache  │        │                 │
    └───────┬───────┘        └─────────────────┘
            │                         ▲
    ┌───────▼──────────────────────── ┤
    │         LOG WORKER              │
    │  Polls Redis queue every 500ms  │
    │  Batch inserts to Postgres      │
    │  Broadcasts via Socket.IO ──────┘
    └─────────────────────────────────┘
```

---

## 🔄 Data Flow: Log Ingestion Pipeline

```
1. Client sends:
   POST /api/v1/logs/ingest
   X-API-Key: lp_xxxxx
   { message, level, timestamp, metadata }

2. Middleware:
   → ingestRateLimiter (Redis: 1000/min per tenant)
   → apiKeyAuth (checks cache → DB, caches result)
   → validate (Zod schema)

3. IngestService:
   → RPUSH log-ingestion-queue JSON payload

4. LogWorker (background, every 500ms):
   → LPOP up to 50 items (pipeline batch)
   → Group by tenantId
   → prisma.log.createMany()
   → Invalidate Redis recent-logs cache
   → Socket.IO broadcast to tenant:${tenantId} room

5. Frontend receives:
   → socket.on('log:new') → prepend to live stream
   → React Query invalidation for analytics
```

---

## 🏢 Multi-Tenancy Enforcement

Every database query includes `tenantId` scoping:

```typescript
// Every repository query is scoped:
prisma.log.findMany({ where: { tenantId: req.user.tenantId, ... } })

// JWT payload contains tenantId:
{ userId, role, tenantId }

// API Key lookup returns tenantId:
{ tenantId, tenantName, ... }

// Socket.IO rooms are tenant-isolated:
socket.join(`tenant:${tenantId}`)
io.to(`tenant:${tenantId}`).emit('log:new', data)
```

No cross-tenant data leakage is possible at the query layer.

---

## ⚡ Redis Usage

| Usage | Key Pattern | TTL |
|-------|-------------|-----|
| Log ingestion queue | `logpulse:queue:logs` | None (FIFO list) |
| API key cache | `logpulse:cache:apikey:{hash}` | 5 min |
| Recent logs cache | `logpulse:cache:logs:{tenantId}` | 60 sec |
| Analytics stats cache | `logpulse:stats:{tenantId}` | 30 sec |
| Rate limit counters | `logpulse:ratelimit:{key}` | Window TTL |

---

## 🔐 Auth & RBAC

| Role | Capabilities |
|------|-------------|
| `ADMIN` | Everything: manage users, create/revoke API keys, view logs |
| `MEMBER` | Read-only: view logs, analytics, dashboard |

JWT tokens carry `{ userId, role, tenantId }`. All protected routes verify the token and re-fetch the user from DB to ensure account is still active.

---

## 📁 Backend Structure

```
backend/src/
├── modules/
│   ├── auth/           {controllers, services, repositories}
│   ├── logs/           {controllers, services, repositories}
│   ├── tenants/        {controllers, services, repositories}
│   ├── users/          {controllers, services, repositories}
│   └── analytics/      {controllers, services}
├── workers/
│   └── logWorker.ts    # Redis queue consumer
├── middleware/
│   ├── auth.ts         # JWT verification + role guards
│   ├── apiKeyAuth.ts   # API key auth with Redis cache
│   ├── rateLimiter.ts  # Redis-backed sliding window
│   ├── validate.ts     # Zod schema validation
│   └── errorHandler.ts # Centralized error handling
├── config/
│   ├── database.ts     # Prisma client singleton
│   ├── redis.ts        # Redis clients + key constants
│   └── socket.ts       # Socket.IO server setup
└── utils/
    ├── errors.ts       # AppError class + helpers
    ├── logger.ts       # Winston logger
    ├── crypto.ts       # API key generation + hashing
    └── validation.ts   # Zod schemas
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your DB and Redis credentials

npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed          # Creates demo tenant + sample logs
npm run dev           # Starts on :4000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev           # Starts on :3000
```

### Demo Login
- **Admin**: `admin@acme.com` / `password123`
- **Member**: `member@acme.com` / `password123`

---

## 📡 Log Ingestion API

```bash
# Ingest a log via API key
curl -X POST http://localhost:4000/api/v1/logs/ingest \
  -H "X-API-Key: lp_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "User login successful",
    "level": "info",
    "source": "auth-service",
    "metadata": { "userId": "u_123", "ip": "1.2.3.4" }
  }'

# Response (202 Accepted - log queued, not yet stored)
{
  "success": true,
  "message": "Log accepted for processing",
  "data": { "queued": true, "queueSize": 1 }
}
```

---

## 🧠 Database Indexes

```sql
-- Logs table (high-volume)
CREATE INDEX ON logs ("tenantId");
CREATE INDEX ON logs ("tenantId", level);
CREATE INDEX ON logs ("tenantId", timestamp DESC);
CREATE INDEX ON logs ("tenantId", "createdAt" DESC);

-- API keys (frequent lookup)
CREATE INDEX ON api_keys ("keyHash");
CREATE INDEX ON api_keys ("tenantId");
```

---

## 🏗 Production Considerations

- **Queue backpressure**: LogWorker polls every 500ms with batch size 50. Adjust for throughput needs.
- **Dead letter queue**: Failed log batches are re-queued with `_retryCount`. In production, route to a DLQ after N retries.
- **Log retention**: Implement `deleteOldLogs()` as a cron job.
- **Horizontal scaling**: Redis queue is shared; multiple worker instances naturally load-balance.
- **Connection pooling**: Prisma handles PG pooling. For very high load, use PgBouncer.
