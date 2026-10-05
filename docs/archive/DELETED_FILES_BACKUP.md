# BACKUP - Files Being Deleted (Just in Case)

## If you need to restore any file, these are the ones being removed:

1. **frontend/src/pages/Status.jsx** (234 lines)
   - Old static status page
   - Replaced by: Status.tsx (dynamic)

2. **frontend/src/pages/Blog.jsx** (202 lines)
   - Old static blog
   - Replaced by: Blog.tsx (dynamic from API)

3. **frontend/src/pages/Changelog.jsx** (175 lines estimated)
   - Old static changelog
   - Replaced by: Changelog.tsx (dynamic from API)

4. **frontend/src/pages/Settings.jsx** (estimated 200+ lines)
   - Old settings page
   - Replaced by: Settings.tsx (imported as SettingsPage)

5. **frontend/src/pages/APIKeys_NEW.jsx** (estimated 150+ lines)
   - Experimental/backup file
   - Using: APIKeys.jsx (original version)

6. **frontend/src/pages/Dashboard.tsx** (estimated 300+ lines)
   - Old dashboard
   - Replaced by: NewDashboard.tsx (imported as Dashboard)

7. **frontend/src/pages/Docs.tsx** (estimated 100+ lines)
   - Unused duplicate
   - Using: Documentation.jsx instead

---

## Git Recovery Commands (if needed):

```bash
# To see what was deleted
git log --diff-filter=D --summary

# To restore a specific file
git checkout <commit-hash>^ -- frontend/src/pages/Status.jsx

# To undo the entire deletion commit
git revert <commit-hash>
```

---

## Why This is Safe:

✅ None of these files are imported in App.tsx
✅ Grep search confirmed no references in codebase  
✅ All functionality exists in the kept versions
✅ Your active .tsx versions have API integration (better than old .jsx)

**You have newer, better versions of everything!**
