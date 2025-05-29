import axios from 'axios';
import { WalletInfo } from '../core/wallet-base';

export interface AuthChallenge {
  challenge: string;
  message: string;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  userId?: string;
  isNewUser?: boolean;
  error?: string;
}

interface AuthRetryContext {
  retryCount: number;
  delay: number;
  statusCode?: number;
}

export class WalletAuthenticator {
  private debugEnabled = false;
  private readonly lastSuccessfulBaseUrl: string | null = null;
  private readonly pendingAuthAttempts: Map<string, Promise<AuthResult>> = new Map();

  constructor(private readonly apiBaseUrl: string) {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      localStorage.removeItem('wallet_auth_working_url');
      this.debugEnabled = true;
    }
  }

  enableDebug(enabled: boolean): void {
    this.debugEnabled = enabled;
  }

  private debugLog(message: string, isError = false): void {
    if (!this.debugEnabled) return;
    console[isError ? 'error' : 'log'](`[WalletAuth] ${message}`);
  }

  private async testConnectivity(): Promise<string> {
    return this.apiBaseUrl;
  }

  // Get authentication challenge for a wallet
  async getAuthChallenge(address: string): Promise<AuthChallenge> {
    try {
      const baseUrl = await this.testConnectivity();
      const response = await axios.get(`${baseUrl}/auth/wallet/challenge?address=${address.toLowerCase()}`);
      
      return {
        challenge: response.data.challenge,
        message: response.data.message ?? response.data.challenge
      };
    } catch (error: any) {
      this.debugLog(`Error getting challenge: ${error.message}`, true);
      throw new Error('Failed to get authentication challenge');
    }
  }

  // Process HTTP error response
  private processErrorResponse(err: any): { errorMessage: string; statusCode: number } {
    let errorMessage = 'Unknown auth error';
    let statusCode = err.response?.status ?? 0;

    if (err.response) {
      const responseData = err.response.data ?? {};
      errorMessage = responseData.message ?? responseData.error ?? `Server error: ${statusCode}`;
      this.debugLog(`Response error: ${statusCode}, ${JSON.stringify(responseData)}`, true);
    } else if (err.request) {
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout';
      } else if (err.code === 'ECONNREFUSED') {
        errorMessage = 'Server not reachable';
      } else {
        errorMessage = 'No response received';
      }
      this.debugLog(`Network error: ${err.code}`, true);
    }

    return { errorMessage, statusCode };
  }

  // Process successful authentication response
  private processSuccessResponse(response: any): AuthResult {
    const accessToken = response.data.accessToken;
    const refreshToken = response.data.refreshToken;
    const userId = response.data.user?.id ?? response.data.userId;
    const isNewUser = !!response.data.isNewUser;

    if (!accessToken) {
      throw new Error('Missing access token in response');
    }

    return {
      success: true,
      token: accessToken,
      refreshToken,
      userId,
      isNewUser
    };
  }

  // Handle retry logic
  private async handleRetry(context: AuthRetryContext): Promise<boolean> {
    const { retryCount, delay, statusCode } = context;
    const maxRetries = 3;
    
    const isServerError = statusCode ? statusCode >= 500 : true;
    if (retryCount > maxRetries || !isServerError) {
      return false;
    }

    const retryDelay = isServerError ? 2000 * retryCount : delay;
    this.debugLog(`Retrying in ${retryDelay}ms...`);
    await new Promise(resolve => setTimeout(resolve, retryDelay));
    return true;
  }

  // Prepare authentication headers
  private prepareHeaders(walletInfo: WalletInfo, deviceFingerprint?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Wallet-Chain-Id': walletInfo.chainId.toString()
    };

    if (deviceFingerprint) {
      headers['X-Device-Fingerprint'] = deviceFingerprint;
      headers['X-Device-Id'] = deviceFingerprint;
    }

    return headers;
  }

  // Authenticate with signature
  async authenticate(
    walletInfo: WalletInfo, 
    signature: string, 
    message: string,
    email?: string,
    deviceFingerprint?: string
  ): Promise<AuthResult> {
    if (!walletInfo?.address) {
      throw new Error('Wallet information is required');
    }

    const normalizedAddress = walletInfo.address.toLowerCase();
    const cacheKey = `auth:${normalizedAddress}:${signature.substring(0, 10)}`;

    // Check for pending request
    if (this.pendingAuthAttempts.has(cacheKey)) {
      this.debugLog(`Using existing auth request for ${normalizedAddress}`);
      return this.pendingAuthAttempts.get(cacheKey) as Promise<AuthResult>;
    }

    const authPromise = this.performAuthenticate(walletInfo, signature, message, email, deviceFingerprint);
    this.pendingAuthAttempts.set(cacheKey, authPromise);

    try {
      return await authPromise;
    } finally {
      this.pendingAuthAttempts.delete(cacheKey);
    }
  }

  private async performAuthenticate(
    walletInfo: WalletInfo, 
    signature: string, 
    message: string,
    email?: string,
    deviceFingerprint?: string
  ): Promise<AuthResult> {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const baseUrl = await this.testConnectivity();
      const headers = this.prepareHeaders(walletInfo, deviceFingerprint);
      const timeoutMs = 15000;

      let retryContext: AuthRetryContext = {
        retryCount: 0,
        delay: 1000
      };

      while (true) {
        try {
          const payload = {
            address: walletInfo.address.toLowerCase(),
            signature,
            message,
            ...(email ? { email: email.trim() } : {})
          };

          this.logAuthPayload(payload, !!email);

          const response = await axios.post(
            `${baseUrl}/auth/wallet/authenticate`,
            payload,
            { headers, timeout: timeoutMs }
          );
          
          if (!response.data) {
            throw new Error('Empty response from server');
          }
          
          this.debugLog(`Auth successful: ${response.status}`);
          return this.processSuccessResponse(response);

        } catch (err: any) {
          retryContext.retryCount++;
          const { errorMessage, statusCode } = this.processErrorResponse(err);
          
          retryContext.statusCode = statusCode;
          retryContext.delay *= 2;
          
          this.debugLog(`Auth attempt ${retryContext.retryCount} failed: ${errorMessage}`, true);

          if (!await this.handleRetry(retryContext)) {
            return { success: false, error: errorMessage };
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unexpected auth error';
      this.debugLog(errorMessage, true);
      return { success: false, error: errorMessage };
    }
  }

  private logAuthPayload(payload: any, hasEmail: boolean): void {
    const sanitizedPayloadLog = {
      address: payload.address,
      signatureLength: payload.signature.length,
      signaturePreview: `${payload.signature.substring(0, 10)}...`,
      messageLength: payload.message.length,
      messagePreview: `${payload.message.substring(0, 15)}...`,
      hasEmail
    };
    
    this.debugLog(`Sending auth payload: ${JSON.stringify(sanitizedPayloadLog)}`);
  }
}