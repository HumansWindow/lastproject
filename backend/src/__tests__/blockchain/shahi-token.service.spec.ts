/// <reference path="../../../jest-types.d.ts" />
/// <reference path="../../../node-types.d.ts" />

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ShahiTokenService } from '../../blockchain/services/shahi-token.service';
import { Contract, ethers } from 'ethers';

// Create mock Contract and Provider
const mockContract = {
  on: jest.fn(),
  connect: jest.fn().mockReturnThis(),
  firstTimeMint: jest.fn().mockResolvedValue({ hash: 'mock-tx-hash', wait: jest.fn().mockResolvedValue({}) }),
  annualMint: jest.fn().mockResolvedValue({ hash: 'mock-tx-hash', wait: jest.fn().mockResolvedValue({}) }),
  userMintRecords: jest.fn().mockResolvedValue({
    hasFirstMinted: true,
    lastMintTimestamp: { toNumber: () => 1680000000 },
    totalMinted: ethers.BigNumber.from('1000000000000000000'),
  }),
  balanceOf: jest.fn().mockResolvedValue(ethers.BigNumber.from('1000000000000000000')),
  totalSupply: jest.fn().mockResolvedValue(ethers.BigNumber.from('1000000000000000000')),
  burnedTokens: jest.fn().mockResolvedValue(ethers.BigNumber.from('100000000000000000')),
  totalMintedTokens: jest.fn().mockResolvedValue(ethers.BigNumber.from('1100000000000000000')),
  burnExpiredTokens: jest.fn().mockResolvedValue({ hash: 'mock-tx-hash', wait: jest.fn().mockResolvedValue({}) }),
  mintForNewUser: jest.fn().mockResolvedValue({ hash: 'mock-tx-hash', wait: jest.fn().mockResolvedValue({ transactionHash: 'mock-tx-hash' }) }),
  adminMint: jest.fn().mockResolvedValue({ hash: 'mock-tx-hash', wait: jest.fn().mockResolvedValue({ transactionHash: 'mock-tx-hash' }) }),
};

// Mock the HotWallet
jest.mock('../../blockchain/hotwallet', () => {
  return jest.fn().mockImplementation(() => {
    return {};
  });
});

// Mock ethers library
jest.mock('ethers', () => {
  const originalEthers = jest.requireActual('ethers');
  
  // Create a proper Jest mock function for solidityKeccak256
  const mockSolidityKeccak256 = jest.fn().mockImplementation((types, values) => {
    // Ensure address is valid format for the tests
    if (values[0] && values[0].startsWith('0x')) {
      // Make sure it's a valid address for testing
      values[0] = '0x' + '1'.repeat(40); // Creates a valid-format address
    }
    return '0xmock-hash';
  });
  
  return {
    ...originalEthers,
    Contract: jest.fn().mockImplementation(() => mockContract),
    Wallet: jest.fn().mockImplementation(() => ({
      signMessage: jest.fn().mockResolvedValue('0xmock-signature'),
      connect: jest.fn().mockReturnThis(),
    })),
    providers: {
      JsonRpcProvider: jest.fn().mockImplementation(() => ({
        getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
      })),
    },
    utils: {
      solidityKeccak256: mockSolidityKeccak256, // Use the proper Jest mock function
      arrayify: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
      formatEther: jest.fn().mockImplementation((value) => {
        if (value.toString() === '100000000000000000') return '0.1';
        if (value.toString() === '1100000000000000000') return '1.1';
        return '1.0';
      }),
      parseEther: jest.fn().mockReturnValue(originalEthers.BigNumber.from('1000000000000000000')),
    },
  };
});

