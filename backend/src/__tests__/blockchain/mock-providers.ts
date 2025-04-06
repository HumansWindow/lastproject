import { jest } from '@jest/globals'; // Add this import to make jest.fn() available
import { ethers } from 'ethers';

/**
 * Mock providers for testing to avoid rate limits and timeouts
 */
export const createMockProviders = () => {
  return {
    ETH: {
      getBalance: jest.fn().mockImplementation(() => 
        Promise.resolve(ethers.utils.parseEther('1.0'))
      ),
      getGasPrice: jest.fn().mockImplementation(() => 
        Promise.resolve(ethers.BigNumber.from('40000000000'))
      ),
      getFeeData: jest.fn().mockImplementation(() => 
        Promise.resolve({
          maxFeePerGas: ethers.BigNumber.from('50000000000'),
          maxPriorityFeePerGas: ethers.BigNumber.from('1500000000'),
        })
      ),
    },
    BNB: {
      getBalance: jest.fn().mockImplementation(() => 
        Promise.resolve(ethers.utils.parseEther('1.0'))
      ),
      getGasPrice: jest.fn().mockImplementation(() => 
        Promise.resolve(ethers.BigNumber.from('5000000000'))
      ),
    },
    MATIC: {
      getBalance: jest.fn().mockImplementation(() => 
        Promise.resolve(ethers.utils.parseEther('1.0'))
      ),
      getGasPrice: jest.fn().mockImplementation(() => 
        Promise.resolve(ethers.BigNumber.from('30000000000'))
      ),
      getFeeData: jest.fn().mockImplementation(() => 
        Promise.resolve({
          maxFeePerGas: ethers.BigNumber.from('100000000000'),
          maxPriorityFeePerGas: ethers.BigNumber.from('30000000000'),
        })
      ),
    },
  };
};

// Mock Solana Connection
export const createMockSolanaConnection = () => {
  return {
    getBalance: jest.fn().mockImplementation(() => 
      Promise.resolve(1000000000)
    ), // 1 SOL
    getParsedTokenAccountsByOwner: jest.fn().mockImplementation(() => 
      Promise.resolve({
        value: [
          {
            account: {
              data: {
                parsed: {
                  info: {
                    tokenAmount: { uiAmount: 100 },
                  },
                },
              },
            },
          },
        ],
      })
    ),
  };
};
