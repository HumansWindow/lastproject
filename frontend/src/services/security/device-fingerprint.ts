/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from './modules/device-fingerprint' instead.
 * 
 * Device Fingerprinting Service
 * This file is a re-export of the proper implementation.
 */

import { getDeviceFingerprint as getFingerprint } from './modules/index';

/**
 * Generates a device fingerprint by gathering information about the user's device
 * and creating a hash from it.
 */
export async function getDeviceFingerprint(): Promise<string> {
  return await getFingerprint();
}

const fingerprintService = {
  getDeviceFingerprint
};

export default fingerprintService;