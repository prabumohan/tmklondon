/**
 * Central analytics IDs for BaseLayout.
 *
 * - GA4 via gtag (default): measurement ID below — loaded high in <head> with dns-prefetch/preconnect.
 * - Optional GTM: set PUBLIC_GTM_CONTAINER_ID=GTM-XXXXXXX at build time, then configure GA4 inside GTM.
 *   When GTM is set, the inline gtag snippet is skipped to avoid double-counting.
 */

export const GA_MEASUREMENT_ID = 'G-RJKJ7HZF3G';

const rawGtm = typeof import.meta.env.PUBLIC_GTM_CONTAINER_ID === 'string' ? import.meta.env.PUBLIC_GTM_CONTAINER_ID.trim() : '';

/** True when a valid GTM container id is provided (GTM-ABC123). */
export function useGtmContainer(): boolean {
  return /^GTM-[A-Z0-9]+$/i.test(rawGtm);
}

export function getGtmContainerId(): string {
  return rawGtm;
}
