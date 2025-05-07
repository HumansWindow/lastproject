# Backend NFT Integration Documentation

## Overview

The backend component of our NFT system provides a bridge between the frontend application and the blockchain smart contracts. It handles NFT minting, listing, purchasing, and metadata management while maintaining a database record of all NFTs for efficient querying and display.

## Architecture

The NFT backend follows a modular architecture pattern based on NestJS:

```
backend/src/nft/
├── entities/
│   └── nft.entity.ts      # Database entity for NFTs
├── nft.controller.ts      # API endpoints for NFT operations
├── nft.module.ts          # Module configuration
└── nft.service.ts         # Business logic implementation
```

This module integrates with:
- Blockchain service for on-chain interactions
- Database for off-chain storage of NFT data
- User service for ownership validation
- IPFS service for metadata storage

## Database Schema

The NFT entity (`nft.entity.ts`) defines the database schema for storing NFT information:

```typescript
@Entity('nfts')
export class NFT {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tokenId: string;

  @Column()
  contractAddress: string;

  @Column()
  chainId: number;

  @Column()
  ownerId: string;

  @Column()
  userId: string;

  @Column()
  metadataUri: string;

  @Column({ type: 'jsonb' })
  metadata: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

This schema maintains both on-chain data (tokenId, contractAddress) and off-chain data (metadata, ownership records) for efficient querying.

## Key Components

### 1. NFT Service

The `NftService` class handles the core business logic for NFT operations:

```typescript
@Injectable()
export class NftService {
  private readonly logger = new Logger(NftService.name);
  private nftContractAbi: any;

  constructor(
    @InjectRepository(NFT)
    private nftRepository: Repository<NFT>,
    private blockchainService: BlockchainService,
  ) {
    // Load NFT contract ABI
    this.nftContractAbi = [/* NFT contract ABI */];
  }
}
```

#### Key Methods

1. **Minting NFTs**

```typescript
async mintNft(userId: string, metadata: any) {
  try {
    // Implement NFT minting logic using blockchain service
    // Store NFT details in database
    const newNft = this.nftRepository.create({
      tokenId: '1',
      contractAddress: '0x...',
      chainId: 1,
      ownerId: userId,
      userId: userId,
      metadataUri: 'https://example.com/metadata/1',
      metadata: metadata,
      isActive: true,
    });

    return await this.nftRepository.save(newNft);
  } catch (error) {
    this.logger.error(`Error minting NFT: ${error.message}`);
    throw error;
  }
}
```

2. **Retrieving User NFTs**

```typescript
async getUserNfts(userId: string) {
  return this.nftRepository.find({
    where: { ownerId: userId },
  });
}
```

3. **Listing NFTs for Sale**

```typescript
async listNFTForSale(tokenId: string, price: string, userId: string) {
  // Validate NFT ownership
  const nft = await this.nftRepository.findOne({ 
    where: { tokenId, ownerId: userId } 
  });
  
  if (!nft) {
    throw new Error('NFT not found or not owned by user');
  }
  
  // Call blockchain service to list on marketplace
  const txHash = await this.blockchainService.listNFTOnMarketplace(
    tokenId, 
    price
  );
  
  // Update NFT status in database
  nft.isListed = true;
  nft.listingPrice = price;
  await this.nftRepository.save(nft);
  
  return { txHash, nft };
}
```

### 2. NFT Controller

The `NftController` class defines the API endpoints for NFT operations:

```typescript
@Controller('nfts')
@ApiTags('nfts')
export class NftController {
  constructor(private readonly nftService: NftService) {}
  
  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Mint a new NFT' })
  async mintNft(
    @Body() createNftDto: CreateNftDto,
    @CurrentUser() user: UserDto
  ) {
    return this.nftService.mintNft(user.id, createNftDto.metadata);
  }
  
  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all NFTs owned by user' })
  async getUserNfts(@CurrentUser() user: UserDto) {
    return this.nftService.getUserNfts(user.id);
  }
  
