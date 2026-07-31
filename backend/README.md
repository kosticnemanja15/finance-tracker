# Finance Tracker — Backend API

REST API for a personal finance tracker. Users manage income/expense transactions
across categories, with per-user data isolation, role-based access control, and
aggregate statistics.

Built as a production-oriented Express backend: JWT auth, Zod validation, centralized
error handling, security headers, and rate limiting.

> **Note:** Data is currently stored in-memory (resets on restart). PostgreSQL + Prisma
> migration is planned for the next phase.

## Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express 5
- **Validation:** Zod 4
- **Auth:** jsonwebtoken (JWT) + bcrypt
- **Security:** helmet, express-rate-limit, CORS
- **Logging:** morgan

## Getting Started

### Prerequisites
- Node.js 18+ (Express 5 requirement)

### Installation

```bash
# From the monorepo root
cd backend
npm install
```

### Environment

Copy the example env file and fill in the values:

```bash
cp .env.example .env
```

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

`.env` variables:

| Variable | Description | Example |
|---|---|---|
| `JWT_SECRET` | Secret for signing JWTs (min 64 chars) | `a1b2c3...` |
| `JWT_EXPIRES_IN` | Access token lifetime | `15m` |
| `BCRYPT_COST` | bcrypt cost factor | `10` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |

### Run

```bash
npm run dev     # watch mode (auto-restart)
npm start       # production
```

Server starts at `http://localhost:3000`.

## Seed Users

The app seeds two users on startup (for development):

| Role  | Email           | Password      |
|-------|-----------------|---------------|
| admin | ana@test.com    | password123   |
| user  | marko@test.com  | password123   |

## Authentication

Protected routes require a Bearer token:

```
Authorization: Bearer <token>
```

Obtain a token via `POST /auth/login` or `POST /auth/register`.

## API Reference

### Auth

| Method | Endpoint         | Auth | Description                    |
|--------|------------------|------|--------------------------------|
| POST   | `/auth/register` | —    | Register + receive JWT         |
| POST   | `/auth/login`    | —    | Login + receive JWT            |
| GET    | `/auth/me`       | ✓    | Current authenticated user     |

> `login` and `register` are rate-limited to **5 failed attempts / 15 min** per IP.

### Users

| Method | Endpoint      | Auth        | Description                        |
|--------|---------------|-------------|------------------------------------|
| GET    | `/users`      | admin       | List all users                     |
| GET    | `/users/:id`  | admin/self  | Get a user                         |
| PATCH  | `/users/:id`  | admin/self  | Update a user                      |
| DELETE | `/users/:id`  | admin       | Soft-delete a user                 |

### Categories

| Method | Endpoint          | Auth  | Description                              |
|--------|-------------------|-------|------------------------------------------|
| GET    | `/categories`     | ✓     | List categories (default + own)          |
| POST   | `/categories`     | ✓     | Create a private category                |
| PATCH  | `/categories/:id` | owner | Update own category                      |
| DELETE | `/categories/:id` | owner | Delete own category (defaults protected) |

Query: `?type=income|expense`

### Transactions

| Method | Endpoint               | Auth  | Description                          |
|--------|------------------------|-------|--------------------------------------|
| GET    | `/transactions`        | ✓     | List own transactions (filtered)     |
| GET    | `/transactions/stats`  | ✓     | Aggregate statistics                 |
| GET    | `/transactions/:id`    | owner | Get one transaction                  |
| POST   | `/transactions`        | ✓     | Create a transaction                 |
| PATCH  | `/transactions/:id`    | owner | Update a transaction                 |
| DELETE | `/transactions/:id`    | owner | Delete a transaction                 |

**`GET /transactions` query params:**

| Param        | Type   | Description                     |
|--------------|--------|---------------------------------|
| `type`       | enum   | `income` \| `expense`           |
| `categoryId` | number | Filter by category              |
| `from`       | date   | Start date (`YYYY-MM-DD`)       |
| `to`         | date   | End date (`YYYY-MM-DD`)         |
| `page`       | number | Page number (default `1`)       |
| `limit`      | number | Items per page (default `20`, max `100`) |

**`GET /transactions/stats` query params:** `?year=2025&month=6` (both optional)

### System

| Method | Endpoint   | Auth | Description   |
|--------|------------|------|---------------|
| GET    | `/health`  | —    | Health check  |

## Example Requests

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"marko@test.com","password":"password123"}'
```

Response:

```json
{
  "user": { "id": 2, "name": "Marko", "email": "marko@test.com", "role": "user" },
  "token": "eyJhbGci..."
}
```

### Create a transaction

```bash
curl -X POST http://localhost:3000/transactions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"type":"expense","amount":3500,"categoryId":1,"description":"Groceries","date":"2025-01-15"}'
```

### List with filters + pagination

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/transactions?type=expense&page=1&limit=20"
```

Response:

```json
{
  "data": [ /* transactions */ ],
  "pagination": { "page": 1, "total": 3, "hasMore": false }
}
```

### Statistics

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/transactions/stats?year=2025&month=6"
```

Response:

```json
{
  "totalIncome": 45000,
  "totalExpense": 4200,
  "balance": 40800,
  "byCategory": [
    { "categoryId": 1, "categoryName": "Hrana", "total": 4200 },
    { "categoryId": 13, "categoryName": "Freelance", "total": 45000 }
  ]
}
```

## Error Format

All errors return a consistent JSON shape:

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [ { "field": "email", "message": "Invalid email format" } ]
}
```

| Status | Meaning                                    |
|--------|--------------------------------------------|
| 400    | Bad request / validation error             |
| 401    | Missing or invalid authentication          |
| 403    | Authenticated but not authorized           |
| 404    | Resource not found                         |
| 409    | Conflict (e.g. email already registered)   |
| 429    | Rate limit exceeded                        |
| 500    | Internal server error                      |

## Security

- Passwords hashed with bcrypt (never stored or returned in plaintext)
- JWT stateless auth with short-lived access tokens
- Timing-attack-resistant login
- Per-user data isolation (ownership checks on every resource)
- Role-based access control (RBAC)
- Security headers via helmet
- Rate limiting (global + stricter auth limiter)
- Request body size limits

## Project Status

- [x] Auth (register / login / me)
- [x] Users CRUD with RBAC
- [x] Categories CRUD with ownership
- [x] Transactions CRUD with ownership
- [x] Filtering, pagination, statistics
- [x] Security hardening (helmet, rate limiting)
- [ ] PostgreSQL + Prisma (next phase)
- [ ] Automated tests
- [ ] TypeScript migration