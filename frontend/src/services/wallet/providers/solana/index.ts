/**
 * Export Solana wallet providers
 */
import { PhantomProvider } from './phantom';
import { SolflareProvider } from './solflare';

export {
  PhantomProvider,
  SolflareProvider
};

// Create named exports object
const solanaProviders = {
  PhantomProvider,
  SolflareProvider
};

export default solanaProviders;