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
- **`.vscode/settings.json`** - VS Code settings for proper linting and Tailwind CSS integration

## Core Application Files

- **`src/pages/_app.tsx`** - Main application wrapper with context providers for auth, wallet, and theme
- **`src/pages/index.tsx`** - Homepage component with internationalization support
- **`src/pages/login.tsx`** - Login page supporting both email and wallet authentication
- **`src/pages/bootstrap-demo.tsx`** - Demo page showcasing Bootstrap components with theme support

## Context Providers

- **`src/contexts/auth.tsx`** - Authentication context provider managing user login state
- **`src/contexts/wallet.tsx`** - Wallet context provider for blockchain wallet interaction

## Layout and UI Components

- **`src/components/layout/Layout.tsx`** - Main layout wrapper with navigation and footer
- **`src/components/layout/Navbar.tsx`** - Navigation bar with authentication status, links and theme toggle
- **`src/components/layout/Footer.tsx`** - Application footer with links and copyright info
- **`src/components/ThemeToggle.tsx`** - Component for switching between light and dark themes

## API and Services

- **`src/services/api.ts`** - API client with axios, token refresh handling and service endpoints
- **`src/services/wallet-auth.service.ts`** - Wallet authentication service implementing two-step authentication flow:
  - Step 1: Connect wallet and get a challenge from the backend
  - Step 2: Sign the challenge and submit for verification
- **`src/services/diary.service.ts`** - Diary service for managing personal diary entries:
  - Create, read, update, and delete diary entries
  - Filtering diary entries by location and game level
  - Support for multimedia attachments

## Diary System

- **`src/pages/diary/index.tsx`** - Main diary listing page showing all user diary entries
- **`src/pages/diary/create.tsx`** - Page for creating new diary entries with rich text editor
- **`src/pages/diary/[id].tsx`** - Detailed view of a single diary entry
- **`src/pages/diary/edit/[id].tsx`** - Edit page for updating existing diary entries
- **`src/components/diary/DiaryCard.tsx`** - Component for displaying diary entry summaries in a grid
- **`src/components/diary/DiaryForm.tsx`** - Reusable form component for creating and editing diary entries
- **`src/types/diary.ts`** - TypeScript interfaces for diary data structure

### Diary Features

The diary system provides users with:
1. **Personal Journal** - Users can maintain a private digital journal
2. **Rich Content** - Support for formatted text with React-Quill
3. **Emotion Tracking** - Record feelings and moods with each entry
4. **Location Tagging** - Tag entries with in-game locations
5. **Game Progress** - Track game level for each diary entry
6. **Color Coding** - Customize entry appearance with colors
7. **Media Support** - Attach audio and video recordings to entries
8. **Filtering** - Filter entries by location and game level
9. **Responsive Layout** - Grid-based diary view that adapts to different screen sizes
10. **Secure Storage** - Entries are securely stored and accessible only to the user

## TypeScript Definitions

- **`src/types/user.ts`** - TypeScript interfaces for user data structure
- **`src/types/diary.ts`** - TypeScript interfaces for diary data including:
  - Diary entry structure with title, content, location, and feeling
  - Location enum for categorizing entries
  - Feeling options for emotional tracking
  - Media attachment interfaces

## Internationalization

- **`public/locales/en/common.json`** - English translations for the application, including new diary-related terms

## Styling

- **`src/styles/globals.css`** - Global CSS with Tailwind imports, Bootstrap overrides, and theme variables for light/dark modes

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
   - Mobile-friendly design using Tailwind CSS and Bootstrap
   - Consistent layout across pages
   - Modern web styling with gradients and proper spacing
   - Dark/light theme support with system preference detection

5. **API Communication**
   - Secure communication with backend services
   - Token-based authentication
   - Automatic token refresh on expiration
   - Type-safe API responses

6. **Theme System**
   - Supports dark and light mode themes
   - User preference is stored and persisted
   - Seamless switching between themes with smooth transitions
   - Bootstrap components styled to match the current theme
   - Toggle component in the navigation bar for easy access

7. **Personal Diary System**
   - Create and manage personal diary entries tied to user accounts
   - Rich text formatting with React-Quill editor
   - Media attachments with audio and video recording
   - Color-coded entries for visual organization
   - Location and feeling tagging for contextual information
   - Game progress tracking with level indicators
   - Grid-based diary view with responsive layout
   - Filtering capabilities for organizing entries

## UI Framework and Components

The application uses a combination of:

1. **Tailwind CSS** - For utility-based styling and responsive design
2. **Bootstrap 5** - For pre-built components and layout system
3. **React-Bootstrap** - React components implementing Bootstrap functionality

These frameworks work together to provide:
- Responsive grid system
- Pre-styled UI components (cards, buttons, forms)
- Consistent theme variables across both frameworks
- Accessibility features built-in to components

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
