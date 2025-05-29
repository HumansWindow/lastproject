# Project Rebuild Guide - Clean & Standardized Architecture

## Project Structure Overview

We'll rebuild the project with the following improved structure:

```
NewProject/
├── package.json             # Root package.json for workspace management
├── yarn.lock                # Centralized yarn lockfile
├── .yarnrc.yml              # Yarn configuration
├── tsconfig.json            # Base TypeScript configuration
├── .eslintrc.js             # Base ESLint configuration
├── jest.config.js           # Base Jest configuration
├── .prettierrc              # Prettier configuration
├── .gitignore               # Git ignore file
│
├── packages/                # Monorepo packages directory
│   ├── backend/             # NestJS backend
│   ├── frontend/            # Next.js frontend
│   ├── admin/               # Admin dashboard (Next.js)
│   ├── mobile/              # Mobile application
│   └── shared/              # Shared code, types, and utilities
│
├── docker/                  # Docker configuration
│   ├── docker-compose.yml   # Main docker-compose file
│   ├── .env.example         # Example environment variables
│   └── services/            # Individual service configurations
│       ├── backend/
│       ├── frontend/
│       ├── database/
│       └── redis/
│
├── docs/                    # Documentation
│   ├── architecture/        # Architecture documentation
│   ├── api/                 # API documentation
│   └── guides/              # Development guides
│
└── scripts/                 # Utility scripts for the project
    ├── setup.sh             # Project setup script
    ├── build.sh             # Build script
    └── deploy.sh            # Deployment script
```

## Centralized Package Management with Yarn Workspaces

We'll use Yarn Workspaces for centralized dependency management:

```json
{
  "name": "new-project",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "yarn workspaces foreach -pt run dev",
    "build": "yarn workspaces foreach -pt run build",
    "lint": "yarn workspaces foreach -pt run lint",
    "test": "yarn workspaces foreach -pt run test",
    "clean": "yarn workspaces foreach -pt run clean"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "eslint": "^8.54.0",
    "prettier": "^3.1.0",
    "jest": "^29.7.0"
  }
}
```

## Backend Package Structure (NestJS)

```
packages/backend/
├── package.json           # Backend package.json
├── tsconfig.json          # Backend-specific TypeScript config
├── nest-cli.json          # NestJS CLI configuration
├── .env.example           # Example environment variables
│
├── src/
│   ├── app.module.ts      # Root application module
│   ├── main.ts            # Application entry point
│   │
│   ├── config/            # Configuration modules
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── app.config.ts
│   │
│   ├── modules/           # Feature modules
│   │   ├── auth/          # Authentication module
│   │   ├── users/         # User management module
│   │   ├── blockchain/    # Blockchain integration module
│   │   ├── wallet/        # Wallet module
│   │   ├── diary/         # Diary module
│   │   ├── game/          # Game module
│   │   ├── nft/           # NFT module
│   │   ├── tokens/        # Token module
│   │   └── profile/       # Profile module
│   │
│   ├── shared/            # Shared utilities and services
│   │   ├── guards/        # Auth guards
│   │   ├── decorators/    # Custom decorators
│   │   ├── filters/       # Exception filters
│   │   ├── interceptors/  # Interceptors
│   │   ├── pipes/         # Validation pipes
│   │   └── utils/         # Utility functions
│   │
│   └── database/          # Database configuration and migrations
│       ├── migrations/    # TypeORM migrations
│       ├── entities/      # Shared entities (if any)
│       └── seeds/         # Database seeders
│
└── test/                  # Test files
    ├── e2e/               # End-to-end tests
    └── unit/              # Unit tests
```

## Frontend Package Structure (Next.js)

