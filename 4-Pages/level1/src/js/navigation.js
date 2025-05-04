const Navigation = {
    init() {
        this.setupSmoothScroll();
        this.handleInitialHash();
    },

    setupSmoothScroll() {
        document.querySelectorAll('.smooth-scroll').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                this.scrollToElement(targetId);
            });
        });
    },

    scrollToElement(targetId) {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 70,
                behavior: 'smooth'
            });
            // Update URL without triggering scroll
            window.history.pushState(null, '', targetId);
        }
    },

    handleInitialHash() {
        if (window.location.hash) {
            setTimeout(() => {
                this.scrollToElement(window.location.hash);
            }, 100);
        }
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    Navigation.init();
});

export default Navigation;
