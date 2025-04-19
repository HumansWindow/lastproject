#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== API URL Configuration Fix Script ===${NC}"
echo -e "${YELLOW}This script will ensure the API URL is consistently set to http://localhost:3001${NC}"

# Check if the frontend is running and kill it if necessary
if pgrep -f "node.*frontend" > /dev/null; then
  echo -e "${YELLOW}Stopping frontend server...${NC}"
  pkill -f "node.*frontend"
  sleep 2
fi

# Path to the localStorage file in developer tools (if it exists)
LOCAL_STORAGE_PATH="$HOME/.config/google-chrome/Default/Local Storage/leveldb/"

# Clear any cached API URLs in browser localStorage
if [ -d "$LOCAL_STORAGE_PATH" ]; then
  echo -e "${YELLOW}Note: You may need to clear your browser's localStorage manually:${NC}"
  echo -e "1. Open browser developer tools (F12)"
  echo -e "2. Go to Application tab > Storage > Local Storage"
  echo -e "3. Delete any 'wallet_auth_working_url' entries"
  echo -e "4. Refresh the page"
fi

# Create a .env.local file in the frontend directory to ensure API URL is set
FRONTEND_ENV_PATH="./frontend/.env.local"
echo -e "${YELLOW}Creating ${FRONTEND_ENV_PATH} with correct API URL...${NC}"

cat > "$FRONTEND_ENV_PATH" << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
# Ensure other environment variables are preserved
EOF

echo -e "${GREEN}✓ Created ${FRONTEND_ENV_PATH} with API URL set to http://localhost:3001${NC}"

# Create a simple script to clear localStorage via JavaScript
JS_CLEAR_SCRIPT="./frontend/clear-local-storage.js"
echo -e "${YELLOW}Creating script to clear localStorage when frontend starts...${NC}"

cat > "$JS_CLEAR_SCRIPT" << 'EOF'
// This script will run during development to ensure localStorage is cleared
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔧 Clearing wallet auth cached URLs from localStorage');
  try {
    localStorage.removeItem('wallet_auth_working_url');
    console.log('✅ localStorage wallet_auth_working_url cleared');
  } catch (err) {
    console.error('❌ Error clearing localStorage:', err);
  }
}
EOF

echo -e "${GREEN}✓ Created localStorage clearing script${NC}"

# Add the script to pages/_app.js or _app.tsx if it exists
APP_FILE=""
if [ -f "./frontend/src/pages/_app.tsx" ]; then
  APP_FILE="./frontend/src/pages/_app.tsx"
elif [ -f "./frontend/src/pages/_app.jsx" ]; then
  APP_FILE="./frontend/src/pages/_app.jsx"
elif [ -f "./frontend/src/pages/_app.js" ]; then
  APP_FILE="./frontend/src/pages/_app.js"
elif [ -f "./frontend/src/app/layout.tsx" ]; then
  APP_FILE="./frontend/src/app/layout.tsx"
elif [ -f "./frontend/src/app/layout.jsx" ]; then
  APP_FILE="./frontend/src/app/layout.jsx"
elif [ -f "./frontend/src/app/layout.js" ]; then
  APP_FILE="./frontend/src/app/layout.js"
fi

if [ -n "$APP_FILE" ]; then
  echo -e "${YELLOW}Adding localStorage clearing script import to ${APP_FILE}...${NC}"
  
  # Check if the import is already there
  if ! grep -q "clear-local-storage" "$APP_FILE"; then
    # Add the import at the top of the file
    sed -i '1i\
import "../clear-local-storage.js";' "$APP_FILE"
    
    echo -e "${GREEN}✓ Added script import to ${APP_FILE}${NC}"
  else
    echo -e "${YELLOW}Import already exists in ${APP_FILE}${NC}"
  fi
else
  echo -e "${YELLOW}Could not find app entry point file. Please manually import the clearing script.${NC}"
fi

# Create a script to ensure backend is properly running on port 3001
BACKEND_CHECK_SCRIPT="./check-backend-port.sh"
echo -e "${YELLOW}Creating backend port check script...${NC}"

cat > "$BACKEND_CHECK_SCRIPT" << 'EOF'
#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if backend is running
if ! nc -z localhost 3001 &>/dev/null; then
  echo -e "${RED}Backend is not running on port 3001${NC}"
  echo -e "${YELLOW}Starting backend server...${NC}"
  
  # Start backend server
  cd backend && npm run start:dev &
  
  # Wait for backend to start
  echo -e "${YELLOW}Waiting for backend to start...${NC}"
  for i in {1..30}; do
    if nc -z localhost 3001 &>/dev/null; then
      echo -e "${GREEN}Backend is now running on port 3001${NC}"
      break
    fi
    sleep 1
  done
  
  if ! nc -z localhost 3001 &>/dev/null; then
    echo -e "${RED}Failed to start backend on port 3001${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}Backend is already running on port 3001${NC}"
fi

echo -e "${BLUE}Use the following command to start the frontend:${NC}"
echo -e "${GREEN}cd frontend && npm run dev${NC}"
EOF

chmod +x "$BACKEND_CHECK_SCRIPT"
echo -e "${GREEN}✓ Created backend port check script${NC}"

# Make this script executable
chmod +x "$0"

echo -e "${GREEN}✓ API URL configuration fix completed!${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Clear browser localStorage for your frontend domain"
echo -e "2. Run: ${GREEN}./check-backend-port.sh${NC} to ensure backend is on port 3001"
echo -e "3. Restart the frontend: ${GREEN}cd frontend && npm run dev${NC}"
echo -e "4. Test the wallet authentication in your application again"

