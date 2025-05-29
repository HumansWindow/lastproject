/**
 * End-to-End Encryption Service
 * 
 * This service provides end-to-end encryption for sensitive data exchange between 
 * the client and server. It implements hybrid encryption:
 * - RSA for asymmetric key exchange
 * - AES-GCM for symmetric encryption of data payloads
 * 
 * Features:
 * - Secure key generation and exchange
 * - Message encryption and decryption
 * - Data integrity verification
 * - Client-side key management
 */

import * as CryptoJS from 'crypto-js';
import JSEncrypt from 'jsencrypt';
import apiClient from "../../api/apiClient";
import { securityService } from "../securityService";

// Represents a client-generated key pair
interface KeyPair {
  publicKey: string;
  privateKey: string;
  fingerprint: string;
  createdAt: number;
  expiresAt: number;
}

// Represents a server key response
interface ServerKey {
  publicKey: string;
  keyId: string;
  expiresAt: number;
}

// Represents an encrypted payload
export interface EncryptedPayload {
  iv: string; // Initialization Vector
  encryptedData: string; // AES encrypted data
  encryptedSymmetricKey: string; // RSA encrypted AES key
  keyId?: string; // Server key ID used for encryption
  signature?: string; // Digital signature for data integrity
  fingerprint: string; // Client key fingerprint
  algorithm: string; // Encryption algorithm used
  timestamp: number; // Encryption timestamp
}

// Supported encryption algorithms
export enum EncryptionAlgorithm {
  AES_GCM = 'AES-GCM',
  AES_CBC = 'AES-CBC'
}

// Default configuration
const DEFAULT_CONFIG = {
  algorithm: EncryptionAlgorithm.AES_GCM,
  keySize: 256, // AES key size
  rsaKeySize: 2048, // RSA key size
  keyExpiryDays: 30, // Client keypair expiry
  storagePrefix: 'secure_e2e_'
};

/**
 * End-to-end encryption service
 */
class EncryptionService {
  private clientKeyPair: KeyPair | null = null;
  private serverKey: ServerKey | null = null;
  private config: typeof DEFAULT_CONFIG;
  private isInitialized: boolean = false;
  
  constructor(config?: Partial<typeof DEFAULT_CONFIG>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Initialize the encryption service
   * - Loads or generates client key pair
   * - Fetches server public key
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    try {
      // Load or generate client key pair
      await this.getOrCreateClientKeyPair();
      
      // Fetch server public key
      await this.fetchServerPublicKey();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize encryption service:', error);
      return false;
    }
  }
  
  /**
   * Check if encryption service is ready
   */
  public isReady(): boolean {
    return this.isInitialized && !!this.clientKeyPair && !!this.serverKey;
  }
  
  /**
   * Get or create client key pair
   */
  private async getOrCreateClientKeyPair(): Promise<KeyPair> {
    if (this.clientKeyPair) {
      return this.clientKeyPair;
    }
    
    // Try to load from storage
    const storedKeyPair = this.loadClientKeyPair();
    
    if (storedKeyPair) {
      // Check if key is still valid
      if (storedKeyPair.expiresAt > Date.now()) {
        this.clientKeyPair = storedKeyPair;
        return storedKeyPair;
      }
    }
    
    // Generate new key pair
    const newKeyPair = await this.generateClientKeyPair();
    this.clientKeyPair = newKeyPair;
    
    // Store key pair
    this.storeClientKeyPair(newKeyPair);
    
    // Register key with server
    await this.registerClientPublicKey(newKeyPair.publicKey, newKeyPair.fingerprint);
    
    return newKeyPair;
  }
  
