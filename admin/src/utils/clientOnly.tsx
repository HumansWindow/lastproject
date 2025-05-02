import React, { ComponentType, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

/**
 * Creates a client-side only version of a component.
 * This is useful for components that use browser APIs like document or window
 * which cause errors during server-side rendering.
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
 * Creates a dynamic import that is only loaded on the client side.
 * This is the preferred way to handle components that use browser-only features.
 */
export function dynamicClientOnly<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  options = {}
) {
  return dynamic(importFunc, {
    ssr: false,
    loading: () => null,
    ...options
  });
}

export default { clientOnly, dynamicClientOnly };