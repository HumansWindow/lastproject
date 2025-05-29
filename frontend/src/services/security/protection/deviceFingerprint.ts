/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '../device-fingerprint.ts' or '../modules/device-fingerprint' instead.
 */

import { getDeviceFingerprint } from '../device-fingerprint';
import type { DeviceInfo } from '../modules/device-fingerprint';

// Re-export for backward compatibility
export type { DeviceInfo };

// Export the function with old name for backward compatibility
export { getDeviceFingerprint };

// Export legacy interface for compatibility
export const deviceFingerprint = {
  getDeviceFingerprint,
};

export default deviceFingerprint;