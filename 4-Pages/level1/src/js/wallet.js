const WalletManager = {
    walletConnected: false,
    currentWallet: null,
    retryAttempts: 3,
    retryDelay: 1000,

    async checkPreviousConnection() {
        const savedWallet = localStorage.getItem('walletData');
        if (savedWallet) {
            try {
                const { address, type, deviceId } = JSON.parse(savedWallet);
                // End current session before reconnecting
                if (window.sessionTracker) {
                    await window.sessionTracker.endTracking(false);
                }
                
                await this.connect(type, true);
            } catch (error) {
                console.error('Failed to restore previous connection:', error);
                localStorage.removeItem('walletData');
                // Start new anonymous session on failure
                if (window.sessionTracker) {
                    await window.sessionTracker.startTracking();
                }
            }
        }
    },

    async getOrCreateDeviceId() {
        return await window.DeviceIdManager.getDeviceId();
    },

    updateButtonStates() {
        const connectButtons = document.querySelectorAll('.wallet-button');
        const mintButton = document.querySelector('.mint-button');
        const walletStatus = document.getElementById('wallet-status');
        const connectionStatus = document.querySelector('.connection-status');

        if (this.walletConnected && this.currentWallet) {
            connectButtons.forEach(btn => {
                btn.disabled = true;
                btn.innerHTML = `<i class="fas fa-check-circle me-2"></i>Connected`;
            });
            
            mintButton.disabled = false;
            mintButton.querySelector('.button-text').textContent = 'Mint SHAHI';
            
            if (connectionStatus) {
                connectionStatus.classList.remove('d-none');
                const addressDisplay = document.getElementById('wallet-address');
                if (addressDisplay) {
                    addressDisplay.textContent = this.currentWallet.address;
                }
            }
        } else {
            connectButtons.forEach(btn => {
                btn.disabled = false;
                btn.innerHTML = btn.getAttribute('data-original-text');
            });
            
            mintButton.disabled = true;
            mintButton.querySelector('.button-text').textContent = 'Connect Wallet to Mint';
            
            if (connectionStatus) {
                connectionStatus.classList.add('d-none');
            }
        }
    },

    async init() {
        this.setupEventListeners();
        this.updateButtonStates();
        await this.checkPreviousConnection();
    },

    async connect(walletType) {
        try {
            // 1. Get device ID first
            const deviceId = await this.getOrCreateDeviceId();
            
            // 2. End current session if exists
            await window.sessionTracker?.endTracking(false);
            
            // 3. Connect wallet
            const accounts = await this.requestAccounts(walletType);
            
            // 4. Register device/user
            const registrationResult = await this.registerDevice(
                accounts[0], 
                deviceId, 
                walletType
            );
            
            // 5. Start authenticated session
            if (window.sessionTracker) {
                await window.sessionTracker.startTracking(true, accounts[0]);
            }
            
            // 6. Auto-mint on successful connection
            if (this.walletConnected) {
                await this.handleMinting();
            }
            
            return accounts[0];
        } catch (error) {
            console.error('Connection error:', error);
            throw error;
        }
    },

    async registerDevice(walletAddress, deviceId, walletType, sessionDuration = 0) {
        const registrationData = {
            walletAddress,
            deviceId,
            walletType,
            firstSessionDuration: sessionDuration
        };

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const response = await fetch(`${CONFIG.apiBaseUrl}/api/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Device-ID': deviceId
                    },
                    body: JSON.stringify(registrationData)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                return data;

            } catch (error) {
                console.error(`Device registration attempt ${attempt}/${this.retryAttempts} failed:`, error);
                if (attempt === this.retryAttempts) {
                    throw new Error('Device registration failed after multiple attempts');
                }
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            }
        }
    },

    async mint() {
        if (!this.walletConnected) {
            throw new Error('Wallet not connected');
        }

        try {
            const mintResponse = await fetch('/api/mint/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Device-ID': await this.getOrCreateDeviceId()
                },
                body: JSON.stringify({
                    walletAddress: this.currentWallet.address
                })
            });

            if (!mintResponse.ok) {
                throw new Error('Minting validation failed');
            }

            const { mintToken, hotWalletAddress } = await mintResponse.json();
            
            // Call smart contract
            const contract = new ethers.Contract(
                CONFIG.contractAddress,
                CONFIG.contractABI,
                this.currentWallet.provider
            );

            const tx = await contract.mintTokens(
                this.currentWallet.address,
                hotWalletAddress,
                mintToken
            );

            await tx.wait();
            return tx.hash;

        } catch (error) {
            console.error('Minting error:', error);
            throw error;
        }
    },

    setupEventListeners() {
        document.querySelectorAll('.wallet-button').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const walletType = button.getAttribute('data-wallet');
                try {
                    await this.connect(walletType);
                } catch (error) {
                    console.error('Wallet connection error:', error);
                    this.showError(error.message);
                }
            });
        });
    },

    showError(message) {
        const walletStatus = document.getElementById('wallet-status');
        if (walletStatus) {
            walletStatus.textContent = message;
            walletStatus.classList.remove('d-none', 'alert-success');
            walletStatus.classList.add('alert-danger');
            setTimeout(() => {
                walletStatus.classList.add('d-none');
            }, 5000);
        }
    },

    // Add disconnect method to handle session end
    async disconnect() {
        if (this.walletConnected && window.sessionTracker) {
            await window.sessionTracker.endTracking(false);
        }
        
        this.walletConnected = false;
        this.currentWallet = null;
        localStorage.removeItem('walletData');
        this.updateUI();
        
        // Start new anonymous session
        if (window.sessionTracker) {
            await window.sessionTracker.startTracking();
        }
    },

    // Add success message handler
    showSuccess(message) {
        const walletStatus = document.getElementById('wallet-status');
        if (walletStatus) {
            walletStatus.textContent = message;
            walletStatus.classList.remove('d-none', 'alert-danger');
            walletStatus.classList.add('alert-success');
            setTimeout(() => {
                walletStatus.classList.add('d-none');
            }, 5000);
        }
    },

    // Helper methods...
    // ...existing code...
};

// Initialize wallet manager
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.DeviceIdManager === 'undefined') {
        console.error('DeviceIdManager not loaded');
        return;
    }
    
    // Initialize session tracker first
    if (window.sessionTracker) {
        window.sessionTracker.startTracking();
    }
    
    // Then initialize wallet manager
    WalletManager.init();
    
    // Add event listeners for wallet buttons
    document.querySelectorAll('.wallet-button').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            const walletType = button.getAttribute('data-wallet');
            try {
                await WalletManager.connect(walletType);
            } catch (error) {
                console.error('Wallet connection error:', error);
                WalletManager.showError(error.message);
            }
        });
    });
});
