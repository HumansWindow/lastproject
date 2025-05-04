const CONFIG = {
    apiBaseUrl: 'http://localhost:3000',
    contractAddress: '0x1234567890123456789012345678901234567890',  // Your contract address
    chainId: '1',
    supportedChains: ['1', '137'],
    apiTimeout: 30000,
    maxRetries: 3,
    responseFormats: {
        mint: {
            success: {
                status: 'success',
                details: {
                    txHash: null,
                    amount: null,
                    timestamp: null
                }
            },
            error: {
                status: 'error',
                message: null,
                code: null
            }
        }
    }
};

window.CONFIG = CONFIG;

window.config = {
    API_URL: 'http://localhost:3001',
    CONTRACT_ADDRESS: '0x1234567890123456789012345678901234567890',  // Your contract address
    CHAIN_ID: '1',
    SUPPORTED_CHAINS: ['1', '137'],
    API_TIMEOUT: 30000,
    MAX_RETRIES: 3
};

const CONTRACT_CONFIG = {
    addresses: {
        shahiCoin: '0x...', // Add your deployed contract address
        priceFeed: '0x...' // Add your price feed contract address
    },
    networks: {
        mainnet: {
            chainId: '0x1',
            rpcUrl: 'https://mainnet.infura.io/v3/YOUR-PROJECT-ID'
        },
        testnet: {
            chainId: '0x5',
            rpcUrl: 'https://goerli.infura.io/v3/YOUR-PROJECT-ID'
        }
    }
};

const SHAHICoinV1ABI = [
    // Add the methods needed for price feeds
    {
        "inputs": [],
        "name": "getKhordePriceInUSD",
        "outputs": [{"type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getShahiPriceInUSD",
        "outputs": [{"type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
    // Add other required methods...
];

// Add contract addresses for different networks
const CONTRACT_ADDRESSES = {
    mainnet: '0x...', // Add your mainnet contract address
    testnet: '0x...', // Add your testnet contract address
};

window.APIService = class APIService {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
        this.retryAttempts = 3;
        this.retryDelay = 2000; // 2 seconds
        this.timeout = 5000; // 5 seconds
    }

    async fetch(endpoint, options = {}) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);

                const response = await fetch(`${this.baseURL}${endpoint}`, {
                    ...options,
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    }
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'API request failed');
                }

                const data = await response.json();
                if (!data.success) {
                    throw new Error(data.error || 'Operation failed');
                }

                return data;
            } catch (error) {
                lastError = error;
                console.warn(`API call failed (attempt ${attempt}/${this.retryAttempts}):`, error);
                
                if (attempt < this.retryAttempts) {
                    // Exponential backoff with jitter
                    const delay = this.retryDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }
};
