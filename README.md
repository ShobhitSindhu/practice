# Copilot Usage Dashboard

A full-stack application to track and visualize GitHub Copilot usage across your organization. Monitor employee adoption, acceptance rates, language breakdowns, and department-level performance in real time.

## Features

- **Real-time Dashboard** — KPI cards, daily trend charts, and employee summary tables
- **Employee Management** — Full CRUD for employee records with Copilot enablement tracking
- **Usage Records** — Filterable table of all Copilot usage data with employee and language filters
- **Analytics** — Deep-dive charts including weekly acceptance rates, top employees, language comparison, radar charts, and pie charts
- **Direct DB Connection** — SQLAlchemy ORM backed by SQLite (swap to PostgreSQL via `DATABASE_URL`)
- **REST API** — FastAPI backend with OpenAPI docs at `/docs`

## Tech Stack

| Layer    | Technology                        |
| -------- | --------------------------------- |
| Backend  | FastAPI, SQLAlchemy, Pydantic     |
| Frontend | React, TypeScript, Recharts, Vite |
| Database | SQLite (default) / PostgreSQL     |

## Quick Start

### Backend

```bash
cd backend
pip install -e .
uvicorn app.main:app --reload --port 8000
```

API docs available at http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard available at http://localhost:5173

### Environment Variables

| Variable       | Default                       | Description          |
| -------------- | ----------------------------- | -------------------- |
| `DATABASE_URL` | `sqlite:///./copilot_usage.db` | Database connection  |
| `VITE_API_URL` | `http://localhost:8000`        | Backend API base URL |

## Sample Data

The app auto-seeds 20 employees with 90 days of realistic Copilot usage data on first startup. This includes multiple languages, editors, and varied acceptance rates across departments.

## API Endpoints

| Method | Endpoint                      | Description               |
| ------ | ----------------------------- | ------------------------- |
| GET    | `/api/dashboard`              | Full dashboard overview   |
| GET    | `/api/employees`              | List all employees        |
| POST   | `/api/employees`              | Create employee           |
| PUT    | `/api/employees/{id}`         | Update employee           |
| DELETE | `/api/employees/{id}`         | Delete employee           |
| GET    | `/api/usage`                  | List usage records        |
| POST   | `/api/usage`                  | Create usage record       |
| DELETE | `/api/usage/{id}`             | Delete usage record       |
| GET    | `/api/health`                 | Health check              |
