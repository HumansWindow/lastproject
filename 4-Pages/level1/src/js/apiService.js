const API_BASE_URL = 'http://localhost:3000/api/v1';  // adjust to your backend URL

export const apiService = {
    async connectWallet(address, walletType) {
        try {
            const response = await fetch(`${API_BASE_URL}/wallet/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ address, walletType })
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};