describe('SHAHITokenService', () => {
  let service: ShahiTokenService;
  let configService: ConfigService;
  let eventEmitter: EventEmitter2;

  const mockConfig = {
    'ENCRYPTION_KEY': 'test-encryption-key',
    'ETH_RPC_URL': 'https://test-eth-rpc-url',
    'BNB_RPC_URL': 'https://test-bnb-rpc-url',
    'SOL_RPC_URL': 'https://test-sol-rpc-url',
    'MATIC_RPC_URL': 'https://test-matic-rpc-url',
    'SHAHI_CONTRACT_ADDRESS': '0xmockContractAddress',
    'ADMIN_WALLET_PRIVATE_KEY': 'test-admin-private-key',
    'BLOCKCHAIN_RPC_URL': 'https://test-blockchain-rpc-url',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShahiTokenService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key]),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ShahiTokenService>(ShahiTokenService);
    configService = module.get<ConfigService>(ConfigService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    
    // Explicitly set the private properties to mock objects
    Object.defineProperty(service, 'contract', { 
      value: mockContract,
      writable: true 
    });
    
    Object.defineProperty(service, 'adminWallet', { 
      value: {
        signMessage: jest.fn().mockResolvedValue('0xmock-signature'),
        connect: jest.fn().mockReturnThis(),
      },
      writable: true 
    });
    
    Object.defineProperty(service, 'initialized', { 
      value: true,
      writable: true 
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be initialized properly', () => {
    // Fixed: isInitialized is a property, not a method
    expect(service.isInitialized).toBeTruthy();
  });

  describe('generateMintingSignature', () => {
    it('should generate a signature', async () => {
      // Fixed: using the correct method name generateMintingSignature
      const result = await service.generateMintingSignature('0x1111111111111111111111111111111111111111', 'mock-device-id');
      expect(result).toBe('0xmock-signature');
    });

    it('should throw an error if not initialized', async () => {
      // Mock the checkInitialization method to throw an error
      jest.spyOn(service as any, 'checkInitialization').mockImplementation(() => {
        throw new Error('SHAHITokenService not properly initialized');
      });
      
      // Fixed: using the correct method name generateMintingSignature
      await expect(service.generateMintingSignature('0x1111111111111111111111111111111111111111', 'mock-device-id'))
        .rejects.toThrow('SHAHITokenService not properly initialized');
    });
  });

  describe('firstTimeMint', () => {
    it('should send a transaction for first-time mint', async () => {
      const result = await service.firstTimeMint('0x1111111111111111111111111111111111111111', 'mock-device-id', ['0xproof']);
      expect(result).toBe('mock-tx-hash');
      expect(mockContract.firstTimeMint).toHaveBeenCalledWith(
        '0x1111111111111111111111111111111111111111',
        ['0xproof'],
        'mock-device-id'
      );
    });
  });

  describe('annualMint', () => {
    it('should send a transaction for annual mint', async () => {
      // Fixed: using the correct method name generateMintingSignature
      jest.spyOn(service, 'generateMintingSignature').mockResolvedValue('0xgenerated-signature');
      
      // Fixed: adding the required signature parameter
      const result = await service.annualMint(
        '0x1111111111111111111111111111111111111111', 
        'mock-device-id',
        '0xgenerated-signature'
      );
      
      expect(result).toBe('mock-tx-hash');
      expect(service.generateMintingSignature).toHaveBeenCalledWith(
        '0x1111111111111111111111111111111111111111', 
        'mock-device-id'
      );
      expect(mockContract.annualMint).toHaveBeenCalledWith(
        '0x1111111111111111111111111111111111111111',
        '0xgenerated-signature',
        'mock-device-id'
      );
    });
  });

  describe('getMintingStatus', () => {
    it('should retrieve user minting status', async () => {
      // Fixed: using the correct method name getMintingStatus
      const status = await service.getMintingStatus('0x1111111111111111111111111111111111111111');
      
      expect(status).toEqual({
        hasFirstMinted: true,
        lastMintTimestamp: 1680000000,
        totalMinted: '1.0',
      });
      expect(mockContract.userMintRecords).toHaveBeenCalledWith('0x1111111111111111111111111111111111111111');
    });
  });

  describe('getTokenBalance', () => {
    it('should retrieve token balance', async () => {
      const balance = await service.getTokenBalance('0x1111111111111111111111111111111111111111');
      
      expect(balance).toBe('1.0');
      expect(mockContract.balanceOf).toHaveBeenCalledWith('0x1111111111111111111111111111111111111111');
    });
  });

  describe('getTokenStats', () => {
    it('should retrieve token statistics', async () => {
      const stats = await service.getTokenStats();
      
      expect(stats).toEqual({
        totalSupply: '1.0',
        totalBurned: '0.1',
        totalMinted: '1.1',
      });
      expect(mockContract.totalSupply).toHaveBeenCalled();
      expect(mockContract.burnedTokens).toHaveBeenCalled();
      expect(mockContract.totalMintedTokens).toHaveBeenCalled();
    });
  });

  describe('burnExpiredTokens', () => {
    it('should burn expired tokens', async () => {
      const result = await service.burnExpiredTokens('0x1111111111111111111111111111111111111111');
      
      expect(result).toBe('mock-tx-hash');
      expect(mockContract.burnExpiredTokens).toHaveBeenCalledWith('0x1111111111111111111111111111111111111111');
    });
  });

  describe('mintForNewUser', () => {
    it('should mint tokens for a new user', async () => {
      const result = await service.mintForNewUser('0x1111111111111111111111111111111111111111');
      
      expect(result).toBe('mock-tx-hash');
      expect(mockContract.mintForNewUser).toHaveBeenCalledWith('0x1111111111111111111111111111111111111111');
    });

    it('should fall back to adminMint if mintForNewUser fails', async () => {
      // Make mintForNewUser throw an error for this test only
      const originalMintForNewUser = mockContract.mintForNewUser;
      mockContract.mintForNewUser = jest.fn().mockRejectedValueOnce(new Error('mintForNewUser failed'));
      
      const result = await service.mintForNewUser('0x1111111111111111111111111111111111111111');
      
      expect(result).toBe('mock-tx-hash');
      expect(mockContract.adminMint).toHaveBeenCalledWith(
        '0x1111111111111111111111111111111111111111',
        expect.anything()
      );
      
      // Restore original implementation
      mockContract.mintForNewUser = originalMintForNewUser;
    });

    it('should return null if fully not initialized', async () => {
      // Need to access isInitialized as a property, not a method
      const originalIsInitialized = service.isInitialized;
      
      // Directly modify the property with Object.defineProperty
      Object.defineProperty(service, 'isInitialized', { 
        value: false,
        writable: true,
        configurable: true 
      });
      
      // Also remove contract and adminWallet to simulate uninitialized state
      const originalContract = Object.getOwnPropertyDescriptor(service, 'contract');
      const originalAdminWallet = Object.getOwnPropertyDescriptor(service, 'adminWallet');
      
      Object.defineProperty(service, 'contract', { value: null, writable: true });
      Object.defineProperty(service, 'adminWallet', { value: null, writable: true });
      
      const result = await service.mintForNewUser('0x1111111111111111111111111111111111111111');
      expect(result).toBeNull();
      
      // Restore original properties
      Object.defineProperty(service, 'isInitialized', { 
        value: originalIsInitialized,
        writable: true,
        configurable: true 
      });
      
      if (originalContract) Object.defineProperty(service, 'contract', originalContract);
      if (originalAdminWallet) Object.defineProperty(service, 'adminWallet', originalAdminWallet);
    });
  });
});
