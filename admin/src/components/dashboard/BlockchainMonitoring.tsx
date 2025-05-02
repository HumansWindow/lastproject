'use client';

import React, { useState, useEffect } from 'react';
import { useDataProvider, Title, useNotify } from 'react-admin';
import { 
  Card, CardContent, Typography, Box, Paper, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Chip, CircularProgress
} from '@mui/material';
import { Grid } from './GridWrapper';
import { LineChart } from '@mui/x-charts';

// Define types for our data structures
interface RPCNode {
  url: string;
  network: string;
  isAlive: boolean;
  responseTime: number;
  lastChecked: string;
  failCount: number;
}

interface WebSocketConnection {
  url: string;
  network: string;
  status: 'connected' | 'disconnected' | 'connecting';
  lastConnected: string;
  connectionAttempts: number;
}

interface WalletBalance {
  address: string;
  network: string;
  balance: string;
  usdValue: number;
  lastUpdated: string;
}

interface Transaction {
  hash: string;
  network: string;
  from: string;
  to: string;
  value: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
}

export const BlockchainMonitoring = () => {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const [loading, setLoading] = useState(true);
  const [refreshTimestamp, setRefreshTimestamp] = useState(new Date());
  
  // State for blockchain data
  const [rpcStatus, setRpcStatus] = useState<any>({
    activeRpcs: {},
    healthStatus: {}
  });
  
  const [networkOverview, setNetworkOverview] = useState<any>({
    networks: {
      ethereum: { isConnected: false, blockNumber: 0 },
      polygon: { isConnected: false, blockNumber: 0 },
      bsc: { isConnected: false, blockNumber: 0 }
    },
    timestamp: new Date().toISOString()
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<WalletBalance[]>([]);

  useEffect(() => {
    const fetchBlockchainData = async () => {
      setLoading(true);
      try {
        // Fetch blockchain status data from the backend API
        const { data: statusData } = await dataProvider.getBlockchainStatus();
        setRpcStatus(statusData.rpcStatus || { activeRpcs: {}, healthStatus: {} });

        // Fetch network overview data
        const { data: networkData } = await dataProvider.getNetworkOverview();
        setNetworkOverview(networkData || { networks: {}, timestamp: new Date().toISOString() });

        // Fetch recent blockchain transactions
        const { data: txData } = await dataProvider.getBlockchainTransactions({ page: 1, perPage: 10 });
        setTransactions(txData || []);

        // Fetch hot wallet monitoring data
        const { data: walletData } = await dataProvider.getHotWallets({ page: 1, perPage: 10 });
        setWallets(walletData || []);

        // Update refresh timestamp
        setRefreshTimestamp(new Date());
      } catch (error) {
        console.error('Error fetching blockchain data:', error);
        notify('Error loading blockchain metrics', { type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchBlockchainData();
    
    // Refresh data every 30 seconds
    const intervalId = setInterval(fetchBlockchainData, 30000);
    
    return () => clearInterval(intervalId);
  }, [dataProvider, notify]);

  // Convert RPC status to nodes array for display
  const rpcNodes = React.useMemo<RPCNode[]>(() => {
    const nodes: RPCNode[] = [];
    
    // Convert the rpcStatus.healthStatus object into an array of nodes
    if (rpcStatus && rpcStatus.healthStatus) {
      Object.entries(rpcStatus.healthStatus).forEach(([network, rpcUrls]: [string, any]) => {
        if (rpcUrls) {
          Object.entries(rpcUrls).forEach(([url, isHealthy]: [string, any]) => {
            nodes.push({
              url,
              network,
              isAlive: Boolean(isHealthy),
              responseTime: isHealthy ? Math.floor(Math.random() * 200) + 50 : 0, // Placeholder for response time
              lastChecked: new Date().toISOString(),
              failCount: isHealthy ? 0 : Math.floor(Math.random() * 5) // Placeholder for fail count
            });
          });
        }
      });
    }
    
    return nodes;
  }, [rpcStatus]);

  // Generate transaction count data for chart (mock data for now)
  const generateTransactionData = () => {
    const data = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now);
      timestamp.setHours(now.getHours() - (23 - i));
      timestamp.setMinutes(0);
      timestamp.setSeconds(0);
      timestamp.setMilliseconds(0);
      
      data.push({
        timestamp,
        count: Math.floor(Math.random() * 15) + 5 // Random between 5 and 20
      });
    }
    return data;
  };

  const transactionData = generateTransactionData();
  const transactionTimeData = transactionData.map(entry => new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const transactionCountData = transactionData.map(entry => entry.count);

  // Convert network data for display
  const websocketConnections = React.useMemo<WebSocketConnection[]>(() => {
    const wsConnections: WebSocketConnection[] = [];
    
    if (networkOverview && networkOverview.networks) {
      Object.entries(networkOverview.networks).forEach(([network, data]: [string, any]) => {
        // Create a websocket entry based on network data
        wsConnections.push({
          url: `wss://${network.toLowerCase()}.example.com`, // Placeholder URL
          network: network.charAt(0).toUpperCase() + network.slice(1), // Capitalize network name
          status: data.isConnected ? 'connected' : 'disconnected',
          lastConnected: data.lastUpdated || new Date().toISOString(),
          connectionAttempts: data.isConnected ? 0 : Math.floor(Math.random() * 3)
        });
      });
    }
    
    return wsConnections;
  }, [networkOverview]);

  // Convert wallet data for display
  const walletBalances = React.useMemo(() => {
    // If we don't have real wallet data yet, return placeholders
    if (!wallets || wallets.length === 0) {
      return [
        { address: '0x1234...5678', network: 'Ethereum', balance: '1.45 ETH', usdValue: 3420.56, lastUpdated: new Date().toISOString() },
        { address: '0x2345...6789', network: 'Polygon', balance: '2500 MATIC', usdValue: 2125.75, lastUpdated: new Date().toISOString() },
        { address: '0x3456...7890', network: 'BSC', balance: '15.2 BNB', usdValue: 4560.00, lastUpdated: new Date().toISOString() },
      ];
    }
    
    // Map the real wallet data to the display format
    return wallets.map(wallet => ({
      address: wallet.address,
      network: wallet.network,
      balance: wallet.balance,
      usdValue: wallet.usdValue || 0,
      lastUpdated: wallet.lastUpdated || new Date().toISOString()
    }));
  }, [wallets]);

  // Helper function for status chip color
  const getStatusColor = (status: 'connected' | 'disconnected' | 'connecting') => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'disconnected':
        return 'error';
      case 'connecting':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTransactionStatusColor = (status: 'pending' | 'confirmed' | 'failed') => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Title title="Blockchain Monitoring" />
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Last updated: {refreshTimestamp.toLocaleString()}
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* RPC Nodes Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                RPC Provider Health
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Provider URL</TableCell>
                        <TableCell>Network</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Response Time</TableCell>
                        <TableCell>Last Checked</TableCell>
                        <TableCell align="right">Fail Count</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rpcNodes.map((node, index) => (
                        <TableRow key={index}>
                          <TableCell>{node.url}</TableCell>
                          <TableCell>{node.network}</TableCell>
                          <TableCell>
                            <Chip 
                              label={node.isAlive ? 'Healthy' : 'Unhealthy'} 
                              color={node.isAlive ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">{node.isAlive ? `${node.responseTime} ms` : 'N/A'}</TableCell>
                          <TableCell>{new Date(node.lastChecked).toLocaleString()}</TableCell>
                          <TableCell align="right">{node.failCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* WebSocket Connections */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                WebSocket Connections
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>WebSocket URL</TableCell>
                        <TableCell>Network</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Connection Attempts</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {websocketConnections.map((ws, index) => (
                        <TableRow key={index}>
                          <TableCell>{ws.url}</TableCell>
                          <TableCell>{ws.network}</TableCell>
                          <TableCell>
                            <Chip 
                              label={ws.status} 
                              color={getStatusColor(ws.status as any) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{ws.connectionAttempts}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Hot Wallet Balances */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hot Wallet Balances
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Wallet Address</TableCell>
                        <TableCell>Network</TableCell>
                        <TableCell>Balance</TableCell>
                        <TableCell align="right">USD Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {walletBalances.map((wallet, index) => (
                        <TableRow key={index}>
                          <TableCell>{wallet.address}</TableCell>
                          <TableCell>{wallet.network}</TableCell>
                          <TableCell>{wallet.balance}</TableCell>
                          <TableCell align="right">${wallet.usdValue.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Transaction Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Transaction Volume (Last 24 Hours)
              </Typography>
              <Box sx={{ height: 300, width: '100%' }}>
                <LineChart
                  xAxis={[{ 
                    data: Array.from({ length: transactionTimeData.length }, (_, i) => i + 1), 
                    scaleType: 'point',
                    valueFormatter: (index) => transactionTimeData[index - 1] || '' 
                  }]}
                  series={[{ data: transactionCountData, label: 'Transactions' }]}
                  height={250}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Recent Transactions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Transactions
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tx Hash</TableCell>
                        <TableCell>Network</TableCell>
                        <TableCell>From</TableCell>
                        <TableCell>To</TableCell>
                        <TableCell>Value</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Timestamp</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.length > 0 ? (
                        transactions.map((tx, index) => (
                          <TableRow key={index}>
                            <TableCell>{tx.hash}</TableCell>
                            <TableCell>{tx.network}</TableCell>
                            <TableCell>{tx.from}</TableCell>
                            <TableCell>{tx.to}</TableCell>
                            <TableCell>{tx.value}</TableCell>
                            <TableCell>
                              <Chip 
                                label={tx.status} 
                                color={getTransactionStatusColor(tx.status) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{new Date(tx.timestamp).toLocaleString()}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            No transactions to display
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};