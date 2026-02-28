import { useState, useEffect } from "react";
import { apiFetch } from "../api/api";
import api from "../services/api";
import { showToast } from "./Toast";

export default function DriverRideRequests() {
  const [pendingRides, setPendingRides] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vehicleType, setVehicleType] = useState("SEDAN");
  const [driverProfile, setDriverProfile] = useState(null);

  // Fetch driver profile to get their vehicle type
  useEffect(() => {
    const fetchDriverProfile = async () => {
      try {
        const res = await api.get("/v1/driver/profile");
        if (res.data) {
          setDriverProfile(res.data);
          // Set the vehicle type from driver's profile if available
          if (res.data.vehicle?.type) {
            setVehicleType(res.data.vehicle.type);
          }
        }
      } catch (error) {
        console.error("Failed to fetch driver profile:", error);
      }
    };

    fetchDriverProfile();
  }, []);

  useEffect(() => {
    fetchRides();
    const interval = setInterval(fetchRides, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [vehicleType]);

  const fetchRides = async () => {
    try {
      // Fetch pending rides
      const pendingRes = await apiFetch(
        `/api/rides/pending?vehicleType=${vehicleType}`,
      );
      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPendingRides(Array.isArray(pendingData) ? pendingData : []);
      } else {
        console.error("Failed to fetch pending rides:", pendingRes.status);
        setPendingRides([]);
      }

      // Fetch active ride
      const activeRes = await apiFetch("/api/rides/active");
      if (activeRes.ok) {
        const activeData = await activeRes.json();
        setActiveRide(activeData);
      } else if (activeRes.status === 204) {
        setActiveRide(null);
      } else {
        console.error("Failed to fetch active ride:", activeRes.status);
        setActiveRide(null);
      }
    } catch (error) {
      console.error("Error fetching rides:", error);
      setPendingRides([]);
      setActiveRide(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRide = async (bookingId) => {
    try {
      const res = await apiFetch(`/api/rides/${bookingId}/accept`, {
        method: "PUT",
      });

      if (res.ok) {
        const data = await res.json();
        setActiveRide(data);
        await fetchRides();
        showToast("Ride accepted successfully!", "success");
      } else {
        const error = await res.json();
        showToast(error.message || "Failed to accept ride", "error");
      }
    } catch (error) {
      console.error("Error accepting ride:", error);
      showToast("Error accepting ride", "error");
    }
  };

  const handleStartRide = async () => {
    if (!activeRide) return;

    try {
      const res = await apiFetch(`/api/rides/${activeRide.id}/start`, {
        method: "PUT",
      });

      if (res.ok) {
        const data = await res.json();
        setActiveRide(data);
        showToast("Ride started!", "success");
      } else {
        const error = await res.json();
        showToast(error.message || "Failed to start ride", "error");
      }
    } catch (error) {
      console.error("Error starting ride:", error);
      showToast("Error starting ride", "error");
    }
  };

  const handleCompleteRide = async () => {
    if (!activeRide) return;

    try {
      const res = await apiFetch(`/api/rides/${activeRide.id}/complete`, {
        method: "PUT",
      });

      if (res.ok) {
        await fetchRides();
        showToast("Ride completed successfully!", "success");
      } else {
        const error = await res.json();
        showToast(error.message || "Failed to complete ride", "error");
      }
    } catch (error) {
      console.error("Error completing ride:", error);
      showToast("Error completing ride", "error");
    }
  };

  const handleCancelRide = async (bookingId) => {
    const reason = prompt("Please provide a reason for cancellation:");
    if (!reason) return;

    try {
      const res = await apiFetch(`/api/rides/${bookingId}/cancel`, {
        method: "PUT",
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        await fetchRides();
        showToast("Ride cancelled", "success");
      } else {
        const error = await res.json();
        showToast(error.message || "Failed to cancel ride", "error");
      }
    } catch (error) {
      console.error("Error cancelling ride:", error);
      showToast("Error cancelling ride", "error");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { bg: "bg-gray-100", text: "text-gray-800", label: "Pending" },
      BROADCASTED: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        label: "Available",
      },
      ACCEPTED: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Accepted",
      },
      ARRIVED: {
        bg: "bg-purple-100",
        text: "text-purple-800",
        label: "Arrived",
      },
      STARTED: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "In Progress",
      },
      COMPLETED: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Completed",
      },
    };

    const badge = badges[status] || badges.PENDING;
    return (
      <span
        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Ride Section */}
      {activeRide && (
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-green-500">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Current Ride</h2>
            {getStatusBadge(activeRide.status)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">
                Customer Details
              </h3>
              <p className="text-gray-600">Name: {activeRide.customerName}</p>
              <p className="text-gray-600">Phone: {activeRide.customerPhone}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Ride Details</h3>
              <p className="text-gray-600">
                Booking Code: {activeRide.bookingCode}
              </p>
              <p className="text-gray-600">
                Vehicle Type: {activeRide.vehicleType}
              </p>
              <p className="text-gray-600">
                Passengers: {activeRide.passengerCount || 1}
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-24 text-sm font-medium text-gray-600">
                Pickup:
              </div>
              <div className="flex-1">
                <p className="text-gray-800">{activeRide.pickupAddress}</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-24 text-sm font-medium text-gray-600">
                Drop:
              </div>
              <div className="flex-1">
                <p className="text-gray-800">{activeRide.dropAddress}</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-24 text-sm font-medium text-gray-600">
                Fare:
              </div>
              <div className="flex-1">
                <p className="text-gray-800 font-semibold">
                  ₹{activeRide.estimatedCost}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {activeRide.status === "ACCEPTED" && (
              <button
                onClick={handleStartRide}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Start Ride
              </button>
            )}

            {activeRide.status === "STARTED" && (
              <button
                onClick={handleCompleteRide}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Complete Ride
              </button>
            )}

            {(activeRide.status === "ACCEPTED" ||
              activeRide.status === "ARRIVED") && (
              <button
                onClick={() => handleCancelRide(activeRide.id)}
                className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pending Rides Section */}
      {!activeRide && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              New Ride Requests
            </h2>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="SEDAN">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="HATCHBACK">Hatchback</option>
              <option value="LUXURY">Luxury</option>
            </select>
          </div>

          {pendingRides.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="mx-auto h-16 w-16 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-lg">No pending ride requests at the moment</p>
              <p className="text-sm mt-2">
                New requests will appear here automatically
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRides.map((ride) => (
                <div
                  key={ride.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-lg text-gray-800">
                        {ride.bookingCode}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(ride.pickupTime).toLocaleString()}
                      </p>
                    </div>
                    {getStatusBadge(ride.status)}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start">
                      <span className="text-green-600 mr-2">📍</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">
                          Pickup
                        </p>
                        <p className="text-gray-800">{ride.pickupAddress}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <span className="text-red-600 mr-2">📍</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">
                          Drop
                        </p>
                        <p className="text-gray-800">{ride.dropAddress}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Fare:</span> ₹
                      {ride.estimatedCost}
                      {ride.passengerCount && (
                        <span className="ml-4">
                          <span className="font-medium">Passengers:</span>{" "}
                          {ride.passengerCount}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAcceptRide(ride.id)}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                      Accept Ride
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
