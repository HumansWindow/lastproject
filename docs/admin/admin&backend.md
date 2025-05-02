# Admin Dashboard & Backend Integration

## Overview

This document outlines the integration between the AliveHuman Admin Dashboard and the backend API. The admin dashboard is a separate Next.js application that communicates with the backend API to provide administrative capabilities for the platform.

## Configuration

- **Admin Dashboard Port**: 3003
- **Backend API Port**: 3001
- **Connection Type**: RESTful API calls via Axios

## Implemented Integration

The integration between the admin dashboard and backend has been completed with the following components:

### 1. Backend Components

- **AdminModule**: Created in the backend with dedicated controllers for:
  - Authentication (AdminAuthController)
  - User management (UserManagementController)
  - Blockchain monitoring (BlockchainMonitoringController)
  - System monitoring (SystemMonitoringController)
  
- **CORS Configuration**: Updated to allow connections from the admin dashboard on port 3003
- **Admin Authentication**: Added JWT-based authentication for admin users

### 2. Admin Dashboard Components

- **Enhanced Data Provider**: Updated to connect to backend API endpoints
- **Authentication Provider**: Implementation for secure admin login
- **Updated Components**: Modified to fetch real data from the backend:
  - BlockchainMonitoring component fetches RPC status and network data
  - SystemMonitoring component fetches system health metrics
  - UserManagement component integrates with user administration APIs

## Connection Components

### 1. Data Provider

The data provider serves as the bridge between React Admin and the backend API:

```typescript
// admin/src/services/dataProvider.ts
import jsonServerProvider from 'ra-data-json-server';
import axios from 'axios';

// Create an Axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json'
  },
  // Add timeout to prevent long-hanging requests
  timeout: 10000
});

// Add request interceptor for authentication
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Use the jsonServerProvider with our custom Axios instance
const dataProvider = jsonServerProvider(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  axiosInstance
);

// Extended data provider with custom methods
const extendedDataProvider = {
  ...dataProvider,
  
  // Custom method for system health check
  checkSystemHealth: async () => {
    try {
      const response = await axiosInstance.get('/admin/system/health');
      return { data: response.data };
    } catch (error) {
      console.warn('System health check failed:', error);
      return { data: { status: 'unknown', uptime: 0 } };
    }
  },

  // Custom method for blockchain status
  getBlockchainStatus: async () => {
    try {
      const response = await axiosInstance.get('/admin/blockchain/status');
      return { data: response.data };
    } catch (error) {
      console.warn('Blockchain status fetch failed:', error);
      return { data: { healthy: false, activeNodes: 0 } };
    }
  },
  
  // Custom method for blockchain network overview
  getNetworkOverview: async () => {
    try {
      const response = await axiosInstance.get('/admin/blockchain/network-overview');
      return { data: response.data };
    } catch (error) {
      console.warn('Blockchain network overview fetch failed:', error);
      return { data: { networks: {} } };
    }
  },
  
  // Admin login method
  adminLogin: async (credentials: { username: string, password: string }) => {
    try {
      const response = await axiosInstance.post('/admin/login', credentials);
      // Store token in localStorage
      localStorage.setItem('auth_token', response.data.token);
      return { data: response.data };
    } catch (error) {
      console.error('Admin login failed:', error);
      throw error;
    }
  }
};

export default extendedDataProvider;
```

### 2. Auth Provider

Authentication between admin dashboard and backend:

```typescript
import { AuthProvider } from 'react-admin';
import dataProvider from './dataProvider';

export const authProvider: AuthProvider = {
  // Called when the user attempts to log in
  login: async ({ username, password }) => {
    try {
      // Use the custom adminLogin method from dataProvider to authenticate
      const { data } = await dataProvider.adminLogin({ username, password });
      
      if (data.token) {
        // Store user info in localStorage
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify({
          id: data.id,
          fullName: data.fullName || data.username,
          role: data.role,
        }));
        
        return Promise.resolve();
      }
      return Promise.reject('Invalid login credentials');
    } catch (error) {
      return Promise.reject(error instanceof Error ? error.message : 'Login failed');
    }
  },
  
  // Called when the user clicks on the logout button
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    return Promise.resolve();
  },
  
  // Called when the API returns an error
  checkError: ({ status }) => {
    if (status === 401 || status === 403) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      return Promise.reject();
    }
    return Promise.resolve();
  },
  
  // Called when the user navigates to a new location, to check for authentication
  checkAuth: () => {
    const token = localStorage.getItem('auth_token');
    return token ? Promise.resolve() : Promise.reject();
  },
  
  // Called when the user navigates to a new location, to check for permissions / roles
  getPermissions: () => {
    const user = localStorage.getItem('user');
    if (!user) return Promise.reject();
    
    const { role } = JSON.parse(user);
    return Promise.resolve(role);
  },

  // Get user identity (display name, etc.)
  getIdentity: () => {
    const user = localStorage.getItem('user');
    if (!user) return Promise.reject();
    
    const userData = JSON.parse(user);
    
    return Promise.resolve({
      id: userData.id,
      fullName: userData.fullName,
      avatar: undefined,
    });
  }
};
```

