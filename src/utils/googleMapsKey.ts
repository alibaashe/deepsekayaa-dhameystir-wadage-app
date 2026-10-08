/**
 * Google Maps API Key Resolver & Configuration Helper
 * ====================================================
 * Automatically checks and resolves Google Maps JS API keys across environment variables:
 * - import.meta.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
 * - import.meta.env.VITE_GOOGLE_MAPS_API_KEY
 * - import.meta.env.VITE_GOOGLE_MAPS_PLATFORM_KEY
 * - import.meta.env.GOOGLE_MAPS_API_KEY
 * - process.env (for Node / SSR environments)
 * - window.GOOGLE_MAPS_API_KEY
 *
 * REQUIRED GOOGLE CLOUD PLATFORM (GCP) APIS TO ENABLE IN CONSOLE:
 * ---------------------------------------------------------------
 * 1. Maps JavaScript API (Required for web vector maps, custom styles, overlay rendering)
 * 2. Directions API (Required for routing polylines and turn calculation)
 * 3. Geocoding API (Required for pickup/destination reverse-geocoding)
 * 4. Places API (Required for address search & autocomplete)
 *
 * SETUP INSTRUCTIONS:
 * 1. Visit Google Cloud Console: https://console.cloud.google.com/google/maps-apis
 * 2. Create or select your project (e.g. "Wadaag Rideshare").
 * 3. Go to "APIs & Services" > "Enabled APIs & Services" and click "+ ENABLE APIS AND SERVICES".
 * 4. Enable: "Maps JavaScript API", "Directions API", "Geocoding API".
 * 5. Create an API key under "Credentials" -> "Create Credentials" -> "API Key".
 * 6. Set API Key Restrictions:
 *    - Application Restrictions: HTTP Referrers (e.g. *.wadaage.com/*, http://localhost:3000/*)
 *    - API Restrictions: Restrict key to Maps JavaScript API, Directions API, Geocoding API.
 * 7. Add key to your .env file:
 *    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_gcp_api_key_here
 */

export const getGoogleMapsApiKey = (): string => {
  try {
    // 1. Vite / Next.js Client-Side Environment Variables
    const metaEnv = (import.meta as any).env || {};

    const candidate =
      metaEnv.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      metaEnv.VITE_GOOGLE_MAPS_API_KEY ||
      metaEnv.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
      metaEnv.GOOGLE_MAPS_API_KEY ||
      metaEnv.GOOGLE_MAPS_PLATFORM_KEY;

    if (candidate && typeof candidate === 'string' && candidate.trim() !== '') {
      return candidate.trim();
    }

    // 2. Global Window Variable Override
    if (typeof window !== 'undefined' && (window as any).GOOGLE_MAPS_API_KEY) {
      return String((window as any).GOOGLE_MAPS_API_KEY).trim();
    }

    // 3. Process ENV Fallback (if running under Node / SSR)
    if (typeof process !== 'undefined' && process.env) {
      const procKey =
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
        process.env.VITE_GOOGLE_MAPS_API_KEY ||
        process.env.GOOGLE_MAPS_API_KEY;

      if (procKey && procKey.trim() !== '') {
        return procKey.trim();
      }
    }
  } catch (err) {
    console.warn('[googleMapsKey] Error resolving Google Maps API key:', err);
  }

  // Fallback string if no env key is defined (triggers graceful fallback or Google error alert)
  return '';
};

export const isGoogleMapsApiKeyConfigured = (): boolean => {
  const key = getGoogleMapsApiKey();
  return key.length > 10;
};
