# Web3 Authentication System
in continue of process of prompts ? 
how we can have a authentication web3 standard , we need device finger print (hardware id ), device location and Geolocation , and ip, autodetect by our system . 
when user open the browser as first time , we need a userSession , we need the time of user is online ,and  be up todate . you can read my files in project too , for have a good flow , 
/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/frontend
/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend
for creating a new md file for web3 authentication , 
and add walletSelector to prompt too . 
## Overview

This document outlines the implementation of a robust Web3 authentication system that includes device fingerprinting, geolocation tracking, IP detection, user session management, and wallet selector integration. This authentication system enhances security by verifying not only the user's wallet but also their device identity and location.

## Core Components

### 1. Device Fingerprinting

Device fingerprinting creates a unique identifier for each user's device based on hardware and software characteristics:

```typescript
interface DeviceFingerprint {
  hardwareId: string;      // Unique hardware identifier
  browserInfo: {
    name: string;
    version: string;
    language: string;
    userAgent: string;
    platform: string;
  };
  screenResolution: {
    width: number;
    height: number;
    colorDepth: number;
  };
  installedFonts: string[];
  installedPlugins: string[];
  timezone: string;
  canvas: string;           // Canvas fingerprint
  webglFingerprint: string; // WebGL capabilities fingerprint
}
```

#### Implementation Strategy:

```typescript
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export async function generateDeviceFingerprint(): Promise<DeviceFingerprint> {
  // Initialize FingerprintJS
  const fp = await FingerprintJS.load();
  
  // Get the visitor identifier
  const result = await fp.get();
  
  // Collect device information
  const fingerprint: DeviceFingerprint = {
    hardwareId: result.visitorId,
    browserInfo: {
      name: navigator.appName,
      version: navigator.appVersion,
      language: navigator.language,
      userAgent: navigator.userAgent,
      platform: navigator.platform
    },
    screenResolution: {
      width: window.screen.width,
      height: window.screen.height,
      colorDepth: window.screen.colorDepth
    },
    installedFonts: await getInstalledFonts(),
    installedPlugins: getInstalledPlugins(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvas: generateCanvasFingerprint(),
    webglFingerprint: generateWebGLFingerprint()
  };
  
  return fingerprint;
}
```

### 2. Geolocation and IP Tracking

Collect and verify user's geolocation and IP address:

```typescript
interface LocationData {
  ip: string;
  coordinates: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  country: string;
  region: string;
  city: string;
  isp: string;
  timezone: string;
  timestamp: number;
}
```

#### Implementation Strategy:

```typescript
export async function getUserLocation(): Promise<LocationData> {
  // Get user's coordinates from browser API
  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });
  });
  
  // Get IP and location data from IP geolocation service
  const ipResponse = await fetch('https://api.ipify.org?format=json');
  const ipData = await ipResponse.json();
  
  const geoResponse = await fetch(`https://ipapi.co/${ipData.ip}/json/`);
  const geoData = await geoResponse.json();
  
  return {
    ip: ipData.ip,
    coordinates: {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy
    },
    country: geoData.country_name,
    region: geoData.region,
    city: geoData.city,
    isp: geoData.org,
    timezone: geoData.timezone,
    timestamp: Date.now()
  };
}
```

### 3. User Session Management

Track user sessions from initial login, with continuous updates:

```typescript
interface UserSession {
  sessionId: string;
  userId: string;
  walletAddress: string;
  deviceFingerprint: DeviceFingerprint;
  locationData: LocationData;
  startTime: number;
  lastActiveTime: number;
  isActive: boolean;
  authToken: string;
  refreshToken: string;
}
```

#### Implementation Strategy:

```typescript
export class SessionManager {
  private static instance: SessionManager;
  private currentSession: UserSession | null = null;
  private sessionHeartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 60000; // 1 minute
  
