# ShieldAuth Deployment Checklist

## ✅ Pre-Deployment Checklist

### Database Setup
- [ ] Run migration: `psql $DATABASE_URL -f backend/migrations/init.sql`
- [ ] Run migration: `psql $DATABASE_URL -f backend/migrations/advanced_features.sql`
- [ ] Run migration: `psql $DATABASE_URL -f backend/migrations/dynamic_content_system.sql`
- [ ] Run migration: `psql $DATABASE_URL -f backend/migrations/admin_system.sql`
- [ ] Update admin email in admin_system.sql line 302 before running
- [ ] Verify all tables created: `\dt` in psql

### Environment Variables - Backend (Railway)
```bash
DATABASE_URL=<your-supabase-connection-string>
JWT_SECRET=<generate-random-string>
ADMIN_EMAILS=<your@email.com>
REDIS_URL=<redis-connection-string> # Optional
FRONTEND_URL=https://your-frontend.vercel.app
NODE_ENV=production
```

### Environment Variables - Frontend (Vercel)
```bash
VITE_API_URL=https://your-backend.up.railway.app/api/v1
```

### Install Dependencies
```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
npm install
```

### Build Tests
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run build
```

## 🚀 Deployment Steps

### Backend Deployment (Railway)
1. Connect GitHub repository to Railway
2. Select `backend` as root directory
3. Add environment variables from checklist above
4. Deploy automatically on git push
5. Test endpoint: `https://your-backend.railway.app/health`

### Frontend Deployment (Vercel)
1. Connect GitHub repository to Vercel
2. Set root directory to `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add VITE_API_URL environment variable
6. Deploy automatically on git push
7. Test: Visit your frontend URL

## 🔒 Security Configuration

### Railway Settings
- [ ] Enable automatic deployments
- [ ] Configure health check: `/health`
- [ ] Set up custom domain (optional)
- [ ] Configure SSL (automatic)

### Vercel Settings
- [ ] Enable automatic deployments
- [ ] Configure preview deployments
- [ ] Set up custom domain (optional)
- [ ] Configure SSL (automatic)

## ✨ Post-Deployment Verification

### Backend Health Checks
```bash
# Health check
curl https://your-backend.railway.app/health

# Admin stats (requires auth)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://your-backend.railway.app/api/v1/admin/stats
```

### Frontend Access
- [ ] Landing page loads correctly
- [ ] Login works
- [ ] Dashboard accessible
- [ ] Admin panel accessible at `/admin`
- [ ] CMD+K command palette works
- [ ] No console errors
- [ ] All icons display correctly (no emojis)

### Database Verification
```sql
-- Check admin stats view
SELECT * FROM admin_stats;

-- Check your admin user
SELECT email, role, is_banned FROM users WHERE role = 'admin';

-- Check feature flags
SELECT * FROM feature_flags;

-- Check recent activity
SELECT * FROM recent_activity LIMIT 10;
```

## 🎨 Visual Verification

### Confirm Professional Appearance
- [ ] Deep blue (#1E3A8A) + Electric blue (#3B82F6) color scheme
- [ ] No emojis visible anywhere on site
- [ ] Lucide React icons displaying correctly
- [ ] Professional typography (system fonts)
- [ ] Clean spacing (8px grid)
- [ ] No particle effects or noise animations
- [ ] Smooth animations and transitions

### Test Pages
- [ ] Landing page - hero, features, pricing
- [ ] Features page - tabs, demos
- [ ] Pricing page - plans, calculator
- [ ] Documentation - code examples, SDKs
- [ ] Security page - encryption details
- [ ] Status page - service status
- [ ] Blog - posts list, single post
- [ ] Changelog - versions, changes
- [ ] Dashboard - stats, quick actions
- [ ] Applications - list, detail view
- [ ] Users - table, filters
- [ ] Licenses - management
- [ ] Admin Dashboard - stats, health
- [ ] Admin Users - ban, role changes
- [ ] Admin Blog - CRUD operations
- [ ] Admin Changelog - version management

## 🔧 Troubleshooting

### Common Issues

**Backend not starting:**
```bash
# Check logs
railway logs

# Verify environment variables
railway variables

# Test database connection
railway run psql $DATABASE_URL -c "SELECT 1"
```

**Frontend build fails:**
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check
```

**Admin panel not accessible:**
1. Check ADMIN_EMAILS environment variable is set
2. Verify your email matches exactly
3. Check JWT token is valid
4. Check browser console for errors

**Database migration errors:**
1. Check if tables already exist: `\dt` in psql
2. Drop conflicting tables if needed
3. Run migrations in order: init → advanced → dynamic → admin
4. Check PostgreSQL version compatibility

**Rate limiting issues:**
```javascript
// Temporarily increase limits in middleware/security.ts
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increase from 100
});
```

## 📊 Monitoring

### Key Metrics to Watch
- Response times (should be < 100ms)
- Error rates (should be < 1%)
- Database connection pool utilization
- API rate limit hits
- Failed login attempts

### Logging
- Backend logs in Railway dashboard
- Frontend errors in browser console
- Database logs in Supabase dashboard
- Winston logs in `logs/` directory (local dev)

## 🎯 Next Steps After Deployment

1. **Create first admin account:**
   - Sign up on frontend
   - Update user role in database manually
   - Or update admin_system.sql with your email before migration

2. **Configure feature flags:**
   ```sql
   UPDATE feature_flags SET enabled = true WHERE flag_name = 'email_notifications';
   ```

3. **Add test data:**
   - Create a test application
   - Generate test licenses
   - Create sample blog posts
   - Add changelog entries

4. **Security hardening:**
   - Review CORS settings
   - Check rate limits
   - Enable Redis caching
   - Set up monitoring alerts

5. **Content updates:**
   - Replace placeholder text
   - Add real testimonials (when available)
   - Update pricing based on your business model
   - Add your actual documentation

## 🚨 Emergency Rollback

If deployment fails:

```bash
# Railway - rollback to previous deployment
railway rollback

# Vercel - rollback from dashboard
# Or redeploy previous commit:
git revert HEAD
git push
```

## ✅ Final Verification

Your deployment is successful when:
- ✅ Health endpoint returns 200
- ✅ Login works and returns JWT
- ✅ Admin panel accessible
- ✅ No emojis visible on site
- ✅ Professional blue color scheme
- ✅ All icons are Lucide React components
- ✅ Command palette (CMD+K) works
- ✅ No console errors
- ✅ Database connections stable
- ✅ API responses < 100ms

---

**Congratulations! Your professional SaaS platform is now live! 🎉**

For support, check:
- QUICK_START_GUIDE.md
- IMPLEMENTATION_STATUS.md
- PROFESSIONAL_UPGRADE_PLAN.md
