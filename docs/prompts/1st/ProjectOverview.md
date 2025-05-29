# Project Overview

## Project Structure

This project is a comprehensive full-stack application with the following main components:

```
LastProject/
├── admin/              # Admin dashboard application (Next.js)
├── backend/            # NestJS backend API server
├── frontend/           # Next.js frontend application
├── backup/             # Backup files and snapshots
├── components/         # Shared components library
├── config/             # Configuration files
├── docker/             # Docker configuration files
├── docs/               # Documentation
│   └── prompts/        # Documentation prompts and file structure descriptions
├── logs/               # Application logs
├── mobile/             # Mobile application
├── public/             # Public static assets
├── scripts/            # Utility scripts
└── shared/             # Shared code and utilities
```

## Technology Stack

### Backend (NestJS)
- **Framework**: NestJS
- **Database**: PostgreSQL
- **Authentication**: JWT, Wallet-based auth
- **Main Modules**:
  - Authentication & Authorization
  - User Management
  - Blockchain Integration
  - Game System
  - Profile Management
  - Diary System
  - Referral System
  - NFT & Token Management
  - WebSocket Real-time Communication

### Frontend (Next.js)
- **Framework**: Next.js with React
- **Styling**: CSS Modules, Tailwind CSS
- **State Management**: React Context API
- **Key Features**:
  - Wallet Integration (Ethereum, Solana, TON)
  - Internationalization (i18n)
  - Real-time Updates via WebSockets
  - Game UI Components
  - Diary Management Interface
  - Authentication UI
  - Profile Management

### Admin Dashboard
- Separate Next.js application for administration
- User management
- Content management
- System monitoring

### Mobile Application
- Mobile client for the platform

## Core Features

1. **Blockchain Integration**
   - Multi-wallet support (MetaMask, Phantom, WalletConnect, etc.)
   - Token management
   - NFT handling
   - Staking functionality
   - Hot wallet management

2. **Game System**
   - Modular game structure
   - Content management
   - User progress tracking
   - Achievements and rewards
   - Interactive UI components
   - Quiz system

3. **User Management**
   - Authentication (traditional and wallet-based)
   - Profile management
   - Session management
   - Device tracking
   - Role-based access control

4. **Diary System**
   - Content creation and editing
   - Media integration
   - Rich text editing

5. **Real-time Features**
   - WebSocket communication
   - Real-time notifications
   - Balance monitoring
   - Transfer monitoring

## Database Structure

The application uses PostgreSQL with a comprehensive schema including tables for:
- Users and authentication
- Wallet connections
- Game content and progress
- NFT and token transactions
- Diary entries
- Profiles
- Referrals

## Development Tools

- TypeScript for type safety
- ESLint for code quality
- Jest for testing
- Docker for containerization
- Migration system for database changes

## Architecture Highlights

- Modular design with clear separation of concerns
- Comprehensive authentication system with both traditional and web3 options
- Real-time capabilities through WebSockets
- Robust error handling and monitoring
- Internationalization support
- Responsive UI design

This project represents a modern full-stack application with emphasis on blockchain integration, gaming features, and real-time user interaction.