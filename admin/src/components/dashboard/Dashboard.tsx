'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Alert, CircularProgress } from '@mui/material';
import { Grid } from './GridWrapper';
import { useDataProvider } from 'react-admin';
import { LineChart } from '@mui/x-charts';

export const Dashboard = () => {
  const dataProvider = useDataProvider();
  const [healthStatus, setHealthStatus] = useState({ status: 'loading', uptime: 0 });
  const [memoryMetrics, setMemoryMetrics] = useState({ heapUsed: 0, heapTotal: 0, rss: 0 });
  const [blockchainStatus, setBlockchainStatus] = useState({ healthy: false, activeNodes: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch health data
        const health = await dataProvider.checkSystemHealth();
        setHealthStatus(health.data);
        
        // Fetch memory metrics
        const memory = await dataProvider.getSystemMetrics();
        setMemoryMetrics(memory.data);
        
        // Fetch blockchain status
        const blockchain = await dataProvider.getBlockchainStatus();
        setBlockchainStatus(blockchain.data);
        
        // Update last fetched timestamp
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to fetch dashboard data. Please check your API connection.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Refresh data every 30 seconds
    const intervalId = setInterval(fetchData, 30000);
    
    return () => clearInterval(intervalId);
  }, [dataProvider]);
  
  // Mock data for charts
  const memoryData = [
    { time: '00:00', value: 65 },
    { time: '04:00', value: 75 },
    { time: '08:00', value: 62 },
    { time: '12:00', value: 85 },
    { time: '16:00', value: 72 },
    { time: '20:00', value: 68 },
    { time: '24:00', value: 70 }
  ];
  
  const xAxisLabels = memoryData.map(d => d.time);
  const memoryValues = memoryData.map(d => d.value);

  // Show loading state
  if (loading && !lastUpdated) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        AliveHuman Admin Dashboard
      </Typography>
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Last updated indicator */}
      {lastUpdated && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </Typography>
      )}
      
      <Grid container spacing={3}>
        {/* Health Status Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ minHeight: 180 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Health
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography>Updating...</Typography>
                </Box>
              ) : (
                <>
                  <Typography variant="h4" color={
                    healthStatus.status === 'ok' ? 'success.main' : 
                    healthStatus.status === 'unknown' ? 'text.secondary' : 'error.main'
                  }>
                    {healthStatus.status === 'ok' ? 'Healthy' : 
                     healthStatus.status === 'unknown' ? 'Unknown' : 'Issues Detected'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Uptime: {Math.floor(healthStatus.uptime / 3600)} hours {Math.floor((healthStatus.uptime % 3600) / 60)} minutes
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Memory Usage Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ minHeight: 180 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Memory Usage
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography>Updating...</Typography>
                </Box>
              ) : (
                <>
                  <Typography variant="h4">
                    {Math.round(memoryMetrics.heapUsed / (1024 * 1024))} MB
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Heap: {Math.round(memoryMetrics.heapUsed / (1024 * 1024))} / {Math.round(memoryMetrics.heapTotal / (1024 * 1024))} MB
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    RSS: {Math.round(memoryMetrics.rss / (1024 * 1024))} MB
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Blockchain Status Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ minHeight: 180 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Blockchain Status
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography>Updating...</Typography>
                </Box>
              ) : (
                <>
                  <Typography variant="h4" color={blockchainStatus.healthy ? 'success.main' : 'error.main'}>
                    {blockchainStatus.healthy ? 'Online' : 'Issues Detected'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Nodes: {blockchainStatus.activeNodes}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Memory Usage Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Memory Usage (Last 24h)
              </Typography>
              <Box sx={{ height: 300, width: '100%' }}>
                <LineChart
                  xAxis={[{ data: [1, 2, 3, 4, 5, 6, 7], scaleType: 'point', valueFormatter: (value) => xAxisLabels[value - 1] || '' }]}
                  series={[{ data: memoryValues, label: 'Memory Usage (MB)' }]}
                  height={280}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};