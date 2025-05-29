import React from 'react';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  children,
  className = '',
}) => {
  // Variant styles
  const variantStyles = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    error: 'bg-red-50 text-red-800 border-red-200'
  };

  return (
    <div className={`rounded-md border p-4 ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
};

export default Alert;