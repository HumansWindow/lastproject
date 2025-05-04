let priceFeed;
let web3;

// Initialize Web3 and price feed
async function initPriceFeed() {
    try {
        // Check if Web3 is available
        if (typeof Web3 === 'undefined') {
            throw new Error('Web3 is not loaded');
        }

        // Initialize Web3
        if (window.ethereum) {
            web3 = new Web3(window.ethereum);
        } else if (window.web3) {
            web3 = new Web3(window.web3.currentProvider);
        } else {
            web3 = new Web3(new Web3.providers.HttpProvider(CONTRACT_CONFIG.networks.mainnet.rpcUrl));
        }

        // Initialize contract
        const contractAddress = CONTRACT_CONFIG.addresses.shahiCoin;
        // Validate address
        if (!web3.utils.isAddress(contractAddress)) {
            console.error('Invalid contract address:', contractAddress);
            return false; // skip initialization
        }
        priceFeed = new PriceFeed(web3, contractAddress, SHAHICoinV1ABI);
        return true;
    } catch (error) {
        console.error('Failed to initialize Web3:', error);
        return false;
    }
}

// Function to copy contract address
function copyAddress() {
    const input = document.querySelector('.contract-details input');
    if (input) {
        input.select();
        document.execCommand('copy');
        alert('Contract address copied to clipboard!');
    }
}

async function initCurrencyPrices() {
    if (!priceFeed) {
        const initialized = await initPriceFeed();
        if (!initialized) {
            return getDefaultPrices();
        }
    }

    try {
        // Get USD prices
        const prices = {
            usd: {
                khorde: await priceFeed.getPrice(),
                shahi: await priceFeed.getShahiPriceInUSD()
            },
            matic: {
                khorde: 0,
                shahi: 0
            },
            eth: {
                khorde: 0,
                shahi: 0
            }
        };

        return prices;
    } catch (error) {
        console.error('Error fetching prices:', error);
        return getDefaultPrices();
    }
}

// Add default prices for fallback
function getDefaultPrices() {
    return {
        usd: { khorde: 1, shahi: 1000 },
        matic: { khorde: 0.5, shahi: 500 },
        eth: { khorde: 0.001, shahi: 1 }
    };
}

// Updated circular control initialization
document.addEventListener('DOMContentLoaded', async function() {
    await initPriceFeed();
    initCircularControl();
});

