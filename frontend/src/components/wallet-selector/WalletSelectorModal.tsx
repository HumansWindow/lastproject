import React from 'react';
import { Modal } from 'react-bootstrap';
import WalletSelector from './WalletSelector';
import { WalletConnectionResult } from '@/services/wallet';

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
  const handleConnect = (result: WalletConnectionResult) => {
    onConnect(result);
    onHide();
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      backdrop="static"
      keyboard={false}
      dialogClassName="wallet-selector-modal"
    >
      <Modal.Body className="p-0">
        <WalletSelector 
          onConnect={handleConnect}
          onCancel={onHide}
        />
      </Modal.Body>
    </Modal>
  );
};

export default WalletSelectorModal;