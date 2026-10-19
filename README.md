# BoneVision AI

BoneVision AI is a research-use-only musculoskeletal fracture review workspace. The frontend uses Next.js 14, React, TypeScript, and Tailwind CSS; the API uses Flask, SQLAlchemy, Flask-JWT-Extended, and Alembic.

## Run locally

1. Start the backend in one terminal:

   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   Copy-Item .env.example .env
   flask --app run db upgrade
   python seed.py
   flask --app run run --port 5000
   ```

2. Start the frontend in another terminal:

   ```powershell
   cd frontend
   npm install
   Copy-Item .env.example .env.local
   npm run dev
   ```

   Open `http://localhost:3000`. The seeded researcher credentials are `researcher@bonevision.test` / `Researcher123!`; development login displays the verification code when email is not configured.

## Leg-analysis API

All case endpoints require the existing access-token authentication. The Next.js API routes proxy requests through the HttpOnly session cookie.

- `GET /api/cases` — the signed-in user's case list and totals.
- `POST /api/cases` — create a case. Accepts `region`, `module`, and optional `side`, `view`, and `study_date`.
- `GET /api/cases/{case_id}` — case metadata and its findings.
- `PATCH /api/cases/{case_id}/findings/{finding_id}` — save finding edits.
- `POST /api/cases/{case_id}/review` — record a review request.
- `POST /api/cases/{case_id}/segmentation` — record a segmentation request.
- `POST /api/cases/{case_id}/analyze` — returns `503` until a fracture-analysis model has been configured.

Apply schema updates using `flask --app run db upgrade`. The seed script adds the illustrative `BV-025` tibia case for the seeded researcher if that user has no cases.

The included X-ray-style SVG and sample findings are illustrative demo content, not medical images, model predictions, or clinical advice. No trained inference model or DICOM image upload is included.

Run backend tests from `backend` with `python -m unittest discover -s tests -v`; build the frontend from `frontend` with `npm run build`.
