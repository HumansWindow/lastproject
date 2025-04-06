/**
 * Mock providers for testing to avoid rate limits and timeouts (Legacy JS version)
 * This file is kept for reference but the TypeScript version should be used instead
 */

// Mock the core methods needed for testing
export const createMockProviders = () => {
  return {
    ETH: {
      getBalance: jest.fn().mockResolvedValue(ethers.utils.parseEther('1.0')),
      getGasPrice: jest.fn().mockResolvedValue(ethers.BigNumber.from('40000000000')),
      getFeeData: jest.fn().mockResolvedValue({
        maxFeePerGas: ethers.BigNumber.from('50000000000'),
        maxPriorityFeePerGas: ethers.BigNumber.from('1500000000'),
      }),
    },
    BNB: {
      getBalance: jest.fn().mockResolvedValue(ethers.utils.parseEther('1.0')),
      getGasPrice: jest.fn().mockResolvedValue(ethers.BigNumber.from('5000000000')),
    },
    MATIC: {
      getBalance: jest.fn().mockResolvedValue(ethers.utils.parseEther('1.0')),
      getGasPrice: jest.fn().mockResolvedValue(ethers.BigNumber.from('30000000000')),
      getFeeData: jest.fn().mockResolvedValue({
        maxFeePerGas: ethers.BigNumber.from('100000000000'),
        maxPriorityFeePerGas: ethers.BigNumber.from('30000000000'),
      }),
    },
  };
};

// Mock Solana Connection
export const createMockSolanaConnection = () => {
  return {
    getBalance: jest.fn().mockResolvedValue(1000000000), // 1 SOL
    getParsedTokenAccountsByOwner: jest.fn().mockResolvedValue({
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
    }),
  };
};