function initCircularControl() {
    const controlRing = document.querySelector('.control-ring');
    const valueDisplay = document.querySelector('.value-display');
    const numberInput = document.getElementById('amountInput');
    const handle = document.querySelector('.slider-handle');
    const MIN_VALUE = 1; // Changed from 3 to 1
    
    let isDragging = false;
    let currentAngle = 0;
    let currentValue = MIN_VALUE;
    let rotationCount = 0;
    let lastAngle = 0;
    let currentCurrency = 'usd';
    let prices = {};

    // Calculate circle properties
    const getCircleProperties = () => {
        const rect = controlRing.getBoundingClientRect();
        const radius = (rect.width - handle.offsetWidth) / 2;
        const center = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        return { radius, center };
    };

    function updateHandlePosition(angle) {
        // Convert angle to radians and adjust for starting position (top)
        const radians = (angle - 90) * (Math.PI / 180);
        const { radius } = getCircleProperties();
        
        // Calculate position
        const x = Math.cos(radians) * radius;
        const y = Math.sin(radians) * radius;
        
        // Apply transform
        handle.style.transform = `translate(${x}px, ${y}px)`;
    }

    function updateUI(angle, newValue) {
        updateHandlePosition(angle);
        
        if (newValue !== undefined) {
            currentValue = Math.max(MIN_VALUE, Math.floor(newValue));
            valueDisplay.textContent = `$${currentValue.toLocaleString('en-US')}`;
            numberInput.value = currentValue;
        }
    }

    async function updatePrices() {
        prices = await initCurrencyPrices();
        updateDisplay(currentValue, prices);
    }

    function updateDisplay(value, prices) {
        const display = document.querySelector('.value-display');
        if (!display) return;

        const amountEl = display.querySelector('.amount');
        const khordeEl = display.querySelector('.khorde-amount');
        const shahiEl = display.querySelector('.shahi-amount');
        if (!amountEl || !khordeEl || !shahiEl) return;

        try {
            const khordeAmount = value / prices[currentCurrency].khorde;
            const shahiAmount = value / prices[currentCurrency].shahi;
            
            // Update display values
            amountEl.textContent = value.toLocaleString('en-US');
            khordeEl.textContent = khordeAmount.toFixed(8);
            shahiEl.textContent = shahiAmount.toFixed(8);
            
            // Update conversion rates
            document.querySelector('.khorde-rate').textContent = prices[currentCurrency].khorde.toFixed(8);
            document.querySelector('.shahi-rate').textContent = prices[currentCurrency].shahi.toFixed(8);
        } catch (error) {
            console.error('Error updating display:', error);
            display.innerHTML = '<div class="text-danger">Error loading prices</div>';
        }
    }

    // Currency selector handling
    document.querySelectorAll('#BuyCoin .currency-selector button').forEach(button => {
        button.addEventListener('click', async function() {
            const currency = this.dataset.currency;
            currentCurrency = currency;
            
            // Update UI elements
            document.querySelector('.currency-prefix').textContent = 
                currency === 'usd' ? '$' : 
                currency === 'matic' ? 'MATIC' : 'ETH';
            
            document.querySelector('.currency-name').textContent = 
                currency.toUpperCase();
            
            document.querySelectorAll('.current-currency').forEach(el => {
                el.textContent = currency.toUpperCase();
            });
            
            // Update prices and display
            await updatePrices();
            updateDisplay(currentValue, prices);
        });
    });

    // Initialize prices
    updatePrices();

    // Define value ranges per rotation
    const RANGES = [
        { rotation: 1, multiplier: 1 },       // First rotation: normal pace
        { rotation: 2, multiplier: 10 },      // Second rotation: 10x faster
        { rotation: 3, multiplier: 100 },     // Third rotation: 100x faster
        { rotation: 4, multiplier: 1000 },    // Fourth rotation: 1000x faster
        { rotation: Infinity, multiplier: 10000 } // Subsequent rotations: 10000x faster
    ];

    function getMultiplier() {
        return RANGES.find(r => rotationCount < r.rotation)?.multiplier || RANGES[RANGES.length - 1].multiplier;
    }

    function handleStart(e) {
        isDragging = true;
        
        const rect = controlRing.getBoundingClientRect();
        const center = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        
        const pointer = {
            x: e.type.includes('touch') ? e.touches[0].clientX : e.clientX,
            y: e.type.includes('touch') ? e.touches[0].clientY : e.clientY
        };
        
        lastAngle = Math.atan2(pointer.y - center.y, pointer.x - center.x) * 180 / Math.PI;
        
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('touchmove', handleMove, { passive: false });
    }

    function handleMove(e) {
        if (!isDragging) return;
        e.preventDefault();

        const { center } = getCircleProperties();
        const pointer = {
            x: e.type.includes('touch') ? e.touches[0].clientX : e.clientX,
            y: e.type.includes('touch') ? e.touches[0].clientY : e.clientY
        };

        // Calculate new angle
        let newAngle = Math.atan2(pointer.y - center.y, pointer.x - center.x) * 180 / Math.PI;
        let angleDiff = newAngle - lastAngle;
        
        // Normalize angle difference
        if (angleDiff < -180) angleDiff += 360;
        if (angleDiff > 180) angleDiff -= 360;

        // Calculate new value
        const multiplier = getMultiplier();
        const angleValue = Math.floor((angleDiff / 360) * 1000 * multiplier);
        const potentialNewValue = Math.floor(currentValue + angleValue);

        // Update if valid
        if ((angleDiff < 0 && potentialNewValue >= MIN_VALUE) || angleDiff > 0) {
            currentAngle += angleDiff;
            rotationCount = Math.floor(Math.abs(currentAngle) / 360);
            currentValue = Math.max(MIN_VALUE, potentialNewValue);
            
            // Update UI
            updateHandlePosition(currentAngle % 360);
            valueDisplay.textContent = `$${currentValue.toLocaleString('en-US')}`;
            numberInput.value = currentValue;
        }

        lastAngle = newAngle;
    }

    function handleEnd() {
        isDragging = false;
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('touchmove', handleMove);
    }

    // Event listeners
    handle.addEventListener('mousedown', handleStart);
    handle.addEventListener('touchstart', handleStart);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);

    // Enhanced number input handlers
    numberInput.addEventListener('focus', function() {
        this.value = '';
    });

    numberInput.addEventListener('blur', function() {
        // Always use integer values
        const value = Math.floor(Number(this.value)) || MIN_VALUE;
        this.value = Math.max(MIN_VALUE, value);
        currentValue = Math.floor(this.value);
        updateUI(currentAngle, currentValue);
    });

    numberInput.addEventListener('input', function() {
        // Remove any non-numeric characters and decimal points
        this.value = this.value.replace(/[^\d]/g, '');
        const value = parseInt(this.value) || 0;
        if (value >= 0) {
            currentValue = Math.floor(value);
            updateUI(currentAngle, value);
        }
    });

    // Initialize at minimum value
    updateUI(0, MIN_VALUE);
}

// Initialize the payment button
const paymentBtn = document.querySelector('.payment-btn');
if (paymentBtn) {
    paymentBtn.addEventListener('click', async function() {
        const amount = numberInput.value;
        if (!window.ethereum) {
            alert('Please connect your wallet first!');
            return;
        }

        try {
            // First check if already connected
            let accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (!accounts || accounts.length === 0) {
                accounts = await connectMetaMask();
                if (!accounts || accounts.length === 0) {
                    throw new Error('Please connect a wallet first');
                }
            }

            // Proceed with payment
            alert(`Processing payment for $${amount}...`);
            // Add your payment processing logic here
        
        } catch (error) {
            console.error('Payment error:', error);
            alert('Payment failed: ' + error.message);
        }
    });
}
