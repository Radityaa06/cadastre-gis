// Google Maps JavaScript API Loader with fallback & demo key support
const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDChU7C2WAuHlYQQbAik9PGNRRUjS2-TKs';

let mapsPromise: Promise<typeof google> | null = null;

export function loadGoogleMapsScript(): Promise<typeof google> {
  if (typeof window !== 'undefined' && (window as any).google?.maps) {
    return Promise.resolve((window as any).google);
  }

  if (mapsPromise) {
    return mapsPromise;
  }

  mapsPromise = new Promise((resolve, reject) => {
    // Check if script element is already added
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve((window as any).google));
      existingScript.addEventListener('error', (err) => reject(err));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places,geometry,drawing&v=weekly`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if ((window as any).google?.maps) {
        resolve((window as any).google);
      } else {
        reject(new Error('Google Maps script loaded but google.maps is undefined.'));
      }
    };

    script.onerror = (err) => {
      console.error('Failed to load Google Maps SDK script', err);
      reject(new Error('Failed to load Google Maps SDK.'));
    };

    document.head.appendChild(script);
  });

  return mapsPromise;
}
