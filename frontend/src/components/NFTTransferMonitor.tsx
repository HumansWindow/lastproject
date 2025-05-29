import React, { useEffect, useState } from 'react';
import { realtimeService, NftTransferEvent } from "../services/realtime/index";
import Image from 'next/image';
import WebSocketStatus from "./WebSocketStatus"; // Import WebSocketStatus component

interface Props {
  walletAddress: string;
}

export const NFTTransferMonitor: React.FC<Props> = ({ walletAddress }) => {
  const [transfers, setTransfers] = useState<NftTransferEvent[]>([]);
  
  useEffect(() => {
    if (!walletAddress) return;
    
    // Use optional chaining for realtimeService
    const unsubscribe = realtimeService?.subscribeToNftTransfers?.(
      walletAddress, 
      (event: any) => {
        setTransfers(prev => {
          // Already typed as NftTransferEvent from the method signature
          const updated = [event, ...prev].slice(0, 10);
          return updated;
        });
      }
    ) || (() => {}); // Provide fallback empty function
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [walletAddress]);

  const formatAddress = (address: string): string => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const isReceived = (transfer: NftTransferEvent): boolean => {
    return transfer.to.toLowerCase() === walletAddress.toLowerCase();
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            NFT Transfer Monitor
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monitoring address: {formatAddress(walletAddress)}
          </p>
        </div>
        <WebSocketStatus connected={true} showDetails />
      </div>
      
      {transfers.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No NFT transfers yet</p>
          <p className="text-sm mt-2">Transfers will appear here in real-time</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transfers.map((transfer, index) => (
            <div 
              key={`${transfer.timestamp}-${index}`}
              className={`border p-3 rounded ${
                isReceived(transfer) 
                  ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900' 
                  : 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900'
              }`}
            >
              <div className="flex items-start space-x-3">
                {transfer.metadata?.image && (
                  <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden">
                    <Image 
                      src={transfer.metadata.image} 
                      alt={transfer.metadata.name || 'NFT'} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="flex-grow">
                  <div className="flex justify-between">
                    <h3 className="font-medium text-gray-800 dark:text-white">
                      {transfer.metadata?.name || `NFT #${transfer.tokenId}`}
                    </h3>
                    <span className={`text-sm font-medium ${
                      isReceived(transfer)
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {isReceived(transfer) ? 'Received' : 'Sent'}
                    </span>
                  </div>
                  
                  {transfer.metadata?.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                      {transfer.metadata.description}
                    </p>
                  )}
                  
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex flex-col sm:flex-row sm:space-x-4">
                    <span>Token ID: {transfer.tokenId}</span>
                    <span>Contract: {formatAddress(transfer.contractAddress)}</span>
                  </div>

                  <div className="mt-1 text-xs">
                    <span>
                      {isReceived(transfer) ? 'From: ' : 'To: '}
                      <span className="text-gray-600 dark:text-gray-300">
                        {formatAddress(isReceived(transfer) ? transfer.from : transfer.to)}
                      </span>
                    </span>
                    <span className="ml-3 text-gray-500 dark:text-gray-400">
                      Block: {transfer.blockNumber}
                    </span>
                    <a 
                      href={`https://etherscan.io/tx/${transfer.txHash}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-3 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Transaction
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NFTTransferMonitor;