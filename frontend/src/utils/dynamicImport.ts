import { ComponentType } from 'react';

export function withDynamicImport<P>(importFn: () => Promise<any>): () => Promise<ComponentType<P>> {
  return () => importFn().then((mod: any) => mod.default);
}
