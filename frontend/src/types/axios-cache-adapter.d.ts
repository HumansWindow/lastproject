declare module 'axios-cache-adapter' {
  import { AxiosAdapter, AxiosRequestConfig } from 'axios';

  interface SetupCacheOptions {
    maxAge?: number;
    exclude?: {
      query?: boolean;
      methods?: string[];
      filter?: (response: any) => boolean;
    };
    clearOnError?: boolean;
    clearOnStale?: boolean;
    readHeaders?: boolean;
    debug?: boolean;
  }

  interface CacheRequestConfig extends AxiosRequestConfig {
    cache?: boolean;
    clearCacheEntry?: boolean;
  }

  interface CacheInstance {
    adapter: AxiosAdapter;
  }

  export function setupCache(options?: SetupCacheOptions): CacheInstance;
}
