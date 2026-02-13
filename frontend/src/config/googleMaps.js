// OpenStreetMap Configuration
// Free and open-source map service - No API key required!

export const MAP_CONFIG = {
  // Default map center (Bangalore, India)
  defaultCenter: {
    lat: 12.9716,
    lng: 77.5946,
  },
  defaultZoom: 13,

  // OpenStreetMap tile layer
  tileLayer: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },

  // Nominatim for geocoding (free, no API key required)
  geocoding: {
    searchUrl: "https://nominatim.openstreetmap.org/search",
    reverseUrl: "https://nominatim.openstreetmap.org/reverse",
  },

  enabled: true,
};

export default MAP_CONFIG;
