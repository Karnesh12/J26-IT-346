# BoneVision AI

BoneVision AI is a research-use-only musculoskeletal fracture recognition workspace. This repository contains a Next.js App Router frontend and a Flask API.

## Requirements

- Python 3.11+
- Node.js 18.17+ and npm

## Backend setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
flask db upgrade
python seed.py
flask run --port 5000
```

The seed script creates:

- Admin: `admin@bonevision.test` / `ResearchAdmin123!`
- Researcher: `researcher@bonevision.test` / `Researcher123!`

In development, when SMTP is not configured, the API includes a development-only OTP in its login response. The frontend displays this code on the verification screen. Configure `MAIL_*` settings to deliver OTP and password-reset messages by email. Never enable debug mode in production.

SQLite is used by default. Set `DATABASE_URL` to a PostgreSQL SQLAlchemy URL to use PostgreSQL.

Run the API tests from `backend` with `python -m unittest discover -s tests -v`.

## Frontend setup

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The Next.js server proxies authentication requests to Flask and writes JWTs to `HttpOnly`, `SameSite=Lax` cookies. Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` only when the Flask API is not running at `http://localhost:5000`.

## Routes

- `/login` — password sign-in
- `/verify` — six-digit email verification
- `/request-access` — researcher access request
- `/forgot-password` — generic password reset request
- `/dashboard` — protected placeholder workspace
- `/api/health` — backend health status

This is a research application and is not intended for diagnosis, treatment, or clinical decision-making.
