# ShahiNFT Smart Contract Documentation

## Overview

The `ShahiNFT` contract is our implementation of the ERC-721 standard for non-fungible tokens. It powers the digital collectibles and unique assets within our platform, providing verifiable ownership and secure transfer of digital items between users.

## Technical Architecture

The NFT system consists of two primary contracts:

1. **ShahiNFT**: The core NFT implementation responsible for minting and managing tokens
2. **NFTMarketplace**: A companion contract that enables listing, buying, and selling NFTs

![NFT System Architecture](../../../docs/blockchain/SHahi&NFT/images/nft-architecture.svg)

## ShahiNFT Contract

### Core Features

The `ShahiNFT` contract implements the following features:

- ERC-721 standard compliance for non-fungible tokens
- Metadata support through URI storage
- Owner-controlled minting process
- Unique token ID generation using counter pattern

### Contract Structure

```solidity
// Key imports
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ShahiNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() ERC721("ShahiNFT", "SNFT") {}

    // Minting functionality
    function mintNFT(address recipient, string memory tokenURI) public onlyOwner returns (uint256) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);
        return newItemId;
    }
}
```

### Inherited Contracts

1. **ERC721URIStorage**: Implements URI storage for token metadata
2. **Ownable**: Provides basic access control for owner-only functions
3. **Counters**: Utility for sequential ID generation

### Key Functions

#### Minting NFTs

```solidity
function mintNFT(address recipient, string memory tokenURI) public onlyOwner returns (uint256)
```

- **Purpose**: Creates a new NFT and assigns it to the specified recipient
- **Parameters**: 
  - `recipient`: The address that will receive the newly minted NFT
  - `tokenURI`: A URI pointing to the NFT's metadata (typically an IPFS link)
- **Returns**: The ID of the newly minted NFT
- **Access**: Only the contract owner can mint NFTs
- **Events**: Emits the standard ERC-721 `Transfer` event

### NFT Metadata

The contract follows the ERC-721 metadata standard with JSON metadata at the tokenURI location:

```json
{
  "name": "NFT Name",
  "description": "Description of the NFT",
  "image": "ipfs://QmImageHash",
  "attributes": [
    { "trait_type": "Rarity", "value": "Legendary" },
    { "trait_type": "Creator", "value": "Artist Name" }
    // Additional attributes...
  ]
}
```

## NFT Marketplace Contract

### Overview

The `NFTMarketplace` contract enables users to list and trade NFTs:

- Secure NFT trading without trusted intermediaries
- Fixed-price listing system
- Listing fee structure to sustain marketplace operations
- Built-in protection against reentrancy attacks

### Key Components

#### MarketItem Struct

```solidity
struct MarketItem {
    uint itemId;
    address nftContract;
    uint256 tokenId;
    address payable seller;
    address payable owner;
    uint256 price;
    bool sold;
}
```

This structure stores all relevant information about an NFT listing, including:
- Internal item ID for marketplace tracking
- Reference to the NFT contract address and token ID
- Seller and owner addresses
- Price in native cryptocurrency (ETH)
- Sale status flag

#### Key Functions

1. **Creating Listings**

```solidity
function createMarketItem(
    address nftContract,
    uint256 tokenId,
    uint256 price
) public payable nonReentrant
```

- Creates a new marketplace listing for an NFT
- Requires a listing fee paid in ETH
- Transfers the NFT to the marketplace contract (escrow)
- Emits a `MarketItemCreated` event

2. **Purchasing NFTs**

```solidity
function createMarketSale(
    address nftContract,
    uint256 itemId
) public payable nonReentrant
```

- Handles the purchase of a listed NFT
- Requires payment matching the listing price
- Transfers the NFT from marketplace to buyer
- Sends payment to the seller
- Updates item status to sold
- Pays listing fee to marketplace owner

## Integration with SHAHI Token

The NFT system is designed to integrate with the SHAHI token ecosystem:

1. **Multi-Currency Support**: The marketplace can be extended to support SHAHI token payments
2. **NFT Staking**: NFTs can be staked to earn SHAHI tokens
3. **Creator Royalties**: Creators can receive royalties in SHAHI tokens on secondary sales

## Technical Considerations

### Security Features

The NFT contracts implement several security best practices:

- **Reentrancy Protection**: Using OpenZeppelin's ReentrancyGuard
- **Access Control**: Owner-only functions for administrative actions
- **Safe Transfers**: Following ERC-721 safe transfer patterns

### Gas Optimization

- Uses Counters library for efficient ID generation
- Minimal storage through optimized data structures
- Follows the checks-effects-interactions pattern

## Deployment Information

The NFT contracts are deployed on:

- Ethereum Mainnet
- Polygon Network
- BSC (Binance Smart Chain)

## Future Enhancements

Planned enhancements to the NFT system:

1. **Royalty Support**: Implementation of ERC-2981 for creator royalties
2. **Auctions**: Addition of Dutch and English auction mechanisms
3. **Fractional Ownership**: Allowing multiple users to own portions of an NFT
4. **Collection Support**: Creating and managing NFT collections
5. **Cross-Chain Integration**: Support for NFTs across multiple blockchains

## Integration Examples

### Minting an NFT through the Backend

```javascript
async function mintNFT(recipientAddress, metadataURI) {
  const contract = await getNFTContract();
  const tx = await contract.mintNFT(recipientAddress, metadataURI);
  const receipt = await tx.wait();
  const event = receipt.events.find(event => event.event === 'Transfer');
  const tokenId = event.args.tokenId;
  return tokenId;
}
```

### Listing an NFT on the Marketplace

```javascript
async function listNFT(nftContractAddress, tokenId, priceInEth) {
  const marketplaceContract = await getMarketplaceContract();
  const listingFee = await marketplaceContract.getListingFee();
  const tx = await marketplaceContract.createMarketItem(
    nftContractAddress,
    tokenId,
    ethers.utils.parseEther(priceInEth),
    { value: listingFee }
  );
  await tx.wait();
}
```