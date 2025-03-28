type Environment = {
  API_URL: string;
  BLOCKCHAIN_NODE_URL: string;
  APP_ENV: string;
};

const DEV: Environment = {
  API_URL: 'https://dev-api.alivehuman.com',
  BLOCKCHAIN_NODE_URL: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
  APP_ENV: 'development',
};

const STAGING: Environment = {
  API_URL: 'https://staging-api.alivehuman.com',
  BLOCKCHAIN_NODE_URL: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
  APP_ENV: 'staging',
};

const PROD: Environment = {
  API_URL: 'https://api.alivehuman.com',
  BLOCKCHAIN_NODE_URL: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
  APP_ENV: 'production',
};

const getEnvVars = (): Environment => {
  if (__DEV__) {
    return DEV;
  }
  
  // You can use other conditions to determine environment
  // e.g. checking if your app is running on test flight
  
  return PROD;
};

export default getEnvVars();
