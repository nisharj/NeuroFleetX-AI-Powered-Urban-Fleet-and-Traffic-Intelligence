import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PropTypes from "prop-types";

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

/**
 * RouteVisualization - Shows route options on a Leaflet map
 *
 * @param {Object} routeData - Route optimization response from backend
 * @param {number} selectedRouteIndex - Index of currently selected route
 * @param {function} onRouteSelect - Callback when user selects a route
 */
export default function RouteVisualization({
  routeData,
  selectedRouteIndex = 0,
  onRouteSelect,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current || !routeData) return;

    // Initialize map if not already done
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(
        [20.5937, 78.9629],
        5,
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Clear previous layers
    layersRef.current.forEach((layer) => map.removeLayer(layer));
    layersRef.current = [];

    // Add pickup marker (green)
    if (routeData.pickup) {
      const pickupIcon = L.icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const pickupMarker = L.marker(
        [routeData.pickup.latitude, routeData.pickup.longitude],
        { icon: pickupIcon },
      )
        .addTo(map)
        .bindPopup(
          `<b>Pickup</b><br>${routeData.pickup.address || "Pickup Location"}`,
        );

      layersRef.current.push(pickupMarker);
    }

    // Add drop marker (red)
    if (routeData.drop) {
      const dropIcon = L.icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const dropMarker = L.marker(
        [routeData.drop.latitude, routeData.drop.longitude],
        { icon: dropIcon },
      )
        .addTo(map)
        .bindPopup(
          `<b>Drop</b><br>${routeData.drop.address || "Drop Location"}`,
        );

      layersRef.current.push(dropMarker);
    }

    // Draw best route (blue, thicker)
    if (routeData.bestRoute && routeData.bestRoute.geometry) {
      const bestRouteCoords = routeData.bestRoute.geometry.map((coord) => [
        coord[1],
        coord[0],
      ]);

      const bestRouteLine = L.polyline(bestRouteCoords, {
        color: "#3B82F6",
        weight: selectedRouteIndex === 0 ? 6 : 4,
        opacity: 0.8,
      })
        .addTo(map)
        .bindPopup(
          `<b>Best Route</b><br>${routeData.bestRoute.summary}<br>Score: ${routeData.bestRoute.score.toFixed(2)}`,
        )
        .on("click", () => onRouteSelect && onRouteSelect(0));

      layersRef.current.push(bestRouteLine);
    }

    // Draw alternate routes (grey, thinner)
    if (routeData.alternateRoutes && routeData.alternateRoutes.length > 0) {
      routeData.alternateRoutes.forEach((route, index) => {
        if (route.geometry) {
          const routeCoords = route.geometry.map((coord) => [
            coord[1],
            coord[0],
          ]);
          const routeIndex = index + 1;

          const altRouteLine = L.polyline(routeCoords, {
            color: "#9CA3AF",
            weight: selectedRouteIndex === routeIndex ? 6 : 3,
            opacity: selectedRouteIndex === routeIndex ? 0.8 : 0.5,
            dashArray: "10, 10",
          })
            .addTo(map)
            .bindPopup(
              `<b>Alternate Route ${routeIndex}</b><br>${route.summary}<br>Score: ${route.score.toFixed(2)}`,
            )
            .on("click", () => onRouteSelect && onRouteSelect(routeIndex));

          layersRef.current.push(altRouteLine);
        }
      });
    }

    // Fit map to show all routes
    if (layersRef.current.length > 0) {
      const group = L.featureGroup(layersRef.current);
      map.fitBounds(group.getBounds().pad(0.1));
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [routeData, selectedRouteIndex, onRouteSelect]);

  if (!routeData) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
        No route data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        ref={mapRef}
        style={{ height: "500px", width: "100%" }}
        className="rounded-lg shadow-lg z-0"
      ></div>

      {/* Route Options Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Best Route Card */}
        <div
          onClick={() => onRouteSelect && onRouteSelect(0)}
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
            selectedRouteIndex === 0
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 bg-white hover:border-blue-300"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="font-semibold text-sm text-blue-700">
              Best Route
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {routeData.bestRoute?.duration?.toFixed(0)} min
          </div>
          <div className="text-sm text-gray-600">
            {routeData.bestRoute?.distance?.toFixed(1)} km
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Score: {routeData.bestRoute?.score?.toFixed(2)}
          </div>
        </div>

        {/* Alternate Route Cards */}
        {routeData.alternateRoutes?.map((route, index) => (
          <div
            key={index}
            onClick={() => onRouteSelect && onRouteSelect(index + 1)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedRouteIndex === index + 1
                ? "border-gray-500 bg-gray-50"
                : "border-gray-200 bg-white hover:border-gray-400"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="font-semibold text-sm text-gray-700">
                Alternate {index + 1}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {route.duration?.toFixed(0)} min
            </div>
            <div className="text-sm text-gray-600">
              {route.distance?.toFixed(1)} km
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Score: {route.score?.toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* ETA Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90">Estimated Time of Arrival</div>
            <div className="text-4xl font-bold mt-1">
              {routeData.estimatedTimeArrival?.toFixed(0)} min
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">Total Distance</div>
            <div className="text-3xl font-bold mt-1">
              {routeData.totalDistance?.toFixed(1)} km
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

RouteVisualization.propTypes = {
  routeData: PropTypes.shape({
    bestRoute: PropTypes.object,
    alternateRoutes: PropTypes.array,
    estimatedTimeArrival: PropTypes.number,
    totalDistance: PropTypes.number,
    pickup: PropTypes.object,
    drop: PropTypes.object,
  }),
  selectedRouteIndex: PropTypes.number,
  onRouteSelect: PropTypes.func,
};
