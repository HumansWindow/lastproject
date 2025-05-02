import React from 'react';
import { Grid as MuiGrid, GridProps as MuiGridProps } from '@mui/material';

// Create a wrapper component to handle the TypeScript incompatibilities
export interface GridProps extends MuiGridProps {
  item?: boolean;
  container?: boolean;
  xs?: number;
  md?: number;
  lg?: number;
  xl?: number;
  spacing?: number;
}

export const Grid: React.FC<GridProps> = ({ children, ...props }) => {
  // Forward all props to the underlying MUI Grid component
  return <MuiGrid {...props}>{children}</MuiGrid>;
};