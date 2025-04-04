/**
 * Encryption utilities for diary media content
 * Uses Web Crypto API for client-side encryption
 */

/**
 * Encrypt data with the provided key
 * @param data Data to encrypt
 * @param key Encryption key
 * @returns Encrypted data as ArrayBuffer
 */
export const encrypt = async (data: ArrayBuffer, key: Uint8Array): Promise<ArrayBuffer> => {
  try {
    // Import the raw key
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    // Generate an initialization vector (IV)
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the data
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      cryptoKey,
      data
    );
    
    // Combine IV and encrypted data for storage
    // IV needs to be stored with the encrypted data for decryption later
    const combinedData = new Uint8Array(iv.length + encryptedData.byteLength);
    combinedData.set(iv, 0);
    combinedData.set(new Uint8Array(encryptedData), iv.length);
    
    return combinedData.buffer;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt data with the provided key
 * @param encryptedData Encrypted data to decrypt
 * @param key Decryption key
 * @returns Decrypted data as ArrayBuffer
 */
export const decrypt = async (encryptedData: ArrayBuffer, key: Uint8Array): Promise<ArrayBuffer> => {
  try {
    // Extract IV from the beginning of the data
    const iv = new Uint8Array(encryptedData.slice(0, 12));
    const dataToDecrypt = new Uint8Array(encryptedData.slice(12));
    
    // Import the raw key
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    // Decrypt the data
    return await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      cryptoKey,
      dataToDecrypt
    );
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Store encrypted media in local storage with the diary entry ID
 * @param diaryId ID of the diary entry
 * @param mediaType Type of media ('audio' or 'video')
 * @param encryptedData Encrypted media data
 * @param encryptionKey Encryption key
 */
export const storeEncryptedMedia = (
  diaryId: string,
  mediaType: 'audio' | 'video',
  encryptedData: ArrayBuffer,
  encryptionKey: Uint8Array
): void => {
  try {
    // Convert ArrayBuffer to Base64 string for storage
    const base64Data = arrayBufferToBase64(encryptedData);
    const base64Key = arrayBufferToBase64(encryptionKey.buffer);
    
    // Store in localStorage with unique key
    const storageKey = `diary_${diaryId}_${mediaType}`;
    const storageData = {
      data: base64Data,
      key: base64Key,
      type: mediaType,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(storageKey, JSON.stringify(storageData));
  } catch (error) {
    console.error('Failed to store encrypted media:', error);
    throw new Error('Failed to store encrypted media locally');
  }
};

/**
 * Retrieve encrypted media from local storage
 * @param diaryId ID of the diary entry
 * @param mediaType Type of media ('audio' or 'video')
 * @returns Object containing encrypted data and key
 */
export const retrieveEncryptedMedia = (
  diaryId: string,
  mediaType: 'audio' | 'video'
): { data: ArrayBuffer; key: Uint8Array } | null => {
  try {
    const storageKey = `diary_${diaryId}_${mediaType}`;
    const storedData = localStorage.getItem(storageKey);
    
    if (!storedData) return null;
    
    const parsedData = JSON.parse(storedData);
    
    return {
      data: base64ToArrayBuffer(parsedData.data),
      key: base64ToUint8Array(parsedData.key)
    };
  } catch (error) {
    console.error('Failed to retrieve encrypted media:', error);
    return null;
  }
};

/**
 * Convert ArrayBuffer to Base64 string
 */
const arrayBufferToBase64 = (buffer: ArrayBufferLike): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return window.btoa(binary);
};

/**
 * Convert Base64 string to ArrayBuffer
 */
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
};

/**
 * Convert Base64 string to Uint8Array
 */
const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
};