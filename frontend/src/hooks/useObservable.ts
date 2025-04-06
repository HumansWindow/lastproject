import { useState, useEffect } from 'react';
import { Observable } from 'rxjs';

/**
 * React hook to use RxJS observables in functional components
 * @param observable$ The RxJS observable to subscribe to
 * @param initialValue Initial value before subscription emits
 * @returns The current value from the observable
 */
export function useObservable<T>(observable$: Observable<T>, initialValue: T): T {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    // Subscribe to the observable and update state when it emits
    const subscription = observable$.subscribe(nextValue => {
      setValue(nextValue);
    });

    // Clean up subscription when component unmounts
    // or when observable changes
    return () => {
      subscription.unsubscribe();
    };
  }, [observable$]);

  return value;
}

export default useObservable;