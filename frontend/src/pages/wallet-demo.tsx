import React, { useState, useEffect } from 'react';
import Layout from "../components/layout/Layout";
import type { NextPage } from "next";
import { WalletInfo } from "../services/wallet/core/walletBase";
import { WalletSelectorModal } from "../components/wallet-selector/WalletSelectorModal";
import WalletDebugWrapper from "../components/debug/WalletDebugWrapper";
import { Container, Button, Card, Alert } from 'react-bootstrap';
import { walletSelector } from "../services/WalletProvider";

const WalletDemo: React.FC = () => {
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  // Try to restore previous wallet connection on page load
  useEffect(() => {
    const connectToLastWallet = async () => {
      const result = await walletSelector.connectToLastWallet();
      if (result && result.success && result.walletInfo) {
        setWalletInfo(result.walletInfo);
      }
    };

    connectToLastWallet();
  }, []);

  // Handle successful wallet connection
  const handleWalletConnect = (result: any) => {
    if (result.success && result.walletInfo) {
      setWalletInfo(result.walletInfo);
      setError(null);
    } else {
      setError(result.error || 'Failed to connect wallet');
    }
  };

  // Handle wallet disconnection
  const handleDisconnect = async () => {
    const success = await walletSelector.disconnectWallet();
    if (success) {
      setWalletInfo(null);
      setSignature(null);
    } else {
      setError('Failed to disconnect wallet');
    }
  };

  // Sign a test message
  const handleSignMessage = async () => {
    if (!walletInfo) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      const message = `Sign this message to confirm your identity\nTimestamp: ${Date.now()}`;
      const result = await walletSelector.signMessage(message);

      if (result.success && result.signature) {
        setSignature(result.signature);
        setError(null);
      } else {
        setError(result.error || 'Failed to sign message');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign message');
    }
  };

  return (
    <Container className="py-5">
      <h1 className="mb-4">Wallet Connection Demo</h1>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      {!walletInfo ? (
        <div className="text-center py-5">
          <h3 className="mb-4">Connect your wallet to continue</h3>
          <Button 
            variant="primary" 
            size="lg"
            onClick={() => setShowWalletModal(true)}
          >
            Connect Wallet
          </Button>
        </div>
      ) : (
        <Card className="mb-4">
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Wallet Connected</h5>
              <Button 
                variant="outline-danger" 
                size="sm"
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <p><strong>Address:</strong> {walletInfo.address}</p>
            <p><strong>Blockchain:</strong> {walletInfo.blockchain}</p>
            <p><strong>Wallet Type:</strong> {walletInfo.providerType}</p>
            <p><strong>Chain ID:</strong> {walletInfo.chainId}</p>
            
            <div className="mt-4">
              <Button 
                variant="outline-primary"
                onClick={handleSignMessage}
              >
                Sign Test Message
              </Button>
            </div>
            
            {signature && (
              <div className="mt-3">
                <h6>Signature:</h6>
                <div className="p-2 bg-light border rounded">
                  <code className="text-break">{signature}</code>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      <WalletSelectorModal
        open={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSelect={handleWalletConnect}
      />
    </Container>
  );
};

export default WalletDemo;