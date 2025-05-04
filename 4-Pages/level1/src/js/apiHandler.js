class APIHandler {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    async handleRequest(url, method, data = null) {
        try {
            const response = await fetch(url, {
                method,
                headers: this.defaultHeaders,
                credentials: 'include',
                body: data ? JSON.stringify(data) : null
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async startSession(deviceId, ipAddress, userAgent) {
        return this.handleRequest(
            `${this.baseURL}/session/start`,
            'POST',
            { deviceId, ipAddress, userAgent }
        );
    }

    async endSession(deviceId, sessionId, walletConnected) {
        return this.handleRequest(
            `${this.baseURL}/session/end`,
            'POST',
            { deviceId, sessionId, walletConnected }
        );
    }
}

window.apiHandler = new APIHandler();
