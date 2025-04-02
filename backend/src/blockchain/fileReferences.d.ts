/**
 * This file helps TypeScript find modules and resolve import errors
 * by explicitly declaring file paths for modules that might not be discovered
 * during the initial compilation context.
 */

// Service declarations
declare module './services/staking.service' {
  import { StakingService } from './services/staking.service';
  export = StakingService;
}

declare module './services/user-minting-queue.service' {
  import { UserMintingQueueService } from './services/user-minting-queue.service';
  export = UserMintingQueueService;
}

// Controller declarations
declare module './controllers/token.controller' {
  import { TokenController } from './controllers/token.controller';
  export = TokenController;
}

declare module './controllers/staking.controller' {
  import { StakingController } from './controllers/staking.controller';
  export = StakingController;
}

declare module './controllers/token-minting.controller' {
  import { TokenMintingController } from './controllers/token-minting.controller';
  export = TokenMintingController;
}

// Entity declarations
declare module './entities/staking-position.entity' {
  import { StakingPosition } from './entities/staking-position.entity';
  export = StakingPosition;
}

declare module './entities/apy-tier.entity' {
  import { ApyTier } from './entities/apy-tier.entity';
  export = ApyTier;
}

declare module './entities/minting-record.entity' {
  import { MintingRecord } from './entities/minting-record.entity';
  export = MintingRecord;
}