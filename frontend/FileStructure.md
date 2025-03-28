# AliveHuman Frontend Project Structure

This document provides a detailed overview of the Next.js frontend application structure, key components, and implementation details.

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Project Structure

## Configuration Files

- **`package.json`** - NPM package definition with project dependencies and scripts
- **`next.config.js`** - Next.js configuration including i18n settings, image domains, and API rewrites
- **`next-i18next.config.js`** - Internationalization configuration defining supported languages
- **`.env.local`** - Environment variables for API URLs and blockchain configuration
- **`tsconfig.json`** - TypeScript configuration with path aliases and compiler options
- **`tailwind.config.js`** - Tailwind CSS configuration for styling
- **`postcss.config.js`** - PostCSS configuration for processing CSS

## Core Application Files

- **`src/pages/_app.tsx`** - Main application wrapper with context providers for auth and wallet
- **`src/pages/index.tsx`** - Homepage component with internationalization support
- **`src/pages/login.tsx`** - Login page supporting both email and wallet authentication

## Context Providers

- **`src/contexts/auth.tsx`** - Authentication context provider managing user login state
- **`src/contexts/wallet.tsx`** - Wallet context provider for blockchain wallet interaction

## Layout and UI Components

- **`src/components/layout/Layout.tsx`** - Main layout wrapper with navigation and footer
- **`src/components/layout/Navbar.tsx`** - Navigation bar with authentication status and links
- **`src/components/layout/Footer.tsx`** - Application footer with links and copyright info

## API and Services

- **`src/services/api.ts`** - API client with axios, token refresh handling and service endpoints
- **`src/services/wallet-auth.service.ts`** - Wallet authentication service implementing two-step authentication flow:
  - Step 1: Connect wallet and get a challenge from the backend
  - Step 2: Sign the challenge and submit for verification

## TypeScript Definitions

- **`src/types/user.ts`** - TypeScript interfaces for user data structure

## Internationalization

- **`public/locales/en/common.json`** - English translations for the application

## Styling

- **`src/styles/globals.css`** - Global CSS with Tailwind imports and custom variables

## Main Functionality

The application provides:

1. **Authentication System** 
   - Traditional email/password login
   - Web3 wallet-based authentication
     - Two-step process for wallet authentication (connect -> sign -> authenticate)
     - Optional email association with wallet accounts
     - Secure challenge-response pattern with cryptographic signatures
   - JWT token handling with refresh capability
   - Session management

2. **Wallet Integration**
   - Connection to Ethereum and compatible wallets
   - Message signing for authentication
   - Chain ID detection
   - Event handling for wallet changes
   - Support for wallet authentication without requiring email
   - Device binding for enhanced security

3. **Internationalization**
   - Support for multiple languages (English, Spanish, French, German)
   - Translation of UI elements
   - Locale-specific formatting

4. **Responsive UI**
   - Mobile-friendly design using Tailwind CSS
   - Consistent layout across pages
   - Modern web styling with gradients and proper spacing

5. **API Communication**
   - Secure communication with backend services
   - Token-based authentication
   - Automatic token refresh on expiration
   - Type-safe API responses

## Wallet Authentication Flow

The wallet authentication system follows a secure two-step process:

1. **Connection Phase**
   - User clicks "Connect Wallet"
   - Frontend requests wallet connection through browser extension (MetaMask, etc.)
   - After connection, wallet address is sent to backend
   - Backend generates a unique challenge and returns it
   - Challenge includes timestamp to prevent replay attacks

2. **Authentication Phase**
   - Frontend asks wallet to sign the challenge message
   - Wallet prompts user to sign with their private key
   - Signature is sent to backend with the address and original message
   - Backend verifies the signature cryptographically
   - If valid, backend issues JWT tokens
   - User is authenticated with their blockchain wallet

3. **Optional Email Association**
   - Users can optionally provide an email address during wallet authentication
   - Email is stored with the user account but not required
   - Wallet address serves as the primary identifier

4. **Security Considerations**
   - Device tracking for enhanced security
   - Challenge includes timestamp to prevent replay attacks
   - Wallet address verification prevents impersonation
   - Optional email for recovery options
