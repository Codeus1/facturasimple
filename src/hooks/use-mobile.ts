import { useEffect, useState } from "react";

const MOBILE_MEDIA_QUERY = "(max-width: 1024px)";

// Detects if the viewport is considered mobile (<= 1024px).
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = typeof window !== "undefined"
      ? window.matchMedia(MOBILE_MEDIA_QUERY)
      : null;

    if (!mediaQuery) return;

    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };

    // Initialize state on mount
    handleChange(mediaQuery);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
}
