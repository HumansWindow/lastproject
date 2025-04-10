import { ComponentType } from 'react';

export type DynamicComponentModule<P = {}> = {
  default: ComponentType<P>;
};
