#!/bin/bash

echo "Fixing TypeScript compilation errors..."

# Create proper types declaration
mkdir -p src/@types
cat > src/@types/express.d.ts << 'EOF'
declare namespace Express {
  interface User {
    id?: string;
    email?: string;
    role?: string;
    name?: string;
    // Add other properties as needed
  }
}
EOF

echo "✅ Created Express type definitions"
echo "Now try building again with: npm run build"