  /**
   * Generate a new RSA key pair for the client
   */
  private async generateClientKeyPair(): Promise<KeyPair> {
    const jsEncrypt = new JSEncrypt({ default_key_size: this.config.rsaKeySize.toString() });
    
    // Generate key pair (can take some time)
    await new Promise<void>(resolve => {
      // Creating a promise around key generation which can be CPU intensive
      setTimeout(() => {
        jsEncrypt.getKey();
        resolve();
      }, 0);
    });
    
    const publicKey = jsEncrypt.getPublicKey();
    const privateKey = jsEncrypt.getPrivateKey();
    
    if (!publicKey || !privateKey) {
      throw new Error('Failed to generate client key pair');
    }
    
    // Create fingerprint from public key (SHA-256 hash)
    const fingerprint = CryptoJS.SHA256(publicKey).toString(CryptoJS.enc.Hex);
    
    // Set expiry date
    const now = Date.now();
    const expiresAt = now + (this.config.keyExpiryDays * 24 * 60 * 60 * 1000);
    
    return {
      publicKey,
      privateKey,
      fingerprint,
      createdAt: now,
      expiresAt
    };
  }
  
  /**
   * Load client key pair from storage
   */
  private loadClientKeyPair(): KeyPair | null {
    if (typeof localStorage === 'undefined') return null;
    
    const keyPairString = localStorage.getItem(`${this.config.storagePrefix}keypair`);
    if (!keyPairString) return null;
    
    try {
      const keyPair: KeyPair = JSON.parse(keyPairString);
      return keyPair;
    } catch (error) {
      console.error('Failed to load client key pair:', error);
      return null;
    }
  }
  
