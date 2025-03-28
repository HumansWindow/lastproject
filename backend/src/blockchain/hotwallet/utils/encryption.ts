import crypto from 'crypto';

type EncryptableData = string | object | Buffer;
type WalletCollection = Record<string, Record<string, any>>;

/**
 * Encrypts data using AES-256-CBC
 * @param {string|Object} data - Data to encrypt (objects will be stringified)
 * @param {string} key - Encryption key
 * @returns {string} - Encrypted data as hex string with IV prepended
 */
export function encrypt(data: EncryptableData, key: string): string {
  try {
    // Convert data to string if it's an object
    if (typeof data === 'object') {
      data = JSON.stringify(data);
    }

    // Generate a secure IV
    const iv = crypto.randomBytes(16);

    // Create key buffer from the provided key
    const keyBuffer = crypto.createHash('sha256').update(String(key)).digest();

    // Create cipher using AES-256-CBC
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);

    // Encrypt the data
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Prepend the IV to the encrypted data (IV is needed for decryption)
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts data using AES-256-CBC
 * @param {string} encryptedData - Encrypted data with IV prepended
 * @param {string} key - Decryption key (same as encryption key)
 * @returns {string|Object} - Decrypted data (parsed as JSON if possible)
 */
export function decrypt(encryptedData: string, key: string): string | object {
  try {
    // Split the encrypted data to get the IV and the actual encrypted content
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    // Create key buffer from the provided key
    const keyBuffer = crypto.createHash('sha256').update(String(key)).digest();

    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);

    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    // Try to parse as JSON if possible
    try {
      return JSON.parse(decrypted);
    } catch (e) {
      // If not valid JSON, return as string
      return decrypted;
    }
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Securely wipes sensitive data from memory by overwriting it
 * @param {string|Buffer|Object|Array} data - Data to be wiped from memory
 */
export function wipeMemory(data: EncryptableData): null {
  try {
    if (!data) return null;

    // Handle different data types
    if (Buffer.isBuffer(data)) {
      // For Buffer objects, fill with zeros
      data.fill(0);
    } else if (typeof data === 'string') {
      // Can't directly modify strings in JavaScript, but we can make sure
      // the reference is removed by the caller
      return null;
    } else if (Array.isArray(data)) {
      // For arrays, overwrite each element then empty the array
      for (let i = 0; i < data.length; i++) {
        if (typeof data[i] === 'object') {
          wipeMemory(data[i]);
        } else {
          data[i] = 0;
        }
      }
      data.length = 0;
    } else if (typeof data === 'object') {
      // For objects, recursively wipe each property then delete all properties
      Object.keys(data).forEach((key) => {
        if (typeof data[key] === 'object') {
          wipeMemory(data[key]);
        } else {
          data[key] = typeof data[key] === 'string' ? '' : 0;
        }
        delete data[key];
      });
    }

    // Let the caller know they should set their reference to null
    return null;
  } catch (error) {
    console.error('Memory wiping error:', error);
    return null;
  }
}

/**
 * Generates a secure random key of specified length
 * @param {number} length - Length of the key to generate (in bytes)
 * @returns {string} - Hex string representation of the key
 */
export function generateKey(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Rotate encryption keys and re-encrypt private keys
 * @param {Object} wallets - Current wallets collection
 * @param {string} oldKey - Old encryption key
 * @param {string} newKey - New encryption key
 * @returns {Object} - Updated wallets collection
 */
export function rotateEncryptionKey(
  wallets: WalletCollection,
  oldKey: string,
  newKey: string
): WalletCollection {
  if (!oldKey || !newKey || oldKey === newKey) {
    throw new Error('Invalid keys for rotation');
  }
  
  const rotatedWallets = {};
  
  // For each network
  Object.entries(wallets).forEach(([network, networkWallets]) => {
    rotatedWallets[network] = {};
    
    // For each wallet in the network
    Object.entries(networkWallets).forEach(([address, wallet]) => {
      // Clone the wallet object
      const rotatedWallet = { ...wallet };
      
      // Only re-encrypt if the wallet's private key is encrypted
      if (wallet.encrypted && wallet.privateKey) {
        // Decrypt with old key
        const decryptedPrivateKey = decrypt(wallet.privateKey, oldKey);
        
        // Re-encrypt with new key
        rotatedWallet.privateKey = encrypt(decryptedPrivateKey, newKey);
        
        // Make sure to wipe the decrypted key from memory
        wipeMemory({ decryptedPrivateKey });
      }
      
      // Store the rotated wallet
      rotatedWallets[network][address] = rotatedWallet;
    });
  });
  
  return rotatedWallets;
}

// Export default with proper types
export default {
  encrypt,
  decrypt,
  wipeMemory,
  generateKey,
  rotateEncryptionKey,
} as const;
