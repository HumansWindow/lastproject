export const marketplaceConfig = {
  opensea: {
    apiKey: process.env.OPENSEA_API_KEY,
    accountAddress: process.env.OPENSEA_ACCOUNT_ADDRESS,
    webhookSecret: process.env.OPENSEA_WEBHOOK_SECRET,
    endpoints: {
      mainnet: 'https://api.opensea.io/api/v2',
      testnet: 'https://testnets-api.opensea.io/api/v2'
    }
  },
  looksrare: {
    apiKey: process.env.LOOKSRARE_API_KEY,
    accountAddress: process.env.LOOKSRARE_ACCOUNT_ADDRESS,
    webhookSecret: process.env.LOOKSRARE_WEBHOOK_SECRET,
    endpoints: {
      mainnet: 'https://api.looksrare.org/api/v1',
      testnet: 'https://api-rinkeby.looksrare.org/api/v1'
    }
  }
};
