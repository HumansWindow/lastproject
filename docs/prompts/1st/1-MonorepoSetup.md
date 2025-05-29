# Monorepo Setup Prompts

## Initial Root Setup

```prompt
Create a Yarn Workspaces monorepo setup for a full-stack application with the following packages:
- backend (NestJS)
- frontend (Next.js)
- admin (Next.js)
- shared (common code)
- mobile (React Native)

Include:
1. Root package.json with workspaces configuration and common dev dependencies
2. Base TypeScript configuration (tsconfig.json) with proper path aliases
3. ESLint and Prettier configuration
4. Git configuration (.gitignore, etc.)
5. Base Jest testing setup
6. Yarn configuration for efficient dependency management
```

## Shared Package Setup

```prompt
Create a shared package within a Yarn workspace monorepo that will contain common code between a NestJS backend, Next.js frontend, and admin dashboard. The package should include:

1. TypeScript configuration with proper exports
2. Structure for shared:
   - Types/interfaces for users, authentication, API responses
   - Utility functions (formatting, validation, encryption)
   - Constants (API paths, error codes)
   - Base configuration options

3. Package.json with minimal dependencies
4. Testing setup for shared utilities
5. Proper export structure for both ESM and CommonJS to support both frontend and backend
```

## Docker Development Environment

```prompt
Create Docker configuration files for a monorepo project with:
1. Main docker-compose.yml with services for:
   - PostgreSQL database
   - Redis cache
   - NestJS backend (with hot reloading)
   - Next.js frontend (with hot reloading)
   - Next.js admin dashboard (with hot reloading)

2. Dockerfile for the backend service with:
   - Node 20 Alpine base image
   - Proper caching of dependencies
   - Development mode with hot reloading
   - Production build option

3. Dockerfile for the frontend services with:
   - Node 20 Alpine base image
   - Proper caching of dependencies
   - Development mode with hot reloading
   - Production build option

4. Environment configuration and example files
5. Docker networking setup for service communication
6. Volume configurations for persistent data
```

## Development Scripts

```prompt
Create development utility scripts for a Yarn workspace monorepo project:

1. A setup.sh script that:
   - Installs dependencies
   - Sets up environmental files
   - Initializes git hooks
   - Configures local development environment

2. A build.sh script that:
   - Builds all packages in the correct order
   - Performs type checking and linting
   - Creates optimized production builds

3. A test.sh script for running:
   - Unit tests
   - Integration tests
   - End-to-end tests
   - Code coverage reporting

4. A deploy.sh script for:
   - Building production assets
   - Running pre-deployment checks
   - Handling deployment to specified environments

All scripts should be compatible with both Linux and macOS environments.
```