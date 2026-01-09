# ShieldVM Testing Plan

## Overview
This comprehensive testing plan will help you validate all functionality and identify areas for improvement.

---

## 1. Authentication Testing

### Login Flow
- [ ] Navigate to landing page at https://shield-auth.vercel.app
- [ ] Click "Login" or "Get Started"
- [ ] **Test Valid Login**
  - Email: `admin@shieldlabs.com`
  - Password: `admin123`
  - Expected: Successfully redirected to `/dashboard`
  - Expected: No errors displayed
  
- [ ] **Test Invalid Login**
  - Try wrong password
  - Expected: "Invalid credentials" error message
  - Try non-existent email
  - Expected: "Invalid credentials" error message

### Registration Flow
- [ ] Click "Sign Up" from landing page
- [ ] **Test New User Registration**
  - Enter new email
  - Enter password (min 8 characters)
  - Enter name
  - Expected: Account created successfully
  - Expected: Redirected to dashboard or login

- [ ] **Test Duplicate Registration**
  - Try registering with `admin@shieldlabs.com` again
  - Expected: Error message about existing user

### Session Persistence
- [ ] Log in successfully
- [ ] Refresh the page
  - Expected: Still logged in, dashboard loads
- [ ] Open new tab, navigate to dashboard
  - Expected: Already authenticated
- [ ] Click logout
  - Expected: Redirected to landing page
  - Expected: Can view landing page without being redirected

---

## 2. Dashboard Testing

### Layout & Navigation
- [ ] Left sidebar displays properly
- [ ] All navigation items visible:
  - Dashboard
  - Users
  - Applications
  - Analytics
  - Logs
  - API Keys
  - Webhooks
  - Settings
  - Support

- [ ] Click each navigation item
  - Expected: Page loads without errors
  - Expected: Active tab highlighted in sidebar

### Dashboard Page (`/dashboard`)
- [ ] Check metrics display:
  - [ ] Total users count (should be real number from database)
  - [ ] Active users count (licenses not expired)
  - [ ] API Configuration section

- [ ] **Refresh Button**
  - Click "Refresh"
  - Expected: Data reloads

- [ ] **Add User Form**
  - Click "Add User"
  - Fill in username
  - Fill in HWID (any string)
  - Set expiration date (optional)
  - Click "Create User"
  - Expected: User created successfully
  - Expected: User appears in table below

- [ ] **Check HWID Validator**
  - Click "Check HWID"
  - Enter an HWID from the user table
  - Click "Validate"
  - Expected: Shows valid/invalid result
  - Expected: Displays user info if valid

- [ ] **Delete User**
  - Click "Delete" on any user
  - Confirm deletion
  - Expected: User removed from list
  - Expected: Page refreshes to show updated data

---

## 3. Users Page Testing (`/users`)

### Page Load
- [ ] Navigate to Users page
- [ ] Expected: No blank screen or loading forever
- [ ] Expected: User table displays with real data
- [ ] Expected: Stats cards show correct counts:
  - Total Users
  - Active (not expired)
  - Expired

### User Management
- [ ] **Search Functionality**
  - Type in search box
  - Expected: Table filters in real-time
  
- [ ] **User Table Columns**
  - [ ] ID displays
  - [ ] Username displays
  - [ ] HWID Hash displays (first 16 chars)
  - [ ] Created date displays
  - [ ] Expires date displays
  - [ ] Status badge (active/expired) displays correctly

- [ ] **Delete User**
  - Click delete button
  - Confirm
  - Expected: User deleted
  - Expected: Table updates

---

## 4. Applications Page Testing (`/applications`)

### Page Load
- [ ] Navigate to Applications page
- [ ] Expected: Loads without "Failed to load applications" error
- [ ] Expected: Shows list of applications (may be empty)

### Application Management
- [ ] **Create Application**
  - Click "Create Application"
  - Fill in application name
  - Fill in version
  - Click create
  - Expected: Application created
  - Expected: Appears in list

- [ ] **Application Stats**
  - Check that user counts are accurate
  - Check validation counts display

---

## 5. Analytics Page Testing (`/analytics`)

### Real Data Verification
- [ ] Navigate to Analytics page
- [ ] **Check Summary Cards**
  - [ ] Total Validations (should be real count from sessions table)
  - [ ] Success Rate (should show 100% if no failures)
  - [ ] Failed Attempts (should show 0 if none tracked)
  - [ ] Unique HWIDs (should match hwid_slots count)

- [ ] **Validation Chart**
  - [ ] Shows last 7 days of data
  - [ ] Bars represent actual sessions created
  - [ ] Dates are accurate

- [ ] **License Status Section**
  - [ ] Active Licenses count matches database
  - [ ] Total Licenses count correct
  - [ ] Unique Devices count correct

- [ ] **System Status Section**
  - [ ] API Status shows "Operational"
  - [ ] Database shows "Connected"
  - [ ] Validations Today shows real count

- [ ] **Verify NO fake data**
  - [ ] No "Top Countries" section with flags
  - [ ] No "Top Applications" section with fake apps
  - [ ] No "Recent Failed Validations" table

---

## 6. Logs Page Testing (`/logs`)

### Page Load & Data
- [ ] Navigate to Logs page
- [ ] Expected: NO "Failed to load logs" error
- [ ] Expected: Shows list of authentication events from sessions table
- [ ] Expected: Each log entry shows:
  - Timestamp
  - Type (auth)
  - Message
  - Username (license key)

