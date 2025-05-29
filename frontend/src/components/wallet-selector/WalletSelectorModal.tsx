import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  IconButton,
  Box,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { WalletConnectionResult } from '../../services/WalletProvider';
import { walletSelector } from '../../services/WalletProvider';

interface WalletSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (result: WalletConnectionResult) => void;
}

export const WalletSelectorModal: React.FC<WalletSelectorModalProps> = ({ 
  open, 
  onClose,
  onSelect 
}) => {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Create a ref for modal container to prevent accessibility issues
  const modalContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      try {
        const availableWallets = walletSelector.getAvailableWallets();
        setWallets(availableWallets);
        setError(null);
      } catch (err) {
        setError('Failed to detect wallets');
        console.error('Error detecting wallets:', err);
      } finally {
        setLoading(false);
      }
    }
  }, [open]);

  const handleSelectWallet = async (walletType: string) => {
    try {
      setConnecting(true);
      setError(null);
      const result = await walletSelector.connectWallet(walletType as any);
      if (result.success) {
        onSelect(result);
        onClose();
      } else {
        setError(result.error || 'Connection failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error connecting wallet';
      setError(errorMessage);
      console.error('Error connecting wallet:', err);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <>
      {/* Add a div that will serve as the modal container */}
      <div ref={modalContainerRef} />
      
      <Dialog
        open={open}
        onClose={connecting ? undefined : onClose}
        maxWidth="sm"
        fullWidth
        aria-labelledby="wallet-selector-title"
        // Add these props to fix accessibility issues
        container={modalContainerRef.current}
        disableEnforceFocus
        disablePortal={false}
        disableScrollLock={false}
        keepMounted={false}
      >
        <DialogTitle id="wallet-selector-title">
          Select a Wallet
          {!connecting && (
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box textAlign="center" p={3}>
              <Typography color="error">{error}</Typography>
            </Box>
          ) : (
            <List>
              {wallets.length === 0 ? (
                <Typography>No compatible wallets found</Typography>
              ) : (
                wallets.map((wallet) => (
                  <ListItem key={wallet.providerType} disablePadding>
                    <ListItemButton
                      onClick={() => handleSelectWallet(wallet.providerType)}
                      disabled={connecting || !wallet.installed}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          src={wallet.icon || '/assets/wallets/generic.svg'} 
                          alt={wallet.name}
                        >
                          {wallet.name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={wallet.name}
                        secondary={!wallet.installed ? 'Not installed' : wallet.blockchain} 
                      />
                      {connecting && (
                        <CircularProgress size={24} />
                      )}
                    </ListItemButton>
                  </ListItem>
                ))
              )}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WalletSelectorModal;