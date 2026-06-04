import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Initialise synchronously so the correct layout renders on the FIRST paint.
  // Previously this started as 'undefined' (-> false), then flipped to true after
  // the effect fired — causing a desktop->mobile remount that reset all component
  // state (HowToPlayOverlay, usePlayerSession balance cache, etc.).
  const [isMobile, setIsMobile] = React.useState(
    () => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
  )

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    // NOTE: Do NOT call setIsMobile here on mount.
    // The useState initializer already captured the correct value synchronously.
    // Calling setIsMobile here would trigger an unnecessary re-render / remount.
    return () => mql.removeEventListener("change", onChange);
  }, [])

  return isMobile
}