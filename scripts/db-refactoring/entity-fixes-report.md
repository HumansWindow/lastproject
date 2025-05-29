# Entity Fixes Report

Generated on: 2025-05-08T13:31:10.012Z

## Summary

- Total entities processed: 31
- Total changes made: 105
- Backups stored in: `backups/entities/2025-05-08T13:31:09.853Z`

## Changes by Entity

### minting-queue-item

File: `backend/src/blockchain/entities/minting-queue-item.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on updatedAt field

### minting-record

File: `backend/src/blockchain/entities/minting-record.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Removed duplicate @Column decorator on updatedAt field

### apy-tier

File: `backend/src/blockchain/entities/apy-tier.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Removed duplicate @Column decorator on updatedAt field

### wallet

File: `backend/src/blockchain/entities/wallet.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field

### staking-position

File: `backend/src/blockchain/entities/staking-position.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Removed duplicate @Column decorator on updatedAt field

### referral

File: `backend/src/referral/entities/referral.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Added name: "created_at" to @CreateDateColumn decorator

### token-transaction

File: `backend/src/token/entities/token-transaction.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Removed duplicate @Column decorator on updatedAt field
- Added name: "created_at" to @CreateDateColumn decorator
- Added name: "updated_at" to @UpdateDateColumn decorator

### nft

File: `backend/src/nft/entities/nft.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Removed duplicate @Column decorator on updatedAt field
- Added name: "created_at" to @CreateDateColumn decorator
- Added name: "updated_at" to @UpdateDateColumn decorator

### account

File: `backend/src/accounts/entities/account.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Removed duplicate @Column decorator on updatedAt field
- Added name: "created_at" to @CreateDateColumn decorator
- Added name: "updated_at" to @UpdateDateColumn decorator

### module-unlock-schedule

File: `backend/src/game/entities/module-unlock-schedule.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Removed duplicate @Column decorator on updatedAt field

### achievement

File: `backend/src/game/entities/achievement.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field

### content-template

File: `backend/src/game/entities/content-template.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Removed duplicate @Column decorator on updatedAt field
- Added name: "created_at" to @CreateDateColumn decorator
- Added name: "updated_at" to @UpdateDateColumn decorator

### game-module

File: `backend/src/game/entities/game-module.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Removed duplicate @Column decorator on updatedAt field

### collaboration-comment

File: `backend/src/game/entities/collaboration-comment.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Removed duplicate @Column decorator on updatedAt field

### media-asset

File: `backend/src/game/entities/media-asset.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Removed duplicate @Column decorator on updatedAt field

### section-unlock-schedule

File: `backend/src/game/entities/section-unlock-schedule.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Removed duplicate @Column decorator on updatedAt field

### content-approval

File: `backend/src/game/entities/content-approval.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Removed duplicate @Column decorator on updatedAt field

### user-notification

File: `backend/src/game/entities/user-notification.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Removed duplicate @Column decorator on updatedAt field
- Added name: "created_at" to @CreateDateColumn decorator
- Added name: "updated_at" to @UpdateDateColumn decorator

### user-progress

File: `backend/src/game/entities/user-progress.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Removed duplicate @Column decorator on updatedAt field

### section-content

File: `backend/src/game/entities/section-content.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Removed duplicate @Column decorator on updatedAt field

### game-notification-template

File: `backend/src/game/entities/game-notification-template.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Removed duplicate @Column decorator on updatedAt field
- Added name: "created_at" to @CreateDateColumn decorator
- Added name: "updated_at" to @UpdateDateColumn decorator

### section-checkpoint

File: `backend/src/game/entities/section-checkpoint.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Removed duplicate @Column decorator on updatedAt field

### module-notification-schedule

File: `backend/src/game/entities/module-notification-schedule.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on updatedAt field
- Added name: "updated_at" to @UpdateDateColumn decorator

### reward-transaction

File: `backend/src/game/entities/reward-transaction.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Removed duplicate @Column decorator on updatedAt field

### user-quiz-response

File: `backend/src/game/entities/quiz/user-quiz-response.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Removed duplicate @Column decorator on updatedAt field
- Added name: "created_at" to @CreateDateColumn decorator
- Added name: "updated_at" to @UpdateDateColumn decorator

### quiz

File: `backend/src/game/entities/quiz/quiz.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Removed duplicate @Column decorator on updatedAt field
- Added name: "created_at" to @CreateDateColumn decorator
- Added name: "updated_at" to @UpdateDateColumn decorator

### quiz-session

File: `backend/src/game/entities/quiz/quiz-session.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Removed duplicate @Column decorator on updatedAt field
- Added name: "created_at" to @CreateDateColumn decorator
- Added name: "updated_at" to @UpdateDateColumn decorator

### quiz-question

File: `backend/src/game/entities/quiz/quiz-question.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Removed duplicate @Column decorator on updatedAt field
- Added name: "created_at" to @CreateDateColumn decorator
- Added name: "updated_at" to @UpdateDateColumn decorator

### content-version

File: `backend/src/game/entities/content-version.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Added name: "created_at" to @CreateDateColumn decorator

### user-achievement

File: `backend/src/game/entities/user-achievement.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field

### game-section

File: `backend/src/game/entities/game-section.entity.ts`

Changes made:
- Removed duplicate @Column decorator on id field
- Removed duplicate @Column decorator on createdAt field
- Removed duplicate @Column decorator on updatedAt field

