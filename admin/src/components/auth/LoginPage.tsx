import React from 'react';
import { 
  Login, 
  LoginForm, 
  useLogin, 
  useNotify, 
  TextInput, 
  PasswordInput, 
  useTranslate 
} from 'react-admin';
import { Box, Card, CardContent, Typography } from '@mui/material';

// Custom login form component
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

// Custom login page with branding
const LoginPage = () => {
  return (
    <Login
      backgroundImage="/images/login-background.jpg"
      title="AliveHuman Admin"
    >
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <Card sx={{ minWidth: 300, maxWidth: 500 }}>
          <Box
            sx={{
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <Typography variant="h5" component="div" gutterBottom>
              AliveHuman Admin Portal
            </Typography>
          </Box>
          <CardContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Enter your admin credentials to access the dashboard
            </Typography>
            <CustomLoginForm />
          </CardContent>
        </Card>
      </Box>
    </Login>
  );
};

export default LoginPage;