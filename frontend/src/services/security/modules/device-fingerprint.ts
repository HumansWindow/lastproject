/**
 * Device Fingerprinting Module
 * 
 * This module provides device fingerprinting to identify devices consistently.
 */

export interface DeviceInfo {
  userAgent: string;
  browser: {
    name?: string;
    version?: string;
  };
  os: {
    name?: string;
    version?: string;
  };
  screen?: {
    width: number;
    height: number;
    colorDepth: number;
  };
  language?: string;
  timezone?: string;
}

/**
 * Generate a unique hash from input string
 */
function hashString(str: string): string {
  let hash = 0;
  if (str.length === 0) return hash.toString(36);
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Collect device information for fingerprinting
 */
export async function collectDeviceInfo(): Promise<DeviceInfo> {
  // Collect screen info
  const screenInfo = {
    width: window.screen.width,
    height: window.screen.height,
    colorDepth: window.screen.colorDepth
  };
  
  return {
    userAgent: window.navigator.userAgent,
    browser: {
      name: getBrowserName(),
      version: getBrowserVersion()
    },
    os: {
      name: getOSName(),
      version: getOSVersion()
    },
    screen: screenInfo,
    language: window.navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}

/**
 * Get browser name from user agent
 */
function getBrowserName(): string {
  const ua = window.navigator.userAgent;
  
  if (ua.indexOf("Firefox") > -1) return "Firefox";
  if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) return "Opera";
  if (ua.indexOf("Trident") > -1) return "Internet Explorer";
  if (ua.indexOf("Edge") > -1) return "Edge";
  if (ua.indexOf("Chrome") > -1) return "Chrome";
  if (ua.indexOf("Safari") > -1) return "Safari";
  
  return "Unknown";
}

/**
 * Get browser version from user agent
 */
function getBrowserVersion(): string {
  const ua = window.navigator.userAgent;
  
  // Extract version using regex
  const match = 
    ua.match(/(firefox|opera|chrome|safari|msie|trident|edge)[\/\s](\d+)/i);
  
  if (match) return match[2];
  return "Unknown";
}

/**
 * Get OS name from user agent
 */
function getOSName(): string {
  const ua = window.navigator.userAgent;
  
  if (ua.indexOf("Win") > -1) return "Windows";
  if (ua.indexOf("Mac") > -1) return "MacOS";
  if (ua.indexOf("Linux") > -1) return "Linux";
  if (ua.indexOf("Android") > -1) return "Android";
  if (ua.indexOf("iOS") > -1 || ua.indexOf("iPhone") > -1 || ua.indexOf("iPad") > -1) return "iOS";
  
  return "Unknown";
}

/**
 * Get OS version from user agent
 */
function getOSVersion(): string {
  const ua = window.navigator.userAgent;
  
  // Extract version using regex based on OS
  if (ua.indexOf("Windows") > -1) {
    const match = ua.match(/Windows NT (\d+\.\d+)/);
    if (match) return match[1];
  } else if (ua.indexOf("Mac") > -1) {
    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
    if (match) return match[1].replace('_', '.');
  }
  
  return "Unknown";
}

/**
 * Generate a fingerprint hash for the current device
 */
export async function generateDeviceFingerprint(): Promise<string> {
  try {
    const info = await collectDeviceInfo();
    
    // Create a string from collected info
    const fingerprintSource = [
      info.userAgent,
      `${info.browser.name}${info.browser.version}`,
      `${info.os.name}${info.os.version}`,
      `${info.screen?.width}x${info.screen?.height}x${info.screen?.colorDepth}`,
      info.language,
      info.timezone
    ].join('|');
    
    return hashString(fingerprintSource);
  } catch (err) {
    console.error("Failed to generate device fingerprint:", err);
    return `backup-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }
}

/**
 * Get device fingerprint (generate if necessary)
 */
export async function getDeviceFingerprint(): Promise<string> {
  // Try to get from storage first for consistency
  const storedFingerprint = localStorage.getItem('deviceFingerprint');
  
  if (storedFingerprint) {
    return storedFingerprint;
  }
  
  // Generate new fingerprint
  const fingerprint = await generateDeviceFingerprint();
  
  // Store for future use
  localStorage.setItem('deviceFingerprint', fingerprint);
  
  return fingerprint;
}

const deviceFingerprintModule = {
  getDeviceFingerprint,
  generateDeviceFingerprint,
  collectDeviceInfo
};

export default deviceFingerprintModule;