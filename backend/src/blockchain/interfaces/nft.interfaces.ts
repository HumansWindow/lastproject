export interface TransferERC1155Params {
  contractAddress: string;
  tokenId: string;
  from: string;
  to: string;
  amount: number;
  network: string;
}

export interface CollectionStats {
  floor_price: string;
  total_supply?: string;
}

export interface MarketplaceListing {
  listing_id: string;
  token_id: string;
  price: string;
  currency: string;
  seller: string;
}

export interface MarketplaceListingResponse {
  order_hash: string;
}

export interface ListNFTParams {
  contractAddress: string;
  tokenId: string;
  price: string;
  expirationTime?: number;
  network: string;
}

export interface Web3ListingParams extends ListNFTParams {
  ownerAddress: string;
  signature?: string;
}

export interface Web3BuyParams {
  contractAddress: string;
  tokenId: string;
  price: string;
  listingId: string;
  network: string;
  buyerAddress: string;
}

export interface BatchTransferParams {
  contractAddress: string;
  tokenIds: string[];
  from: string;
  to: string;
  amounts: number[];
  network: string;
}

export interface NFTTransferResult {
  transactionHash: string;
  status: boolean;
}