  private constructor() {
    // Initialize session from localStorage if exists
    const savedSession = localStorage.getItem('userSession');
    if (savedSession) {
      this.currentSession = JSON.parse(savedSession);
      this.startSessionHeartbeat();
    }
    
    // Listen for window focus/blur events
    window.addEventListener('focus', this.updateLastActiveTime.bind(this));
    window.addEventListener('blur', this.updateLastActiveTime.bind(this));
  }
  
  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }
  
  public async createNewSession(userId: string, walletAddress: string): Promise<UserSession> {
    const deviceFingerprint = await generateDeviceFingerprint();
    const locationData = await getUserLocation();
    
    // Generate session ID (UUID v4)
    const sessionId = crypto.randomUUID();
    
    const session: UserSession = {
      sessionId,
      userId,
      walletAddress,
      deviceFingerprint,
      locationData,
      startTime: Date.now(),
      lastActiveTime: Date.now(),
      isActive: true,
      authToken: '', // Will be filled by auth service
      refreshToken: '' // Will be filled by auth service
    };
    
    // Save session
    this.currentSession = session;
    localStorage.setItem('userSession', JSON.stringify(session));
    
    // Start heartbeat
    this.startSessionHeartbeat();
    
    return session;
  }
  
  public getCurrentSession(): UserSession | null {
    return this.currentSession;
  }
  
  public updateLastActiveTime(): void {
    if (this.currentSession) {
      this.currentSession.lastActiveTime = Date.now();
      localStorage.setItem('userSession', JSON.stringify(this.currentSession));
    }
  }
  
  public updateSessionTokens(authToken: string, refreshToken: string): void {
    if (this.currentSession) {
      this.currentSession.authToken = authToken;
      this.currentSession.refreshToken = refreshToken;
      localStorage.setItem('userSession', JSON.stringify(this.currentSession));
    }
  }
  
  public endSession(): void {
    if (this.sessionHeartbeatInterval) {
      clearInterval(this.sessionHeartbeatInterval);
      this.sessionHeartbeatInterval = null;
    }
    
    if (this.currentSession) {
      this.currentSession.isActive = false;
      
      // Send end session to backend
      fetch('/api/auth/end-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.currentSession.authToken}`
        },
        body: JSON.stringify({
          sessionId: this.currentSession.sessionId
        })
      });
      
      // Clear local storage
      localStorage.removeItem('userSession');
      this.currentSession = null;
    }
  }
  
  private startSessionHeartbeat(): void {
    if (this.sessionHeartbeatInterval) {
      clearInterval(this.sessionHeartbeatInterval);
    }
    
    this.sessionHeartbeatInterval = setInterval(async () => {
      if (this.currentSession) {
        try {
          // Update location data
          const locationData = await getUserLocation();
          
          // Send heartbeat to backend
          const response = await fetch('/api/auth/session-heartbeat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.currentSession.authToken}`
            },
            body: JSON.stringify({
              sessionId: this.currentSession.sessionId,
              lastActiveTime: Date.now(),
              locationData
            })
          });
          
          if (!response.ok) {
            throw new Error('Session heartbeat failed');
          }
          
          // Update session data
          this.currentSession.lastActiveTime = Date.now();
          this.currentSession.locationData = locationData;
          localStorage.setItem('userSession', JSON.stringify(this.currentSession));
        } catch (error) {
          console.error('Session heartbeat error:', error);
        }
      }
    }, this.HEARTBEAT_INTERVAL);
  }
}
```

### 4. Wallet Selector Integration

Integrate with multiple wallet providers for flexible authentication:

```typescript
interface WalletProvider {
  id: string;
  name: string;
  icon: string;
  description: string;
  installed: boolean;
  supported: boolean;
}

interface WalletAccount {
  address: string;
  publicKey: string;
  balance: string;
  provider: string;
}

interface WalletSelectorState {
  selectedWallet: string | null;
  accounts: WalletAccount[];
  connected: boolean;
  chainId: string;
  networkId: string;
}
```

#### Implementation Strategy:

```typescript
export class WalletSelector {
  private static instance: WalletSelector;
  private providers: WalletProvider[] = [];
  private state: WalletSelectorState = {
    selectedWallet: null,
    accounts: [],
    connected: false,
    chainId: '',
    networkId: ''
  };
  private stateListeners: ((state: WalletSelectorState) => void)[] = [];
  
  private constructor() {
    this.initializeProviders();
    
    // Check for cached wallet connection
    const cachedWallet = localStorage.getItem('selectedWallet');
    if (cachedWallet) {
      this.connectToWallet(cachedWallet);
    }
  }
  
  public static getInstance(): WalletSelector {
    if (!WalletSelector.instance) {
      WalletSelector.instance = new WalletSelector();
    }
    return WalletSelector.instance;
  }
  
