# AliveHuman Project

A comprehensive platform integrating blockchain functionality with a secure, multi-chain wallet system supporting web and mobile applications.

## Project Overview

AliveHuman is a modern web3 platform that combines:
- Traditional web/mobile applications with blockchain integration
- Multi-chain wallet support (ETH, BTC, SOL, BNB, MATIC)
- NFT minting and management capabilities
- Security-focused authentication system with device tracking
- Referral and reward systems

## Architecture

The project follows a modular architecture:
- **Backend**: NestJS application with TypeScript
- **Frontend**: Next.js web application
- **Mobile**: React Native iOS/Android apps
- **Admin**: Separate admin panel for platform management
- **Shared**: Common code shared between applications

## Key Components

### Hot Wallet System
Recently completed comprehensive wallet implementation supporting:
- Multi-chain operations (ETH, BTC, SOL, BNB, MATIC)
- Secure key management with AES-256-CBC encryption
- Balance checking and transaction creation
- Token operations for ERC20/BEP20 standards
- Memory protection for sensitive cryptographic material

### Authentication System
Secure authentication with:
- JWT-based authentication with refresh tokens
- Wallet-based login (blockchain signatures)
- Email verification and password reset flows
- Device tracking and validation
- Session management with proper expiration

### Referral System
User acquisition system with:
- Secure referral code generation
- Validation logic with anti-fraud measures
- Statistics and analytics for referrals
- Reward claiming mechanisms

## Development Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/alivehuman.git
cd alivehuman
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env file with your configuration
```

4. Start development servers
```bash
npm run dev
```

## Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- src/__tests__/blockchain/hotwallet.spec.ts
npm test -- src/__tests__/auth/auth.spec.ts
```

## Recent Achievements

- ✅ Implemented multi-chain hot wallet system with comprehensive tests
- ✅ Integrated encryption for secure key management
- ✅ Created robust testing infrastructure with mock providers
- ✅ Built referral system with anti-fraud measures
- ✅ Enhanced security with device tracking and session management
- ✅ Fixed ESM import issues in main.ts and across the project
- ✅ Optimized test performance by silencing console output

## Next Steps

### 1. Complete Authentication Testing (Priority: Highest)
- [x] Email verification tests
- [x] Registration security tests
- [x] Token refresh tests
- [ ] Password reset tests
- [ ] Session management tests
- [ ] Two-factor authentication implementation

### 2. Hot Wallet Security Enhancements (Priority: High)
- [ ] Implement transaction signing rate limiting
- [ ] Add multi-signature support for high-value transactions
- [ ] Create balance monitoring system with alerts
- [ ] Develop cold wallet integration for high-value storage
- [ ] Implement key rotation protocols

### 3. Authentication & Authorization (Priority: High)
- [x] Basic authentication system with JWT
- [x] Email verification flow
- [x] Blockchain wallet authentication
- [ ] Complete password reset flow tests
- [ ] Multi-factor authentication options
- [ ] Enhanced session management with device fingerprinting
- [ ] Implement role-based access control for wallet operations
- [ ] Create proper JWT validation middleware for the hot wallet system
- [ ] Add proper logging of authorization attempts
- [ ] Implement session timeouts for wallet operations

### 4. NFT Functionality Expansion (Priority: Medium)
- [ ] Complete NFT contract integration
- [ ] Implement minting cooldown periods
- [ ] Create metadata storage solution
- [ ] Build NFT gallery components for frontend/mobile
- [ ] Add NFT trading functionality

### 5. Frontend Integration (Priority: High)
- [ ] Connect wallet components to backend API
- [ ] Implement transaction history display
- [ ] Build balance dashboard with real-time updates
- [ ] Create wallet backup/recovery flows
- [ ] Add QR code support for mobile

### 6. Security Monitoring & Alerting (Priority: High)
- [ ] Create a dedicated alert service for the wallet system
- [ ] Add webhook notification support for critical security events
- [ ] Implement email notifications using the main application's mail service
- [ ] Build a simple dashboard component for the admin panel to visualize alerts
- [ ] Configure severity levels and response protocols for different alert types

### 7. DevOps & Deployment (Priority: Medium)
- [ ] Finalize Docker configuration
- [ ] Set up CI/CD pipeline
- [ ] Configure staging environment
- [ ] Implement backup strategy
- [ ] Create disaster recovery plan

### 8. Documentation & Security Audit (Priority: High)
- [ ] Complete API documentation
- [ ] Create architecture diagrams
- [ ] Write security protocols
- [ ] Prepare for external security audit
- [ ] Document all wallet functions

## Resolved Issues

### ESM Module Support
- Fixed CommonJS import syntax in main.ts using ES module import
- Updated Jest configuration to handle ESM modules properly
- Improved TypeScript configuration for better module resolution

### Test Infrastructure
- Enhanced mock providers with proper TypeScript typing
- Fixed memory leaks in WebSocket providers during tests
- Silenced console output during tests for cleaner output
- Implemented wallet manager interactions in test mocks

### Authentication System
- Fixed email verification tests
- Solved token refresh validation issues
- Corrected service method signatures for consistent behavior
- Implemented proper device tracking in tests
- Enhanced security with proper token validation

## Contributing

1. Follow the project's coding standards (ESLint+Prettier)
2. Write tests for new functionality
3. Update documentation
4. Open a PR with a detailed description of changes

## License

Proprietary - All rights reserved
