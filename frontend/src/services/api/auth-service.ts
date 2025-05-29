/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from './auth' or './modules/auth' instead.
 */

import { authService } from './modules/auth';
import type { AuthResponse } from './modules/auth';

// Re-export for backward compatibility
export { AuthResponse };
export { authService };
export default authService;