  private async initializeProviders(): Promise<void> {
    // Check for MetaMask
    const isMetaMaskInstalled = typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
    
    // Check for Coinbase Wallet
    const isCoinbaseInstalled = typeof window.ethereum !== 'undefined' && window.ethereum.isCoinbaseWallet;
    
    // Check for WalletConnect
    const isWalletConnectSupported = true; // Always supported as it's web-based
    
    this.providers = [
      {
        id: 'metamask',
        name: 'MetaMask',
        icon: '/assets/wallets/metamask.svg',
        description: 'Connect to your MetaMask Wallet',
        installed: isMetaMaskInstalled,
        supported: true
      },
      {
        id: 'coinbase',
        name: 'Coinbase Wallet',
        icon: '/assets/wallets/coinbase.svg',
        description: 'Connect to your Coinbase Wallet',
        installed: isCoinbaseInstalled,
        supported: true
      },
      {
        id: 'walletconnect',
        name: 'WalletConnect',
        icon: '/assets/wallets/walletconnect.svg',
        description: 'Scan with WalletConnect to connect',
        installed: true, // Web-based, always available
        supported: isWalletConnectSupported
      },
      {
        id: 'phantom',
        name: 'Phantom',
        icon: '/assets/wallets/phantom.svg',
        description: 'Connect to your Phantom Wallet',
        installed: typeof window.phantom !== 'undefined',
        supported: true
      }
    ];
  }
  
  public getProviders(): WalletProvider[] {
    return this.providers;
  }
  
  public getState(): WalletSelectorState {
    return this.state;
  }
  
  public subscribeToStateChanges(listener: (state: WalletSelectorState) => void): () => void {
    this.stateListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== listener);
    };
  }
  
  private updateState(newState: Partial<WalletSelectorState>): void {
    this.state = { ...this.state, ...newState };
    
    // Notify listeners
    this.stateListeners.forEach(listener => listener(this.state));
  }
  
  public async connectToWallet(providerId: string): Promise<boolean> {
    try {
      const provider = this.providers.find(p => p.id === providerId);
      if (!provider) {
        throw new Error(`Provider ${providerId} not found`);
      }
      
      if (!provider.supported) {
        throw new Error(`Provider ${provider.name} is not supported in this browser`);
      }
      
      let accounts: string[] = [];
      let chainId: string = '';
      
      switch (providerId) {
        case 'metamask':
          if (window.ethereum) {
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            chainId = await window.ethereum.request({ method: 'eth_chainId' });
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
            window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));
          } else {
            throw new Error('MetaMask is not installed');
          }
          break;
        
        case 'coinbase':
          // Coinbase Wallet connection logic
          if (window.ethereum && window.ethereum.isCoinbaseWallet) {
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            chainId = await window.ethereum.request({ method: 'eth_chainId' });
            
            window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
            window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));
          } else {
            throw new Error('Coinbase Wallet is not installed');
          }
          break;
        
        case 'walletconnect':
          // WalletConnect connection logic
          // This requires the WalletConnect SDK to be installed
          // Implementation depends on the WalletConnect version you're using
          break;
        
        case 'phantom':
          // Phantom Wallet connection logic
          if (window.phantom) {
            const provider = window.phantom.solana;
            const connection = await provider.connect();
            accounts = [connection.publicKey.toString()];
            chainId = 'solana:mainnet';
          } else {
            throw new Error('Phantom is not installed');
          }
          break;
      }
      
      if (accounts.length > 0) {
        // Get account balances and other details
        const walletAccounts = await Promise.all(
          accounts.map(async (address) => {
            // Get balance logic depends on the blockchain
            let balance = '0';
            
            if (providerId === 'phantom') {
              // Solana balance logic
            } else {
              // Ethereum balance logic
              const balanceHex = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [address, 'latest']
              });
              balance = parseInt(balanceHex, 16).toString();
            }
            
            return {
              address,
              publicKey: address,
              balance,
              provider: providerId
            };
          })
        );
        
        // Update state
        this.updateState({
          selectedWallet: providerId,
          accounts: walletAccounts,
          connected: true,
          chainId,
          networkId: this.getNetworkIdFromChainId(chainId)
        });
        
        // Cache selected wallet
        localStorage.setItem('selectedWallet', providerId);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Wallet connection error:', error);
      return false;
    }
  }
  
  public async disconnectWallet(): Promise<void> {
    // Clean up event listeners
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', this.handleChainChanged);
    }
    
    // For WalletConnect, we need to kill the session
    
    // Reset state
    this.updateState({
      selectedWallet: null,
      accounts: [],
      connected: false,
      chainId: '',
      networkId: ''
    });
    
    // Remove from local storage
    localStorage.removeItem('selectedWallet');
  }
  
  private handleAccountsChanged(accounts: string[]): void {
    if (accounts.length === 0) {
      // User has disconnected all accounts
      this.disconnectWallet();
    } else {
      // Accounts changed, update state
      this.updateState({
        accounts: accounts.map(address => ({
          address,
          publicKey: address,
          balance: '0', // Will be updated on next refresh
          provider: this.state.selectedWallet as string
        }))
      });
    }
  }
  
  private handleChainChanged(chainId: string): void {
    this.updateState({
      chainId,
      networkId: this.getNetworkIdFromChainId(chainId)
    });
  }
  
  private getNetworkIdFromChainId(chainId: string): string {
    // Convert chainId to network name
    const chainIdNum = parseInt(chainId, 16);
    
    switch (chainIdNum) {
      case 1:
        return 'ethereum:mainnet';
      case 3:
        return 'ethereum:ropsten';
      case 4:
        return 'ethereum:rinkeby';
      case 5:
        return 'ethereum:goerli';
      case 42:
        return 'ethereum:kovan';
      case 56:
        return 'binance:mainnet';
      case 97:
        return 'binance:testnet';
      case 137:
        return 'polygon:mainnet';
      case 80001:
        return 'polygon:mumbai';
      default:
        return `unknown:${chainIdNum}`;
    }
  }
  
  public async signMessage(message: string): Promise<string> {
    if (!this.state.connected || !this.state.selectedWallet || this.state.accounts.length === 0) {
      throw new Error('No wallet connected');
    }
    
    try {
      const address = this.state.accounts[0].address;
      let signature = '';
      
      switch (this.state.selectedWallet) {
        case 'metamask':
        case 'coinbase':
          // Ethereum signing
          signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [message, address]
          });
          break;
        
        case 'walletconnect':
          // WalletConnect signing
          // Implementation depends on WalletConnect version
          break;
        
        case 'phantom':
          // Phantom signing
          if (window.phantom) {
            const encodedMessage = new TextEncoder().encode(message);
            const signResult = await window.phantom.solana.signMessage(encodedMessage, 'utf8');
            signature = signResult.signature;
          }
          break;
      }
      
      return signature;
    } catch (error) {
      console.error('Message signing error:', error);
      throw error;
    }
  }
}
```

## Integration with Backend

### Server-Side Verification

Implement server-side verification of device fingerprint, location, and wallet signature:

```typescript
// In backend/src/auth/web3-auth.service.ts

