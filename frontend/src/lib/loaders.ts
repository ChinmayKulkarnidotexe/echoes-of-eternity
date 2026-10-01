/**
 * Single-flight script loaders for the two heavyweight third-party runtimes.
 *
 * Both are memoised at module scope rather than per component: React will mount
 * the aerial and street-view stages repeatedly as the visitor moves between
 * modes, and loading the Maps JS API twice logs a console error and can mint a
 * second billable session. One promise per runtime, forever.
 */

export const GOOGLE_MAPS_API_KEY: string =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? '';

export const CESIUM_VERSION = '1.145.0';
const CESIUM_BASE_URL = `https://cdn.jsdelivr.net/npm/cesium@${CESIUM_VERSION}/Build/Cesium/`;

declare global {
  interface Window {
    google?: any;
    Cesium?: any;
    CESIUM_BASE_URL?: string;
  }
}

function injectScript(id: string, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
      } else {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)));
      }
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function injectStylesheet(id: string, href: string): void {
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

// ---------------------------------------------------------------------------
// Google Maps JavaScript API — needed for StreetViewPanorama
// ---------------------------------------------------------------------------
let mapsPromise: Promise<any> | null = null;

export function loadGoogleMaps(): Promise<any> {
  if (window.google?.maps?.StreetViewPanorama) {
    return Promise.resolve(window.google.maps);
  }
  if (mapsPromise) return mapsPromise;

  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(
      new Error('VITE_GOOGLE_MAPS_API_KEY is not set in frontend/.env'),
    );
  }

  // No `libraries` parameter: StreetViewPanorama is in the core bundle, and
  // asking for places/marker as well only costs load time here.
  const src =
    `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}` +
    `&v=weekly&loading=async`;

  mapsPromise = injectScript('google-maps-js-api', src)
    .then(async () => {
      // With loading=async the global appears a tick after onload fires.
      for (let attempt = 0; attempt < 60; attempt += 1) {
        if (window.google?.maps?.StreetViewPanorama) return window.google.maps;
        await new Promise((r) => setTimeout(r, 50));
      }
      throw new Error('Google Maps loaded but StreetViewPanorama never appeared');
    })
    .catch((error) => {
      mapsPromise = null;
      throw error;
    });

  return mapsPromise;
}

// ---------------------------------------------------------------------------
// CesiumJS — the renderer for Google's Photorealistic 3D Tiles
// ---------------------------------------------------------------------------
let cesiumPromise: Promise<any> | null = null;

export function loadCesium(): Promise<any> {
  if (window.Cesium) return Promise.resolve(window.Cesium);
  if (cesiumPromise) return cesiumPromise;

  // Cesium resolves its workers and assets against this global, so it has to be
  // set before the bundle evaluates.
  window.CESIUM_BASE_URL = CESIUM_BASE_URL;
  injectStylesheet('cesium-widgets-css', `${CESIUM_BASE_URL}Widgets/widgets.css`);

  cesiumPromise = injectScript('cesium-js', `${CESIUM_BASE_URL}Cesium.js`)
    .then(() => {
      if (!window.Cesium) throw new Error('Cesium loaded but window.Cesium is undefined');
      return window.Cesium;
    })
    .catch((error) => {
      cesiumPromise = null;
      throw error;
    });

  return cesiumPromise;
}

// ---------------------------------------------------------------------------
// Warm-up
// ---------------------------------------------------------------------------

/**
 * Start fetching the heavy runtimes before the visitor asks for them.
 *
 * Cesium alone is about six megabytes, and the Maps JS API is another second or
 * two. Both were previously fetched at the moment their mode opened, which put
 * the whole cost on screen as a spinner. Calling this from the monument
 * catalogue — where the visitor spends a few seconds reading — moves that cost
 * into time that was idle anyway.
 *
 * Failures are swallowed: this is an optimisation, and the real load paths
 * still report their own errors properly.
 */
export function warmUpRuntimes(): void {
  if (!GOOGLE_MAPS_API_KEY) return;
  loadCesium().catch(() => {});
  loadGoogleMaps().catch(() => {});
}

/**
 * Ask the browser to resolve and connect to the hosts we are about to hammer.
 *
 * Tiles and panorama imagery come from dedicated Google hosts, and each one
 * otherwise costs a DNS lookup plus a TLS handshake at exactly the moment the
 * visitor is waiting on a picture.
 */
const PRECONNECT_HOSTS = [
  'https://tile.googleapis.com',
  'https://maps.googleapis.com',
  'https://streetviewpixels-pa.googleapis.com',
  'https://khms0.googleapis.com',
  'https://cdn.jsdelivr.net',
];

export function preconnectImageryHosts(): void {
  for (const host of PRECONNECT_HOSTS) {
    const id = `preconnect-${host.replace(/[^a-z]/gi, '')}`;
    if (document.getElementById(id)) continue;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'preconnect';
    link.href = host;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }
}
