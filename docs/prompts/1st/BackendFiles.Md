# Backend Files Structure

## Directory Structure

```
backend/
├── config/
│   └── test.ts
├── debug-ts.ts
├── .env
├── .env.development
├── .env.production
├── .env.test
├── .env.test.local
├── .eslintrc.js
├── fix-id-inconsistencies.ts
├── .gitignore
├── jest.config.js
├── jest-global.d.ts
├── jest-types.d.ts
├── main.ts.patch
├── nest-cli.json
├── .node-args
├── node-types.d.ts
├── .npmrc
├── package.json
├── patches/
│   └── fix-schedule-explorer.js
├── .prettierrc
├── runbackend.txt
├── scripts/
│   ├── build-and-run.sh
│   ├── build-debug.js
│   ├── build.js
│   ├── build-strict.ts
│   ├── check-db.js
│   ├── check-dist.js
│   ├── check-id-consistency.js
│   ├── check-src.js
│   ├── check-tsconfig.js
│   ├── clean.js
│   ├── config-loader.js
│   ├── create-admin-user.js
│   ├── create-dist-package.js
│   ├── create-test-db.js
│   ├── database-init.js
│   ├── deploy-production.js
│   ├── extract-wallet-key.js
│   ├── find-main.js
│   ├── fix-all-deps.js
│   ├── fix-modules.js
│   ├── fix-node-modules.js
│   ├── fix-websockets.js
│   ├── init-db.js
│   ├── initialize-database.js
│   ├── install-jest-types.js
│   ├── install-local.js
│   ├── patch-schedule.js
│   ├── print-build.js
│   ├── quick-setup.js
│   ├── run-migrations.js
│   ├── src-check.js
│   ├── swagger-test.js
│   ├── test-db-connection.js
│   ├── test-wallet-login.js
│   ├── update-database.js
│   └── update-deps.js
├── src/
│   ├── accounts/
│   │   ├── accounts.module.ts
│   │   ├── controllers/
│   │   │   └── accounts.controller.ts
│   │   ├── entities/
│   │   │   └── account.entity.ts
│   │   └── services/
│   │       └── accounts.service.ts
│   ├── admin/
│   │   ├── admin.module.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── blockchain-monitoring.controller.ts
│   │   │   ├── system-monitoring.controller.ts
│   │   │   └── user-management.controller.ts
│   │   ├── dto/
│   │   │   └── admin-login.dto.ts
│   │   └── services/
│   │       ├── auth.service.ts
│   │       └── user-management.service.ts
│   ├── app/
│   │   ├── app.controller.ts
│   │   ├── app.module.ts
│   │   ├── app.service.ts
│   │   ├── base.controller.ts
│   │   └── controllers/
│   │       └── base.controller.ts
│   ├── app.module.ts
│   ├── auth/
│   │   ├── auth.controller.spec.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.service.ts.bak
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── debug.controller.ts
│   │   │   ├── wallet-auth.controller.ts
│   │   │   └── wallet-auth-debug.controller.ts
│   │   ├── decorators/
│   │   │   ├── get-user.decorator.ts
│   │   │   ├── public.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   ├── skip-session-check.decorator.ts
│   │   │   └── ws-user.decorator.ts
│   │   ├── dto/
│   │   │   ├── auth.dto.ts
│   │   │   ├── forgot-password.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   ├── refresh-token.dto.ts
│   │   │   ├── register.dto.ts
│   │   │   ├── reset-password.dto.ts
│   │   │   ├── wallet-connect-response.dto.ts
│   │   │   └── wallet-login.dto.ts
│   │   ├── entities/
│   │   │   └── refresh-token.entity.ts
│   │   ├── guards/
│   │   │   ├── access-token.guard.ts
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── local-auth.guard.ts
│   │   │   ├── refresh-token.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   ├── session-security.guard.ts
│   │   │   └── ws-auth.guard.ts
│   │   ├── interfaces/
│   │   │   ├── jwt-payload.interface.ts
│   │   │   └── request-with-user.interface.ts
│   │   ├── jwt.module.ts
│   │   ├── modules/
│   │   │   └── session-security.module.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts.bak
│   │   │   ├── session-security.service.ts
│   │   │   ├── token.service.ts
│   │   │   ├── wallet-auth.service.ts
│   │   │   └── wallet-transaction.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── local.strategy.ts
│   │   │   └── wallet.strategy.ts
│   │   └── types/
│   │       ├── passport-custom.d.ts
│   │       └── tokens.type.ts
│   ├── batch/
│   │   ├── batch.controller.ts
│   │   ├── batch.interfaces.ts
│   │   ├── batch.module.ts
│   │   └── batch.service.ts
│   ├── blockchain/
│   │   ├── abis/
│   │   │   ├── shahi-token.abi.json
│   │   │   └── shahiToken.json
│   │   ├── blockchain.module.ts
│   │   ├── blockchain.service.ts
│   │   ├── config/
│   │   │   └── blockchain-environment.ts
│   │   ├── constants.ts
│   │   ├── contracts/
│   │   │   ├── abis/
│   │   │   │   └── SHAHICoin.ts
│   │   │   ├── artifacts/
│   │   │   │   ├── deployment-info-polygon-mumbai.json
│   │   │   │   └── SHAHICoin-abi.json
│   │   │   ├── deploy/
│   │   │   │   ├── bridge-config.js
│   │   │   │   ├── contract-addresses.json
│   │   │   │   ├── deploy-all.js
│   │   │   │   ├── deploy-base.js
│   │   │   │   ├── deploy-bsc.js
│   │   │   │   ├── deploy-ethereum.js
│   │   │   │   ├── deploy-polygon-direct.js
│   │   │   │   ├── deploy-polygon.js
│   │   │   │   ├── deploy-polygon-simulate.js
│   │   │   │   ├── deploy-rsk.js
│   │   │   │   ├── run-real-deployment.sh
│   │   │   │   ├── update-addresses.js
│   │   │   │   └── verify-contracts.js
│   │   │   ├── deploy-recompile.sh
│   │   │   ├── deploy.txt
│   │   │   ├── direct-compile.sh
│   │   │   ├── .env
│   │   │   ├── .env.example
│   │   │   ├── hardhat.config.js
│   │   │   ├── Marketplace.sol
│   │   │   ├── NFT.sol
│   │   │   ├── package.json
│   │   │   ├── package-lock.json
│   │   │   ├── rpc-connectivity-results.json
│   │   │   ├── scripts/
│   │   │   │   └── deploy.js
│   │   │   ├── SHAHICoin.sol
│   │   │   ├── SHAHIStorage.sol
│   │   │   ├── shahi-token.abi.json
│   │   │   ├── .solhintignore
│   │   │   ├── test-rpc-connectivity.js
│   │   │   └── test-rpc-fallback.js
│   │   ├── controllers/
│   │   │   ├── minting.controller.ts
│   │   │   ├── rpc-status.controller.ts
│   │   │   ├── staking.controller.ts
│   │   │   ├── token.controller.ts
│   │   │   └── token-minting.controller.ts
│   │   ├── entities/
│   │   │   ├── apy-tier.entity.ts
│   │   │   ├── device-fingerprint.entity.ts
│   │   │   ├── minting-queue-item.entity.ts
│   │   │   ├── minting-record.entity.ts
│   │   │   ├── staking-position.entity.ts
│   │   │   └── wallet.entity.ts
│   │   ├── enums/
│   │   │   ├── minting-status.enum.ts
│   │   │   └── minting-type.enum.ts
│   │   ├── fileReferences.d.ts
│   │   ├── gateways/
│   │   │   ├── token-events.gateway.ts
│   │   │   └── websocket.gateway.ts
│   │   ├── guards/
│   │   │   └── rate-limit.guard.ts
│   │   ├── hot-wallet.controller.ts
│   │   ├── hot-wallet.module.ts
│   │   ├── hot-wallet.service.ts
│   │   ├── hotwallet/
│   │   │   ├── cli-tools.mjs
│   │   │   ├── config/
│   │   │   │   └── marketplaceConfig.ts
│   │   │   ├── config.js
│   │   │   ├── .env
│   │   │   ├── handlers/
│   │   │   │   └── ChainHandlers.ts
│   │   │   ├── index.ts
│   │   │   ├── middleware/
│   │   │   │   └── auth.middleware.ts
│   │   │   ├── package.json
│   │   │   ├── services/
│   │   │   │   ├── BalanceService.ts
│   │   │   │   ├── GasService.ts
│   │   │   │   ├── .~lock.monit.rtf#
│   │   │   │   ├── MarketplaceAccountService.ts
│   │   │   │   ├── MarketplaceWebhookService.ts
│   │   │   │   ├── MonitoringService.ts
│   │   │   │   ├── monit.rtf
│   │   │   │   ├── NFTService.ts
│   │   │   │   ├── RPCLoadBalancer.ts
│   │   │   │   ├── TransactionHistoryService.ts
│   │   │   │   └── TransactionService.ts
│   │   │   ├── setup.sh
│   │   │   ├── types/
│   │   │   │   └── api-config.ts
│   │   │   ├── utils/
│   │   │   │   ├── circuitBreaker.ts
│   │   │   │   ├── encryption.ts
│   │   │   │   ├── errors.ts
│   │   │   │   └── rateLimiter.ts
│   │   │   └── WalletManager.ts
│   │   ├── interfaces/
│   │   │   └── nft.interfaces.ts
│   │   ├── services/
│   │   │   ├── merkle.service.ts
│   │   │   ├── minting.service.ts
│   │   │   ├── rpc-provider.service.ts
│   │   │   ├── shahi-token.service.ts
│   │   │   ├── staking.service.ts
│   │   │   └── user-minting-queue.service.ts
│   │   ├── tasks/
│   │   │   └── token-expiry.task.ts
│   │   ├── types.ts
│   │   └── wallet.controller.ts
│   ├── config/
│   │   ├── development.config.ts
│   │   ├── migration.config.ts
│   │   ├── test-database.config.ts
│   │   └── typeorm.config.ts
│   ├── constants/
│   │   └── api.constants.ts
│   ├── database/
│   │   ├── database.module.ts
│   │   ├── data-source.ts
│   │   ├── migrations/
│   │   │   └── 1711369000000-FixUserDevicesTable.ts
│   │   └── run-migrations.ts
│   ├── db/
│   │   ├── initialize-schema.ts
│   │   └── reset-database.ts
│   ├── db-test.ts
│   ├── diary/
│   │   ├── controllers/
│   │   │   └── diary.controller.ts
│   │   ├── diary.module.ts
│   │   ├── dto/
│   │   │   └── diary.dto.ts
│   │   ├── entities/
│   │   │   └── diary.entity.ts
│   │   └── services/
│   │       └── diary.service.ts
│   ├── fix-swagger.ts
│   ├── game/
│   │   ├── controllers/
│   │   │   ├── admin-content.controller.ts
│   │   │   ├── collaboration-comment.controller.ts
│   │   │   ├── content-approval.controller.ts
│   │   │   ├── content-template.controller.ts
│   │   │   ├── game-modules.controller.ts
│   │   │   ├── game-notification.controller.ts
│   │   │   ├── game-sections.controller.ts
│   │   │   ├── media.controller.ts
│   │   │   ├── module-unlock.controller.ts
│   │   │   ├── module-unlock.controller.ts.bak
│   │   │   ├── quiz.controller.ts
│   │   │   ├── rewards.controller.ts
│   │   │   ├── section-checkpoint.controller.ts
│   │   │   ├── section-navigation.controller.ts
│   │   │   └── user-progress.controller.ts
│   │   ├── dto/
│   │   │   ├── achievement.dto.ts
│   │   │   ├── collaboration-comment.dto.ts
│   │   │   ├── content-approval.dto.ts
│   │   │   ├── content-statistics.dto.ts
│   │   │   ├── media.dto.ts
│   │   │   ├── module.dto.ts
│   │   │   ├── notification.dto.ts
│   │   │   ├── progress.dto.ts
│   │   │   ├── progress.dto.ts.bak
│   │   │   ├── quiz/
│   │   │   │   ├── quiz.dto.ts
│   │   │   │   ├── quiz-question.dto.ts
│   │   │   │   └── quiz-session.dto.ts
│   │   │   ├── quiz.dto.ts.bak
│   │   │   ├── reward.dto.ts
│   │   │   ├── reward.dto.ts.bak
│   │   │   ├── section-content.dto.ts
│   │   │   ├── section.dto.ts
│   │   │   ├── unlock.dto.ts
│   │   │   └── unlock.dto.ts.bak
│   │   ├── entities/
│   │   │   ├── achievement.entity.ts
│   │   │   ├── collaboration-comment.entity.ts
│   │   │   ├── content-approval.entity.ts
│   │   │   ├── content-template.entity.ts
│   │   │   ├── content-version.entity.ts
│   │   │   ├── game-module.entity.ts
│   │   │   ├── game-notification-template.entity.ts
│   │   │   ├── game-section.entity.ts
│   │   │   ├── media-asset.entity.ts
│   │   │   ├── module-notification-schedule.entity.ts
│   │   │   ├── module-unlock-schedule.entity.ts
│   │   │   ├── quiz-compat.ts
│   │   │   ├── quiz/
│   │   │   │   ├── quiz.entity.ts
│   │   │   │   ├── quiz-question.entity.ts
│   │   │   │   ├── quiz-session.entity.ts
│   │   │   │   └── user-quiz-response.entity.ts
│   │   │   ├── reward-transaction.entity.ts
│   │   │   ├── section-checkpoint.entity.ts
│   │   │   ├── section-checkpoint.entity.ts.bak
│   │   │   ├── section-content.entity.ts
│   │   │   ├── section-unlock-schedule.entity.ts
│   │   │   ├── user-achievement.entity.ts
│   │   │   ├── user-notification.entity.ts
│   │   │   ├── user-progress.entity.ts
│   │   │   └── user-progress.entity.ts.bak
│   │   ├── events/
│   │   │   └── achievement-unlocked.event.ts
│   │   ├── game.module.ts
│   │   ├── game.module.ts.bak
│   │   ├── gateways/
│   │   │   ├── game-notification.gateway.ts
│   │   │   └── game-websocket.gateway.ts
│   │   ├── guards/
│   │   │   ├── module-access.guard.ts
│   │   │   └── module-unlock.guard.ts
│   │   ├── interfaces/
│   │   │   ├── content-types.interface.ts
│   │   │   ├── notification-types.interface.ts
│   │   │   ├── progress-status.interface.ts
│   │   │   ├── quiz/
│   │   │   │   └── quiz-types.interface.ts
│   │   │   ├── section-config.interface.ts
│   │   │   └── unlock-status.interface.ts
│   │   ├── repositories/
│   │   │   ├── collaboration-comment.repository.ts
│   │   │   ├── content-approval.repository.ts
│   │   │   ├── content-template.repository.ts
│   │   │   ├── content-version.repository.ts
│   │   │   ├── game-module.repository.ts
│   │   │   ├── game-notification.repository.ts
│   │   │   ├── game-section.repository.ts
│   │   │   ├── media-asset.repository.ts
│   │   │   ├── module-unlock.repository.ts
│   │   │   ├── quiz/
│   │   │   │   ├── quiz-question.repository.ts
│   │   │   │   ├── quiz.repository.ts
│   │   │   │   ├── quiz-session.repository.ts
│   │   │   │   └── user-quiz-response.repository.ts
│   │   │   ├── section-checkpoint.repository.ts
│   │   │   ├── section-content.repository.ts
│   │   │   └── user-progress.repository.ts
│   │   ├── services/
│   │   │   ├── collaboration-comment.service.ts
│   │   │   ├── content-approval.service.ts
│   │   │   ├── content-template.service.ts
│   │   │   ├── game-achievements.service.ts
│   │   │   ├── game-achievements.service.ts.bak
│   │   │   ├── game-modules.service.ts
│   │   │   ├── game-modules.service.ts.bak
│   │   │   ├── game-notification.service.ts
│   │   │   ├── game-notification.service.ts.bak
│   │   │   ├── game-sections.service.ts
│   │   │   ├── game-sections.service.ts.bak
│   │   │   ├── media-processing.service.ts
│   │   │   ├── media.service.ts
│   │   │   ├── media.service.ts.bak
│   │   │   ├── module-unlock.service.ts
│   │   │   ├── module-unlock.service.ts.bak
│   │   │   ├── quiz/
│   │   │   │   └── quiz.service.ts
│   │   │   ├── quiz.service.ts.bak
│   │   │   ├── rewards.service.ts
│   │   │   ├── rewards.service.ts.bak
│   │   │   ├── section-checkpoint.service.ts
│   │   │   ├── section-content.service.ts
│   │   │   ├── section-navigation.service.ts
│   │   │   ├── user-progress.service.ts
│   │   │   └── user-progress.service.ts.bak
│   │   └── tasks/
│   │       └── notification-sender.task.ts
│   ├── generate-admin-wallet.ts
│   ├── i18n/
│   │   ├── i18n.module.ts
│   │   └── i18n.service.ts
│   ├── mail/
│   │   ├── mail.module.ts
│   │   └── mail.service.ts
│   ├── main.ts
│   ├── main.ts.new
│   ├── migrations/
│   │   ├── 1714500000000-InitialSchema.ts
│   │   ├── 1714500000001-WalletAuthFixes.ts
│   │   ├── 1746283625000-CreateGameTables.ts
│   │   ├── fix-missing-columns.ts
│   │   ├── fix-user-sessions-schema.ts
│   │   ├── index.ts
│   │   └── quiz/
│   │       └── 1715475961234-create-quiz-tables.ts
│   ├── migrations-backup/
│   │   ├── 1710000000000-InitialMigration.ts
│   │   ├── 1710000000000-UpdateUserAndWalletEntities.ts
│   │   ├── 1714384861234-InitialSchema.ts
│   │   ├── 1714384962345-AddNftAndTokenTables.ts
│   │   ├── 1714386000000-AddSecurityTables.ts
│   │   ├── 1743120000000-FixWalletUserIdInconsistency.ts
│   │   ├── 1743281500000-FixUserSessionsAndDevicesTables.ts
│   │   ├── 1743281728126-AddMissingColumns.ts
│   │   ├── 1743283000000-FixDbTables.ts
│   │   ├── 1743400000000-FixColumnInconsistencies.ts
│   │   ├── 1743500000000-FixUserColumnsNames.ts
│   │   ├── 1743600000000-UpdateUsersTableToUUID.ts
│   │   ├── 1743700000000-CreateProfileTable.ts
│   │   └── 1750000000000-StandardizeUserIds.ts
│   ├── nft/
│   │   ├── entities/
│   │   │   └── nft.entity.ts
│   │   ├── nft.controller.ts
│   │   ├── nft.module.ts
│   │   └── nft.service.ts
│   ├── profile/
│   │   ├── dto/
│   │   │   ├── geo-location.dto.ts
│   │   │   └── profile.dto.ts
│   │   ├── entities/
│   │   │   └── profile.entity.ts
│   │   ├── geo-location.service.ts
│   │   ├── profile.controller.ts
│   │   ├── profile-error-handler.service.ts
│   │   ├── profile.module.ts
│   │   ├── profile.service.ts
│   │   └── tests/
│   │       ├── profile-completion.test.ts
│   │       └── profile-controller.integration.test.ts
│   ├── referral/
│   │   ├── dto/
│   │   │   ├── create-referral.dto.ts
│   │   │   └── toggle-referral-code.dto.ts
│   │   ├── entities/
│   │   │   ├── referral-code.entity.ts
│   │   │   └── referral.entity.ts
│   │   ├── referral.controller.ts
│   │   ├── referral.module.ts
│   │   └── referral.service.ts
│   ├── run-migration.ts
│   ├── scripts/
│   │   ├── diagnose-wallet-auth.ts
│   │   ├── fix-schema.ts
│   │   └── reset-db.ts
│   ├── shared/
│   │   ├── config/
│   │   │   └── cors.config.ts
│   │   ├── dto/
│   │   │   └── pagination-params.dto.ts
│   │   ├── exceptions/
│   │   │   └── domain.exceptions.ts
│   │   ├── filters/
│   │   │   └── global-exception.filter.ts
│   │   ├── interfaces/
│   │   │   └── request-with-user.interface.ts
│   │   ├── middleware/
│   │   │   └── dev-bypass.middleware.ts
│   │   ├── modules/
│   │   │   └── device-detector.module.ts
│   │   ├── services/
│   │   │   ├── bcrypt.service.ts
│   │   │   ├── device-detector.service.ts
│   │   │   ├── error-handling.service.ts
│   │   │   └── memory-monitor.service.ts
│   │   ├── shared.module.ts
│   │   ├── testing/
│   │   │   ├── auth-test.script.ts
│   │   │   ├── auth-test.util.ts
│   │   │   ├── token-test.ts
│   │   │   ├── wallet-auth-comprehensive-test.ts
│   │   │   ├── wallet-debug-test.ts
│   │   │   └── wallet-login-test.ts
│   │   └── utils/
│   │       └── debug-logger.util.ts
│   ├── swagger-config.ts
│   ├── test-alive-connection.ts
│   ├── token/
│   │   ├── entities/
│   │   │   └── token-transaction.entity.ts
│   │   ├── token.controller.ts
│   │   ├── token.module.ts
│   │   └── token.service.ts
│   ├── typeorm.config.ts
│   ├── @types/
│   │   ├── express.d.ts
│   │   ├── jest.d.ts
│   │   └── jest/
│   │       └── index.d.ts
│   ├── types/
│   │   ├── express-multer.d.ts
│   │   ├── keccak256.d.ts
│   │   └── merkletreejs.d.ts
│   ├── users/
│   │   ├── controllers/
│   │   │   └── user-devices.controller.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   ├── entities/
│   │   │   ├── user-device.entity.ts
│   │   │   ├── user.entity.ts
│   │   │   └── user-session.entity.ts
│   │   ├── enums/
│   │   │   └── user-role.enum.ts
│   │   ├── services/
│   │   │   ├── user-devices.service.ts
│   │   │   ├── user-devices.service.ts.bak
│   │   │   ├── user-sessions.service.ts
│   │   │   └── user-sessions.service.ts.bak
│   │   ├── users.controller.ts
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   └── users.service.ts.bak
│   ├── wallets/
│   │   ├── entities/
│   │   │   └── wallet.entity.ts
│   │   ├── wallets.controller.ts
│   │   ├── wallets.module.ts
│   │   └── wallets.service.ts
│   └── __tests__/
│       ├── api.spec.ts
│       ├── auth/
│       │   ├── auth.spec.ts
│       │   ├── password-reset.spec.ts
│       │   └── session-management.spec.ts
│       ├── auth.spec2.ts
│       ├── basic.spec.ts
│       ├── blockchain/
│       │   ├── hotwallet-basic.spec.ts
│       │   ├── hotwallet.spec.js
│       │   ├── hotwallet.spec.ts
│       │   ├── hotwallet-wrapper.ts
│       │   ├── mock-providers.js
│       │   ├── mock-providers.legacy.js
│       │   ├── mock-providers.ts
│       │   ├── nft.spec.ts
│       │   └── shahi-token.service.spec.ts
│       ├── game/
│       │   ├── integration/
│       │   │   ├── content-viewing.spec.ts
│       │   │   ├── media-access.spec.ts
│       │   │   ├── module-navigation.spec.ts
│       │   │   └── module-unlock.spec.ts
│       │   └── services/
│       │       ├── game-achievements.service.spec.ts
│       │       ├── game-modules.service.spec.ts
│       │       ├── game-notification.service.spec.ts
│       │       ├── game-sections.service.spec.ts
│       │       ├── media.service.spec.ts
│       │       ├── module-unlock.service.spec.ts
│       │       ├── quiz.service.spec.ts
│       │       ├── rewards.service.spec.ts
│       │       ├── section-content.service.spec.ts
│       │       └── user-progress.service.spec.ts
│       ├── integration.spec.ts
│       ├── jest-setup.ts
│       ├── minimal.spec.ts
│       ├── mock-app.module.ts
│       ├── mocks/
│       │   ├── auth.service.mock.ts
│       │   ├── blockchain.module.mock.ts
│       │   ├── blockchain.service.mock.ts
│       │   ├── device-detector.service.mock.ts
│       │   ├── user-devices.service.mock.ts
│       │   ├── user.entity.mock.ts
│       │   ├── user-sessions.service.mock.ts
│       │   └── wallet.entity.mock.ts
│       ├── referral.controller.spec.ts
│       ├── referral.service.spec.ts
│       ├── setup.js
│       ├── setup.ts
│       ├── test-app.module.ts
│       ├── test.module.ts
│       ├── test-overrides.ts
│       ├── test-utils.ts
│       └── utils/
│           └── test-utils.ts
├── start-app.js
├── test/
│   └── profile-completion.e2e-spec.ts
├── test-db-connection.js
├── test-setup.js
├── tsconfig.build.json
├── tsconfig.build.simple.json
├── tsconfig.build.tsbuildinfo
├── tsconfig.json
├── tsconfig.test.json
├── tsconfig.tsbuildinfo
├── typeorm.config.ts
├── typescript-error-fixes.log
└── webpack.config.js
```