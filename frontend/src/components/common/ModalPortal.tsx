import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
  rootId?: string;
}

/**
 * A component that renders its children in a portal outside the main DOM hierarchy
 * This ensures modals can be positioned correctly regardless of parent component positioning
 */
const ModalPortal: React.FC<ModalPortalProps> = ({ children, rootId = 'modal-root' }) => {
  const [mounted, setMounted] = useState(false);
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Find or create the modal root element
    let root = document.getElementById(rootId);
    if (!root) {
      root = document.createElement('div');
      root.id = rootId;
      // Ensure it's positioned correctly with CSS
      root.style.position = 'fixed';
      root.style.top = '0';
      root.style.left = '0';
      root.style.width = '100%';
      root.style.height = '100%';
      root.style.zIndex = '9999';
      root.style.pointerEvents = 'none'; // Let clicks through to backdrop
      
      // Important: Append directly to body to avoid layout issues
      document.body.appendChild(root);
    }
    setModalRoot(root);
    
    // Clean up function
    return () => {
      // Only remove the root if it's empty when this component unmounts
      if (root && root.childElementCount <= 1) {
        document.body.removeChild(root);
      }
    };
  }, [rootId]);

  // Don't render anything on the server
  if (!mounted || !modalRoot) return null;
  
  // Render children inside the portal
  return createPortal(<>{children}</>, modalRoot);
};

export default ModalPortal;