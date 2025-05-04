class PriceFeed {
    constructor(web3, contractAddress, abi) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(abi, contractAddress);
    }

    async getPrice() {
        try {
            return await this.contract.methods.getKhordePriceInUSD().call();
        } catch (error) {
            console.error('Error getting KHORDE price:', error);
            return 0;
        }
    }

    async getShahiPriceInUSD() {
        try {
            return await this.contract.methods.getShahiPriceInUSD().call();
        } catch (error) {
            console.error('Error getting SHAHI price:', error);
            return 0;
        }
    }

    async getPriceInMatic() {
        try {
            return await this.contract.methods.getKhordePriceInMatic().call();
        } catch (error) {
            console.error('Error getting MATIC price:', error);
            return 0;
        }
    }

    async getPriceInEth() {
        try {
            return await this.contract.methods.getKhordePriceInEth().call();
        } catch (error) {
            console.error('Error getting ETH price:', error);
            return 0;
        }
    }
}

window.PriceFeed = PriceFeed;
