'use client';

import React, { useState, useEffect } from 'react';
import { useDataProvider, Title, useNotify } from 'react-admin';
import { Card, CardContent, Typography, Box, Divider, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Grid } from './GridWrapper';
import { LineChart } from '@mui/x-charts';

export const SystemMonitoring = () => {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const [metrics, setMetrics] = useState({
    cpu: { usage: 0, cores: 0 },
    memory: { 
      heapUsed: 0, 
      heapTotal: 0, 
      rss: 0,
      history: [] as {timestamp: number, heapUsed: number, rss: number}[]
    },
    api: {
      requestCount: 0,
      averageResponseTime: 0,
      errorRate: 0,
      endpoints: [] as {endpoint: string, responseTime: number, calls: number, errors: number}[]
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        // In a real implementation, you would fetch this data from your API
        // For now, we'll use mock data
        const memoryData = await dataProvider.getMemoryMetrics();
        
        // Process the data
        setMetrics({
          cpu: { usage: Math.random() * 90, cores: 8 }, 
          memory: { 
            heapUsed: memoryData.data.heapUsed || Math.random() * 500 * 1024 * 1024, 
            heapTotal: memoryData.data.heapTotal || 1024 * 1024 * 1024,
            rss: memoryData.data.rss || Math.random() * 800 * 1024 * 1024,
            history: Array(24).fill(0).map((_, i) => ({
              timestamp: Date.now() - (23 - i) * 60 * 60 * 1000,
              heapUsed: Math.random() * 500 * 1024 * 1024,
              rss: Math.random() * 800 * 1024 * 1024
            }))
          },
          api: {
            requestCount: Math.floor(Math.random() * 10000),
            averageResponseTime: Math.random() * 100,
            errorRate: Math.random() * 5,
            endpoints: [
              { endpoint: '/api/auth', responseTime: Math.random() * 100, calls: Math.floor(Math.random() * 1000), errors: Math.floor(Math.random() * 10) },
              { endpoint: '/api/users', responseTime: Math.random() * 100, calls: Math.floor(Math.random() * 1000), errors: Math.floor(Math.random() * 10) },
              { endpoint: '/api/blockchain', responseTime: Math.random() * 100, calls: Math.floor(Math.random() * 1000), errors: Math.floor(Math.random() * 10) },
              { endpoint: '/api/wallet', responseTime: Math.random() * 100, calls: Math.floor(Math.random() * 1000), errors: Math.floor(Math.random() * 10) },
            ]
          }
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
        notify('Error loading system metrics', { type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    
    // Refresh data every 60 seconds
    const intervalId = setInterval(fetchMetrics, 60000);
    
    return () => clearInterval(intervalId);
  }, [dataProvider, notify]);

  // Prepare data for memory usage chart
  const memoryTimeData = metrics.memory.history.map(entry => new Date(entry.timestamp).toLocaleTimeString());
  const memoryHeapData = metrics.memory.history.map(entry => Math.round(entry.heapUsed / (1024 * 1024)));
  const memoryRssData = metrics.memory.history.map(entry => Math.round(entry.rss / (1024 * 1024)));

  return (
    <Box sx={{ padding: 2 }}>
      <Title title="System Monitoring" />
      
      <Grid container spacing={3}>
        {/* CPU Usage Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                CPU Usage
              </Typography>
              {loading ? (
                <Typography>Loading...</Typography>
              ) : (
                <>
                  <Typography variant="h4">
                    {metrics.cpu.usage.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cores: {metrics.cpu.cores}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Memory Usage Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Memory Usage
              </Typography>
              {loading ? (
                <Typography>Loading...</Typography>
              ) : (
                <>
                  <Typography variant="h4">
                    {Math.round(metrics.memory.heapUsed / (1024 * 1024))} MB
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Heap: {Math.round(metrics.memory.heapUsed / (1024 * 1024))} / {Math.round(metrics.memory.heapTotal / (1024 * 1024))} MB
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    RSS: {Math.round(metrics.memory.rss / (1024 * 1024))} MB
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* API Performance Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                API Performance
              </Typography>
              {loading ? (
                <Typography>Loading...</Typography>
              ) : (
                <>
                  <Typography variant="h4">
                    {metrics.api.averageResponseTime.toFixed(1)} ms
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Requests: {metrics.api.requestCount.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Error Rate: {metrics.api.errorRate.toFixed(2)}%
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
                Memory Usage (Last 24 Hours)
              </Typography>
              <Box sx={{ height: 350, width: '100%' }}>
                <LineChart
                  xAxis={[{ 
                    data: Array.from({ length: memoryTimeData.length }, (_, i) => i + 1), 
                    scaleType: 'point',
                    valueFormatter: (index) => memoryTimeData[index - 1] || '' 
                  }]}
                  series={[
                    { data: memoryHeapData, label: 'Heap Memory (MB)' },
                    { data: memoryRssData, label: 'RSS Memory (MB)' }
                  ]}
                  height={300}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* API Endpoints Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                API Endpoints Performance
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Endpoint</TableCell>
                      <TableCell align="right">Avg Response Time</TableCell>
                      <TableCell align="right">Total Calls</TableCell>
                      <TableCell align="right">Errors</TableCell>
                      <TableCell align="right">Error Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics.api.endpoints.map((endpoint, index) => (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {endpoint.endpoint}
                        </TableCell>
                        <TableCell align="right">{endpoint.responseTime.toFixed(2)} ms</TableCell>
                        <TableCell align="right">{endpoint.calls.toLocaleString()}</TableCell>
                        <TableCell align="right">{endpoint.errors}</TableCell>
                        <TableCell align="right">
                          {(endpoint.errors / endpoint.calls * 100).toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};