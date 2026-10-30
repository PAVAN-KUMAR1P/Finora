# Personal Finance Tracker (MVP)

React + Vite frontend, FastAPI backend, PostgreSQL via SQLAlchemy. Argon2 password hashing, JWT auth, per-user data isolation.

## 1. Database (PostgreSQL)

Create a dedicated user and database (edit the password in `backend/setup_db.sql` first):

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -f backend/setup_db.sql
```

Tables (`users`, `expenses`) are created automatically when the backend starts (`Base.metadata.create_all`).

No PostgreSQL installed? Quickest option on Windows: `winget install PostgreSQL.PostgreSQL.17`, then run the command above.

## 2. Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
copy .env.example .env      # then edit DATABASE_URL and JWT_SECRET
.venv\Scripts\uvicorn app.main:app --reload --port 8000
```

Generate a JWT secret: `python -c "import secrets; print(secrets.token_urlsafe(48))"`

API docs: http://localhost:8000/docs

## 3. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to `http://localhost:8000`.

## Features

| Page | What it does |
|---|---|
| Overview | Monthly spend, trend chart, category donut, recent transactions |
| Transactions | Add / edit / delete expenses, filter by category and month |
| Budgets | Per-category monthly limits with progress (on track / near limit / over) |
| Fixed Deposits | Maturity value, interest earned and days left (compound interest, quarterly by default) |
| Investments | Holdings with gain/loss and allocation. **Current value is entered by you** - no live market prices |
| Reports | 3/6/12-month spending, top categories, budgets kept, investment and FD totals; printable |

There is no income or bank-balance data, so no net-worth figure is shown.

## API

All routes except register/login need `Authorization: Bearer <token>`. Every query is scoped to the logged-in user; another user's record returns 404.

| Method | Path |
|---|---|
| POST | /api/auth/register, /api/auth/login |
| GET | /api/auth/me |
| GET/POST | /api/expenses (`?month=YYYY-MM`) |
| PUT/DELETE | /api/expenses/{id} |
| GET | /api/summary (`?month=YYYY-MM`), /api/categories |
| GET | /api/budgets/status?month=YYYY-MM |
| POST/PUT/DELETE | /api/budgets, /api/budgets/{id} |
| GET/POST | /api/fixed-deposits |
| PUT/DELETE | /api/fixed-deposits/{id} |
| GET/POST | /api/investments, GET /api/investments/types |
| PUT/DELETE | /api/investments/{id} |
| GET | /api/reports/overview?months=6 |

New tables (`budgets`, `fixed_deposits`, `investments`) are created automatically on backend start.
If you change backend code, restart uvicorn (or run it with `--reload`).
