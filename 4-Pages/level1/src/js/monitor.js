class ActivityMonitor {
    static async checkStatus() {
        try {
            const response = await fetch('/api/monitor/stats');
            const data = await response.json();
            
            if (data.success) {
                this.updateUI(data.stats);
            }
        } catch (error) {
            console.error('Monitoring error:', error);
        }
    }

    static updateUI(stats) {
        // Update minting stats
        const mintStats = document.getElementById('mint-stats');
        if (mintStats) {
            mintStats.innerHTML = `
                <div>Total Mints: ${stats.totalMints}</div>
                <div>Successful: ${stats.successfulMints}</div>
            `;
        }

        // Update registration stats
        const regStats = document.getElementById('registration-stats');
        if (regStats) {
            regStats.innerHTML = `
                <div>Total Registrations: ${stats.totalRegistrations}</div>
                <div>Successful: ${stats.successfulRegistrations}</div>
            `;
        }
    }
}

// Auto-update every minute
setInterval(() => ActivityMonitor.checkStatus(), 60000);
window.ActivityMonitor = ActivityMonitor;
