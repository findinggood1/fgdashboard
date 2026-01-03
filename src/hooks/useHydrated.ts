import { useState, useEffect } from 'react';

/**
 * Returns false on first render (SSR/prerender), true after component mounts.
 * Use this to delay rendering of time/locale-dependent content to avoid hydration mismatches.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  
  useEffect(() => {
    setHydrated(true);
  }, []);
  
  return hydrated;
}
