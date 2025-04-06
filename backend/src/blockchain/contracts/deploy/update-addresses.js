const fs = require('fs');
const path = require('path');

/**
 * Updates the contract-addresses.json file with the latest deployment address
 * @param {string} blockchain - The blockchain name (ethereum, polygon, bnbChain, bitcoin)
 * @param {string} environment - The environment type (mainnet or testnet)
 * @param {string} testnetName - Specific testnet name (mumbai, goerli, etc.) if applicable
 * @param {string} address - The deployed contract address
 */
function updateContractAddress(blockchain, environment, testnetName, address) {
    // Path to addresses file
    const addressesPath = path.join(__dirname, 'contract-addresses.json');
    
    // Initialize default structure if file doesn't exist
    if (!fs.existsSync(addressesPath)) {
        const defaultAddresses = {
            SHAHICoin: {
                ethereum: {
                    mainnet: "",
                    testnet: {
                        goerli: ""
                    }
                },
                polygon: {
                    mainnet: "",
                    testnet: {
                        mumbai: ""
                    }
                },
                bnbChain: {
                    mainnet: "",
                    testnet: ""
                },
                bitcoin: {
                    mainnet: "",
                    testnet: ""
                },
                deploymentDates: {
                    ethereum: {
                        mainnet: "",
                        goerli: ""
                    },
                    polygon: {
                        mainnet: "",
                        mumbai: ""
                    },
                    bnbChain: {
                        mainnet: "",
                        testnet: ""
                    },
                    bitcoin: {
                        mainnet: "",
                        testnet: ""
                    }
                }
            }
        };
        
        fs.writeFileSync(addressesPath, JSON.stringify(defaultAddresses, null, 2));
    }
    
    // Read the current addresses file
    const rawData = fs.readFileSync(addressesPath);
    const addresses = JSON.parse(rawData);
    
    // Update the address based on blockchain and environment
    if (environment === 'mainnet') {
        addresses.SHAHICoin[blockchain].mainnet = address;
        addresses.SHAHICoin.deploymentDates[blockchain].mainnet = new Date().toISOString();
    } else if (environment === 'testnet') {
        if (testnetName && testnetName !== '') {
            // For named testnets (like Ethereum's Goerli or Polygon's Mumbai)
            if (!addresses.SHAHICoin[blockchain].testnet[testnetName]) {
                addresses.SHAHICoin[blockchain].testnet[testnetName] = "";
            }
            addresses.SHAHICoin[blockchain].testnet[testnetName] = address;
            
            // Add date if it doesn't exist
            if (!addresses.SHAHICoin.deploymentDates[blockchain][testnetName]) {
                addresses.SHAHICoin.deploymentDates[blockchain][testnetName] = "";
            }
            addresses.SHAHICoin.deploymentDates[blockchain][testnetName] = new Date().toISOString();
        } else {
            // For general testnets (like BSC Testnet)
            addresses.SHAHICoin[blockchain].testnet = address;
            addresses.SHAHICoin.deploymentDates[blockchain].testnet = new Date().toISOString();
        }
    }
    
    // Write the updated data back to the file
    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
    
    console.log(`Updated contract address for ${blockchain} ${environment} ${testnetName ? '(' + testnetName + ')' : ''}: ${address}`);
}

module.exports = {
    updateContractAddress
};