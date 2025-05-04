export class SessionTracker {
    constructor() {
        this.currentSessionId = null;
        this.sessionStartTime = null;
        this.isTracking = false;
        this.deviceId = this.getOrCreateDeviceId();
    }

    getOrCreateDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = this.generateDeviceId();
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    generateDeviceId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    async startTracking() {
        if (this.isTracking) return;
        
        if (!this.deviceId) {
            console.error('Device ID not available');
            this.deviceId = this.getOrCreateDeviceId();
        }

        try {
            const response = await fetch('/api/session/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    deviceId: this.deviceId,
                    ipAddress: await this.getIpAddress(),
                    userAgent: navigator.userAgent
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success && data.sessionId) {
                this.currentSessionId = data.sessionId;
                this.sessionStartTime = Date.now();
                this.isTracking = true;
                
                document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
                window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
            } else {
                throw new Error('Invalid session response');
            }
        } catch (error) {
            console.error('Failed to start session:', error);
            // Retry after a delay
            setTimeout(() => this.startTracking(), 5000);
        }
    }

    async getIpAddress() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('Failed to get IP address:', error);
            return '0.0.0.0';
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.endSession(false);
        } else {
            this.startTracking();
        }
    }

    handleBeforeUnload() {
        this.endSession(false);
    }

    async endSession(walletConnected = false) {
        if (!this.isTracking || !this.currentSessionId) return;

        try {
            await fetch('/api/session/end', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    deviceId: this.deviceId,
                    sessionId: this.currentSessionId,
                    walletConnected
                })
            });

            this.isTracking = false;
            this.currentSessionId = null;
            this.sessionStartTime = null;
        } catch (error) {
            console.error('Failed to end session:', error);
        }
    }
}

// Create default export
export default new SessionTracker();

// Remove the old export code and keep only browser initialization
if (typeof window !== 'undefined') {
    window.sessionTracker = new SessionTracker();
    document.addEventListener('DOMContentLoaded', () => {
        window.sessionTracker.startTracking().catch(console.error);
    });
}