### Log Filtering
- [ ] Try filter dropdown (if available)
- [ ] Expected: Filters work correctly

### Export
- [ ] Click "Export Logs" button
- [ ] Expected: Triggers export (or shows "not implemented" gracefully)

---

## 7. API Keys Page Testing (`/api-keys`)

- [ ] Navigate to API Keys page
- [ ] Expected: Page loads
- [ ] Test key generation functionality
- [ ] Test key revocation

---

## 8. Webhooks Page Testing (`/webhooks`)

- [ ] Navigate to Webhooks page
- [ ] Expected: Page loads without errors
- [ ] Test webhook creation
- [ ] Test webhook testing/validation

---

## 9. Settings Page Testing (`/settings`)

- [ ] Navigate to Settings page
- [ ] Expected: Page loads
- [ ] Check profile settings
- [ ] Check password change functionality
- [ ] Check email change functionality

---

## 10. API Validation Testing

### Direct API Calls (Optional - for technical validation)

Using Postman, curl, or browser console:

#### Login Endpoint
```bash
curl -X POST https://shieldauth-production.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@shieldlabs.com","password":"admin123"}'
```
- [ ] Expected: Returns JWT token and user object

#### Get Users (Protected)
```bash
curl https://shieldauth-production.up.railway.app/api/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
- [ ] Expected: Returns array of users from database

#### Get Analytics
```bash
curl https://shieldauth-production.up.railway.app/api/v1/admin/analytics \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
- [ ] Expected: Returns analytics object with real counts

#### Get Logs
```bash
curl https://shieldauth-production.up.railway.app/api/v1/admin/logs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
- [ ] Expected: Returns array of log entries from sessions table

---

## 11. Error Handling Testing

### Network Errors
- [ ] Disconnect internet
- [ ] Try to load a page
- [ ] Expected: Graceful error message (not blank screen)

### Token Expiration
- [ ] Log in
- [ ] Wait 24 hours (or manually delete token from localStorage)
- [ ] Try to access protected page
- [ ] Expected: Redirected to login page

### Server Errors
- [ ] If backend goes down, frontend should show appropriate errors
- [ ] No infinite loading states

---

## 12. Responsive Design Testing

### Desktop (1920x1080)
- [ ] Left sidebar displays properly
- [ ] All content readable
- [ ] Tables fit properly

### Laptop (1366x768)
- [ ] Layout adapts
- [ ] Sidebar still functional

### Tablet (768px)
- [ ] Mobile menu appears (hamburger icon)
- [ ] Navigation works

### Mobile (375px)
- [ ] Mobile menu functional
- [ ] Tables scroll horizontally
- [ ] All features accessible

---

## 13. Performance Testing

- [ ] Dashboard loads in < 2 seconds
- [ ] Users page with 100+ users loads smoothly
- [ ] Analytics page renders charts quickly
- [ ] No memory leaks after navigating multiple times

---

## 14. Security Testing

### XSS Prevention
- [ ] Try entering `<script>alert('xss')</script>` in username field
- [ ] Expected: Sanitized/escaped, no script execution

### SQL Injection Prevention
- [ ] Try entering `' OR '1'='1` in search fields
- [ ] Expected: Treated as literal string, no injection

### Authorization
- [ ] Remove token from localStorage
- [ ] Try accessing `/dashboard` directly
- [ ] Expected: Redirected to login

---

## 15. Browser Compatibility Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

Expected: All features work consistently across browsers

---

## Bugs to Report

Use this template when reporting issues:

```
### Bug Title

**Page/Feature:** [e.g., Users page, Analytics, etc.]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**


**Actual Behavior:**


**Screenshot/Error Message:**


**Browser:** [Chrome/Firefox/etc.]

**Priority:** [High/Medium/Low]
```

---

## Improvement Suggestions

After testing, note down:
- UI/UX improvements
- Missing features you'd like
- Performance issues
- Confusing workflows
- Design tweaks

---

## Testing Checklist Summary

### Critical (Must Pass)
- [ ] Login works with correct credentials
- [ ] All pages load without errors
- [ ] No fake data displayed anywhere
- [ ] Users page shows real database users
- [ ] Analytics shows real validation counts
- [ ] Logs show real session data

### Important (Should Pass)
- [ ] User creation/deletion works
- [ ] Search and filters function
- [ ] Navigation smooth
- [ ] Responsive on mobile

### Nice to Have (Can Improve)
- [ ] Loading states are smooth
- [ ] Error messages are helpful
- [ ] UI is polished
- [ ] Performance is snappy

---

## Notes for Tester

- **Database is empty initially**: When you first test, there might be no users, no validations, no logs. This is normal! Create some test data first.

- **Test data creation**: Before testing analytics and logs, create a few users on the Dashboard to populate the database.

- **Authentication required**: Make sure you're logged in when testing protected pages.

- **Real-time updates**: Some pages may need manual refresh to see new data (click Refresh button).

---

## Post-Testing Actions

After completing all tests, provide feedback on:

1. **What's working well?**
2. **What's broken or not working?**
3. **What's confusing or unclear?**
4. **What features are missing that you need?**
5. **What would make the dashboard more useful?**

This will help prioritize improvements and fixes for the next iteration.
