async function handleReferral() {
    // Enable referral button when wallet is connected
    window.addEventListener('walletConnected', (e) => {
        const walletAddress = e.detail.address;
        document.getElementById('generateReferralBtn').disabled = false;
        
        // Setup referral button click handler
        document.getElementById('generateReferralBtn').onclick = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/referral/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ walletAddress })
                });
                
                const data = await response.json();
                if (data.success) {
                    const referralLinkBox = document.getElementById('referralLinkBox');
                    const referralLink = document.getElementById('referralLink');
                    referralLinkBox.classList.remove('d-none');
                    referralLink.value = data.referralLink;
                }
            } catch (error) {
                console.error('Failed to generate referral:', error);
                alert('Failed to generate referral link. Please try again.');
            }
        };
    });
}

function copyReferralLink() {
    const referralLink = document.getElementById('referralLink');
    referralLink.select();
    document.execCommand('copy');
    alert('Referral link copied to clipboard!');
}

// Check for referral code on page load
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
    
    if (referralCode) {
        // Store referral code to use after wallet connection
        localStorage.setItem('pendingReferral', referralCode);
    }

    handleReferral();
});
