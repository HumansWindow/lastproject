# ID and Property Standardization Fix Plan

## Overview

This document outlines a systematic approach to fixing the TypeScript errors in the game backend module, focusing on standardizing ID field naming conventions and addressing property mismatches between TypeScript entities and PostgreSQL database fields.

## Current Issues

1. **Inconsistent ID naming conventions**:
   - TypeScript code uses: `id`, `userId`, `moduleId`, etc. (camelCase)
   - Database uses: `id`, `user_id`, `module_id`, etc. (snake_case)
   - Code tries to access both naming styles interchangeably, causing TypeScript errors

2. **Property naming mismatches**:
   - PostgreSQL database uses snake_case: `order_index`, `wait_time_hours`, etc.
   - TypeScript entities should use camelCase: `orderIndex`, `waitTimeHours`, etc.
   - No proper @Column decorators to map between the two styles

3. **Entity naming inconsistencies**:
   - Some entities have `Entity` suffix in their class names, others don't
   - Imports and usages don't match the actual class names

## Current Progress (May 4, 2025)

We've created and executed scripts that have fixed a significant portion of the TypeScript errors, reducing them from 277 to 132 errors across 17 files:

1. **First Script (fix-typescript-errors.js)**
   - Fixed property naming conventions in services and DTOs
   - Updated TypeORM query conditions to use camelCase
   - Fixed service file imports

2. **Second Script (fix-entity-imports.js)**
   - Fixed entity import statements in 3 files
   - Updated DTO classes in 3 files
   - Fixed missing imports in 2 files
   - Created missing achievement-related files

3. **Manual Fixes**
   - Fixed UserProgress entity by adding missing fields (`sectionId`, `startedAt`, `completedAt`)
   - Updated SectionCheckpoint entity with missing fields (`progressId`, `checkpointType`)
   - Fixed entity naming conflicts in game.module.ts
   - Fixed `GameModuleWithSectionsDto` class in module.dto.ts
   - Fixed TypeORM query syntax in 3 service files

## Current Error Distribution (132 errors in 17 files)

```
Errors  Files
     1  src/game/controllers/quiz.controller.ts:51
     1  src/game/dto/progress.dto.ts:3
     1  src/game/dto/section.dto.ts:57
     2  src/game/dto/unlock.dto.ts:100
     1  src/game/game.module.ts:28
    66  src/game/services/game-achievements.service.ts:28
     2  src/game/services/game-modules.service.spec.ts:5
     5  src/game/services/game-modules.service.ts:11
     3  src/game/services/game-notification.service.ts:620
     3  src/game/services/game-sections.service.spec.ts:5
     2  src/game/services/game-sections.service.ts:442
     4  src/game/services/media.service.ts:4
     1  src/game/services/module-unlock.service.ts:247
    11  src/game/services/quiz.service.ts:51
     8  src/game/services/rewards.service.ts:51
    19  src/game/services/user-progress.service.ts:96
     2  src/game/services/notification-sender.task.ts:16
```

## Fix Checklist

### 1. Fix Entity Class Definitions

- [x] Create utility script to automate adding decorators
- [x] Fix entity class naming conflicts in game.module.ts
- [x] Add missing fields to UserProgress entity
- [x] Add missing fields to SectionCheckpoint entity
- [ ] Fix remaining entity files with proper TypeORM column decorators

### 2. Update Service and Repository Files

- [x] Fix some property access in services (snake_case to camelCase)
- [x] Update many TypeORM query conditions to use camelCase
- [ ] Fix remaining service files that reference snake_case properties
- [ ] Fix repository method parameter types

### 3. Fix DTO and Interface Issues

- [x] Fix duplicate SectionQuizResultDto
- [x] Fix circular references in unlock.dto.ts
- [x] Create missing media.dto.ts
- [x] Create missing achievement DTOs
- [ ] Fix remaining DTO property mismatches

### 4. Validate and Test

- [ ] Run TypeScript compiler after fixes
- [ ] Test core functionality to ensure backward compatibility

## Remaining Issues to Fix

The most problematic files with the highest number of errors are:

1. **game-achievements.service.ts** (66 errors)
   - Many references to snake_case properties like `icon_url` instead of camelCase `iconUrl`
   - TypeORM FindOptions using incorrect property names
   - Entity mapping issues between DTOs and entities

2. **user-progress.service.ts** (19 errors)
   - References to snake_case properties like `section_id` instead of camelCase `sectionId`
   - TypeORM FindOptions using incorrect property names

3. **quiz.service.ts** (11 errors)
   - Type mismatches between DTOs and entities
   - Return type issues in service methods

4. **rewards.service.ts** (8 errors)
   - Integration issues with blockchain module
   - Type mismatches in reward calculation methods

## Implementation Plan

1. **Day 1 (May 5): Focus on game-achievements.service.ts**
   - Create a specialized script to fix property access patterns
   - Fix the 66 errors in this file manually if needed

2. **Day 2 (May 6): Fix user-progress.service.ts and quiz.service.ts**
   - Address the 19 errors in user-progress.service.ts
   - Fix the 11 errors in quiz.service.ts

3. **Day 3 (May 7): Fix rewards.service.ts and remaining files**
   - Fix the 8 errors in rewards.service.ts
   - Address issues in files with fewer errors

4. **Day 4 (May 8): Final validation**
   - Run TypeScript compiler after all fixes
   - Fix any remaining edge cases

## Recent Progress (May 4, 2025 Update)

We've successfully fixed three key files:

1. **module.dto.ts**
   - Fixed the `GameModuleWithSectionsDto` class by properly typing the sections property as `GameSectionDto[]` instead of `any[]`
   - Added required imports

2. **game-achievements.service.ts**
   - Fixed variable shadowing in the `unlockAchievement` method
   - Corrected property references from snake_case `icon_url` to camelCase `iconUrl`
   - Fixed TypeORM syntax by replacing comment-based operators with proper syntax
   - Corrected parameter references in the `getAchievementDetails` method

3. **game-notification.service.ts**
   - Fixed TypeORM query syntax by replacing commented operators with proper TypeORM operator syntax
   - Fixed null checks and conditional expressions

4. **user-progress.service.ts**
   - Fixed TypeORM query syntax by replacing commented operators like `/*in*/` with proper TypeORM syntax like `{ in: sectionIds }`

## Recommended Long-Term Solution

After fixing the immediate errors, we recommend implementing these long-term solutions:

1. **Create entity base classes** with standard TypeORM decorators
2. **Implement automatic column mapping** with custom decorators
3. **Add integration tests** that verify entity-database field mapping
4. **Document naming conventions** in your project standards