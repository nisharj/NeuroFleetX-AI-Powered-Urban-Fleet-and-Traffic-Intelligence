import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

const defaultCenter = [28.6139, 77.2090]; // Default to New Delhi [lat, lng]

// Custom marker icons
const blueMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Fit bounds component
function FitBounds({ bounds, route }) {
  const map = useRef(null);
  useEffect(() => {
    if (map.current && bounds) {
      map.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, route]);
  return null;
}

function RideMap({ pickup, dropoff }) {
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const mapRef = useRef(null);

  // Fetch route from OSRM
  const calculateRoute = async () => {
    if (!pickup?.lat || !pickup?.lng || !dropoff?.lat || !dropoff?.lng) return;

    setLoading(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=full&geometries=geojson`;
      const response = await axios.get(url);
      
      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        setRouteData({
          path: route.geometry.coordinates.map(coord => [coord[1], coord[0]]), // Convert [lng,lat] to [lat,lng]
          distance: (route.distance / 1000).toFixed(1),
          duration: Math.round(route.duration / 60)
        });
        setError(false);
      } else {
        throw new Error('No routes found');
      }
    } catch (err) {
      console.error('Route calculation error:', err);
      setError(true);
      setRouteData(null);
    } finally {
      setLoading(false);
    }
  };
      }
    } catch (err) {
      // Fallback to straight line silently
      setDirections(null);
      setAlternateRoute(null);
      setDirectionsError(true);
    }
  };



  // Trigger route calculation
  useEffect(() => {
    if (pickup?.lat && pickup?.lng && dropoff?.lat && dropoff?.lng) {
      calculateRoute();
    } else {
      setRouteData(null);
    }
  }, [pickup, dropoff]);

  // Build bounds for map fitting
  const getBounds = () => {
    if (!pickup?.lat || !dropoff?.lat) return null;
    return [[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]];
  };
}

export default RideMap;
