import React, { useEffect, useState, useRef, memo } from "react";
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

function SetViewOnChange({ center }) {
  const map = useMap();

  useEffect(() => {
    if (map && center) {
      map.setView(center, map.getZoom());
    }
  }, [map, center]);

  return null;
}

// Memoized map display component - only re-renders when props actually change
const MapDisplay = memo(
  ({ pickup, drop, positions }) => {
    const center =
      pickup || drop
        ? [pickup?.lat || drop?.lat, pickup?.lng || drop?.lng]
        : [20.5937, 78.9629];

    return (
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

        <SetViewOnChange center={center} />

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
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison - only re-render if coordinates or route actually changed
    return (
      prevProps.pickup?.lat === nextProps.pickup?.lat &&
      prevProps.pickup?.lng === nextProps.pickup?.lng &&
      prevProps.drop?.lat === nextProps.drop?.lat &&
      prevProps.drop?.lng === nextProps.drop?.lng &&
      prevProps.positions.length === nextProps.positions.length
    );
  },
);

export default function RouteMap({ pickup, drop, onRouteInfoChange }) {
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Store callback in ref to avoid dependency changes
  const onRouteInfoChangeRef = useRef(onRouteInfoChange);

  useEffect(() => {
    onRouteInfoChangeRef.current = onRouteInfoChange;
  }, [onRouteInfoChange]);

  useEffect(() => {
    // Reset when coordinates change
    setRoute(null);
    setError(null);

    if (!pickup || !drop) {
      // notify parent that route info is cleared
      if (onRouteInfoChangeRef.current)
        onRouteInfoChangeRef.current({ distanceKm: null, durationMin: null });
      return;
    }

    // Validate coordinates
    if (!pickup.lat || !pickup.lng || !drop.lat || !drop.lng) {
      console.error("Invalid coordinates:", { pickup, drop });
      setError("Invalid location coordinates");
      return;
    }

    console.log("Fetching route for:", { pickup, drop });

    let isCleanedUp = false;
    const abortController = new AbortController();

    // Haversine distance calculation
    const haversineDistance = (lat1, lng1, lat2, lng2) => {
      const toRad = (deg) => (deg * Math.PI) / 180;
      const R = 6371; // Earth radius in km
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // Generate a curved path between two points (fallback when no routing API works)
    const generateCurvedPath = (p1, p2, numPoints = 30) => {
      const points = [];
      const midLat = (p1.lat + p2.lat) / 2;
      const midLng = (p1.lng + p2.lng) / 2;
      const dLat = p2.lat - p1.lat;
      const dLng = p2.lng - p1.lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      const curveOffset = dist * 0.08;
      const perpLat = (-dLng / dist) * curveOffset;
      const perpLng = (dLat / dist) * curveOffset;
      const ctrlLat = midLat + perpLat;
      const ctrlLng = midLng + perpLng;

      for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const lat =
          (1 - t) * (1 - t) * p1.lat +
          2 * (1 - t) * t * ctrlLat +
          t * t * p2.lat;
        const lng =
          (1 - t) * (1 - t) * p1.lng +
          2 * (1 - t) * t * ctrlLng +
          t * t * p2.lng;
        points.push([lat, lng]);
      }
      return points;
    };

    // Local fallback route calculation
    const calcLocalRoute = () => {
      const straightKm = haversineDistance(
        pickup.lat,
        pickup.lng,
        drop.lat,
        drop.lng,
      );
      const distanceKm = straightKm * 1.3;
      const durationMin = (distanceKm / 40) * 60;
      const positions = generateCurvedPath(pickup, drop);
      return { positions, distanceKm, durationMin };
    };

    // Try fetching a real road route from OSRM servers
    const tryOSRM = async (baseUrl) => {
      const url = `${baseUrl}${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url, { signal: abortController.signal });
      if (!res.ok) throw new Error(`OSRM error: ${res.status}`);
      const data = await res.json();
      if (!data.routes || !data.routes[0]) throw new Error("No route found");
      const routeGeo = data.routes[0].geometry.coordinates.map((c) => [
        c[1],
        c[0],
      ]);
      return {
        positions: routeGeo,
        distanceKm: data.routes[0].distance / 1000,
        durationMin: data.routes[0].duration / 60,
      };
    };

    // Multiple OSRM routing servers (fallback chain)
    const OSRM_SERVERS = [
      "https://routing.openstreetmap.de/routed-car/route/v1/driving/",
      "https://router.project-osrm.org/route/v1/driving/",
    ];

    const fetchRoute = async () => {
      setLoading(true);

      // Try each OSRM server in order
      for (const server of OSRM_SERVERS) {
        if (isCleanedUp) return;
        try {
          const result = await tryOSRM(server);
          if (isCleanedUp) return;
          setRoute(result);
          setError(null);
          if (onRouteInfoChangeRef.current) {
            onRouteInfoChangeRef.current({
              distanceKm: result.distanceKm,
              durationMin: result.durationMin,
            });
          }
          setLoading(false);
          return; // success — stop trying
        } catch {
          // try next server
        }
      }

      // All servers failed — use local calculation
      if (isCleanedUp) return;
      const local = calcLocalRoute();
      setRoute(local);
      setError(null);
      if (onRouteInfoChangeRef.current) {
        onRouteInfoChangeRef.current({
          distanceKm: local.distanceKm,
          durationMin: local.durationMin,
        });
      }
      setLoading(false);
    };

    // Timeout: if no server responds in 6s total, abort and use local
    const timeout = setTimeout(() => abortController.abort(), 6000);
    fetchRoute().finally(() => clearTimeout(timeout));

    return () => {
      isCleanedUp = true;
      abortController.abort();
    };
  }, [pickup?.lat, pickup?.lng, drop?.lat, drop?.lng]); // Use primitive values only

  const positions = route ? route.positions : [];

  return (
    <div className="route-map-card">
      <div className="route-map-container">
        {/* Memoized map that won't remount on state changes */}
        <MapDisplay pickup={pickup} drop={drop} positions={positions} />

        <div className="route-map-overlay">
          {loading && (
            <div className="route-map-loading">
              <div className="animate-pulse">Calculating route...</div>
            </div>
          )}
          {error && (
            <div className="route-map-error">
              <div className="font-semibold">Route Error</div>
              <div className="text-xs">{error}</div>
            </div>
          )}
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
          {!pickup || !drop ? (
            <div className="route-map-loading bg-gray-700 bg-opacity-80 text-white">
              Select both pickup and drop locations
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
