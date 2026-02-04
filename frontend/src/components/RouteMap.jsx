import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet's default icon paths for bundlers (React/Vite)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function FitBounds({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !positions || positions.length === 0) return;
    try {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [40, 40] });
    } catch (e) {
      // ignore
    }
  }, [map, positions]);

  return null;
}

export default function RouteMap({ pickup, drop, onRouteInfoChange }) {
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Reset when coordinates change
    setRoute(null);
    setError(null);

    if (!pickup || !drop) {
      // notify parent that route info is cleared
      if (onRouteInfoChange)
        onRouteInfoChange({ distanceKm: null, durationMin: null });
      return;
    }

    const controller = new AbortController();
    const fetchRoute = async () => {
      setLoading(true);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`OSRM error: ${res.status}`);
        const data = await res.json();
        if (!data.routes || !data.routes[0]) throw new Error("No route found");

        const routeGeo = data.routes[0].geometry.coordinates.map((c) => [
          c[1],
          c[0],
        ]);
        const distanceKm = data.routes[0].distance / 1000; // meters -> km
        const durationMin = data.routes[0].duration / 60; // seconds -> minutes

        setRoute({ positions: routeGeo, distanceKm, durationMin });

        if (onRouteInfoChange) onRouteInfoChange({ distanceKm, durationMin });
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Route fetch failed", err);
        setError(err.message || "Failed to fetch route");
        if (onRouteInfoChange)
          onRouteInfoChange({ distanceKm: null, durationMin: null });
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();

    return () => controller.abort();
  }, [pickup, drop, onRouteInfoChange]);

  const center =
    pickup || drop
      ? [pickup?.lat || drop?.lat, pickup?.lng || drop?.lng]
      : [20.5937, 78.9629];

  const positions = route ? route.positions : [];

  return (
    <div className="route-map-card">
      <div className="route-map-container">
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: "100%", borderRadius: "12px" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {pickup && (
            <Marker position={[pickup.lat, pickup.lng]}>
              <Popup>Pickup</Popup>
            </Marker>
          )}

          {drop && (
            <Marker position={[drop.lat, drop.lng]}>
              <Popup>Drop</Popup>
            </Marker>
          )}

          {positions.length > 0 && (
            <>
              <Polyline
                positions={positions}
                pathOptions={{ color: "#3b82f6", weight: 5 }}
              />
              <FitBounds positions={positions} />
            </>
          )}
        </MapContainer>

        <div className="route-map-overlay">
          {loading && (
            <div className="route-map-loading">Fetching route...</div>
          )}
          {error && <div className="route-map-error">{error}</div>}
          {route && !loading && !error && (
            <div className="route-map-info">
              <div>
                <strong>{route.distanceKm.toFixed(2)} km</strong>
                <div className="text-xs text-gray-600">Distance</div>
              </div>
              <div>
                <strong>{Math.round(route.durationMin)} min</strong>
                <div className="text-xs text-gray-600">Duration</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
