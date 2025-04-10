import React, { useEffect, useState } from 'react';
import { realtimeService, BalanceUpdateEvent } from '../services/realtime';
import { BalanceChangeEvent } from '../types/api-types';
import WebSocketStatus from './WebSocketStatus';

interface Props {
  walletAddress: string;
  networkName?: string;
}

export const WalletBalanceMonitor: React.FC<Props> = ({ walletAddress, networkName = 'Ethereum' }) => {
  const [currentBalance, setCurrentBalance] = useState<string>('0.0');
  const [formattedBalance, setFormattedBalance] = useState<string>('0.0 ETH');
  const [balanceChanges, setBalanceChanges] = useState<BalanceChangeEvent[]>([]);
  const [isIncreasing, setIsIncreasing] = useState<boolean | null>(null);
  const [balanceUpdates, setBalanceUpdates] = useState<BalanceUpdateEvent[]>([]);

  useEffect(() => {
    if (walletAddress) {
      const unsubscribe = realtimeService.subscribeToBalanceUpdates(
        walletAddress,
        (event: BalanceUpdateEvent) => {
          // Ensure newBalance is handled as a string
          setCurrentBalance(String(event.newBalance));
          // Use formattedNewBalance if available, otherwise format it
          setFormattedBalance(event.formattedNewBalance || `${event.newBalance} ETH`);

          // Determine if this is a credit or debit
          const isCredit = event.previousBalance ? 
            parseFloat(String(event.newBalance)) > parseFloat(String(event.previousBalance)) :
            true;

          // Update balance changes history
          setBalanceChanges((prev: BalanceChangeEvent[]) => {
            return [
              {
                address: event.address,
                previousBalance: String(event.previousBalance || '0'),
                newBalance: String(event.newBalance),
                formattedNewBalance: event.formattedNewBalance || `${event.newBalance} ETH`,
                txHash: event.txHash || '',
                blockNumber: event.blockNumber,
                timestamp: event.timestamp,
                chainId: event.chainId,
                networkName: event.networkName,
                type: isCredit ? 'credit' : 'debit'
              },
              ...prev.slice(0, 9) // Keep last 10 changes
            ];
          });
        }
      );

      return unsubscribe;
    }
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
        <WebSocketStatus connected={true} showDetails />
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
                      {parseFloat(change.newBalance) > parseFloat(change.previousBalance) 
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
                      parseFloat(change.newBalance) > parseFloat(change.previousBalance)
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }>
                      {parseFloat(change.newBalance) > parseFloat(change.previousBalance) ? '+' : '-'}
                      {Math.abs(
                        parseFloat(change.newBalance) - parseFloat(change.previousBalance)
                      ).toFixed(6)} ETH
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {change.blockNumber ? `Block ${change.blockNumber}` : new Date(change.timestamp).toLocaleTimeString()}
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