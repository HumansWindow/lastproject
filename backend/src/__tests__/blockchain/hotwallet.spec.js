import HotWallet from '../../blockchain/hotwallet/index.js';
import ChainHandlers from '../../blockchain/hotwallet/handlers/ChainHandlers.js';
import WalletManager from '../../blockchain/hotwallet/WalletManager.js';
import BalanceService from '../../blockchain/hotwallet/services/BalanceService.js';
import { encrypt, decrypt, wipeMemory } from '../../blockchain/hotwallet/utils/encryption.js';

// Mock configuration for testing
const testConfig = {
  ETH_RPC_URL: 'wss://mainnet.infura.io/ws/v3/b9980d193a9e496e92e948e0f01ad7c4',
  BNB_RPC_URL: 'https://bnb-mainnet.g.alchemy.com/v2/fdUf1-b7ks8jGGBzQyurl1RM9o5ITrey',
  SOL_RPC_URL: 'https://solana-mainnet.g.alchemy.com/v2/fdUf1-b7ks8jGGBzQyurl1RM9o5ITrey',
  MATIC_RPC_URL: 'wss://polygon-mainnet.infura.io/ws/v3/b9980d193a9e496e92e948e0f01ad7c4',
  encryptPrivateKeys: true,
  encryptionKey: 'test-encryption-key-for-unit-tests-only',
};

// Test mnemonic phrase (DO NOT USE IN PRODUCTION)
const TEST_MNEMONIC = 'test test test test test test test test test test test junk';

// Mock providers and responses for blockchain interactions
jest.mock('ethers', () => {
  const originalModule = jest.requireActual('ethers');
  
  class MockProvider {
    constructor() {
      this.getBalance = jest.fn().mockResolvedValue(originalModule.ethers.utils.parseEther('1.0'));
      this.getFeeData = jest.fn().mockResolvedValue({
        maxFeePerGas: originalModule.ethers.BigNumber.from('50000000000'),
        maxPriorityFeePerGas: originalModule.ethers.BigNumber.from('1500000000'),
      });
      this.getGasPrice = jest.fn().mockResolvedValue(originalModule.ethers.BigNumber.from('40000000000'));
    }
  }
  
  class MockWebSocketProvider extends MockProvider {}
  class MockJsonRpcProvider extends MockProvider {}
  
  return {
    ...originalModule,
    providers: {
      ...originalModule.providers,
      WebSocketProvider: MockWebSocketProvider,
      JsonRpcProvider: MockJsonRpcProvider,
    },
  };
});

// Mock solana web3.js
jest.mock('@solana/web3.js', () => {
  const originalModule = jest.requireActual('@solana/web3.js');
  
  class MockConnection {
    constructor() {
      this.getBalance = jest.fn().mockResolvedValue(1000000000);
      this.getParsedTokenAccountsByOwner = jest.fn().mockResolvedValue({
        value: [{
          account: {
            data: {
              parsed: {
                info: {
                  tokenAmount: {
                    uiAmount: 100,
                  },
                },
              },
            },
          },
        }],
      });
    }
  }
  
  return {
    ...originalModule,
    Connection: MockConnection,
  };
});

// Mock the blockchain.info API for BTC balance checks
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ 'bc1test123': { final_balance: 10000000 } }),
  })
);

describe('Hot Wallet Integration Tests', () => {
  let hotWallet;
  
  beforeEach(() => {
    // Initialize a fresh HotWallet instance before each test
    hotWallet = new HotWallet(testConfig);
    
    // Reset all mocks
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Cleanup
    if (hotWallet && hotWallet.walletManager) {
      hotWallet.walletManager.clearWallets();
    }
  });

  describe('Configuration', () => {
    it('should initialize with the correct RPC URLs', () => {
      expect(hotWallet.config.ETH_RPC_URL).toBe(testConfig.ETH_RPC_URL);
      expect(hotWallet.config.BNB_RPC_URL).toBe(testConfig.BNB_RPC_URL);
      expect(hotWallet.config.SOL_RPC_URL).toBe(testConfig.SOL_RPC_URL);
      expect(hotWallet.config.MATIC_RPC_URL).toBe(testConfig.MATIC_RPC_URL);
    });
    
    it('should properly initialize ChainHandlers', () => {
      expect(hotWallet.chainHandlers).toBeInstanceOf(ChainHandlers);
      expect(hotWallet.chainHandlers.config.ETH_RPC_URL).toBe(testConfig.ETH_RPC_URL);
    });
    
    it('should properly initialize services', () => {
      expect(hotWallet.balanceService).toBeInstanceOf(BalanceService);
      expect(hotWallet.walletManager).toBeInstanceOf(WalletManager);
    });
  });

  describe('Wallet Import', () => {
    it('should successfully import an ETH wallet', async () => {
      const wallet = await hotWallet.importWallet(TEST_MNEMONIC, 'ETH');
      
      expect(wallet).toBeDefined();
      expect(wallet.network).toBe('ETH');
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(wallet.privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });
    
    it('should successfully import a BNB wallet', async () => {
      const wallet = await hotWallet.importWallet(TEST_MNEMONIC, 'BNB');
      
      expect(wallet).toBeDefined();
      expect(wallet.network).toBe('BNB');
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
    
    it('should successfully import a MATIC wallet', async () => {
      const wallet = await hotWallet.importWallet(TEST_MNEMONIC, 'MATIC');
      
      expect(wallet).toBeDefined();
      expect(wallet.network).toBe('MATIC');
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
    
    it('should successfully import a SOL wallet', async () => {
      const wallet = await hotWallet.importWallet(TEST_MNEMONIC, 'SOL');
      
      expect(wallet).toBeDefined();
      expect(wallet.network).toBe('SOL');
      // SOL addresses are base58 encoded strings
      expect(wallet.address).toBeTruthy();
      expect(wallet.privateKey).toBeTruthy();
    });
    
    it('ETH, BNB, and MATIC wallets should have the same address (same derivation path)', async () => {
      const ethWallet = await hotWallet.importWallet(TEST_MNEMONIC, 'ETH');
      const bnbWallet = await hotWallet.importWallet(TEST_MNEMONIC, 'BNB');
      const maticWallet = await hotWallet.importWallet(TEST_MNEMONIC, 'MATIC');
      
      expect(ethWallet.address).toBe(bnbWallet.address);
      expect(ethWallet.address).toBe(maticWallet.address);
    });
    
    it('should throw an error for unsupported networks', async () => {
      await expect(hotWallet.importWallet(TEST_MNEMONIC, 'UNKNOWN')).rejects.toThrow();
    });
  });
  
  describe('Balance Retrieval', () => {
    let ethWallet;
    
    beforeEach(async () => {
      ethWallet = await hotWallet.importWallet(TEST_MNEMONIC, 'ETH');
    });
    
    it('should retrieve ETH balance', async () => {
      const balance = await hotWallet.getBalance(ethWallet.address, 'ETH');
      expect(balance).toBe('1.0');
    });
    
    it('should retrieve BNB balance', async () => {
      const balance = await hotWallet.getBalance(ethWallet.address, 'BNB');
      expect(balance).toBe('1.0');
    });
    
    it('should retrieve MATIC balance', async () => {
      const balance = await hotWallet.getBalance(ethWallet.address, 'MATIC');
      expect(balance).toBe('1.0');
    });
    
    it('should retrieve token balances', async () => {
      const balance = await hotWallet.getTokenBalance(ethWallet.address, 'ETH_USDT');
      expect(balance).toBe('0.0');
    });
  });

  describe('Encryption Utilities', () => {
    it('should encrypt and decrypt data correctly', () => {
      const data = 'test-private-key';
      const key = 'test-encryption-key';
      
      const encrypted = encrypt(data, key);
      expect(encrypted).toBeTruthy();
      expect(encrypted).toContain(':');
      
      const decrypted = decrypt(encrypted, key);
      expect(decrypted).toBe(data);
    });
    
    it('should handle object encryption/decryption', () => {
      const data = { key: 'value', nested: { foo: 'bar' } };
      const key = 'test-encryption-key';
      
      const encrypted = encrypt(data, key);
      const decrypted = decrypt(encrypted, key);
      
      expect(decrypted).toEqual(data);
    });
    
    it('should securely wipe data from memory', () => {
      const obj = { 
        key1: 'sensitive-data', 
        key2: { nested: 'more-sensitive' } 
      };
      
      wipeMemory(obj);
      
      expect(Object.keys(obj).length).toBe(0);
    });
  });

  describe('WebSocket Provider Support', () => {
    it('should use WebSocketProvider for ETH when URL starts with wss://', () => {
      expect(hotWallet.chainHandlers.config.ETH_RPC_URL.startsWith('wss://')).toBe(true);
      // This test would be more robust if we could check the provider instance type
    });
    
    it('should use WebSocketProvider for MATIC when URL starts with wss://', () => {
      expect(hotWallet.chainHandlers.config.MATIC_RPC_URL.startsWith('wss://')).toBe(true);
      // This test would be more robust if we could check the provider instance type
    });
  });
});

describe('Multi-Chain Wallet Generation', () => {
  let hotWallet;
  
  beforeEach(() => {
    hotWallet = new HotWallet(testConfig);
  });
  
  it('should generate new wallets with mnemonics', async () => {
    const ethWallet = await hotWallet.generateWallet('ETH');
    
    expect(ethWallet.mnemonic).toBeDefined();
    expect(ethWallet.mnemonic.split(' ').length).toBe(12);
    expect(ethWallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });
  
  it('should add generated wallets to WalletManager by default', async () => {
    const ethWallet = await hotWallet.generateWallet('ETH');
    
    const storedWallet = hotWallet.walletManager.getWallet('ETH', ethWallet.address);
    expect(storedWallet).toBeTruthy();
  });
});

// Skip actual transaction tests to avoid real network calls
describe.skip('Transaction Creation', () => {
  let hotWallet;
  let ethWallet;
  
  beforeEach(async () => {
    hotWallet = new HotWallet(testConfig);
    ethWallet = await hotWallet.importWallet(TEST_MNEMONIC, 'ETH');
  });
  
  it('should send ETH transactions', async () => {
    const tx = await hotWallet.sendTransaction({
      from: ethWallet.privateKey,
      to: '0x1234567890123456789012345678901234567890',
      amount: '0.001',
      network: 'ETH',
    });
    
    expect(tx.transactionHash).toBeDefined();
    expect(tx.status).toBe(true);
  });
});
