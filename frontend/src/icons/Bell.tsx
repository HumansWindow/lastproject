import React from 'react';

export interface BellIconProps {
  className?: string;
  color?: string;
  size?: number;
  style?: React.CSSProperties;
}

export const BellIcon: React.FC<BellIconProps> = ({ 
  className = '',
  color = 'currentColor',
  size = 24,
  style = {},
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...props}
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  );
};
