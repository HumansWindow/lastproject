declare module 'jsencrypt' {
  export default class JSEncrypt {
    constructor(options?: { default_key_size?: string | number; default_public_exponent?: string | number });
    setPublicKey(publicKey: string): void;
    setPrivateKey(privateKey: string): void;
    encrypt(text: string): string | false;
    decrypt(text: string): string | false;
    getPublicKey(): string;
    getPrivateKey(): string;
    // Add missing methods
    getKey(): void;
    sign(str: string, digestMethod: any, digestName: string): string | false;
    verify(str: string, signature: string, digestMethod: any): boolean;
  }
}