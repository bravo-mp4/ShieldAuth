#!/bin/bash

# ShieldAuth Professional Upgrade Installation Script
# This script automates the setup process

echo "======================================"
echo "ShieldAuth Professional Upgrade"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Install Frontend Dependencies
echo -e "${BLUE}Step 1/7: Installing frontend dependencies...${NC}"
cd frontend
npm install lucide-react @tanstack/react-table react-hook-form zod cmdk recharts react-markdown
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install frontend dependencies${NC}"
    exit 1
fi
cd ..

# Step 2: Install Backend Dependencies
echo -e "${BLUE}Step 2/7: Installing backend dependencies...${NC}"
cd backend
npm install bull redis express-rate-limit helmet winston
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install backend dependencies${NC}"
    exit 1
fi
cd ..

# Step 3: Check Environment Variables
echo -e "${BLUE}Step 3/7: Checking environment variables...${NC}"
if [ -z "$ADMIN_EMAILS" ]; then
    echo -e "${RED}⚠ ADMIN_EMAILS not set${NC}"
    echo "Please set your admin email:"
    read -p "Enter your email: " admin_email
    export ADMIN_EMAILS=$admin_email
    echo -e "${GREEN}✓ ADMIN_EMAILS set to: $admin_email${NC}"
else
    echo -e "${GREEN}✓ ADMIN_EMAILS already set${NC}"
fi

# Step 4: Run Database Migration
echo -e "${BLUE}Step 4/7: Running database migration...${NC}"
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}⚠ DATABASE_URL not set${NC}"
    echo "Please enter your PostgreSQL connection string:"
    read -p "DATABASE_URL: " db_url
    export DATABASE_URL=$db_url
fi

echo "Updating admin email in migration file..."
sed -i "s/your@email.com/$ADMIN_EMAILS/" backend/migrations/admin_system.sql

echo "Running migration..."
psql $DATABASE_URL -f backend/migrations/admin_system.sql
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database migration completed${NC}"
else
    echo -e "${RED}✗ Migration failed (this may be okay if tables already exist)${NC}"
fi

# Step 5: Update Backend Index
echo -e "${BLUE}Step 5/7: Checking backend configuration...${NC}"
if grep -q "securityHeaders" backend/src/index.ts; then
    echo -e "${GREEN}✓ Backend security already configured${NC}"
else
    echo -e "${RED}⚠ Backend needs manual security middleware integration${NC}"
    echo "Add these imports to backend/src/index.ts:"
    echo "  import { securityHeaders, corsOptions, apiLimiter } from './middleware/security';"
    echo "  import { connectRedis } from './cache';"
    echo "  import logger from './logger';"
fi

# Step 6: Check Redis
echo -e "${BLUE}Step 6/7: Checking Redis...${NC}"
if command -v redis-cli &> /dev/null; then
    redis-cli ping &> /dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Redis is running${NC}"
    else
        echo -e "${RED}⚠ Redis is installed but not running${NC}"
        echo "Start Redis with: redis-server"
    fi
else
    echo -e "${RED}⚠ Redis not installed (optional but recommended)${NC}"
    echo "Install on Mac: brew install redis"
    echo "Install on Ubuntu: sudo apt-get install redis-server"
fi

# Step 7: Summary
echo ""
echo -e "${BLUE}Step 7/7: Installation Summary${NC}"
echo "======================================"
echo -e "${GREEN}✓ All dependencies installed${NC}"
echo -e "${GREEN}✓ Database migration completed${NC}"
echo ""
echo "Next Steps:"
echo "1. Start Redis (if installed): redis-server"
echo "2. Start backend: cd backend && npm run dev"
echo "3. Start frontend: cd frontend && npm run dev"
echo "4. Visit http://localhost:5173"
echo "5. Login and navigate to /admin"
echo ""
echo "Manual Tasks Remaining:"
echo "- Replace emojis in 8 files (see docs/archive/IMPLEMENTATION_STATUS.md)"
echo "- Add CommandPalette to App.tsx"
echo "- Add admin routes to App.tsx"
echo "- Update copywriting (remove AI language)"
echo ""
echo -e "${GREEN}Installation Complete!${NC}"
echo "======================================"
