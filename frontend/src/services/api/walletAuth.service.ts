/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from './modules/auth' instead.
 */

import { walletAuthService as walletAuthImpl } from './modules/auth';
import type { WalletChallenge, WalletAuthRequest, AuthResponse } from './modules/auth';

// Re-export for backward compatibility
export { WalletChallenge, WalletAuthRequest, AuthResponse };

// Export the wallet auth service with previous API method names
export const walletAuthService = {
  // Map the old methods to the new implementations
  authenticate: walletAuthImpl.authenticate.bind(walletAuthImpl),
  getChallenge: walletAuthImpl.requestChallenge.bind(walletAuthImpl),
  isWalletLinked: walletAuthImpl.isWalletLinked.bind(walletAuthImpl),
};

export default walletAuthService;