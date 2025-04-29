import { ComponentType } from 'react';

export interface DynamicComponentModule<P = {}> {
  default: ComponentType<P>;
}
