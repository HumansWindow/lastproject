import React, { useState } from 'react';
import { Button, Box } from '@mui/material';
import { WalletSelectorModal } from './WalletSelectorModal';
import { WalletConnectionResult } from '../../services/wallet/core/walletBase';
import { walletSelector } from '../../services/WalletProvider';

interface WalletSelectorProps {
  onSelect?: (result: WalletConnectionResult) => void;
  onError?: (error: string) => void;
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  buttonText?: string;
}

const WalletSelector: React.FC<WalletSelectorProps> = ({
  onSelect,
  onError,
  variant = 'contained',
  size = 'medium',
  color = 'primary',
  buttonText = 'Connect Wallet'
}) => {
  const [isModalOpen, setModalOpen] = useState(false);

  const handleOpenModal = () => {
    try {
      setModalOpen(true);
    } catch (error) {
      console.error('Error detecting wallets:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to detect wallets');
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleWalletSelect = (result: WalletConnectionResult) => {
    if (onSelect) {
      onSelect(result);
    }
  };

  return (
    <Box>
      <Button 
        variant={variant} 
        size={size} 
        color={color} 
        onClick={handleOpenModal}
      >
        {buttonText}
      </Button>
      
      <WalletSelectorModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSelect={handleWalletSelect}
      />
    </Box>
  );
};

export default WalletSelector;