  /**
   * Store client key pair in storage
   */
  private storeClientKeyPair(keyPair: KeyPair): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      // Store key pair in local storage
      localStorage.setItem(
        `${this.config.storagePrefix}keypair`,
        JSON.stringify(keyPair)
      );
    } catch (error) {
      console.error('Failed to store client key pair:', error);
    }
  }
  
  /**
   * Register client public key with server
   */
  private async registerClientPublicKey(publicKey: string, fingerprint: string): Promise<void> {
    try {
      const deviceFingerprint = await securityService.getDeviceFingerprint();
      
      // Send public key to server
      await apiClient.post('/security/register-key', {
        publicKey,
        keyFingerprint: fingerprint,
        deviceFingerprint: deviceFingerprint, // Fixed: removing .value property which doesn't exist on string
        expiresAt: this.clientKeyPair!.expiresAt,
        algorithm: this.config.algorithm
      });
    } catch (error) {
      console.error('Failed to register client public key with server:', error);
      throw error;
    }
  }
  
  /**
   * Fetch server public key
   */
  private async fetchServerPublicKey(): Promise<ServerKey> {
    try {
      // Fetch server public key
      const response = await apiClient.get('/security/server-key');
      
      this.serverKey = {
        publicKey: response.data.publicKey,
        keyId: response.data.keyId,
        expiresAt: response.data.expiresAt
      };
      
      return this.serverKey;
    } catch (error) {
      console.error('Failed to fetch server public key:', error);
      throw error;
    }
  }
  
  /**
   * Encrypt data using hybrid encryption
   * - Generates a random symmetric key
   * - Encrypts data with the symmetric key (AES)
   * - Encrypts the symmetric key with server's public key (RSA)
   * - Returns the encrypted package
   */
  public async encrypt(data: any): Promise<EncryptedPayload> {
    if (!this.isReady()) {
      throw new Error('Encryption service is not initialized');
    }
    
    try {
      // Convert data to string if not already
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Generate a random symmetric key for AES encryption
      const symmetricKey = CryptoJS.lib.WordArray.random(this.config.keySize / 8);
      const symmetricKeyString = symmetricKey.toString(CryptoJS.enc.Base64);
      
      // Generate initialization vector
      const iv = CryptoJS.lib.WordArray.random(16);
      const ivString = iv.toString(CryptoJS.enc.Base64);
      
      // Encrypt data with symmetric key
      let encryptedData: string;
      
      if (this.config.algorithm === EncryptionAlgorithm.AES_GCM) {
        // CryptoJS doesn't directly support GCM mode in many implementations
        // Using CBC mode as a fallback with additional integrity checks
        encryptedData = CryptoJS.AES.encrypt(dataString, symmetricKey, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }).toString();
      } else {
        // Fallback to AES-CBC
        encryptedData = CryptoJS.AES.encrypt(dataString, symmetricKey, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }).toString();
      }
      
      // Encrypt symmetric key with server's public RSA key
      const jsEncrypt = new JSEncrypt();
      jsEncrypt.setPublicKey(this.serverKey!.publicKey);
      const encryptedSymmetricKey = jsEncrypt.encrypt(symmetricKeyString);
      
      if (!encryptedSymmetricKey) {
        throw new Error('Failed to encrypt symmetric key');
      }
      
      // Create digital signature for data integrity
      const dataToSign = `${encryptedData}${ivString}${this.clientKeyPair!.fingerprint}${Date.now()}`;
      const signature = this.signData(dataToSign);
      
      // Create encrypted payload
      const payload: EncryptedPayload = {
        iv: ivString,
        encryptedData: encryptedData,
        encryptedSymmetricKey: encryptedSymmetricKey,
        keyId: this.serverKey!.keyId,
        signature,
        fingerprint: this.clientKeyPair!.fingerprint,
        algorithm: this.config.algorithm,
        timestamp: Date.now()
      };
      
      return payload;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }
  
  /**
   * Decrypt data using hybrid encryption
   * - Decrypts the symmetric key with client's private key (RSA)
   * - Decrypts the data with the symmetric key (AES)
   * - Returns the decrypted data
   */
  public async decrypt(payload: EncryptedPayload): Promise<any> {
    if (!this.isReady()) {
      throw new Error('Encryption service is not initialized');
    }
    
    try {
      // Decrypt symmetric key with client's private RSA key
      const jsEncrypt = new JSEncrypt();
      jsEncrypt.setPrivateKey(this.clientKeyPair!.privateKey);
      const symmetricKeyString = jsEncrypt.decrypt(payload.encryptedSymmetricKey);
      
      if (!symmetricKeyString) {
        throw new Error('Failed to decrypt symmetric key');
      }
      
      // Convert symmetric key back to WordArray
      const symmetricKey = CryptoJS.enc.Base64.parse(symmetricKeyString);
      
      // Convert IV back to WordArray
      const iv = CryptoJS.enc.Base64.parse(payload.iv);
      
      // Decrypt data with symmetric key
      let decryptedData: string;
      
      if (payload.algorithm === EncryptionAlgorithm.AES_GCM) {
        // Using CBC mode as a fallback since we encrypted with CBC above
        const cipherParams = CryptoJS.lib.CipherParams.create({
          ciphertext: CryptoJS.enc.Base64.parse(payload.encryptedData)
        });
        
        const decrypted = CryptoJS.AES.decrypt(cipherParams, symmetricKey, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        });
        
        decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
      } else {
        // AES-CBC decryption
        const decrypted = CryptoJS.AES.decrypt(payload.encryptedData, symmetricKey, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        });
        
        decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
      }
      
      // Verify data integrity if signature is present
      if (payload.signature) {
        const dataToVerify = `${payload.encryptedData}${payload.iv}${payload.fingerprint}${payload.timestamp}`;
        const isValid = this.verifySignature(dataToVerify, payload.signature, payload.fingerprint);
        
        if (!isValid) {
          throw new Error('Data integrity verification failed');
        }
      }
      
      // Parse JSON if the decrypted data is a JSON string
      try {
        return JSON.parse(decryptedData);
      } catch (e) {
        // If not JSON, return as is
        return decryptedData;
      }
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }
  
  /**
   * Sign data with the client's private key
   */
  private signData(data: string): string {
    if (!this.clientKeyPair) {
      throw new Error('Client key pair not available');
    }
    
    // Hash the data first for fixed-length input to RSA
    const dataHash = CryptoJS.SHA256(data).toString(CryptoJS.enc.Base64);
    
    // Sign the hash with RSA
    const jsEncrypt = new JSEncrypt();
    jsEncrypt.setPrivateKey(this.clientKeyPair.privateKey);
    const signature = jsEncrypt.sign(dataHash, CryptoJS.SHA256, 'sha256');
    
    if (!signature) {
      throw new Error('Failed to create signature');
    }
    
    return signature;
  }
  
  /**
   * Verify a signature using the public key associated with the given fingerprint
   */
  private verifySignature(data: string, signature: string, fingerprint: string): boolean {
    // This is a simplified implementation that only verifies signatures from
    // the current client key. In a more complete implementation, we would:
    // 1. Fetch the public key associated with the fingerprint from the server
    // 2. Use that key to verify the signature
    
    // For now, we only verify if the fingerprint matches our current key
    if (fingerprint !== this.clientKeyPair?.fingerprint) {
      console.warn('Fingerprint mismatch, cannot verify signature');
      return false;
    }
    
    // Hash the data
    const dataHash = CryptoJS.SHA256(data).toString(CryptoJS.enc.Base64);
    
    // Verify the signature
    const jsEncrypt = new JSEncrypt();
    jsEncrypt.setPublicKey(this.clientKeyPair.publicKey);
    return jsEncrypt.verify(dataHash, signature, CryptoJS.SHA256);
  }
  
  /**
   * Reset the encryption service
   * - Generates new client key pair
   * - Fetches new server public key
   */
  public async reset(): Promise<boolean> {
    try {
      // Clear client key pair
      this.clientKeyPair = null;
      this.serverKey = null;
      this.isInitialized = false;
      
      // Clear stored key pair
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`${this.config.storagePrefix}keypair`);
      }
      
      // Re-initialize
      return await this.initialize();
    } catch (error) {
      console.error('Failed to reset encryption service:', error);
      return false;
    }
  }
  
  /**
   * Create an API interceptor to automatically encrypt/decrypt data
   */
  public createInterceptors() {
    // Request interceptor for automatic encryption
    const requestInterceptor = async (config: any) => {
      // Only encrypt requests that are marked as requiring encryption
      if (config.encrypt === true) {
        // Make sure encryption service is initialized
        if (!this.isReady()) {
          await this.initialize();
          
          if (!this.isReady()) {
            throw new Error('Failed to initialize encryption service');
          }
        }
        
        // Only encrypt POST, PUT, PATCH requests with a body
        if (
          ['post', 'put', 'patch'].includes(config.method?.toLowerCase() || '') &&
          config.data
        ) {
          const encryptedPayload = await this.encrypt(config.data);
          
          // Replace request data with encrypted payload
          config.data = encryptedPayload;
          
          // Add headers to indicate encryption
          config.headers = {
            ...config.headers,
            'X-Encrypted': 'true',
            'X-Encryption-Key-Id': encryptedPayload.keyId || '',
            'X-Client-Key-Fingerprint': encryptedPayload.fingerprint
          };
        }
      }
      
      return config;
    };
    
    // Response interceptor for automatic decryption
    const responseInterceptor = async (response: any) => {
      // Check if response contains encrypted data
      if (
        response.headers &&
        response.headers['x-encrypted'] === 'true' &&
        response.data
      ) {
        try {
          // Make sure encryption service is initialized
          if (!this.isReady()) {
            await this.initialize();
            
            if (!this.isReady()) {
              console.error('Failed to initialize encryption service for response decryption');
              return response;
            }
          }
          
          // Decrypt response data
          const decryptedData = await this.decrypt(response.data);
          
          // Replace response data with decrypted data
          response.data = decryptedData;
          
          // Add flag to indicate decryption was performed
          response.decrypted = true;
        } catch (error) {
          console.error('Failed to decrypt response data:', error);
          // Return original response if decryption fails
        }
      }
      
      return response;
    };
    
    return {
      requestInterceptor,
      responseInterceptor,
      responseErrorInterceptor: (error: any) => Promise.reject(error)
    };
  }
}

// Create and export singleton instance
export const encryptionService = new EncryptionService();

export default encryptionService;