'use client';

import React, { useState, useEffect } from 'react';
import { useDataProvider, Title, useNotify } from 'react-admin';
import {
  Card, CardContent, Typography, Box, Paper, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, TextField, InputAdornment,
  IconButton, Button, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle
} from '@mui/material';
import { Grid } from './GridWrapper';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { PieChart } from '@mui/x-charts';

export const UserManagement = () => {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const [userData, setUserData] = useState({
    users: [] as {
      id: string;
      username: string;
      email: string;
      walletAddress: string;
      lastLogin: string;
      status: 'active' | 'suspended' | 'pending';
      createdAt: string;
    }[],
    sessions: [] as {
      id: string;
      userId: string;
      username: string;
      ipAddress: string;
      device: string;
      startTime: string;
      lastActivity: string;
      status: 'active' | 'expired';
    }[],
    stats: {
      totalUsers: 0,
      activeUsers: 0,
      newUsersToday: 0,
      usersByStatus: {
        active: 0,
        suspended: 0,
        pending: 0
      }
    }
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [dialogAction, setDialogAction] = useState<'suspend' | 'delete' | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // In a real implementation, you would fetch this data from your API
        // For now, we'll use mock data
        
        // Mock user data
        const users = [
          { id: '1', username: 'john_doe', email: 'john@example.com', walletAddress: '0x1234...5678', lastLogin: new Date().toISOString(), status: 'active' as const, createdAt: '2025-01-15T10:30:00Z' },
          { id: '2', username: 'jane_smith', email: 'jane@example.com', walletAddress: '0x2345...6789', lastLogin: new Date(Date.now() - 3600000).toISOString(), status: 'active' as const, createdAt: '2025-02-20T14:45:00Z' },
          { id: '3', username: 'bob_wilson', email: 'bob@example.com', walletAddress: '0x3456...7890', lastLogin: new Date(Date.now() - 86400000).toISOString(), status: 'suspended' as const, createdAt: '2025-03-10T09:15:00Z' },
          { id: '4', username: 'alice_johnson', email: 'alice@example.com', walletAddress: '0x4567...8901', lastLogin: new Date(Date.now() - 172800000).toISOString(), status: 'pending' as const, createdAt: '2025-04-05T11:20:00Z' },
          { id: '5', username: 'mike_brown', email: 'mike@example.com', walletAddress: '0x5678...9012', lastLogin: new Date(Date.now() - 259200000).toISOString(), status: 'active' as const, createdAt: '2025-04-25T16:10:00Z' },
        ];
        
        // Mock session data
        const sessions = [
          { id: 's1', userId: '1', username: 'john_doe', ipAddress: '192.168.1.100', device: 'Chrome / Windows', startTime: new Date(Date.now() - 3600000).toISOString(), lastActivity: new Date().toISOString(), status: 'active' as const },
          { id: 's2', userId: '2', username: 'jane_smith', ipAddress: '192.168.1.101', device: 'Safari / macOS', startTime: new Date(Date.now() - 7200000).toISOString(), lastActivity: new Date(Date.now() - 1800000).toISOString(), status: 'active' as const },
          { id: 's3', userId: '5', username: 'mike_brown', ipAddress: '192.168.1.102', device: 'Firefox / Linux', startTime: new Date(Date.now() - 10800000).toISOString(), lastActivity: new Date(Date.now() - 3600000).toISOString(), status: 'active' as const },
          { id: 's4', userId: '1', username: 'john_doe', ipAddress: '192.168.1.103', device: 'Mobile / iOS', startTime: new Date(Date.now() - 86400000).toISOString(), lastActivity: new Date(Date.now() - 82800000).toISOString(), status: 'expired' as const },
        ];
        
        // Count users by status
        const usersByStatus = users.reduce((acc, user) => {
          acc[user.status]++;
          return acc;
        }, { active: 0, suspended: 0, pending: 0 });
        
        // Set the user data
        setUserData({
          users,
          sessions,
          stats: {
            totalUsers: users.length,
            activeUsers: users.filter(user => user.status === 'active').length,
            newUsersToday: 1, // Mock value
            usersByStatus
          }
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        notify('Error loading user data', { type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [notify, dataProvider]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleOpenDialog = (userId: string, action: 'suspend' | 'delete') => {
    setSelectedUser(userId);
    setDialogAction(action);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleConfirmAction = () => {
    if (!selectedUser || !dialogAction) return;

    // In a real implementation, you would call your API to suspend or delete the user
    if (dialogAction === 'suspend') {
      notify(`User ${selectedUser} has been suspended`, { type: 'success' });
      // Update the user status in the local state
      setUserData(prevState => ({
        ...prevState,
        users: prevState.users.map(user => 
          user.id === selectedUser ? { ...user, status: 'suspended' as const } : user
        ),
        stats: {
          ...prevState.stats,
          usersByStatus: {
            ...prevState.stats.usersByStatus,
            active: prevState.stats.usersByStatus.active - 1,
            suspended: prevState.stats.usersByStatus.suspended + 1
          }
        }
      }));
    } else if (dialogAction === 'delete') {
      notify(`User ${selectedUser} has been deleted`, { type: 'success' });
      // Remove the user from the local state
      setUserData(prevState => {
        const deletedUser = prevState.users.find(user => user.id === selectedUser);
        if (!deletedUser) return prevState;

        return {
          ...prevState,
          users: prevState.users.filter(user => user.id !== selectedUser),
          stats: {
            ...prevState.stats,
            totalUsers: prevState.stats.totalUsers - 1,
            usersByStatus: {
              ...prevState.stats.usersByStatus,
              [deletedUser.status]: prevState.stats.usersByStatus[deletedUser.status] - 1
            }
          }
        };
      });
    }

    handleCloseDialog();
  };

  // Filter users based on search term
  const filteredUsers = userData.users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Data for the user status pie chart
  const userStatusData = [
    { id: 0, value: userData.stats.usersByStatus.active, label: 'Active' },
    { id: 1, value: userData.stats.usersByStatus.suspended, label: 'Suspended' },
    { id: 2, value: userData.stats.usersByStatus.pending, label: 'Pending' }
  ];

  const getUserStatusColor = (status: 'active' | 'suspended' | 'pending') => {
    switch (status) {
      case 'active':
        return 'success';
      case 'suspended':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getSessionStatusColor = (status: 'active' | 'expired') => {
    return status === 'active' ? 'success' : 'default';
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Title title="User Management" />
      
      <Grid container spacing={3}>
        {/* User Statistics Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Users
              </Typography>
              {loading ? (
                <Typography>Loading...</Typography>
              ) : (
                <Typography variant="h4">
                  {userData.stats.totalUsers}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Users
              </Typography>
              {loading ? (
                <Typography>Loading...</Typography>
              ) : (
                <Typography variant="h4">
                  {userData.stats.activeUsers}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                New Users Today
              </Typography>
              {loading ? (
                <Typography>Loading...</Typography>
              ) : (
                <Typography variant="h4">
                  {userData.stats.newUsersToday}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* User Status Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Status Distribution
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ height: 300 }}>
                  <PieChart
                    series={[
                      {
                        data: userStatusData,
                        highlightScope: { highlight: 'item', fade: 'global' },
                        valueFormatter: (item) => `${item.value} users`
                      },
                    ]}
                    height={300}
                    margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    slotProps={{
                      legend: {
                        position: { vertical: 'bottom', horizontal: 'center' },
                      }
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Active Sessions */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Sessions
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
                        <TableCell>User</TableCell>
                        <TableCell>IP Address</TableCell>
                        <TableCell>Device</TableCell>
                        <TableCell>Last Activity</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {userData.sessions.slice(0, 3).map((session, index) => (
                        <TableRow key={index}>
                          <TableCell>{session.username}</TableCell>
                          <TableCell>{session.ipAddress}</TableCell>
                          <TableCell>{session.device}</TableCell>
                          <TableCell>{new Date(session.lastActivity).toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip 
                              label={session.status} 
                              color={getSessionStatusColor(session.status) as any}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* User List */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Users
                </Typography>
                <TextField
                  placeholder="Search users..."
                  variant="outlined"
                  size="small"
                  value={searchTerm}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small">
                          <FilterListIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: 300 }}
                />
              </Box>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Username</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Wallet Address</TableCell>
                        <TableCell>Last Login</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredUsers.map((user, index) => (
                        <TableRow key={index}>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.walletAddress}</TableCell>
                          <TableCell>{new Date(user.lastLogin).toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip 
                              label={user.status} 
                              color={getUserStatusColor(user.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button 
                                size="small" 
                                variant="outlined" 
                                color="primary"
                                onClick={() => notify(`Viewing details for ${user.username}`, { type: 'info' })}
                              >
                                View
                              </Button>
                              {user.status !== 'suspended' && (
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  color="error"
                                  onClick={() => handleOpenDialog(user.id, 'suspend')}
                                >
                                  Suspend
                                </Button>
                              )}
                              <IconButton size="small">
                                <MoreVertIcon />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {dialogAction === 'suspend' ? 'Suspend User' : 'Delete User'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {dialogAction === 'suspend' 
              ? 'Are you sure you want to suspend this user? They will not be able to access their account until unsuspended.'
              : 'Are you sure you want to delete this user? This action cannot be undone.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleConfirmAction} color="error" autoFocus>
            {dialogAction === 'suspend' ? 'Suspend' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};