## Backend Implementations

### 1. Admin Authentication Controller

```typescript
// backend/src/admin/controllers/auth.controller.ts
@ApiTags('admin')
@Controller('admin')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate as admin user' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns JWT token for admin access',
  })
  async login(@Body() loginDto: AdminLoginDto) {
    return this.adminAuthService.login(loginDto);
  }
}
```

### 2. Blockchain Monitoring Controller

```typescript
// backend/src/admin/controllers/blockchain-monitoring.controller.ts
@ApiTags('admin/blockchain')
@Controller('admin/blockchain')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class BlockchainMonitoringController {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly rpcProviderService: RpcProviderService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get blockchain status for admin dashboard' })
  @ApiResponse({ status: 200, description: 'Returns blockchain status' })
  async getBlockchainStatus() {
    return {
      rpcStatus: await this.blockchainService.getRpcStatus(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('network-overview')
  @ApiOperation({ summary: 'Get blockchain network overview' })
  @ApiResponse({ status: 200, description: 'Returns network overview' })
  async getNetworkOverview() {
    // Get block numbers for each network
    const networkStatus = {
      ethereum: await this.getNetworkStatus('ethereum'),
      polygon: await this.getNetworkStatus('polygon'),
      bsc: await this.getNetworkStatus('bsc')
    };
    
    return {
      networks: networkStatus,
      timestamp: new Date().toISOString()
    };
  }
  
  // Additional methods omitted for brevity
}
```

### 3. System Monitoring Controller

```typescript
// backend/src/admin/controllers/system-monitoring.controller.ts
@ApiTags('admin/system')
@Controller('admin/system')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SystemMonitoringController {
  private startTime = Date.now();

  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'Returns system health metrics' })
  async getHealthStatus() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      status: 'ok',
      uptime: this.getUptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        usedProcess: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
        }
      },
      cpu: {
        load: os.loadavg(),
        cores: os.cpus().length,
        usage: {
          user: cpuUsage.user,
          system: cpuUsage.system
        }
      },
      timestamp: new Date().toISOString()
    };
  }
  
  // Additional methods omitted for brevity
}
```

## Admin Module Integration

The `AdminModule` has been added to the backend `app.module.ts` to enable all admin functionality:

```typescript
@Module({
  imports: [
    // Other modules...
    AdminModule,
  ],
  // Controllers and providers...
})
export class AppModule {}
```

## CORS Configuration

Updated to allow connections from the admin dashboard:

```typescript
// backend/src/shared/config/cors.config.ts
export const getCorsConfig = (): CorsOptions => {
  // Default origins based on environment
  const defaultOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://alivehuman.com',
        'https://app.alivehuman.com',
        'https://admin.alivehuman.com', // Admin dashboard production domain
      ]
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3003', // Admin dashboard dev port
        // Other local development origins...
      ];
  
  // Rest of configuration...
};
```

## Security Implementation

1. **JWT Authentication**: Admin endpoints are protected using JwtAuthGuard and RolesGuard
2. **Role-Based Access Control**: Only users with 'admin' role can access admin endpoints
3. **Token Expiration**: Admin tokens expire after 8 hours for added security
4. **HTTPS Enforcement**: In production, all admin traffic is required to use HTTPS

## Using the Connected Admin Dashboard

To use this integrated solution:

1. **Start your backend server**:
   ```
   cd backend
   npm run start:dev
   ```

2. **Start your admin dashboard**:
   ```
   cd admin
   npm run dev
   ```

3. **Access the admin dashboard** at http://localhost:3003/
   - You'll see the login screen
   - Enter admin credentials to access the dashboard
   - Navigate to the Blockchain Monitoring page to see real-time blockchain data