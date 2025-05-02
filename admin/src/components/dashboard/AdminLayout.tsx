'use client';

import React, { useEffect } from 'react';
import { Admin, Resource, Layout } from 'react-admin';
import dataProvider from '../../services/dataProvider';
import { authProvider } from '../../services/authProvider';
import LoginPage from '../auth/LoginPage';

// Import resource components (we'll create these next)
import { Dashboard } from './Dashboard';
import { SystemMonitoring } from './SystemMonitoring';
import { BlockchainMonitoring } from './BlockchainMonitoring';
import { UserManagement } from './UserManagement';

const AdminLayout = () => {
  useEffect(() => {
    document.title = "AliveHuman Admin";
  }, []);

  return (
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
  );
};

export default AdminLayout;