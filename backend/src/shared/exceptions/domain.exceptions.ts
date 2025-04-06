import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base class for all domain exceptions
 * Helps to distinguish between domain-specific errors and system errors
 */
export class DomainException extends HttpException {
  constructor(message: string, status: HttpStatus) {
    super(message, status);
  }
}

/**
 * Exception for wallet-related errors
 */
export class WalletException extends DomainException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}

/**
 * Exception for blockchain operation failures
 */
export class BlockchainException extends DomainException {
  constructor(
    message: string,
    readonly transactionHash?: string,
    readonly reason?: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, status);
  }
}

/**
 * Exception for minting operation failures
 */
export class MintingException extends BlockchainException {
  constructor(message: string, transactionHash?: string, reason?: string) {
    super(message, transactionHash, reason);
  }
}

/**
 * Exception for token-related errors
 */
export class TokenException extends DomainException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}

/**
 * Exception for staking-related errors
 */
export class StakingException extends DomainException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}

/**
 * Exception for NFT-related errors
 */
export class NFTException extends DomainException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}

/**
 * Exception for referral system errors
 */
export class ReferralException extends DomainException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}

/**
 * Exception for user account actions
 */
export class UserException extends DomainException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}

/**
 * Exception for authentication failures
 */
export class AuthenticationException extends DomainException {
  constructor(message: string, status: HttpStatus = HttpStatus.UNAUTHORIZED) {
    super(message, status);
  }
}

/**
 * Exception for device validation errors
 */
export class DeviceException extends DomainException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}

/**
 * Exception for diary-related errors
 */
export class DiaryException extends DomainException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}

/**
 * Exception for rate limiting
 */
export class RateLimitException extends DomainException {
  constructor(message: string = 'Too many requests') {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}