import React from 'react';
import Navbar from "./Navbar";
import Footer from "./Footer";
import WalletDebugWrapper from "../debug/WalletDebugWrapper";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Only use the debug wrapper in development mode
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {isDev ? (
          <WalletDebugWrapper>
            {children}
          </WalletDebugWrapper>
        ) : (
          children
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
