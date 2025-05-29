import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  variant?: 'default' | 'outline';
}

const Select: React.FC<SelectProps> = ({ 
  children, 
  className = '', 
  variant = 'default', 
  ...props 
}) => {
  const baseStyles = 'block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500';
  const variantStyles = variant === 'outline' 
    ? 'border-2 py-1.5' 
    : 'py-2';
  
  return (
    <select 
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};

export default Select;