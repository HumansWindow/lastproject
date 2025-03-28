require('@nomiclabs/hardhat-waffle');
require('hardhat-gas-reporter');

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
    // Add other networks as needed:
    // mumbai: {
    //   url: `https://polygon-mumbai.infura.io/v3/${INFURA_API_KEY}`,
    //   accounts: [process.env.PRIVATE_KEY]
    // }
  },
  paths: {
    sources: "./",
    artifacts: "./artifacts",
  }
};
