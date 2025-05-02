# Admin Dashboard File Structure

## Overview
This document outlines the file structure of the AliveHuman admin dashboard, explaining the purpose of each key file and directory.

## Directory Structure

```
admin/
├── public/               # Static files served by Next.js
├── src/                  # Source code directory
│   ├── app/              # Next.js App Router directory
│   │   ├── globals.css   # Global CSS styles
│   │   ├── layout.tsx    # Root layout for all pages
│   │   └── page.tsx      # Main page component (renders AdminLayout)
│   ├── components/       # React components
│   │   ├── auth/         # Authentication components
│   │   │   └── LoginPage.tsx  # Custom login page for admin dashboard
│   │   └── dashboard/    # Admin dashboard components
│   │       ├── AdminLayout.tsx          # Main React Admin wrapper component
│   │       ├── Dashboard.tsx            # Dashboard homepage component
│   │       ├── SystemMonitoring.tsx     # System monitoring page
│   │       ├── BlockchainMonitoring.tsx # Blockchain monitoring page
│   │       ├── UserManagement.tsx       # User management page
│   │       └── GridWrapper.tsx          # Grid layout wrapper component
│   └── services/         # Service modules
│       ├── dataProvider.ts  # Data provider for React Admin
│       └── authProvider.ts  # Authentication provider for React Admin
├── next.config.ts        # Next.js configuration (includes port 3003 setup)
├── package.json          # Project dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Key Files Explained

### Configuration Files

- **next.config.ts**: Configures Next.js to run on port 3003, with API pointing to backend on port 3001
- **package.json**: Contains dependencies including React Admin, Material UI, and chart libraries

### Core Components

- **src/app/page.tsx**: Entry point to the admin dashboard, renders the AdminLayout component
- **src/app/layout.tsx**: Root layout that wraps the entire application

### Authentication Components

- **src/components/auth/LoginPage.tsx**: Custom login page with branded styling and form validation
- **src/services/authProvider.ts**: Authentication provider that handles login/logout and permissions

### Dashboard Components

- **src/components/dashboard/AdminLayout.tsx**: Main React Admin setup with resources configuration and authentication
- **src/components/dashboard/Dashboard.tsx**: Dashboard homepage showing key metrics and system health
- **src/components/dashboard/SystemMonitoring.tsx**: Detailed system monitoring with performance metrics
- **src/components/dashboard/BlockchainMonitoring.tsx**: Blockchain-specific monitoring for nodes, wallets, transactions
- **src/components/dashboard/UserManagement.tsx**: User management interface with search, filtering, and actions

### Services

- **src/services/dataProvider.ts**: Connects React Admin to our backend API using axios, includes custom methods for health checks, blockchain monitoring, and user management
- **src/services/authProvider.ts**: Handles authentication with the backend API, including JWT token management and user permissions

## Component Details

### AdminLayout

The AdminLayout component sets up the React Admin framework with the following configuration:
```tsx
<Admin 
  dataProvider={dataProvider}
  authProvider={authProvider}
  dashboard={Dashboard}
  layout={props => <Layout {...props} />}
  loginPage={LoginPage}
  requireAuth
>
  <Resource
    name="system"
    options={{ label: 'System Monitoring' }}
    list={SystemMonitoring}
  />
  <Resource
    name="blockchain"
    options={{ label: 'Blockchain Monitoring' }}
    list={BlockchainMonitoring}
  />
  <Resource
    name="users"
    options={{ label: 'User Management' }}
    list={UserManagement}
  />
</Admin>
```

### BlockchainMonitoring

The BlockchainMonitoring component includes:
- RPC provider health status table
- WebSocket connection status
- Hot wallet balances
- Transaction volume chart
- Recent transactions table

Key features:
```tsx
// Data fetching from backend
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

      // Additional data fetching...
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
```

### LoginPage

Custom login page with the following implementation:
```tsx
const CustomLoginForm = (props: any) => {
  const login = useLogin();
  const notify = useNotify();
  const translate = useTranslate();
  
  const handleSubmit = (values: { username: string; password: string }) => {
    login(values)
      .catch((error) => {
        notify(
          typeof error === 'string'
            ? error
            : translate('ra.auth.auth_check_error'),
          { type: 'error' }
        );
      });
  };

  return (
    <LoginForm {...props} onSubmit={handleSubmit}>
      <TextInput 
        source="username" 
        label="Username" 
        autoComplete="username" 
        fullWidth
      />
      <PasswordInput 
        source="password" 
        label="Password" 
        autoComplete="current-password" 
        fullWidth
      />
    </LoginForm>
  );
};
```

## Backend Integration

Backend integration is implemented through the data provider and auth provider services which connect to:

- **Authentication**: `/admin/login`
- **System monitoring**: `/admin/system/health`, `/admin/system/metrics`
- **Blockchain monitoring**: `/admin/blockchain/status`, `/admin/blockchain/network-overview`
- **User management**: `/admin/users`

## Connection to Backend

The admin dashboard connects to the backend through RESTful API calls using axios with the following configuration:

```typescript
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});
```

Authentication tokens are automatically included in API requests:

```typescript
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);
```