```
packages/frontend/
├── package.json         # Frontend package.json
├── tsconfig.json        # Frontend-specific TypeScript config
├── next.config.js       # Next.js configuration
├── .env.example         # Example environment variables
│
├── public/              # Public assets
│   ├── assets/          # General assets
│   │   └── wallets/     # Wallet-specific assets
│   ├── locales/         # i18n translation files
│   └── favicon.ico      # Favicon
│
├── src/
│   ├── pages/           # Next.js pages
│   │   ├── _app.tsx     # App component
│   │   ├── _document.tsx # Document component
│   │   ├── index.tsx    # Homepage
│   │   ├── auth/        # Auth pages
│   │   ├── diary/       # Diary pages
│   │   └── profile/     # Profile pages
│   │
│   ├── components/      # React components
│   │   ├── common/      # Common UI components
│   │   ├── layout/      # Layout components
│   │   ├── wallet/      # Wallet-related components
│   │   ├── diary/       # Diary-related components
│   │   └── game/        # Game-related components
│   │
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useWallet.ts
│   │   └── useWebSocket.ts
│   │
│   ├── services/        # API service modules
│   │   ├── api/         # Base API utilities
│   │   ├── auth/        # Auth services
│   │   ├── wallet/      # Wallet services
│   │   └── diary/       # Diary services
│   │
│   ├── contexts/        # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── WalletContext.tsx
│   │   └── WebSocketContext.tsx
│   │
│   ├── styles/          # Styling
│   │   ├── globals.css  # Global styles
│   │   └── theme/       # Theme configuration
│   │
│   ├── utils/           # Utility functions
│   │   ├── formatting.ts
│   │   ├── validation.ts
│   │   └── encryption.ts
│   │
│   └── types/           # TypeScript type definitions
│       ├── api.types.ts
│       ├── auth.types.ts
│       └── wallet.types.ts
│
└── test/                # Test files
    └── components/      # Component tests
```

## Shared Package Structure

```
packages/shared/
├── package.json          # Shared package.json
├── tsconfig.json         # Shared TypeScript config
│
├── src/
│   ├── types/            # Shared TypeScript types
│   │   ├── auth.types.ts
│   │   ├── user.types.ts
│   │   └── api.types.ts
│   │
│   ├── utils/            # Shared utilities
│   │   ├── formatting.ts
│   │   ├── validation.ts
│   │   └── encryption.ts
│   │
│   ├── constants/        # Shared constants
│   │   ├── api.constants.ts
│   │   └── error-codes.ts
│   │
│   └── config/           # Shared configuration
│       └── common.config.ts
│
└── test/                 # Test files
```

## Admin Package Structure

```
packages/admin/
├── package.json         # Admin package.json
├── tsconfig.json        # Admin-specific TypeScript config
├── next.config.js       # Next.js configuration
│
├── src/                 # Similar structure to frontend
│   ├── pages/
│   ├── components/
│   ├── services/
│   └── ...
│
└── public/              # Admin public assets
```

## Docker Configuration

```yaml
# docker/docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password}
      POSTGRES_DB: ${POSTGRES_DB:-appdb}
    ports:
      - "5432:5432"
    networks:
      - app-network

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - app-network

  backend:
    build:
      context: ../packages/backend
      dockerfile: ../../docker/services/backend/Dockerfile
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-password}@postgres:5432/${POSTGRES_DB:-appdb}
      REDIS_URL: redis://redis:6379
    ports:
      - "3001:3001"
    networks:
      - app-network

  frontend:
    build:
      context: ../packages/frontend
      dockerfile: ../../docker/services/frontend/Dockerfile
    depends_on:
      - backend
    ports:
      - "3000:3000"
    networks:
      - app-network

  admin:
    build:
      context: ../packages/admin
      dockerfile: ../../docker/services/admin/Dockerfile
    depends_on:
      - backend
    ports:
      - "3002:3000"
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

## Implementation Plan

1. **Initial Setup**
   - Create root package.json with workspaces
   - Set up yarn workspace configuration
   - Configure base TypeScript, ESLint, and Prettier

2. **Backend Implementation**
   - Create NestJS backend with modular structure
   - Implement core modules (auth, users, etc.)
   - Set up database connection and migrations
   - Configure API endpoints

3. **Frontend Implementation**
   - Set up Next.js with TypeScript
   - Create core components and pages
   - Implement service layer for API communication
   - Set up contexts for state management

4. **Shared Package**
   - Define shared types and utilities
   - Create common configuration

5. **Admin Dashboard**
   - Set up separate Next.js app for admin
   - Create admin-specific pages and components

6. **Docker Configuration**
   - Create Dockerfiles for each service
   - Configure docker-compose for local development
   - Set up production-ready Docker configuration

7. **Documentation and Testing**
   - Set up testing for all packages
   - Create comprehensive documentation

This structure follows industry best practices and addresses the issues found in the current project by:
- Using a monorepo structure with Yarn Workspaces for clean dependency management
- Properly separating concerns between packages
- Following a consistent architectural pattern
- Providing clear boundaries between modules
- Enabling code sharing through a dedicated shared package
- Supporting efficient Docker-based development and deployment