async function runIntegrationTests() {
    const results = document.createElement('div');
    results.className = 'test-results';
    
    try {
        // Test 1: Generate Device ID
        const hardwareID = await window.getHardwareID();
        addResult(results, 'Device ID Generation', true, hardwareID);

        // Test 2: Register First Wallet
        const firstWallet = '0x1234567890123456789012345678901234567890';
        try {
            const firstRegResponse = await registerWallet(firstWallet, 'MetaMask', hardwareID);
            addResult(results, 'First Wallet Registration', true, 
                JSON.stringify(firstRegResponse.user));
        } catch (error) {
            if (error.message.includes('already registered')) {
                addResult(results, 'First Wallet Registration', true, 
                    'Device already registered (expected)');
            } else {
                throw error;
            }
        }

        // Test 3: Attempt Second Wallet (Should Fail)
        const secondWallet = '0x9876543210987654321098765432109876543210';
        try {
            await registerWallet(secondWallet, 'Trust Wallet', hardwareID);
            addResult(results, 'Security Check', false, 
                'Second wallet registration should have failed');
        } catch (error) {
            if (error.message.includes('already registered')) {
                addResult(results, 'Security Check', true, 
                    'Successfully prevented second wallet registration');
            } else {
                throw error;
            }
        }

        // Test 4: Referral System
        try {
            const referralResponse = await createReferral(firstWallet, secondWallet);
            addResult(results, 'Referral Creation', true, 
                JSON.stringify(referralResponse));
        } catch (error) {
            if (error.message.includes('already referred')) {
                addResult(results, 'Referral Creation', true, 
                    'User already referred (expected)');
            } else {
                addResult(results, 'Referral Creation', false, 
                    error.message);
            }
        }

    } catch (error) {
        console.error('Test Suite Error:', error);
        addResult(results, 'Test Suite', false, error.message);
    }

    const container = document.querySelector('.test-container') || document.body;
    container.appendChild(results);
}

async function registerWallet(walletAddress, walletType, hardwareID) {
    const API_BASE_URL = 'http://localhost:3000/api';
    
    try {
        // First verify if device is already registered
        const verifyResponse = await fetch(`${API_BASE_URL}/verify-device`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ hardwareID })
        });

        const verifyData = await verifyResponse.json();
        
        // If device is registered to a different wallet, block registration
        if (verifyData.isRegistered && verifyData.walletAddress !== walletAddress) {
            throw new Error('Device already registered to wallet: ' + 
                verifyData.walletAddress.substring(0, 6) + '...');
        }

        // Proceed with registration
        const registerResponse = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                walletAddress,
                walletType,
                hardwareID,
                timestamp: Date.now()
            })
        });

        if (!registerResponse.ok) {
            const error = await registerResponse.json();
            throw new Error(error.error || 'Registration failed');
        }

        return await registerResponse.json();

    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

async function createReferral(referrerWallet, referredWallet) {
    const API_BASE_URL = 'http://localhost:3000/api';
    
    try {
        // First register the referrer wallet
        await registerWallet(referrerWallet, 'MetaMask', await window.getHardwareID('referrer'));
        
        // Generate a unique device ID for referred wallet
        const referredHardwareID = await window.getHardwareID('referred-' + Date.now());
        
        // Then create referral
        const referralResponse = await fetch(`${API_BASE_URL}/referral/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                referrerWallet: referrerWallet.toLowerCase(),
                referredWallet: referredWallet.toLowerCase()
            })
        });

        if (!referralResponse.ok) {
            const error = await referralResponse.json();
            throw new Error(error.error || 'Referral creation failed');
        }

        // Finally register the referred wallet
        await registerWallet(referredWallet, 'MetaMask', referredHardwareID);

        return await referralResponse.json();
    } catch (error) {
        console.error('Referral error:', error);
        throw error;
    }
}

async function verifyDevice(hardwareID, walletAddress) {
    const response = await fetch('http://localhost:3000/api/verify-device', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            hardwareID,
            walletAddress
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Device verification failed');
    }

    return await response.json();
}

function addResult(container, testName, passed, details = '') {
    const result = document.createElement('div');
    result.className = `test-result ${passed ? 'pass' : 'fail'}`;
    result.innerHTML = `
        <span class="test-name">${testName}</span>
        <span class="test-status">${passed ? '✅' : '❌'}</span>
        ${details ? `<div class="test-details">${details}</div>` : ''}
    `;
    container.appendChild(result);
}

// Add test button
function addIntegrationTestButton() {
    const button = document.createElement('button');
    button.textContent = 'Run Integration Tests';
    button.className = 'btn btn-primary test-button';
    button.onclick = runIntegrationTests;
    
    const container = document.createElement('div');
    container.className = 'test-container mb-4';
    container.appendChild(button);
    
    // Add to page near wallet buttons
    document.querySelector('.wallet-buttons').appendChild(container);
}

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addIntegrationTestButton);
} else {
    addIntegrationTestButton();
}
