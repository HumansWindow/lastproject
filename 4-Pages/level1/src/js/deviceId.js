class DeviceIdManager {
    static async getDeviceId() {
        let deviceId = localStorage.getItem('device_id');
        
        if (!deviceId) {
            deviceId = await this.generateDeviceId();
            localStorage.setItem('device_id', deviceId);
        }
        
        return deviceId;
    }

    static async generateDeviceId() {
        const components = [
            navigator.userAgent,
            navigator.language,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency,
            screen.colorDepth,
            screen.width + 'x' + screen.height,
            crypto.getRandomValues(new Uint32Array(1))[0].toString()
        ];

        const fingerprint = components.join('|');
        const encoder = new TextEncoder();
        const data = encoder.encode(fingerprint);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
}

window.DeviceIdManager = DeviceIdManager;
