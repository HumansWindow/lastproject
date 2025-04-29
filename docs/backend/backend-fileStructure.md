# Backend File Structure

```
backend/
├── debug-ts.ts                      # TypeScript debugging utility
├── fix-id-inconsistencies.ts        # Script to fix ID inconsistencies
├── jest.config.js                   # Jest configuration
├── jest-global.d.ts                 # Global Jest type definitions
├── jest-types.d.ts                  # Jest type definitions
├── nest-cli.json                    # NestJS CLI configuration
├── node-types.d.ts                  # Node.js type definitions
├── package.json                     # Package configuration
├── start-app.js                     # Application starter script
├── tsconfig.build.json              # TypeScript build configuration
├── tsconfig.build.simple.json       # Simple TypeScript build configuration
├── tsconfig.json                    # Main TypeScript configuration
├── tsconfig.test.json               # TypeScript test configuration
├── typeorm.config.ts                # TypeORM configuration
├── webpack.config.js                # Webpack configuration
├── backups/                         # Backup files directory
├── config/                          # Configuration directory
│   └── test.ts                      # Test configuration
├── patches/                         # Patches directory
│   └── fix-schedule-explorer.js     # Schedule explorer fix
├── scripts/                         # Scripts directory
│   ├── check-dist.js                # Script to check dist folder
│   ├── check-src.js                 # Script to check source files
│   ├── check-tsconfig.js            # Script to check TypeScript configuration
│   ├── clean.js                     # Cleanup script
│   ├── database-init.js             # Database initialization script
│   ├── extract-wallet-key.js        # Tool for wallet key extraction
│   ├── find-main.js                 # Script to locate main entry file
│   ├── fix-all-deps.js              # Fix dependencies script
│   ├── fix-node-modules.js          # Fix node_modules script
│   ├── fix-websockets.js            # WebSockets fix script
│   ├── install-local.js             # Local installation script
│   ├── patch-schedule.js            # Schedule patching script
│   ├── print-build.js               # Build information printer
│   ├── src-check.js                 # Source code check script
│   ├── swagger-test.js              # Swagger testing script
│   ├── update-database.js           # Database update script
│   ├── update-deps.js               # Dependencies update script
│   ├── build-and-run.sh             # Build and run script
│   ├── build-debug.js               # Debug build script
│   ├── build.js                     # Build script
│   ├── build-strict.ts              # Strict build script
│   ├── check-db.js                  # Database check script
│   ├── check-id-consistency.js      # ID consistency checker
│   ├── config-loader.js             # Configuration loader
│   ├── create-admin-user.js         # Admin user creation script
│   ├── create-dist-package.js       # Distribution package creator
│   ├── create-test-db.js            # Test database creator
│   ├── deploy-production.js         # Production deployment script
│   ├── fix-modules.js               # Modules fix script
│   ├── init-db.js                   # Database initialization script
│   ├── initialize-database.js       # Database initializer
│   ├── install-jest-types.js        # Jest types installer
│   ├── quick-setup.js               # Quick setup script
│   ├── run-migrations.js            # Migrations runner
│   ├── test-db-connection.js        # Database connection tester
│   └── test-wallet-login.js         # Wallet login tester
├── src/                             # Source code directory
│   ├── accounts/                    # Accounts module
│   │   ├── accounts.module.ts       # Module definition
│   │   ├── controllers/            
│   │   │   └── accounts.controller.ts  # Accounts controller
│   │   ├── entities/
│   │   │   └── account.entity.ts    # Account entity
│   │   └── services/
│   │       └── accounts.service.ts  # Accounts service
│   ├── app/                         # App module
│   │   ├── app.controller.ts        # App controller
│   │   ├── app.module.ts            # App module definition
│   │   ├── app.service.ts           # App service
│   │   ├── base.controller.ts       # Base controller
│   │   └── controllers/
│   │       └── base.controller.ts   # Base controller implementation
│   ├── app.module.ts                # Main app module
│   ├── auth/                        # Authentication module
│   │   ├── auth.controller.spec.ts  # Auth controller tests
│   │   ├── auth.controller.ts       # Auth controller
│   │   ├── auth.module.ts           # Auth module definition
│   │   ├── auth.service.ts          # Auth service
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts   # Auth controller implementation
│   │   │   ├── debug.controller.ts  # Debug controller
│   │   │   ├── wallet-auth.controller.ts       # Wallet auth controller
│   │   │   └── wallet-auth-debug.controller.ts # Wallet auth debug controller
│   │   ├── decorators/
│   │   │   ├── get-user.decorator.ts   # Get user decorator
│   │   │   ├── roles.decorator.ts      # Roles decorator
│   │   │   └── ws-user.decorator.ts    # WebSocket user decorator
│   │   ├── dto/
│   │   │   ├── auth.dto.ts             # Auth DTOs
│   │   │   ├── forgot-password.dto.ts  # Forgot password DTO
│   │   │   ├── login.dto.ts            # Login DTO
│   │   │   ├── refresh-token.dto.ts    # Refresh token DTO
│   │   │   ├── register.dto.ts         # Registration DTO
│   │   │   ├── reset-password.dto.ts   # Reset password DTO
│   │   │   ├── wallet-connect-response.dto.ts # Wallet connect response DTO
│   │   │   └── wallet-login.dto.ts     # Wallet login DTO
│   │   ├── entities/
│   │   │   └── refresh-token.entity.ts # Refresh token entity
│   │   ├── guards/
│   │   │   ├── access-token.guard.ts   # Access token guard
│   │   │   ├── jwt-auth.guard.ts       # JWT auth guard
│   │   │   ├── local-auth.guard.ts     # Local auth guard
│   │   │   ├── refresh-token.guard.ts  # Refresh token guard
│   │   │   ├── roles.guard.ts          # Roles guard
│   │   │   └── ws-auth.guard.ts        # WebSocket auth guard
│   │   ├── interfaces/
│   │   │   ├── jwt-payload.interface.ts       # JWT payload interface
│   │   │   └── request-with-user.interface.ts # Request with user interface
│   │   ├── jwt.module.ts               # JWT module
│   │   ├── services/
│   │   │   ├── auth.service.ts         # Auth service implementation
│   │   │   ├── token.service.ts        # Token service
│   │   │   ├── wallet-auth.service.ts  # Wallet auth service
│   │   │   └── wallet-transaction.service.ts  # Wallet transaction service
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts         # JWT strategy
│   │   │   ├── local.strategy.ts       # Local strategy
│   │   │   └── wallet.strategy.ts      # Wallet strategy
│   │   └── types/
│   │       ├── passport-custom.d.ts    # Passport custom types
│   │       └── tokens.type.ts          # Token types
│   ├── batch/                          # Batch processing module
│   │   ├── batch.controller.ts         # Batch controller
│   │   ├── batch.interfaces.ts         # Batch interfaces
│   │   ├── batch.module.ts             # Batch module
│   │   └── batch.service.ts            # Batch service
│   ├── blockchain/                     # Blockchain module
│   │   ├── abis/
│   │   │   ├── shahi-token.abi.json    # SHAHI token ABI
│   │   │   └── shahiToken.json         # SHAHI token configuration
│   │   ├── blockchain.module.ts        # Blockchain module definition
│   │   ├── blockchain.service.ts       # Blockchain service
│   │   ├── config/
│   │   │   └── blockchain-environment.ts # Blockchain environment config
│   │   ├── constants.ts                # Constants
│   │   ├── contracts/                  # Smart contracts
│   │   │   ├── abis/
│   │   │   │   └── SHAHICoin.ts        # SHAHI coin interface
│   │   │   ├── artifacts/
│   │   │   │   ├── deployment-info-polygon-mumbai.json  # Deployment info
│   │   │   │   └── SHAHICoin-abi.json  # SHAHI coin ABI
│   │   │   ├── deploy/                 # Deployment scripts
│   │   │   │   ├── bridge-config.js    # Bridge configuration
│   │   │   │   ├── contract-addresses.json # Contract addresses
│   │   │   │   ├── deploy-all.js       # Deploy all script
│   │   │   │   ├── deploy-base.js      # Base deploy script
│   │   │   │   ├── deploy-bsc.js       # BSC deploy script
│   │   │   │   ├── deploy-ethereum.js  # Ethereum deploy script
│   │   │   │   ├── deploy-polygon-direct.js   # Direct Polygon deploy
│   │   │   │   ├── deploy-polygon.js   # Polygon deploy script
│   │   │   │   ├── deploy-polygon-simulate.js # Simulate Polygon deploy
│   │   │   │   ├── deploy-rsk.js       # RSK deploy script
│   │   │   │   ├── run-real-deployment.sh # Real deployment script
│   │   │   │   ├── update-addresses.js # Update addresses script
│   │   │   │   └── verify-contracts.js # Contract verification script
│   │   │   ├── deploy-recompile.sh     # Recompilation script
│   │   │   ├── direct-compile.sh       # Direct compilation script
│   │   │   ├── hardhat.config.js       # Hardhat configuration
│   │   │   ├── Marketplace.sol         # Marketplace smart contract
│   │   │   ├── NFT.sol                 # NFT smart contract
│   │   │   ├── package.json            # Package configuration
│   │   │   ├── rpc-connectivity-results.json # RPC connectivity results
│   │   │   ├── scripts/
│   │   │   │   └── deploy.js           # Deployment script
│   │   │   ├── SHAHICoin.sol           # SHAHI coin smart contract
│   │   │   ├── SHAHIStorage.sol        # SHAHI storage smart contract
│   │   │   ├── shahi-token.abi.json    # SHAHI token ABI
│   │   │   ├── test-rpc-connectivity.js # RPC connectivity test
│   │   │   └── test-rpc-fallback.js    # RPC fallback test
│   │   ├── controllers/
│   │   │   ├── minting.controller.ts   # Minting controller
│   │   │   ├── rpc-status.controller.ts # RPC status controller
│   │   │   ├── staking.controller.ts   # Staking controller
│   │   │   ├── token.controller.ts     # Token controller
│   │   │   └── token-minting.controller.ts # Token minting controller
│   │   ├── entities/
│   │   │   ├── apy-tier.entity.ts      # APY tier entity
│   │   │   ├── device-fingerprint.entity.ts # Device fingerprint
│   │   │   ├── minting-queue-item.entity.ts # Minting queue item
│   │   │   ├── minting-record.entity.ts # Minting record
│   │   │   ├── staking-position.entity.ts # Staking position
│   │   │   └── wallet.entity.ts        # Wallet entity
│   │   ├── enums/
│   │   │   ├── minting-status.enum.ts  # Minting status enum
│   │   │   └── minting-type.enum.ts    # Minting type enum
│   │   ├── fileReferences.d.ts         # File references
│   │   ├── gateways/
│   │   │   ├── token-events.gateway.ts # Token events gateway
│   │   │   └── websocket.gateway.ts    # WebSocket gateway
│   │   ├── guards/
│   │   │   └── rate-limit.guard.ts     # Rate limit guard
│   │   ├── hot-wallet.controller.ts    # Hot wallet controller
│   │   ├── hot-wallet.module.ts        # Hot wallet module
│   │   ├── hot-wallet.service.ts       # Hot wallet service
│   │   ├── hotwallet/                  # Hot wallet implementation
│   │   │   ├── config.js               # Configuration
│   │   │   ├── config/
│   │   │   │   └── marketplaceConfig.ts # Marketplace configuration
│   │   │   ├── handlers/
│   │   │   │   └── ChainHandlers.ts    # Chain handlers
│   │   │   ├── index.ts                # Main index
│   │   │   ├── middleware/
│   │   │   │   └── auth.middleware.ts  # Auth middleware
│   │   │   ├── package.json            # Package configuration
│   │   │   ├── services/
│   │   │   │   ├── BalanceService.ts   # Balance service
│   │   │   │   ├── GasService.ts       # Gas service
│   │   │   │   ├── MarketplaceAccountService.ts # Marketplace account service
│   │   │   │   ├── MarketplaceWebhookService.ts # Marketplace webhook service
│   │   │   │   ├── MonitoringService.ts # Monitoring service
│   │   │   │   ├── NFTService.ts       # NFT service
│   │   │   │   ├── RPCLoadBalancer.ts  # RPC load balancer
│   │   │   │   ├── TransactionHistoryService.ts # Transaction history service
│   │   │   │   └── TransactionService.ts # Transaction service
│   │   │   ├── setup.sh                # Setup script
│   │   │   ├── types/
│   │   │   │   └── api-config.ts       # API configuration types
│   │   │   ├── utils/
│   │   │   │   ├── circuitBreaker.ts   # Circuit breaker
│   │   │   │   ├── encryption.ts       # Encryption utilities
│   │   │   │   ├── errors.ts           # Error handling
│   │   │   │   └── rateLimiter.ts      # Rate limiter
│   │   │   └── WalletManager.ts        # Wallet manager
│   │   ├── interfaces/
│   │   │   └── nft.interfaces.ts       # NFT interfaces
│   │   ├── services/
│   │   │   ├── merkle.service.ts       # Merkle service
│   │   │   ├── minting.service.ts      # Minting service
│   │   │   ├── rpc-provider.service.ts # RPC provider service
│   │   │   ├── shahi-token.service.ts  # SHAHI token service
│   │   │   ├── staking.service.ts      # Staking service
│   │   │   └── user-minting-queue.service.ts # User minting queue service
│   │   ├── tasks/
│   │   │   └── token-expiry.task.ts    # Token expiry task
│   │   ├── types.ts                    # Type definitions
│   │   └── wallet.controller.ts        # Wallet controller
│   ├── config/                         # Configuration
│   │   ├── development.config.ts       # Development configuration
│   │   ├── migration.config.ts         # Migration configuration
│   │   ├── test-database.config.ts     # Test database configuration
│   │   └── typeorm.config.ts           # TypeORM configuration
│   ├── constants/
│   │   └── api.constants.ts            # API constants
│   ├── database/                       # Database module
│   │   ├── database.module.ts          # Database module definition
│   │   ├── data-source.ts              # Data source
│   │   ├── migrations/
│   │   │   └── 1711369000000-FixUserDevicesTable.ts # Migration fix
│   │   └── run-migrations.ts           # Migration runner
│   ├── db/                             # Database utilities
│   │   ├── initialize-schema.ts        # Schema initializer
│   │   └── reset-database.ts           # Database reset
│   ├── db-test.ts                      # Database test
│   ├── diary/                          # Diary module
│   │   ├── controllers/
│   │   │   └── diary.controller.ts     # Diary controller
│   │   ├── diary.module.ts             # Diary module
│   │   ├── dto/
│   │   │   └── diary.dto.ts            # Diary DTOs
│   │   ├── entities/
│   │   │   └── diary.entity.ts         # Diary entity
│   │   └── services/
│   │       └── diary.service.ts        # Diary service
│   ├── fix-swagger.ts                  # Swagger fix
│   ├── generate-admin-wallet.ts        # Admin wallet generator
│   ├── i18n/                           # Internationalization
│   │   ├── i18n.module.ts              # i18n module
│   │   └── i18n.service.ts             # i18n service
│   ├── mail/                           # Mail module
│   │   ├── mail.module.ts              # Mail module
│   │   └── mail.service.ts             # Mail service
│   ├── main.ts                         # Main entry point
│   ├── migrations/                     # Migrations
│   │   ├── 1714500000000-InitialSchema.ts # Initial schema
│   │   ├── 1714500000001-WalletAuthFixes.ts # Wallet auth fixes
│   │   ├── fix-user-sessions-schema.ts # User sessions schema fix
│   │   └── index.ts                    # Migrations index
│   ├── migrations-backup/              # Migration backups
│   │   ├── 1710000000000-InitialMigration.ts # Initial migration
│   │   ├── 1710000000000-UpdateUserAndWalletEntities.ts # Entity updates
│   │   └── ... (more migration files)
│   ├── nft/                            # NFT module
│   │   ├── entities/
│   │   │   └── nft.entity.ts           # NFT entity
│   │   ├── nft.controller.ts           # NFT controller
│   │   ├── nft.module.ts               # NFT module
│   │   └── nft.service.ts              # NFT service
│   ├── profile/                        # Profile module
│   │   ├── dto/
│   │   │   └── profile.dto.ts          # Profile DTOs
│   │   ├── entities/
│   │   │   └── profile.entity.ts       # Profile entity
│   │   ├── profile.controller.ts       # Profile controller
│   │   ├── profile-error-handler.service.ts # Error handler
│   │   ├── profile.module.ts           # Profile module
│   │   ├── profile.service.ts          # Profile service
│   │   └── tests/
│   │       ├── profile-completion.test.ts      # Profile completion test
│   │       └── profile-controller.integration.test.ts # Integration test
│   ├── referral/                       # Referral module
│   │   ├── dto/
│   │   │   ├── create-referral.dto.ts  # Create referral DTO
│   │   │   └── toggle-referral-code.dto.ts # Toggle referral code DTO
│   │   ├── entities/
│   │   │   ├── referral-code.entity.ts # Referral code entity
│   │   │   └── referral.entity.ts      # Referral entity
│   │   ├── referral.controller.ts      # Referral controller
│   │   ├── referral.module.ts          # Referral module
│   │   └── referral.service.ts         # Referral service
│   ├── run-migration.ts                # Migration runner
│   ├── scripts/                        # Scripts
│   │   ├── diagnose-wallet-auth.ts     # Wallet auth diagnostics
│   │   ├── fix-schema.ts               # Schema fix
│   │   └── reset-db.ts                 # Database reset
│   ├── shared/                         # Shared module
│   │   ├── config/
│   │   │   └── cors.config.ts          # CORS configuration
│   │   ├── exceptions/
│   │   │   └── domain.exceptions.ts    # Domain exceptions
│   │   ├── filters/
│   │   │   └── global-exception.filter.ts # Global exception filter
│   │   ├── middleware/
│   │   │   └── dev-bypass.middleware.ts # Development bypass middleware
│   │   ├── modules/
│   │   │   └── device-detector.module.ts # Device detector module
│   │   ├── services/
│   │   │   ├── bcrypt.service.ts       # BCrypt service
│   │   │   ├── device-detector.service.ts # Device detector service
│   │   │   ├── error-handling.service.ts # Error handling service
│   │   │   └── memory-monitor.service.ts # Memory monitor service
│   │   ├── shared.module.ts            # Shared module
│   │   ├── testing/                    # Testing utilities
│   │   │   ├── auth-test.script.ts     # Auth test script
│   │   │   ├── auth-test.util.ts       # Auth test utilities
│   │   │   ├── token-test.ts           # Token test
│   │   │   ├── wallet-auth-comprehensive-test.ts # Wallet auth test
│   │   │   ├── wallet-debug-test.ts    # Wallet debug test
│   │   │   └── wallet-login-test.ts    # Wallet login test
│   │   └── utils/
│   │       └── debug-logger.util.ts    # Debug logger
│   ├── swagger-config.ts               # Swagger configuration
│   ├── test-alive-connection.ts        # Connection test
│   ├── token/                          # Token module
│   │   ├── entities/
│   │   │   └── token-transaction.entity.ts # Token transaction entity
│   │   ├── token.controller.ts         # Token controller
│   │   ├── token.module.ts             # Token module
│   │   └── token.service.ts            # Token service
│   ├── typeorm.config.ts               # TypeORM configuration
│   ├── @types/                         # Type definitions
│   │   ├── express.d.ts                # Express types
│   │   ├── jest.d.ts                   # Jest types
│   │   └── jest/
│   │       └── index.d.ts              # Jest index types
│   ├── types/                          # More type definitions
│   │   ├── keccak256.d.ts              # Keccak256 types
│   │   └── merkletreejs.d.ts           # MerkleTree.js types
│   ├── users/                          # Users module
│   │   ├── controllers/
│   │   │   └── user-devices.controller.ts # User devices controller
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts      # Create user DTO
│   │   │   └── update-user.dto.ts      # Update user DTO
│   │   ├── entities/
│   │   │   ├── user-device.entity.ts   # User device entity
│   │   │   ├── user.entity.ts          # User entity
│   │   │   └── user-session.entity.ts  # User session entity
│   │   ├── enums/
│   │   │   └── user-role.enum.ts       # User role enum
│   │   ├── services/
│   │   │   ├── user-devices.service.ts # User devices service
│   │   │   └── user-sessions.service.ts # User sessions service
│   │   ├── users.controller.ts         # Users controller
│   │   ├── users.module.ts             # Users module
│   │   └── users.service.ts            # Users service
│   └── wallets/                        # Wallets module
│       ├── entities/
│       │   └── wallet.entity.ts        # Wallet entity
│       ├── wallets.controller.ts       # Wallets controller
│       ├── wallets.module.ts           # Wallets module
│       └── wallets.service.ts          # Wallets service
└── test/                               # Tests directory
    └── profile-completion.e2e-spec.ts  # Profile completion end-to-end test
```

> **Note:** Shell scripts (.sh) have been moved to the project's scripts directory at `/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/scripts/`:
> - build-and-deploy.sh
> - build.sh
> - fix-dist-permissions.sh
> - simple-build.sh

## Major Modules
- **accounts**: Account management
- **auth**: Authentication system with web and wallet authentication
- **batch**: Batch processing operations
- **blockchain**: Blockchain integration, smart contracts, and cryptocurrency operations
- **diary**: User diary functionality
- **nft**: NFT management
- **profile**: User profiles
- **referral**: Referral system
- **token**: Token management
- **users**: User management
- **wallets**: Wallet management

## Key Smart Contracts
- SHAHICoin.sol
- NFT.sol
- Marketplace.sol
- SHAHIStorage.sol

## Main Architecture
The project is built using NestJS framework, with TypeORM for database interactions and web3.js/ethers.js for blockchain operations. It features comprehensive authentication with both traditional (JWT) and blockchain wallet-based authentication.