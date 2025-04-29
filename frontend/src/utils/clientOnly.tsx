import React, { ComponentType, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

/**
 * Creates a client-side only version of a component.
 * This is especially useful for components that use browser APIs like WebSocket
 * which cause errors during server-side rendering.
 * 
 * Usage:
 * ```
 * const ClientOnlyWebSocketStatus = clientOnly(WebSocketStatus);
 * ```
 * 
 * @param Component The component to be rendered only on client-side
 * @returns A wrapper component that only renders on client-side
 */
export function clientOnly<P extends object>(Component: ComponentType<P>) {
  const ClientOnlyComponent = (props: P) => {
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
      setIsMounted(true);
    }, []);
    
    if (!isMounted) {
      return null;
    }
    
    return <Component {...props} />;
  };
  
  // Copy display name for better debugging
  ClientOnlyComponent.displayName = `ClientOnly(${Component.displayName || Component.name || 'Component'})`;
  
  return ClientOnlyComponent;
}

/**
 * Creates a Next.js dynamic import that is only loaded on the client side.
 * This is the preferred way to handle WebSocket components.
 * 
 * Usage:
 * ```
 * const WebSocketStatus = dynamicClientOnly(() => import('../components/WebSocketStatus'));
 * ```
 * 
 * @param importFunc The dynamic import function
 * @returns A component that is only loaded and rendered on the client side
 */
export function dynamicClientOnly<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  options = {}
) {
  // Use type assertion to work around the compatibility issue
  return dynamic(importFunc as any, {
    ssr: false,
    loading: () => null,
    ...options
  });
}

// Export utilities as a named object instead of anonymous default export
export const clientOnlyUtils = { clientOnly, dynamicClientOnly };