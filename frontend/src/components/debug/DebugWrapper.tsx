import React, { ReactNode } from 'react';
import { useAuthDebug } from '../../hooks/useAuthDebug';
import AuthDebugPanel from './AuthDebugPanel';

interface Props {
  children: ReactNode;
  autoStartDebugging?: boolean;
}

/**
 * Wrapper component that adds debugging capabilities to any component
 */
const DebugWrapper: React.FC<Props> = ({ 
  children, 
  autoStartDebugging = false 
}) => {
  const { isDebugging, toggleDebugging } = useAuthDebug(autoStartDebugging);
  
  // Only show debug UI in development mode
  const isDev = process.env.NODE_ENV === 'development';
  
  if (!isDev) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      
      {isDebugging && (
        <AuthDebugPanel visible={isDebugging} />
      )}
      
      <button
        onClick={toggleDebugging}
        style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          background: '#333',
          color: isDebugging ? '#00ff00' : '#aaaaaa',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '12px',
          zIndex: 9998
        }}
      >
        {isDebugging ? '🔍 Debug ON' : '🔎 Debug OFF'}
      </button>
    </>
  );
};

export default DebugWrapper;
