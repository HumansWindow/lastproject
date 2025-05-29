/**
 * Wallet Compatibility Loader
 * 
 * This script automatically loads all necessary wallet compatibility fixes
 * and ensures they're applied at the right time during the application lifecycle.
 */

(function() {
  // Paths to compatibility scripts
  const scripts = [
    '/wallet-utils/trust-wallet-fix.js'
  ];
  
  // Function to load a script dynamically
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      
      document.head.appendChild(script);
    });
  }
  
  // Function to apply wallet fixes once loaded
  function applyWalletFixes() {
    console.log('Wallet Loader: Applying wallet compatibility fixes');
    
    // Apply Trust Wallet fix if available
    if (window.TrustWalletFix && typeof window.TrustWalletFix.apply === 'function') {
      const result = window.TrustWalletFix.apply();
      console.log(`Trust Wallet fix applied: ${result ? 'successfully' : 'not needed'}`);
    }
    
    // Dispatch an event so other parts of the application know fixes are applied
    const event = new CustomEvent('wallet-fixes-applied');
    window.dispatchEvent(event);
  }
  
  // Load all scripts, then apply fixes
  function init() {
    console.log('Wallet Loader: Initializing wallet compatibility layer');
    
    const promises = scripts.map(loadScript);
    
    Promise.all(promises)
      .then(() => {
        console.log('Wallet Loader: All compatibility scripts loaded');
        
        // Give a short delay to ensure any initialization in the scripts completes
        setTimeout(applyWalletFixes, 100);
      })
      .catch(err => {
        console.error('Wallet Loader: Error loading compatibility scripts:', err);
      });
  }
  
  // Start loading immediately if document is already loaded
  // Otherwise wait for DOMContentLoaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 0);
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();