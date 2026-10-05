# ShieldAuth

ShieldAuth is an authentication and license management platform. It handles user auth, license issuance, and hardware ID binding so software can be licensed per-device with a central dashboard to manage it all.

Built as a personal project to explore full-stack auth systems, license validation flows, and SDK design across multiple languages.

## What it does

- Handles user registration/login with JWT-based auth
- Issues and manages software licenses
- Binds licenses to hardware IDs to prevent sharing
- Tracks usage and license status through an analytics dashboard
- Generates and manages API keys for integrations
- Logs activity for auditing

## Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL via Supabase
- **Hosting**: Vercel (frontend), Railway (backend)

## Structure

```text
ShieldAuth/
├── backend/         # Express + TypeScript API
├── frontend/        # React + TypeScript app (Vite)
├── sdk/             # Client SDKs (C++, C#, Python)
└── README.md
```

## Setup

### Environment variables

Backend (`.env`):

```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-secret-key
FRONTEND_URL=https://your-frontend-url.vercel.app
PORT=3000
```

Frontend (`.env`):

```env
VITE_API_URL=https://your-backend-url.up.railway.app/api/v1
```

### Database

Run the migrations against Supabase:

```bash
psql $DATABASE_URL < backend/migrations/init.sql
psql $DATABASE_URL < backend/migrations/seed.sql
```

The seed script creates a default admin account; change the password immediately if you're running this anywhere beyond local testing.

### Running locally

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Deployment

- **Frontend (Vercel)** - connected to GitHub, auto-deploys on push to `main`. Needs `VITE_API_URL` set.
- **Backend (Railway)** - connected to GitHub, auto-deploys on push to `main`. Needs `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `PORT`.

## API

### Auth

`POST /api/v1/auth/register`

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

`POST /api/v1/auth/login`

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### License validation

`POST /api/v1/validate`

```json
{
  "app_id": "your-app-id",
  "app_secret": "your-app-secret",
  "license_key": "license-key",
  "hwid": "hardware-id"
}
```

## Security notes

- Passwords hashed with bcrypt (10 rounds)
- JWT-based session auth
- CORS locked down for production
- Secrets kept out of source via environment variables
- Licenses bound to hardware ID to limit sharing

## Notes

This was built as a learning project, with AI tools used to help design parts of the architecture and write portions of the code. All core logic was reviewed and tested manually.

## License

Proprietary - all rights reserved.
