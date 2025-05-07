# NFT Marketplace Documentation

## Overview

The NFT Marketplace is a decentralized exchange platform that enables users to list, buy, and sell NFTs within our ecosystem. It serves as the primary marketplace for ShahiNFT tokens and integrates closely with the SHAHI token economy.

## Architecture

The marketplace follows a decentralized exchange model where:

1. NFT owners can list their tokens for sale at a fixed price
2. Potential buyers can purchase listed NFTs by paying the exact price
3. The marketplace contract acts as an escrow, holding NFTs during the listing period
4. Listing fees are collected to maintain the marketplace and contribute to the ecosystem

## Key Components

### Smart Contracts

The marketplace is powered by the following contracts:

- **NFTMarketplace.sol**: The core marketplace contract
- **ShahiNFT.sol**: The NFT implementation contract
- **SHAHICoin.sol**: The token contract for SHAHI currency integration

### Data Structures

#### MarketItem

The core data structure that represents a listing on the marketplace:

```solidity
struct MarketItem {
    uint itemId;          // Unique identifier for the listing
    address nftContract;  // Address of the NFT contract
    uint256 tokenId;      // ID of the NFT within its contract
    address payable seller; // Address of the seller
    address payable owner;  // Address of the current owner (0x0 if listed)
    uint256 price;        // Price in native currency (ETH)
    bool sold;            // Whether the item has been sold
}
```

## Key Marketplace Operations

### 1. Listing an NFT

The listing process follows these steps:

1. User approves the marketplace contract to transfer their NFT
2. User calls the `createMarketItem` function with:
   - NFT contract address
   - Token ID
   - Desired price
   - Listing fee payment
3. NFT is transferred to the marketplace contract (held in escrow)
4. A MarketItem is created and stored on-chain
5. A `MarketItemCreated` event is emitted

### 2. Purchasing an NFT

The purchase process follows these steps:

1. Buyer calls the `createMarketSale` function with:
   - NFT contract address
   - Market item ID
   - Payment matching the listing price
2. Payment is transferred to the seller
3. NFT is transferred from the marketplace to the buyer
4. MarketItem status is updated to sold
5. The listing fee is transferred to the marketplace owner

### 3. Cancelling a Listing

The cancellation process (if implemented):

1. Only the original seller can cancel their listing
2. The NFT is returned to the seller
3. The market item is removed or marked as cancelled
4. The listing fee is not refunded

## Integration with SHAHI Token

The marketplace is designed to integrate with the SHAHI token economy:

### Current Integration Points

1. **Payment Option**: The marketplace can accept SHAHI tokens as payment
2. **Listing Fees**: Can be paid in SHAHI tokens at a discounted rate
3. **Staking Rewards**: NFT holders can stake their NFTs to earn SHAHI rewards

### Future Integration Plans

1. **Royalty Distribution**: Creators will receive royalties in SHAHI tokens for secondary sales
2. **DAO Governance**: NFT holders will participate in governance decisions
3. **SHAHI Rewards**: Marketplace activity will generate SHAHI rewards for participants

## Marketplace Economics

### Fee Structure

- **Listing Fee**: 0.025 ETH (or equivalent in SHAHI)
- **Transaction Fee**: Currently 0% (may be implemented in the future)
- **Creator Royalties**: Currently 0% (to be implemented)

### Revenue Distribution

- **Platform Maintenance**: 70% of fees
- **SHAHI Staking Rewards**: 20% of fees
- **DAO Treasury**: 10% of fees

## Security Considerations

The marketplace implements several security mechanisms:

1. **Reentrancy Protection**: Using OpenZeppelin's ReentrancyGuard
2. **Escrow System**: Marketplace holds assets until sale completion
3. **Access Control**: Only sellers can cancel their listings
4. **Payment Validation**: Strict verification of payment amounts

## Backend Integration

The marketplace integrates with our backend systems through:

### NFTService

Located at `/backend/src/blockchain/hotwallet/services/NFTService.ts`, this service:

- Provides an API for frontend interactions with the NFT marketplace
- Handles NFT minting, listing, and purchasing
- Manages metadata storage and retrieval
- Processes marketplace events and updates the database

### MarketplaceWebhookService

Located at `/backend/src/blockchain/hotwallet/services/MarketplaceWebhookService.ts`, this service:

- Listens for marketplace events
- Updates user balances and ownership records
- Triggers notifications for marketplace activities
- Synchronizes on-chain and off-chain data

## User Interface Integration

The marketplace user interface provides:

1. **Browsing Experience**: Gallery view of all available NFTs
2. **Search & Filter**: Find NFTs by various attributes
3. **User Dashboard**: Manage owned and created NFTs
4. **Simple Listing Process**: Easy-to-use interface for listing NFTs
5. **Secure Purchase Flow**: Guided workflow for purchasing NFTs

## Technical Implementation Details

### Event Handling

The marketplace emits the following events:

```solidity
event MarketItemCreated(
    uint indexed itemId,
    address indexed nftContract,
    uint256 indexed tokenId,
    address seller,
    address owner,
    uint256 price,
    bool sold
);

event MarketItemSold(
    uint indexed itemId,
    address indexed buyer
);
```

### Gas Optimization

The marketplace implements several gas optimizations:

1. **Batch Processing**: Support for batch listings and purchases
2. **Minimal Storage**: Only essential data stored on-chain
3. **Efficient Data Structures**: Optimized mappings and counters
4. **Lazy Minting**: Where applicable, NFTs are minted only when purchased

## Deployment Considerations

When deploying the marketplace:

1. **Fee Configuration**: Set appropriate fee values based on current gas prices
2. **Admin Controls**: Configure admin addresses and permissions
3. **Integration Testing**: Thoroughly test with NFT and SHAHI contracts
4. **Front-end Setup**: Configure front-end to connect to the correct contract addresses

## Common Integration Patterns

### Viewing Available NFTs

```javascript
async function fetchMarketItems() {
  const marketplaceContract = await getMarketplaceContract();
  const itemCount = await marketplaceContract.itemCount();
  
  const items = [];
  for (let i = 1; i <= itemCount; i++) {
    const item = await marketplaceContract.idToMarketItem(i);
    if (!item.sold) {
      // Get URI and metadata
      const nftContract = await getNFTContract(item.nftContract);
      const tokenURI = await nftContract.tokenURI(item.tokenId);
      const metadata = await fetchMetadata(tokenURI);
      
      items.push({
        itemId: item.itemId,
        tokenId: item.tokenId,
        seller: item.seller,
        price: ethers.utils.formatEther(item.price),
        image: metadata.image,
        name: metadata.name,
        description: metadata.description
      });
    }
  }
  
  return items;
}
```

### Purchasing an NFT with SHAHI Tokens

```javascript
async function purchaseNFTWithSHAHI(itemId, price) {
  const shahiContract = await getSHAHIContract();
  const marketplaceContract = await getMarketplaceContract();
  
  // First approve SHAHI tokens to be spent by marketplace
  await shahiContract.approve(marketplaceContract.address, price);
  
  // Then execute the purchase
  const tx = await marketplaceContract.createMarketSaleWithSHAHI(
    nftContractAddress,
    itemId,
    price
  );
  
  return await tx.wait();
}
```

## Future Roadmap

The NFT marketplace development roadmap includes:

1. **Q3 2025**: Implement SHAHI token payment integration
2. **Q4 2025**: Add auction functionality (Dutch and English auctions)
3. **Q1 2026**: Implement creator royalties using ERC-2981
4. **Q2 2026**: Launch NFT collections and series support
5. **Q3 2026**: Develop cross-chain NFT marketplace functionality