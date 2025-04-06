/**
 * This file contains configurations for popular token bridges between networks
 * to help users bridge their SHAHI tokens between different blockchains.
 */

const bridges = {
  // Ethereum <-> Polygon
  ethereumToPolygon: {
    name: "Polygon PoS Bridge",
    description: "Official Polygon bridge for moving tokens between Ethereum and Polygon",
    url: "https://wallet.polygon.technology/bridge/",
    documentation: "https://docs.polygon.technology/docs/develop/ethereum-polygon/pos/getting-started/",
    supportedNetworks: ["Ethereum Mainnet", "Polygon Mainnet"],
    tokenType: "ERC20"
  },
  
  // Ethereum <-> BNB Chain
  ethereumToBnb: {
    name: "Binance Bridge",
    description: "Official Binance bridge for moving tokens between Ethereum and BNB Chain",
    url: "https://www.bnbchain.org/en/bridge",
    documentation: "https://docs.bnbchain.org/docs/bnb-chain-wallet",
    supportedNetworks: ["Ethereum Mainnet", "BNB Chain"],
    tokenType: "ERC20"
  },
  
  // Polygon <-> BNB Chain (via Multichain)
  polygonToBnb: {
    name: "Multichain Bridge",
    description: "Popular third-party bridge supporting transfers between multiple chains",
    url: "https://app.multichain.org/#/router",
    documentation: "https://docs.multichain.org/getting-started",
    supportedNetworks: ["Polygon Mainnet", "BNB Chain"],
    tokenType: "ERC20"
  },
  
  // Bitcoin (RSK) <-> Ethereum
  bitcoinToEthereum: {
    name: "RSK Token Bridge",
    description: "Bridge SHAHI tokens between Bitcoin (via RSK) and Ethereum",
    url: "https://tokenbridge.rsk.co/",
    documentation: "https://developers.rsk.co/tools/tokenbridge/",
    supportedNetworks: ["RSK Mainnet", "Ethereum Mainnet"],
    tokenType: "ERC20"
  },
  
  // Bitcoin (RSK) <-> Polygon (via Chainlink CCIP)
  bitcoinToPolygon: {
    name: "Chainlink CCIP Bridge",
    description: "Cross-chain interoperability protocol for bridging tokens between RSK and Polygon",
    url: "https://ccip.chain.link/",
    documentation: "https://docs.chain.link/ccip",
    supportedNetworks: ["RSK Mainnet", "Polygon Mainnet"],
    tokenType: "ERC20"
  },
  
  // Bitcoin (RSK) <-> BNB Chain
  bitcoinToBnb: {
    name: "AllBridge",
    description: "Multi-chain bridge supporting RSK and BNB Chain",
    url: "https://allbridge.io/",
    documentation: "https://docs.allbridge.io/",
    supportedNetworks: ["RSK Mainnet", "BNB Chain"],
    tokenType: "ERC20"
  }
};

module.exports = bridges;