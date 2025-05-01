import React, { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import ReactDOM from 'react-dom';
import WalletSelector from './WalletSelector';
import { WalletConnectionResult } from '@/services/wallet';
import styles from './WalletSelector.module.css';

interface WalletSelectorModalProps {
  show: boolean;
  onHide: () => void;
  onConnect: (result: WalletConnectionResult) => void;
}

const WalletSelectorModal: React.FC<WalletSelectorModalProps> = ({ 
  show, 
  onHide, 
  onConnect 
}) => {
  const [mounted, setMounted] = useState(false);

  // Initialize on mount
  useEffect(() => {
    setMounted(true);
    
    // Handle scroll locking
    if (show && typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [show]);

  const handleConnect = (result: WalletConnectionResult) => {
    onConnect(result);
    onHide();
  };

  // Don't render anything on the server or when not showing
  if (!mounted || !show) {
    return null;
  }

  // Create modal content
  const modalContent = (
    <div className={styles.modalOverlay} onClick={onHide}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <WalletSelector 
          onConnect={handleConnect}
          onCancel={onHide}
        />
      </div>
    </div>
  );

  // Use ReactDOM.createPortal to render directly in the document body
  return ReactDOM.createPortal(
    modalContent,
    document.body
  );
};

export default WalletSelectorModal;