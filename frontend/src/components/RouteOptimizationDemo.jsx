import { useState } from "react";
import RouteVisualization from "./RouteVisualization";
import { apiFetch } from "../api/api";

/**
 * RouteOptimizationDemo - Demonstrates AI Route Optimization
 * Shows best route and alternatives with ETA
 */
export default function RouteOptimizationDemo() {
  const [pickup, setPickup] = useState({
    latitude: 28.6139,
    longitude: 77.209,
    address: "New Delhi, India",
  });

  const [drop, setDrop] = useState({
    latitude: 28.5355,
    longitude: 77.391,
    address: "Noida, UP, India",
  });

  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  const fetchOptimizedRoutes = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch("/api/routes/optimize", {
        method: "POST",
        body: JSON.stringify({
          pickupLatitude: pickup.latitude,
          pickupLongitude: pickup.longitude,
          dropLatitude: drop.latitude,
          dropLongitude: drop.longitude,
          pickupAddress: pickup.address,
          dropAddress: drop.address,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch routes");
      }

      const data = await response.json();
      setRouteData(data);
      setSelectedRouteIndex(0);
    } catch (err) {
      console.error("Error fetching routes:", err);
      setError(err.message || "Failed to optimize routes");
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSelect = (index) => {
    setSelectedRouteIndex(index);
  };

  const presetLocations = [
    {
      name: "Delhi to Noida",
      pickup: {
        latitude: 28.6139,
        longitude: 77.209,
        address: "New Delhi, India",
      },
      drop: {
        latitude: 28.5355,
        longitude: 77.391,
        address: "Noida, UP, India",
      },
    },
    {
      name: "Mumbai to Pune",
      pickup: {
        latitude: 19.076,
        longitude: 72.8777,
        address: "Mumbai, Maharashtra",
      },
      drop: {
        latitude: 18.5204,
        longitude: 73.8567,
        address: "Pune, Maharashtra",
      },
    },
    {
      name: "Bangalore Center to Airport",
      pickup: {
        latitude: 12.9716,
        longitude: 77.5946,
        address: "Bangalore, Karnataka",
      },
      drop: {
        latitude: 13.1986,
        longitude: 77.7066,
        address: "Bangalore Airport",
      },
    },
  ];

  const loadPreset = (preset) => {
    setPickup(preset.pickup);
    setDrop(preset.drop);
    setRouteData(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-2">
          🚗 AI Route Optimization Engine
        </h2>
        <p className="text-blue-100">
          Get the best route with alternatives, ETA prediction, and optimal
          driver assignment
        </p>
      </div>

      {/* Preset Locations */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">
          Quick Presets:
        </h3>
        <div className="flex gap-3 flex-wrap">
          {presetLocations.map((preset, index) => (
            <button
              key={index}
              onClick={() => loadPreset(preset)}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Location Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pickup */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-green-700 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            Pickup Location
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Address"
              value={pickup.address}
              onChange={(e) =>
                setPickup({ ...pickup, address: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="0.0001"
                placeholder="Latitude"
                value={pickup.latitude}
                onChange={(e) =>
                  setPickup({ ...pickup, latitude: parseFloat(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="number"
                step="0.0001"
                placeholder="Longitude"
                value={pickup.longitude}
                onChange={(e) =>
                  setPickup({
                    ...pickup,
                    longitude: parseFloat(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Drop */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-red-700 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            Drop Location
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Address"
              value={drop.address}
              onChange={(e) => setDrop({ ...drop, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="0.0001"
                placeholder="Latitude"
                value={drop.latitude}
                onChange={(e) =>
                  setDrop({ ...drop, latitude: parseFloat(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
              <input
                type="number"
                step="0.0001"
                placeholder="Longitude"
                value={drop.longitude}
                onChange={(e) =>
                  setDrop({ ...drop, longitude: parseFloat(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Optimize Button */}
      <div className="flex justify-center">
        <button
          onClick={fetchOptimizedRoutes}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "🔄 Optimizing Routes..." : "🚀 Optimize Route"}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-800 font-medium">⚠️ {error}</p>
        </div>
      )}

      {/* Route Visualization */}
      {routeData && (
        <div className="animate-fadeIn">
          <RouteVisualization
            routeData={routeData}
            selectedRouteIndex={selectedRouteIndex}
            onRouteSelect={handleRouteSelect}
          />
        </div>
      )}

      {/* Feature Explanation */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">✨ Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">
              📍 Route Scoring
            </h4>
            <p className="text-sm text-blue-700">
              Score = (duration × 0.6) + (distance × 0.3) + (traffic × 0.1)
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">
              🚗 Driver Assignment
            </h4>
            <p className="text-sm text-green-700">
              Score = distance_to_pickup + (active_rides × 2)
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">
              ⚡ Real-time Updates
            </h4>
            using
            <p className="text-sm text-purple-700">
              Live ride status updates every 10 seconds via polling
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
