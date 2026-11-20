# DBU Student Clearance System

A university clearance management system split into two independently deployable apps.

```
Student-Clearance/
├── frontend/   → React + Vite (deploy to Vercel)
└── backend/    → Express.js + PostgreSQL (deploy to Railway)
```

## Quick Start (Local Development)

**Terminal 1 — Backend:**
```bash
cd backend
npm install
# create .env from .env.example and fill in your values
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
# No .env needed locally — Vite proxy handles API calls
npm run dev
```

Frontend runs on http://localhost:5173, backend on http://localhost:3000.

## Deployment

| Part | Platform | Notes |
|------|----------|-------|
| `frontend/` | Vercel | Root dir = `frontend`, auto-detects Vite |
| `backend/` | Railway | Root dir = `backend`, runs `npm start` |

See the deployment guide for full setup steps.