@Injectable()
export class Web3AuthService {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    @InjectRepository(SessionRepository)
    private sessionRepository: SessionRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}
  
  async verifyWalletSignature(address: string, message: string, signature: string): Promise<boolean> {
    try {
      // For Ethereum
      const recoveredAddress = ethers.utils.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
      
      // For other chains, implement chain-specific verification
    } catch (error) {
      this.logger.error(`Signature verification failed: ${error.message}`);
      return false;
    }
  }
  
  async authenticateUser(authDto: Web3AuthDto): Promise<AuthResponse> {
    const { walletAddress, signature, nonce, deviceFingerprint, locationData } = authDto;
    
    // 1. Verify the signature
    const message = `Sign this message to authenticate with your wallet: ${nonce}`;
    const isSignatureValid = await this.verifyWalletSignature(walletAddress, message, signature);
    
    if (!isSignatureValid) {
      throw new UnauthorizedException('Invalid signature');
    }
    
    // 2. Find or create user
    let user = await this.userRepository.findOne({ where: { walletAddress } });
    
    if (!user) {
      user = await this.userRepository.save({
        walletAddress,
        firstLoginAt: new Date(),
        lastLoginAt: new Date(),
      });
    } else {
      // Update last login time
      user.lastLoginAt = new Date();
      await this.userRepository.save(user);
    }
    
    // 3. Create user session
    const session = await this.sessionRepository.save({
      userId: user.id,
      walletAddress,
      deviceFingerprint,
      locationData,
      startTime: new Date(),
      lastActiveTime: new Date(),
      isActive: true,
    });
    
    // 4. Generate tokens
    const payload = { sub: user.id, wallet: walletAddress, sessionId: session.id };
    
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '15m',
    });
    
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });
    
    // 5. Update session with tokens
    session.refreshToken = refreshToken;
    await this.sessionRepository.save(session);
    
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
      },
      session: {
        id: session.id,
        startTime: session.startTime,
      }
    };
  }
  
  async refreshSession(refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    const { refreshToken, deviceFingerprint, locationData } = refreshTokenDto;
    
    try {
      // 1. Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
      
      // 2. Find the session
      const session = await this.sessionRepository.findOne({ 
        where: { 
          id: payload.sessionId,
          refreshToken,
          isActive: true
        }
      });
      
      if (!session) {
        throw new UnauthorizedException('Invalid session');
      }
      
      // 3. Verify device fingerprint
      const fingerprintMatch = this.verifyDeviceFingerprint(
        session.deviceFingerprint, 
        deviceFingerprint
      );
      
      if (!fingerprintMatch) {
        // Suspicious activity - different device
        await this.sessionRepository.update(session.id, { isActive: false });
        throw new UnauthorizedException('Device verification failed');
      }
      
      // 4. Update session data
      session.lastActiveTime = new Date();
      session.locationData = locationData;
      await this.sessionRepository.save(session);
      
      // 5. Generate new tokens
      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      const newPayload = { 
        sub: user.id, 
        wallet: user.walletAddress, 
        sessionId: session.id 
      };
      
      const accessToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '15m',
      });
      
      const newRefreshToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      });
      
      // 6. Update session with new refresh token
      session.refreshToken = newRefreshToken;
      await this.sessionRepository.save(session);
      
      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
        },
        session: {
          id: session.id,
          startTime: session.startTime,
        }
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new UnauthorizedException('Invalid token');
    }
  }
  
  private verifyDeviceFingerprint(
    storedFingerprint: DeviceFingerprint, 
    currentFingerprint: DeviceFingerprint
  ): boolean {
    // Core hardware ID should match
    if (storedFingerprint.hardwareId !== currentFingerprint.hardwareId) {
      return false;
    }
    
    // Check for major browser changes
    if (storedFingerprint.browserInfo.name !== currentFingerprint.browserInfo.name) {
      return false;
    }
    
    // Check screen resolution
    if (storedFingerprint.screenResolution.width !== currentFingerprint.screenResolution.width ||
        storedFingerprint.screenResolution.height !== currentFingerprint.screenResolution.height) {
      return false;
    }
    
    // Allow some minor variations in other parameters
    // Return true if enough parameters match
    return true;
  }
  
  async updateSessionHeartbeat(heartbeatDto: SessionHeartbeatDto): Promise<boolean> {
    const { sessionId, lastActiveTime, locationData } = heartbeatDto;
    
    try {
      const session = await this.sessionRepository.findOne({ where: { id: sessionId, isActive: true } });
      
      if (!session) {
        return false;
      }
      
      // Update session data
      session.lastActiveTime = new Date(lastActiveTime);
      session.locationData = locationData;
      await this.sessionRepository.save(session);
      
      return true;
    } catch (error) {
      this.logger.error(`Session heartbeat failed: ${error.message}`);
      return false;
    }
  }
  
  async endSession(sessionId: string): Promise<boolean> {
    try {
      await this.sessionRepository.update(sessionId, { 
        isActive: false,
        endTime: new Date()
      });
      
      return true;
    } catch (error) {
      this.logger.error(`End session failed: ${error.message}`);
      return false;
    }
  }
}
```

## Authentication Flow

1. **Initial Authentication:**
   - User connects wallet via the `WalletSelector`
   - System generates device fingerprint and captures location data
   - Backend verifies wallet signature and issues tokens
   - Client creates and stores session

2. **Session Maintenance:**
   - Client sends periodic heartbeats to backend
   - Location and device data are continuously verified
   - Session timestamps are updated to track online time

3. **Token Refresh:**
   - When access token expires, system uses refresh token
   - Device fingerprint is verified again
   - New tokens are issued if verification passes

4. **Security Measures:**
   - Suspicious location changes trigger additional verification
   - Device fingerprint changes may require re-authentication
   - Session data is encrypted in transit and at rest

## Database Schema

```sql
-- User table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address VARCHAR(255) NOT NULL UNIQUE,
  first_login_at TIMESTAMPTZ NOT NULL,
  last_login_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Session table
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  wallet_address VARCHAR(255) NOT NULL,
  device_fingerprint JSONB NOT NULL,
  location_data JSONB NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  last_active_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  refresh_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for active sessions
CREATE INDEX idx_user_sessions_active ON user_sessions(user_id, is_active);
CREATE INDEX idx_user_sessions_wallet ON user_sessions(wallet_address);
```

## Implementation Checklist

- [ ] Implement device fingerprinting module
- [ ] Create geolocation and IP tracking service
- [ ] Develop session management system
- [ ] Integrate wallet selector with multiple providers
- [ ] Set up backend verification API
- [ ] Create database tables and relationships
- [ ] Implement token generation and validation
- [ ] Add session heartbeat mechanism
- [ ] Implement security alerting for suspicious activities
- [ ] Add analytics for tracking user online time
- [ ] Create admin dashboard for session monitoring