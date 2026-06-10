'use client';

export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ph = (window as any).posthog;
    if (ph?.capture) {
      ph.capture(event, props);
    }
  } catch {}

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gtag = (window as any).gtag;
    if (gtag) {
      gtag('event', event, props);
    }
  } catch {}
}
