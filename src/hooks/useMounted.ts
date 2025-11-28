/**
 * Custom Hook: useMounted
 * Handle hydration safety for SSR/client rendering
 */

import { useState, useEffect } from 'react';

export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
