# Admin Dashboard Implementation Prompts

## Admin Dashboard Setup

```prompt
Create a Next.js admin dashboard application within a Yarn workspace monorepo structure at 'packages/admin' with:

1. Next.js app directory structure (App Router)
2. TypeScript configuration extending the root config
3. Package.json with:
   - Next.js and React dependencies
   - Admin UI component library (like MUI Admin or Tailwind Admin)
   - Chart libraries for data visualization
   - Data table components
   - Form management libraries
   - Testing libraries
   - Development dependencies

4. Environment configuration setup with validation
5. Authentication system with admin-specific roles
6. Layout with sidebar navigation, header, and content area
7. Dashboard analytics page with key metrics
8. Basic module structure for admin features
```

## Admin Authentication System

```prompt
Create an admin authentication system for a Next.js admin dashboard:

1. Authentication context provider:
   - Admin user state management
   - Role-based permissions
   - Authentication status tracking

2. Login system:
   - Secure admin login form
   - Two-factor authentication support
   - Session management
   - Timeout handling

3. Security features:
   - Role-based route protection
   - Permission-based UI rendering
   - Audit logging for admin actions
   - Session management with inactivity detection

4. Admin profile management:
   - Password change
   - Profile settings
   - Activity history

5. Complete test coverage
```

## User Management Interface

```prompt
Create a user management interface for a Next.js admin dashboard:

1. User listing page with:
   - Data table with sorting and filtering
   - Pagination
   - Bulk actions
   - Search functionality
   - Status indicators

2. User detail view:
   - Profile information display
   - Activity history
   - Connected wallets
   - Security settings
   - Session management

3. User management actions:
   - Create/edit user
   - Change user status (activate/deactivate)
   - Reset password
   - Assign roles
   - Manage permissions

4. Security audit features:
   - Login history
   - Action logs
   - IP tracking
   - Device management

5. Complete test coverage
```

## Content Management System

```prompt
Create a content management system for a Next.js admin dashboard:

1. Game content management:
   - Module creation and editing
   - Section management
   - Content templates
   - Media asset management
   - Quiz creation and management

2. Content editing features:
   - Rich text editor
   - Media uploader
   - Content versioning
   - Preview capabilities
   - Content scheduling

3. Workflow management:
   - Content approval workflows
   - Review process
   - Publishing system
   - Collaboration tools

4. Content organization:
   - Category management
   - Tagging system
   - Search functionality
   - Content relationships

5. Complete test coverage
```

## Analytics Dashboard

```prompt
Create an analytics dashboard for a Next.js admin application:

1. Overview dashboard with:
   - Key performance indicators
   - User statistics
   - Engagement metrics
   - Financial metrics
   - System health indicators

2. Data visualization components:
   - Line and bar charts
   - Pie and donut charts
   - Heat maps
   - Data tables with export functionality
   - Filters and date range selectors

3. User analytics:
   - Registration trends
   - Active user tracking
   - Cohort analysis
   - Retention metrics
   - User journey visualization

4. Game analytics:
   - Module engagement metrics
   - Completion rates
   - Quiz performance statistics
   - Achievement tracking
   - Reward distribution analytics

5. Blockchain analytics:
   - Wallet connections
   - Transaction volume
   - Token distribution
   - NFT activity
   - Network statistics

6. Data export capabilities and API for custom reporting
```

## System Monitoring Interface

```prompt
Create a system monitoring interface for a Next.js admin dashboard:

1. System health dashboard:
   - Server status indicators
   - Database metrics
   - API performance metrics
   - Error rates
   - Response times

2. Real-time monitoring:
   - Active user count
   - Request throughput
   - Resource utilization
   - Queue status
   - WebSocket connections

3. Log viewer:
   - Log level filtering
   - Source filtering
   - Date range selection
   - Search functionality
   - Pattern highlighting

4. Alert management:
   - Alert configuration
   - Notification settings
   - Alert history
   - Resolution tracking

5. Infrastructure visualization:
   - Service dependency graph
   - Load balancing status
   - Database replication status
   - Cache hit rates
   - Network traffic visualization
```