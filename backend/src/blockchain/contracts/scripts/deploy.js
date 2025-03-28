const { ethers } = require("hardhat");

async function main() {
  // Deploy SHAHI Coin
  const SHAHICoin = await ethers.getContractFactory("SHAHICoin");
  const initialSupply = 1000000; // 1 million tokens
  const shahiCoin = await SHAHICoin.deploy(initialSupply);
  await shahiCoin.deployed();
  console.log("SHAHI Coin deployed to:", shahiCoin.address);

  // Deploy NFT contract
  const ShahiNFT = await ethers.getContractFactory("ShahiNFT");
  const shahiNFT = await ShahiNFT.deploy();
  await shahiNFT.deployed();
  console.log("ShahiNFT deployed to:", shahiNFT.address);

  // Deploy Marketplace
  const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
  const marketplace = await NFTMarketplace.deploy();
  await marketplace.deployed();
  console.log("NFT Marketplace deployed to:", marketplace.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
