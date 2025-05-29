/**
 * Wallet Authentication Provider
 * This file re-exports the WalletAuthenticator class from walletAuth.ts
 * to maintain backward compatibility with existing code.
 */

import { WalletAuthenticator, AuthChallenge, AuthResult } from "./walletAuth";

export type { WalletAuthenticator, AuthChallenge, AuthResult };