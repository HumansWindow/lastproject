export interface ApiConfig {
  etherscan?: {
    apiKey?: string;
    baseUrl?: string;
  };
  covalent?: {
    apiKey?: string;
    baseUrl?: string;
  };
  blockscout?: {
    baseUrl?: string;
  };
  infura?: {
    apiKey?: string;
    secretKey?: string;
  };
  alchemy?: {
    apiKey?: string;
  };
}