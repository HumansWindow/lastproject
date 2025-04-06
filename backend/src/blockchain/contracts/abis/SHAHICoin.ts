export const SHAHICoinABI = [
  // Minting functions
  "function firstTimeMint(address user, bytes32[] calldata proof, string calldata deviceId) external",
  "function annualMint(address user, bytes calldata signature, string calldata deviceId) external",
  "function regularMint(address user, bytes calldata signature, string calldata deviceId) external",
  
  // View functions
  "function balanceOf(address account) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function burnedTokens() external view returns (uint256)",
  "function totalMintedTokens() external view returns (uint256)",
  "function userMintRecords(address) external view returns (uint256 lastMintTimestamp, bool hasFirstMinted, uint256 totalMinted)",
  
  // Events
  "event FirstTimeMint(address indexed user, uint256 amount)",
  "event RegularMint(address indexed user, uint256 adminShare, uint256 userShare)",
  "event TokensExpiredAndBurned(address indexed user, uint256 amount)",
  
  // Admin functions
  "function burnExpiredTokens(address user) external"
];