  @Post(':id/list')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'List an NFT for sale' })
  async listNft(
    @Param('id') tokenId: string,
    @Body() listingDto: ListNftDto,
    @CurrentUser() user: UserDto
  ) {
    return this.nftService.listNFTForSale(
      tokenId, 
      listingDto.price, 
      user.id
    );
  }
}
```

### 3. Blockchain Integration

The NFT module integrates with the blockchain through the `BlockchainService`:

```typescript
// Simplified example of blockchain integration
async callNFTContractMethod(method: string, args: any[]) {
  try {
    const contract = new ethers.Contract(
      this.nftContractAddress,
      this.nftContractAbi,
      this.provider
    );
    
    const tx = await contract[method](...args);
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    this.logger.error(`Error calling NFT contract: ${error.message}`);
    throw error;
  }
}
```

## NFT Lifecycle

### 1. Minting Process

The NFT minting process follows these steps:

1. User requests to mint an NFT through the API
2. Backend validates the request and user permissions
3. Metadata is prepared and uploaded to IPFS
4. The NFT contract's `mintNFT` function is called with:
   - User's wallet address as recipient
   - IPFS metadata URI
5. Transaction receipt is processed to extract tokenId
6. NFT record is created in the database with:
   - On-chain information (tokenId, contract address)
   - Off-chain information (metadata, owner information)
7. Success response is returned to the user

### 2. Listing Process

The listing process includes:

1. User requests to list their NFT at a specific price
2. Backend validates ownership of the NFT
3. NFT approval for marketplace is requested (if not already approved)
4. The marketplace contract's `createMarketItem` function is called with:
   - NFT contract address
   - Token ID
   - Price
5. Transaction receipt is processed
6. NFT database record is updated with listing status and price
7. Success response is returned to the user

### 3. Purchase Process

The purchase process includes:

1. User requests to purchase a listed NFT
2. Backend validates the NFT's listing status
3. Payment handling (depends on payment method):
   - Direct blockchain transaction for Web3 wallets
   - Backend-facilitated transaction for users without wallets
4. The marketplace contract's `createMarketSale` function is called
5. Transaction receipt is processed
6. NFT ownership is updated in the database
7. Success response is returned to both buyer and seller

## Security Considerations

The backend NFT implementation includes several security measures:

1. **Ownership Verification**
   - All NFT operations verify ownership before proceeding
   - Double verification (database and blockchain) for critical operations

2. **Transaction Validation**
   - Gas price limitations to prevent overspending
   - Transaction value validation to ensure correct payment

3. **Rate Limiting**
   - API rate limiting to prevent abuse
   - Concurrent transaction limits to prevent double-spending

4. **Error Handling**
   - Comprehensive error handling for failed transactions
   - Automatic retry mechanisms with exponential backoff

5. **Logging and Monitoring**
   - Detailed logging of all NFT operations
   - Real-time monitoring of transaction status

## Integration with Frontend

The NFT backend exposes several endpoints for frontend integration:

1. **GET /api/nfts**
   - Retrieves all NFTs owned by the authenticated user
   - Supports filtering, sorting, and pagination

2. **POST /api/nfts**
   - Mints a new NFT with provided metadata
   - Returns the newly created NFT with transaction information

3. **GET /api/nfts/:id**
   - Retrieves detailed information about a specific NFT
   - Includes ownership history and transaction records

4. **POST /api/nfts/:id/list**
   - Lists an NFT for sale on the marketplace
   - Sets price and listing parameters

5. **POST /api/nfts/:id/buy**
   - Purchases a listed NFT
   - Handles payment and ownership transfer

## Integration with SHAHI Token

The NFT backend integrates with the SHAHI token in several ways:

1. **Purchase Currency**
   - NFTs can be purchased with SHAHI tokens
   - Price conversion between ETH and SHAHI is handled automatically

2. **Listing Fee Discounts**
   - Users with SHAHI token balances receive discounted listing fees
   - Discount tiers based on SHAHI token holdings

3. **Rewards Integration**
   - NFT activities can generate SHAHI token rewards
   - Events are published to the reward system

## Testing Strategy

The NFT backend includes comprehensive testing:

1. **Unit Tests**
   - Testing individual service methods in isolation
   - Mocking blockchain interactions

2. **Integration Tests**
   - Testing interactions between modules
   - Database interactions with test repositories

3. **E2E Tests**
   - Testing complete user flows
   - Using test blockchain networks (Hardhat or local Ganache)

## Deployment Considerations

When deploying the NFT backend:

1. **Environment Configuration**
   - Proper environment variables for contract addresses
   - Network configuration for different environments

2. **Database Indexing**
   - Create indexes for frequently queried fields
   - Optimize for NFT listing and ownership queries

3. **Scaling Strategies**
   - Horizontal scaling for high-load endpoints
   - Caching for frequently accessed NFT data

4. **Monitoring Setup**
   - Transaction monitoring alerts
   - Error rate monitoring and alerting