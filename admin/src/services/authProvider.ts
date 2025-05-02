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