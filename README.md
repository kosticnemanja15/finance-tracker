# 💰 Personal Finance Tracker

A full-stack personal finance application for tracking income, expenses, categories, and statistics — with full JWT authentication, role-based access control, and per-user data ownership.

**Live demo:** [finance-tracker-murex-nu.vercel.app](https://finance-tracker-murex-nu.vercel.app)

> **Demo accounts** (feel free to log in and explore):
> - **Admin:** `ana@test.com` / `password123`
> - **User:** `marko@test.com` / `password123`
>
> The backend runs on Render's free tier and sleeps after 15 minutes of inactivity, so the **first request may take 30–50 seconds** to wake the server. Subsequent requests are fast.

---

## Features

- **JWT authentication** — register, login, and session hydration via a stateless token flow (bcrypt password hashing + signed JWTs).
- **Role-based access control (RBAC)** — `user` and `admin` roles, enforced on the backend and reflected in the UI.
- **Ownership model** — every user sees and edits only their own transactions; the backend verifies ownership on every read and mutation.
- **Transactions CRUD** — create, list (with filtering by type, category, and date range), edit, and delete income/expense records, with pagination.
- **Categories** — default seeded categories plus user-created ones.
- **Dashboard** — monthly balance overview and a category breakdown pie chart, filterable by month and year.
- **Admin panel** — user management table, visible only to admins.
- **Production-grade validation and error handling** — shared Zod schemas, a centralized error handler, and consistent `{ error, code }` responses.
- **Resilient auth** — the client distinguishes "backend unreachable" from "unauthorized", so a temporary server outage doesn't log the user out.

---

## Tech Stack

**Backend**
- Node.js + Express
- JWT authentication (`jsonwebtoken` + `bcrypt`)
- Zod for request validation
- `helmet`, `cors`, `morgan`, `express-rate-limit` for production hardening
- `dotenv` for configuration
- In-memory data store (see [Known Limitations](#known-limitations))

**Frontend**
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui (Radix primitives)
- React Hook Form + Zod (`@hookform/resolvers`) for typed forms
- Recharts for data visualization
- `sonner` for toast notifications
- `lucide-react` for icons

**Deployment**
- Backend → [Render](https://render.com) (web service, free tier)
- Frontend → [Vercel](https://vercel.com) (Hobby tier)

---

## Architecture

This is a monorepo containing two independently deployed applications:

```
finance-tracker/
├── backend/          # Express REST API
│   ├── config.js         # centralized, env-driven config
│   ├── server.js         # app setup + middleware chain + route mounting
│   ├── routes/           # Express routers per resource (auth, users, categories, transactions)
│   ├── schemas/          # Zod validation schemas
│   ├── middleware/       # auth (requireAuth, requireRole), validation, error handling, rate limiting
│   ├── errors/           # ApiError class hierarchy
│   ├── data/             # in-memory stores + seed data
│   └── utils/            # JWT sign/verify helpers
│
└── frontend/         # Next.js app
    ├── src/app/          # App Router pages (grouped: (protected) routes behind an AuthGuard)
    ├── src/components/   # UI components (NavBar, TransactionForm, charts, guards)
    ├── src/context/      # Auth + Categories React contexts
    ├── src/hooks/        # data-fetching hooks (useTransactions, useStats, useUsers)
    ├── src/lib/          # API client, formatters, chart helpers
    └── src/schemas/      # Zod schemas (shared shape with the backend)
```

The frontend talks to the backend through a single API client (`src/lib/api.ts`) that attaches the JWT and normalizes backend errors into a typed `ApiError`. CORS is configured on the backend to allow only the deployed frontend origin in production.

---

## API Overview

All protected routes require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/auth/register` | Register + auto-login | Public |
| `POST` | `/auth/login` | Log in | Public |
| `GET` | `/auth/me` | Current user | Authenticated |
| `GET` | `/users` | List users | Admin |
| `GET` | `/users/:id` | User detail | Admin or self |
| `PATCH` | `/users/:id` | Update user | Admin or self |
| `DELETE` | `/users/:id` | Delete user | Admin |
| `GET` | `/categories` | List categories | Authenticated |
| `POST` | `/categories` | Create category | Authenticated |
| `PATCH` | `/categories/:id` | Update own category | Owner |
| `DELETE` | `/categories/:id` | Delete own category | Owner |
| `GET` | `/transactions` | List own transactions (filters + pagination) | Authenticated |
| `GET` | `/transactions/:id` | Single transaction | Owner or admin |
| `POST` | `/transactions` | Create transaction | Authenticated |
| `PATCH` | `/transactions/:id` | Update own transaction | Owner |
| `DELETE` | `/transactions/:id` | Delete own transaction | Owner |
| `GET` | `/transactions/stats` | Aggregated stats | Authenticated |
| `GET` | `/health` | Health check | Public |

---

## Running Locally

### Prerequisites
- Node.js 20+
- npm

### Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in the values
npm start
```

Generate a `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

The backend runs on `http://localhost:3000` by default.

### Frontend

```bash
cd frontend
npm install
# create .env.local with:
#   NEXT_PUBLIC_API_URL=http://localhost:3000
npm run dev
```

The frontend runs on `http://localhost:3001`.

---

## Environment Variables

**Backend**

| Variable | Description |
|---|---|
| `JWT_SECRET` | Secret used to sign JWTs (required) |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `24h` (required) |
| `BCRYPT_COST` | bcrypt cost factor, e.g. `10` (required) |
| `NODE_ENV` | `development` or `production` |
| `FRONTEND_URL` | Allowed CORS origin in production (the deployed frontend URL) |
| `PORT` | Injected automatically by the host in production |

**Frontend**

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API |

---

## Known Limitations

This is a **Phase 1 MVP** focused on backend fundamentals (Express, auth, validation, error handling) and a working full-stack deployment. A few deliberate trade-offs:

- **In-memory storage.** The backend stores data in memory, so a server restart (including Render's free-tier sleep/redeploy cycle) resets everything to the seed data. Persistence with PostgreSQL is planned for v2.
- **Free-tier cold starts.** The backend sleeps after inactivity; the first request after a sleep is slow (~30–50s).
- **Token in localStorage.** The JWT is stored in `localStorage` for simplicity. A production build would move to httpOnly cookies with refresh tokens.

---

## Roadmap (v2)

- PostgreSQL + Prisma (persistent storage, migrations, foreign keys, indexes)
- Aggregate stats via database `GROUP BY` (monthly trend line chart)
- Refresh tokens + httpOnly cookie auth
- Automated tests (Jest + Supertest)
- Consistent theming and dark mode

---

## License

This project was built as a portfolio piece. Feel free to explore the code.