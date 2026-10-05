# ShieldAuth

A comprehensive authentication and license management platform combining secure authentication with hardware ID validation.

## Features

- 🔐 **User Authentication** - Secure registration and login with JWT tokens
- 🛡️ **License Management** - Create and manage software licenses
- 💻 **Hardware ID Binding** - Bind licenses to specific hardware
- 📊 **Analytics Dashboard** - Track usage and monitor licenses
- 🔑 **API Key Management** - Generate and manage API keys
- 📝 **Audit Logs** - Complete activity tracking

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Supabase)
- **Hosting**: Vercel (Frontend) + Railway (Backend)

## Project Structure

```text
ShieldAuth/
├── backend/         # Express + TypeScript API
├── frontend/        # React + TypeScript app (Vite)
├── sdk/             # Client SDKs (C++, C#, Python)
├── docs/
│   ├── guides/      # Setup and deployment guides
│   ├── reference/   # Architecture and API references
│   └── archive/     # Historical planning/progress docs
└── README.md
```

See `/home/runner/work/ShieldAuth/ShieldAuth/docs/README.md` for documentation navigation.

## Environment Variables

### Backend (.env)

```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-secret-key
FRONTEND_URL=https://your-frontend-url.vercel.app
PORT=3000
```

### Frontend (.env)

```env
VITE_API_URL=https://your-backend-url.up.railway.app/api/v1
```

## Database Setup

1. Run migrations on Supabase:

```bash
psql $DATABASE_URL < backend/migrations/init.sql
psql $DATABASE_URL < backend/migrations/seed.sql
```

2. The seed script creates an admin user:
   - Email: `admin@shieldlabs.com`
   - Password: `admin123`

## Local Development

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Deployment

### Vercel (Frontend)

- Connected to GitHub
- Auto-deploys on push to main
- Environment variable: `VITE_API_URL`

### Railway (Backend)

- Connected to GitHub
- Auto-deploys on push to main
- Environment variables: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `PORT`

## API Documentation

### Authentication

**POST** `/api/v1/auth/register`

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**POST** `/api/v1/auth/login`

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### License Validation

**POST** `/api/v1/validate`

```json
{
  "app_id": "your-app-id",
  "app_secret": "your-app-secret",
  "license_key": "license-key",
  "hwid": "hardware-id"
}
```

## Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens for authentication
- CORS configured for production
- Environment variables for sensitive data
- Hardware ID validation for license binding

## License

Proprietary - All rights reserved
