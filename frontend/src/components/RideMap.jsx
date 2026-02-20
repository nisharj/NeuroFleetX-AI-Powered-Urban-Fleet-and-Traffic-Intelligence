import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

const defaultCenter = [28.6139, 77.2090];

const blueMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const redMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function RideMap({ pickup, dropoff }) {
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasRouteError, setHasRouteError] = useState(false);

  const center = useMemo(() => {
    if (pickup?.lat && pickup?.lng) return [pickup.lat, pickup.lng];
    return defaultCenter;
  }, [pickup]);

  const canRoute = Boolean(
    pickup?.lat && pickup?.lng && dropoff?.lat && dropoff?.lng,
  );

  useEffect(() => {
    const calculateRoute = async () => {
      if (!canRoute) {
        setRouteData(null);
        setHasRouteError(false);
        return;
      }

      setLoading(true);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=full&geometries=geojson`;
        const response = await axios.get(url);

        if (response.data?.routes?.length > 0) {
          const route = response.data.routes[0];
          const path = route.geometry.coordinates.map((coord) => [coord[1], coord[0]]);

          setRouteData({
            path,
            distanceKm: (route.distance / 1000).toFixed(1),
            durationMin: Math.round(route.duration / 60),
          });
          setHasRouteError(false);
        } else {
          throw new Error('No route found');
        }
      } catch (err) {
        console.error('Route calculation failed:', err);
        setHasRouteError(true);
        setRouteData({
          path: [
            [pickup.lat, pickup.lng],
            [dropoff.lat, dropoff.lng],
          ],
          distanceKm: null,
          durationMin: null,
        });
      } finally {
        setLoading(false);
      }
    };

    calculateRoute();
  }, [canRoute, pickup, dropoff]);

  return (
    <div className="glass-card" style={{ height: '420px', overflow: 'hidden' }}>
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {pickup?.lat && pickup?.lng && (
          <Marker position={[pickup.lat, pickup.lng]} icon={blueMarkerIcon}>
            <Popup>
              <strong>Pickup</strong>
              <br />
              {pickup.address || 'Selected pickup point'}
            </Popup>
          </Marker>
        )}

        {dropoff?.lat && dropoff?.lng && (
          <Marker position={[dropoff.lat, dropoff.lng]} icon={redMarkerIcon}>
            <Popup>
              <strong>Dropoff</strong>
              <br />
              {dropoff.address || 'Selected dropoff point'}
            </Popup>
          </Marker>
        )}

        {routeData?.path?.length > 1 && (
          <Polyline positions={routeData.path} pathOptions={{ color: hasRouteError ? '#f97316' : '#2563eb', weight: 5 }} />
        )}
      </MapContainer>

      <div style={{ padding: '10px 12px', borderTop: '1px solid #e5e7eb', fontSize: '0.9rem' }}>
        {loading && <span>Calculating route...</span>}
        {!loading && routeData?.distanceKm && routeData?.durationMin && (
          <span>
            Distance: {routeData.distanceKm} km | ETA: {routeData.durationMin} min
          </span>
        )}
        {!loading && hasRouteError && (
          <span>OSRM unavailable, showing straight-line fallback.</span>
        )}
      </div>
    </div>
  );
}

export default RideMap;
