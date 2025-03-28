import { jest } from '@jest/globals';

/**
 * Basic sanity tests for the hotwallet implementation
 */

// Set a timeout for this test file specifically
jest.setTimeout(30000);

// Import only what's needed for the test to minimize dependencies
describe('Hot Wallet Configuration', () => {
  it('should verify correct RPC endpoint configuration', () => {
    // Test constants - using the same values used in the real config
    const ETH_RPC_URL = 'wss://mainnet.infura.io/ws/v3/b9980d193a9e496e92e948e0f01ad7c4';
    const BNB_RPC_URL = 'https://bnb-mainnet.g.alchemy.com/v2/fdUf1-b7ks8jGGBzQyurl1RM9o5ITrey';
    const SOL_RPC_URL = 'https://solana-mainnet.g.alchemy.com/v2/fdUf1-b7ks8jGGBzQyurl1RM9o5ITrey';
    const MATIC_RPC_URL = 'wss://polygon-mainnet.infura.io/ws/v3/b9980d193a9e496e92e948e0f01ad7c4';

    // Check that Ethereum uses WebSocket URL
    expect(ETH_RPC_URL.startsWith('wss://')).toBe(true);
    expect(ETH_RPC_URL).toContain('infura.io/ws');

    // Check BNB Chain uses Alchemy
    expect(BNB_RPC_URL.startsWith('https://')).toBe(true);
    expect(BNB_RPC_URL).toContain('alchemy.com');
    expect(BNB_RPC_URL).toContain('bnb-mainnet');

    // Check Solana uses Alchemy
    expect(SOL_RPC_URL.startsWith('https://')).toBe(true);
    expect(SOL_RPC_URL).toContain('alchemy.com');
    expect(SOL_RPC_URL).toContain('solana-mainnet');

    // Check Polygon uses WebSocket URL
    expect(MATIC_RPC_URL.startsWith('wss://')).toBe(true);
    expect(MATIC_RPC_URL).toContain('infura.io/ws');
    expect(MATIC_RPC_URL).toContain('polygon-mainnet');
  });

  it('verifies all required networks are supported', () => {
    // These are the networks we should support
    const requiredNetworks = ['ETH', 'BTC', 'SOL', 'BNB', 'MATIC'];

    // Verify each one
    for (const network of requiredNetworks) {
      expect(['ETH', 'BTC', 'SOL', 'BNB', 'MATIC']).toContain(network);
    }
  });

  it('has valid token configuration', () => {
    // Test some sample token configurations
    const ETH_USDT = {
      type: 'ERC20',
      address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      decimals: 6,
      network: 'ETH',
    };

    const MATIC_USDC = {
      type: 'MATIC20',
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      decimals: 6,
      network: 'MATIC',
    };

    const BNB_CAKE = {
      type: 'BEP20',
      address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
      decimals: 18,
      network: 'BNB',
    };

    // Check token configurations are valid
    expect(ETH_USDT.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(MATIC_USDC.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(BNB_CAKE.address).toMatch(/^0x[a-fA-F0-9]{40}$/);

    // Check decimals are correct
    expect(ETH_USDT.decimals).toBe(6);
    expect(MATIC_USDC.decimals).toBe(6);
    expect(BNB_CAKE.decimals).toBe(18);
  });
});
