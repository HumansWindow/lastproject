import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import { BlockchainProvider } from './src/context/BlockchainContext';
import AppNavigator from './src/navigation/AppNavigator';
import i18n from './src/locales/i18n';
import theme from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <BlockchainProvider>
            <PaperProvider theme={theme}>
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            </PaperProvider>
          </BlockchainProvider>
        </AuthProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}
