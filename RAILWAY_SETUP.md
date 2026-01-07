# Railway Environment Variables Setup

## Required Environment Variables

Go to your Railway project → Variables tab and add:

### 1. DATABASE_URL
```
postgresql://postgres:[YOUR-PASSWORD]@db.pyectashpksowtxqdqcf.supabase.co:5432/postgres
```

**IMPORTANT:** Get this from Supabase:
1. Go to Supabase Dashboard → Project Settings → Database
2. Copy the "Connection string" (URI format)
3. Make sure it uses `postgres://` not `postgresql://`
4. Should look like: `postgres://postgres.pyectashpksowtxqdqcf:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres`

### 2. JWT_SECRET
```
your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random
```

### 3. FRONTEND_URL
```
https://shield-auth.vercel.app
```

### 4. NODE_ENV
```
production
```

## Troubleshooting IPv6 Issues

If you still get ENETUNREACH errors:

### Option 1: Use Supabase Transaction Pooler
Change your DATABASE_URL port from `5432` to `6543`:
```
postgres://postgres.pyectashpksowtxqdqcf:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

### Option 2: Use IPv4-only Supabase endpoint
Some Supabase regions have IPv4 endpoints. Check Supabase docs for your region.

### Option 3: Switch Database Provider
If Railway's IPv6 network continues having issues with Supabase:
- Use Railway's built-in PostgreSQL (supports IPv6 natively)
- Use Neon.tech (better Railway compatibility)
- Use PlanetScale (if MySQL is acceptable)

## Current Issue
Railway's IPv6-only network is unable to reach Supabase's IPv6 address. This is a network routing issue between Railway's infrastructure and Supabase's AWS infrastructure.

**Recommended Solution:** Use Railway PostgreSQL or Neon.tech instead of Supabase for Railway deployments.
