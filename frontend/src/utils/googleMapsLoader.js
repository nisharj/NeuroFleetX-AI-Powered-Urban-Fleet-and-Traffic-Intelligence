import GOOGLE_MAPS_CONFIG from '../config/googleMaps';

let isLoading = false;
let isLoaded = false;
const callbacks = [];

/**
 * Load Google Maps API script only once
 * @returns {Promise<void>}
 */
export const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    // Check if Google Maps is enabled and API key is valid
    if (!GOOGLE_MAPS_CONFIG.enabled || !GOOGLE_MAPS_CONFIG.apiKey) {
      console.warn('Google Maps API key not configured. Address autocomplete will be disabled.');
      reject(new Error('Google Maps API key not configured'));
      return;
    }

    // If already loaded, resolve immediately
    if (isLoaded && window.google && window.google.maps) {
      resolve();
      return;
    }

    // If currently loading, add to callback queue
    if (isLoading) {
      callbacks.push({ resolve, reject });
      return;
    }

    // Check if script already exists in DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Script exists, wait for it to load
      if (window.google && window.google.maps) {
        isLoaded = true;
        resolve();
        return;
      }
      
      existingScript.addEventListener('load', () => {
        isLoaded = true;
        resolve();
        callbacks.forEach(cb => cb.resolve());
        callbacks.length = 0;
      });
      
      existingScript.addEventListener('error', (error) => {
        reject(error);
        callbacks.forEach(cb => cb.reject(error));
        callbacks.length = 0;
      });
      return;
    }

    // Start loading
    isLoading = true;
    callbacks.push({ resolve, reject });

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_CONFIG.apiKey}&libraries=${GOOGLE_MAPS_CONFIG.libraries.join(',')}&language=${GOOGLE_MAPS_CONFIG.language}&region=${GOOGLE_MAPS_CONFIG.region}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isLoading = false;
      isLoaded = true;
      callbacks.forEach(cb => cb.resolve());
      callbacks.length = 0;
    };

    script.onerror = (error) => {
      isLoading = false;
      console.error('Failed to load Google Maps API:', error);
      callbacks.forEach(cb => cb.reject(error));
      callbacks.length = 0;
    };

    document.head.appendChild(script);
  });
};

/**
 * Check if Google Maps API is loaded
 * @returns {boolean}
 */
export const isGoogleMapsLoaded = () => {
  return isLoaded && window.google && window.google.maps && window.google.maps.places;
};

export default loadGoogleMapsScript;
