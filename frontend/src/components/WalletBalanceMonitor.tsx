import React, { useEffect, useState } from 'react';
import { realtimeService } from '../services/api';
import { BalanceChangeEvent } from '../types/api-types';
import WebSocketStatus from './WebSocketStatus';

interface WalletBalanceMonitorProps {
  walletAddress: string;
  networkName?: string;
}

const WalletBalanceMonitor: React.FC<WalletBalanceMonitorProps> = ({ 
  walletAddress, 
  networkName = 'Ethereum'
}) => {
  const [currentBalance, setCurrentBalance] = useState<string>('0.0');
  const [formattedBalance, setFormattedBalance] = useState<string>('0.0 ETH');
  const [balanceChanges, setBalanceChanges] = useState<BalanceChangeEvent[]>([]);
  const [isIncreasing, setIsIncreasing] = useState<boolean | null>(null);

  useEffect(() => {
    // Subscribe to balance changes for the specified wallet
    const unsubscribe = realtimeService.subscribeToBalanceChanges(
      walletAddress,
      (event) => {
        // Update current balance
        setCurrentBalance(event.newBalance);
        setFormattedBalance(event.formattedNewBalance || `${event.newBalance} ETH`);
        
        // Determine if balance is increasing or decreasing
        const isIncrease = 
          BigInt(event.newBalance) > BigInt(event.previousBalance);
        setIsIncreasing(isIncrease);
        
        // Add to history
        setBalanceChanges(prev => {
          const updated = [event, ...prev].slice(0, 5);
          return updated;
        });

        // Reset direction indicator after 3 seconds
        setTimeout(() => {
          setIsIncreasing(null);
        }, 3000);
      }
    );
    
    // Clean up subscription when component unmounts
    return () => {
      unsubscribe();
    };
  }, [walletAddress]);

  const formatAddress = (address: string): string => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Wallet Balance Monitor
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatAddress(walletAddress)} on {networkName}
          </p>
        </div>
        <WebSocketStatus showDetails />
      </div>
      
      <div className="py-4 text-center">
        <div className="flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-800 dark:text-white">
            {formattedBalance}
          </span>
          
          {isIncreasing !== null && (
            <span className={`ml-2 text-lg ${
              isIncreasing 
                ? 'text-green-500' 
                : 'text-red-500'
            }`}>
              {isIncreasing ? '↑' : '↓'}
            </span>
          )}
        </div>
      </div>
      
      {balanceChanges.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recent Transactions
          </h3>
          <div className="space-y-2">
            {balanceChanges.map((change, index) => (
              <div 
                key={`${change.timestamp}-${index}`}
                className="bg-gray-50 dark:bg-gray-700 rounded p-2 text-sm"
              >
                <div className="flex justify-between">
                  <div>
                    <span className="font-medium">
                      {BigInt(change.newBalance) > BigInt(change.previousBalance) 
                        ? 'Received' 
                        : 'Sent'}
                    </span>
                    {change.txHash && (
                      <span className="text-xs ml-2 text-gray-500 dark:text-gray-400">
                        Tx: {formatAddress(change.txHash)}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={
                      BigInt(change.newBalance) > BigInt(change.previousBalance)
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }>
                      {BigInt(change.newBalance) > BigInt(change.previousBalance) ? '+' : '-'}
                      {Math.abs(
                        Number(BigInt(change.newBalance) - BigInt(change.previousBalance))
                      ) / Math.pow(10, 18)} ETH
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Block {change.blockNumber}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletBalanceMonitor;