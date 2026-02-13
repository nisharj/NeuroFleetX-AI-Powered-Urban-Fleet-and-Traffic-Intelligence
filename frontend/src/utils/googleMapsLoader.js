import MAP_CONFIG from "../config/googleMaps";

/**
 * OpenStreetMap geocoding utilities
 * Free and open-source, no API key required
 */

/**
 * Search for address using Nominatim (OpenStreetMap geocoding service)
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of results
 */
export const searchAddress = async (query) => {
  if (!query || query.length < 3) {
    return [];
  }

  try {
    const response = await fetch(
      `${MAP_CONFIG.geocoding.searchUrl}?q=${encodeURIComponent(query)}&format=json&limit=5`,
      {
        headers: {
          "User-Agent": "NeuroFleetX",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Geocoding failed");
    }

    const data = await response.json();
    return data.map((item) => ({
      address: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch (error) {
    console.error("Address search failed:", error);
    return [];
  }
};

/**
 * Reverse geocode coordinates to address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} Address
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `${MAP_CONFIG.geocoding.reverseUrl}?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          "User-Agent": "NeuroFleetX",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Reverse geocoding failed");
    }

    const data = await response.json();
    return data.display_name || "Selected location";
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return "Selected location";
  }
};

// Legacy function for compatibility
export const loadGoogleMapsScript = () => {
  return new Promise((resolve) => {
    // OpenStreetMap doesn't need loading - resolve immediately
    console.log("Using OpenStreetMap - no API loading required");
    resolve();
  });
};

/**
 * Check if maps are available (always true for OpenStreetMap)
 * @returns {boolean}
 */
export const isGoogleMapsLoaded = () => {
  return true;
};

export default loadGoogleMapsScript;
