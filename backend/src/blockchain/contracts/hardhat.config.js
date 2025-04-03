require('@nomicfoundation/hardhat-ethers');
require('@nomicfoundation/hardhat-verify');
require('@openzeppelin/hardhat-upgrades');
require('hardhat-gas-reporter');
require('dotenv').config();

// Load environment variables securely
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000000";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || "";

module.exports = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    
    // === ETHEREUM ===
    mainnet: {
      url: process.env.ETH_MAINNET_RPC || "https://mainnet.infura.io/v3/your-infura-key",
      accounts: [PRIVATE_KEY],
      gasPrice: 30000000000 // 30 gwei
    },
    goerli: {
      url: process.env.ETH_GOERLI_RPC || "https://goerli.infura.io/v3/your-infura-key",
      accounts: [PRIVATE_KEY],
      gasPrice: 5000000000 // 5 gwei
    },
    
    // === POLYGON ===
    polygon: {
      url: process.env.POLYGON_MAINNET_RPC || "https://polygon-mainnet.infura.io/v3/your-infura-key",
      accounts: [PRIVATE_KEY],
      gasPrice: 80000000000 // 80 gwei
    },
    mumbai: {
      url: process.env.POLYGON_MUMBAI_RPC || "https://polygon-mumbai.infura.io/v3/your-infura-key",
      accounts: [PRIVATE_KEY],
      gasPrice: 5000000000 // 5 gwei
    },
    
    // === BNB CHAIN ===
    bsc: {
      url: process.env.BSC_MAINNET_RPC || "https://bsc-dataseed.binance.org/",
      accounts: [PRIVATE_KEY],
      gasPrice: 5000000000 // 5 gwei
    },
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC || "https://data-seed-prebsc-1-s1.binance.org:8545/",
      accounts: [PRIVATE_KEY],
      gasPrice: 10000000000 // 10 gwei
    },
    
    // === RSK (BITCOIN) ===
    rskmainnet: {
      url: process.env.RSK_MAINNET_RPC || "https://public-node.rsk.co",
      accounts: [PRIVATE_KEY],
      chainId: 30,
      gasPrice: 60000000 // 0.06 gwei (RSK uses lower gas prices)
    },
    rsktestnet: {
      url: process.env.RSK_TESTNET_RPC || "https://public-node.testnet.rsk.co",
      accounts: [PRIVATE_KEY],
      chainId: 31,
      gasPrice: 60000000 // 0.06 gwei
    }
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      goerli: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
      mumbai: POLYGONSCAN_API_KEY,
      bsc: BSCSCAN_API_KEY,
      bscTestnet: BSCSCAN_API_KEY
      // RSK doesn't have direct Hardhat verification support yet
    }
  },
  paths: {
    sources: "./",
    artifacts: "./artifacts",
    cache: "./cache"
  },
  // Exclude problematic files from compilation
  mocha: {
    timeout: 20000
  },
  // Override to handle ENS files in node_modules
  overrides: {
    '@ensdomains/ens': {
      version: "0.4.5",
      settings: {
        outputSelection: {
          "*": {
            "*": ["abi", "evm.bytecode"]
          }
        }
      }
    }
  }
};
