// Add at the beginning of your file
document.addEventListener('DOMContentLoaded', () => {
    // Initially hide minting controls
    const mintingControls = document.querySelector('.minting-controls');
    if (mintingControls) {
        mintingControls.style.display = 'none';
        mintingControls.classList.add('d-none');
    }
});

// Add function to show/hide minting controls
function toggleMintingControls(show) {
    const mintingControls = document.querySelector('.minting-controls');
    if (mintingControls) {
        mintingControls.style.display = show ? 'block' : 'none';
    }
}

// Add automatic visit validation
async function validateVisit() {
    try {
        // Get current wallet
        const walletInfo = await window.WalletConnector.getCurrentWallet();
        if (!walletInfo || !walletInfo.address) {
            throw new Error('Please connect your wallet first');
        }

        // Get hardware fingerprint
        const hardwareID = await generateDeviceFingerprint();

        // Auto-fetch proof from backend
        const response = await fetch('http://localhost:3000/api/mint/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                walletAddress: walletInfo.address,
                hardwareID: hardwareID
            })
        });

        if (!response.ok) {
            throw new Error('Failed to validate visit');
        }

        const validationData = await response.json();
        return validationData;
    } catch (error) {
        console.error('Visit validation failed:', error);
        throw error;
    }
}

// Update handleMinting to use correct amount
async function handleMinting(userAddress) {
    try {
        // Get validation and proof
        const response = await fetch('/api/mint/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Device-ID': await window.WalletManager.getOrCreateDeviceId()
            },
            body: JSON.stringify({
                walletAddress: userAddress
            })
        });

        if (!response.ok) throw new Error('Validation failed');
        
        const { mintToken, proof, signature, isFirstMint } = await response.json();

        // Call contract with correct amount
        const contract = new window.web3.eth.Contract(
            window.SHAHICoin.abi, 
            window.contractAddress
        );

        const tx = await contract.methods.mintTokens(
            window.hotWalletAddress,
            proof,
            signature
        ).send({ 
            from: userAddress,
            gasLimit: 300000
        });

        return tx;
    } catch (error) {
        console.error('Minting error:', error);
        throw error;
    }
}

// Clean up the device fingerprint generator
async function generateDeviceFingerprint() {
    try {
        const components = [
            navigator.userAgent,
            screen.width,
            screen.height,
            navigator.hardwareConcurrency,
            navigator.deviceMemory || '',
            window.devicePixelRatio,
            new Date().getTimezoneOffset(),
            navigator.language,
            navigator.platform,
            Date.now(),
            Math.random() // Add extra entropy
        ];

        const fingerprint = components.join('|');
        return await generateHash(fingerprint);
    } catch (error) {
        console.error('Error generating device fingerprint:', error);
        // Fallback to simpler fingerprint if error
        return generateHash(`${Date.now()}-${Math.random()}-${navigator.userAgent}`);
    }
}

async function generateHash(data) {
    try {
        const encoder = new TextEncoder();
        const rawData = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', rawData);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
        console.error('Hash generation error:', error);
        throw new Error('Failed to generate hash');
    }
}

class MintUI {
    static updateMintingStatus(status, message = '') {
        const mintStatus = document.querySelector('.mint-status');
        const progressBar = document.querySelector('.progress-bar');
        
        if (!mintStatus || !progressBar) return;

        switch (status) {
            case 'pending':
                mintStatus.classList.remove('d-none');
                mintStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Minting in progress...';
                progressBar.style.width = '50%';
                break;
                
            case 'success':
                mintStatus.classList.remove('alert-danger');
                mintStatus.classList.add('alert-success');
                mintStatus.innerHTML = '<i class="fas fa-check-circle"></i> ' + (message || 'Successfully minted!');
                progressBar.style.width = '100%';
                setTimeout(() => {
                    mintStatus.classList.add('d-none');
                    progressBar.style.width = '0%';
                }, 5000);
                break;
                
            case 'error':
                mintStatus.classList.remove('alert-success');
                mintStatus.classList.add('alert-danger');
                mintStatus.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + (message || 'Minting failed');
                progressBar.style.width = '0%';
                setTimeout(() => {
                    mintStatus.classList.add('d-none');
                }, 5000);
                break;
        }
    }

    static updateMintAmount(isFirstMint) {
        const mintAmount = document.getElementById('mint-amount');
        if (mintAmount) {
            mintAmount.textContent = isFirstMint ? 'First Mint: 110 SHAHI' : 'Regular Mint: 1 SHAHI';
        }
    }

    static updateCooldownTimer(remainingTime) {
        const cooldownTimer = document.getElementById('cooldown-timer');
        if (cooldownTimer && remainingTime > 0) {
            const days = Math.floor(remainingTime / (24 * 60 * 60 * 1000));
            cooldownTimer.textContent = `Cooldown: ${days} days remaining`;
            cooldownTimer.classList.remove('d-none');
        } else if (cooldownTimer) {
            cooldownTimer.classList.add('d-none');
        }
    }
}

// Make MintUI globally available
window.MintUI = MintUI;

// Main minting function now in wallet.js
async function handleMinting() {
    try {
        MintUI.updateMintingStatus('pending');
        
        // 1. Validate mint eligibility
        const mintValidation = await window.apiHandler.validateMint(
            this.currentWallet.address,
            await this.getOrCreateDeviceId()
        );
        
        if (!mintValidation.success) {
            throw new Error(mintValidation.error);
        }
        
        // 2. Get proof and signature
        const { proof, signature, isFirstMint } = mintValidation.data;
        
        // 3. Call smart contract
        const contract = new ethers.Contract(
            CONFIG.contractAddress,
            CONFIG.contractABI,
            this.currentWallet.provider
        );
        
        // 4. Execute mint transaction
        const tx = await contract.mintTokens(
            this.currentWallet.address,
            proof,
            signature
        );
        
        // 5. Wait for confirmation
        await tx.wait();
        
        // 6. Update UI
        MintUI.updateMintingStatus('success');
        MintUI.updateMintAmount(isFirstMint);
        
        return tx;
    } catch (error) {
        MintUI.updateMintingStatus('error', error.message);
        throw error;
    }
}

// Add event listeners when document is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initially hide minting controls
    toggleMintingControls(false);

    const mintButtons = document.querySelectorAll('.mint-button');
    mintButtons.forEach(button => {
        button.addEventListener('click', async () => {
            try {
                await handleMinting();
            } catch (error) {
                console.error('Minting failed:', error);
            }
        });
    });
});

// Export for global access
window.handleMinting = handleMinting;