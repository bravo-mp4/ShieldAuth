# ShieldVM Setup Guide

## Quick Start

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Start Backend Server

```bash
npm run dev
```

Backend will run on `http://localhost:3000`

### 3. Start Frontend (in new terminal)

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

## Login Credentials

**Email:** `admin@shieldlabs.com`  
**Password:** `admin123`

## API Endpoints Added

### Authentication

- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/register` - Register new user (not implemented)
- `POST /api/v1/auth/logout` - Logout (requires token)

### Protected Endpoints (require Authorization header)

- `GET /api/v1/applications` - List all applications
- `POST /api/v1/applications` - Create new application
- `GET /api/v1/users` - List all users/licenses
- `DELETE /api/v1/users/:id` - Delete user
- `GET /api/v1/logs` - Get activity logs

## How Authentication Works

1. User submits login form
2. Frontend calls `POST /api/v1/auth/login` with email/password
3. Backend validates credentials and returns JWT token
4. Frontend stores token in localStorage
5. All subsequent API calls include token in Authorization header:
   ```
   Authorization: Bearer <token>
   ```
6. Backend middleware verifies token before allowing access

## Troubleshooting

### "Login failed" error

- Make sure backend is running on port 3000
- Check browser console for detailed error
- Verify credentials: `admin@shieldlabs.com` / `admin123`

### CORS errors

- Backend has CORS enabled for all origins
- Make sure frontend is making requests to `http://localhost:3000/api/v1`

### Database connection issues

- Ensure PostgreSQL is running
- Check .env file has correct DATABASE_URL
- Run migrations: `psql -U postgres -d shieldvm -f migrations/init.sql`

## Next Steps

1. Run `npm install` in backend to install jsonwebtoken
2. Start both servers
3. Visit `http://localhost:5173`
4. Login with demo credentials
5. Explore the dashboard!
