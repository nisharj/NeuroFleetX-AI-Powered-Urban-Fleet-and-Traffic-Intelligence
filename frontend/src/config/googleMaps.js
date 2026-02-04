// Google Maps Configuration
// Replace with your actual Google Maps API Key
// Get your key from: https://console.cloud.google.com/google/maps-apis

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Check if API key is valid (not placeholder or empty)
const isValidApiKey = apiKey && 
                      apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY' && 
                      apiKey !== 'your_google_maps_api_key_here' &&
                      apiKey.startsWith('AIza');

export const GOOGLE_MAPS_CONFIG = {
  apiKey: isValidApiKey ? apiKey : null,
  libraries: ['places', 'geometry'],
  language: 'en',
  region: 'US',
  // Temporarily disabled until billing is enabled on Google Cloud Project
  // To enable: Set this to true and enable billing at https://console.cloud.google.com/billing/enable
  enabled: false // Changed from isValidApiKey to false
};

export default GOOGLE_MAPS_CONFIG;
