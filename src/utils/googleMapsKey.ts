// Utility to resolve Google Maps API Key from Vite env, process env, or global scope

export function getGoogleMapsApiKey(): string {
  if (typeof window !== 'undefined') {
    const win = window as any;
    if (win.GOOGLE_MAPS_API_KEY) return win.GOOGLE_MAPS_API_KEY.trim();
    if (win.__ENV__?.VITE_GOOGLE_MAPS_API_KEY) return win.__ENV__.VITE_GOOGLE_MAPS_API_KEY.trim();
  }

  try {
    const importMetaEnv = (import.meta as any).env;
    if (importMetaEnv?.VITE_GOOGLE_MAPS_API_KEY) return String(importMetaEnv.VITE_GOOGLE_MAPS_API_KEY).trim();
    if (importMetaEnv?.VITE_GOOGLE_MAPS_PLATFORM_KEY) return String(importMetaEnv.VITE_GOOGLE_MAPS_PLATFORM_KEY).trim();
    if (importMetaEnv?.GOOGLE_MAPS_API_KEY) return String(importMetaEnv.GOOGLE_MAPS_API_KEY).trim();
  } catch (_e) {
    // Ignore import.meta error if unavailable
  }

  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.VITE_GOOGLE_MAPS_API_KEY) return String(process.env.VITE_GOOGLE_MAPS_API_KEY).trim();
      if (process.env.GOOGLE_MAPS_API_KEY) return String(process.env.GOOGLE_MAPS_API_KEY).trim();
      if (process.env.GOOGLE_MAPS_PLATFORM_KEY) return String(process.env.GOOGLE_MAPS_PLATFORM_KEY).trim();
    }
  } catch (_e) {
    // Ignore process error if unavailable
  }

  return 'AIzaSyBAOVGm7NLFbVZdx2GCsn5_YjdYQVry_4w';
}
