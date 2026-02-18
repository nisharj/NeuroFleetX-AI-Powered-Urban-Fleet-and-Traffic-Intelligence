import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../api/api";
import {
  FaCar,
  FaMapMarkerAlt,
  FaClock,
  FaUsers,
  FaDollarSign,
  FaRoad,
  FaBroadcastTower,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

// ================= RIDE TYPE TABS =================
const RIDE_TYPES = {
  ALL: { label: "All", icon: <FaCar className="text-xs" /> },
  RIDE_HAILING: {
    label: "Ride Hailing",
    icon: <FaBroadcastTower className="text-xs" />,
  },
  SCHEDULED: {
    label: "Scheduled",
    icon: <FaCalendarAlt className="text-xs" />,
  },
  HOURLY: { label: "Hourly", icon: <FaClock className="text-xs" /> },
};

export default function DriverPendingRides({
  onAction,
  vehicleStatus,
  hasActiveRide,
  isApproved,
}) {
  const [rideHailingRides, setRideHailingRides] = useState([]);
  const [bookingRides, setBookingRides] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  // Determine if driver can accept rides
  const canAcceptRides =
    isApproved && vehicleStatus === "AVAILABLE" && !hasActiveRide;
  const unavailableReason = !isApproved
    ? "Your profile is not approved yet. Complete your vehicle details and wait for admin approval."
    : hasActiveRide
      ? "You already have an active ride. Complete it before accepting a new one."
      : vehicleStatus && vehicleStatus !== "AVAILABLE"
        ? `Your vehicle is currently ${vehicleStatus.replace("_", " ").toLowerCase()}. Complete your current ride to accept new requests.`
        : null;

  const showToast = (message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ================= LOAD PENDING RIDES =================
  const loadPendingRides = useCallback(async () => {
    try {
      // Fetch ride-hailing pending rides
      const [rideHailingRes, bookingRes] = await Promise.all([
        apiFetch("/api/bookings/driver/pending").catch(() => null),
        apiFetch("/api/rides/pending?vehicleType=").catch(() => null),
      ]);

      // Parse ride-hailing bookings
      if (rideHailingRes && rideHailingRes.ok) {
        const data = await rideHailingRes.json();
        const rides = (Array.isArray(data) ? data : []).map((r) => ({
          ...r,
          _rideType: classifyBookingType(
            r.bookingType || r.requestedVehicleType,
            r,
          ),
          _source: "booking",
        }));
        setRideHailingRides(rides);
      } else {
        setRideHailingRides([]);
      }

      // Parse ride lifecycle pending rides
      if (bookingRes && bookingRes.ok) {
        const data = await bookingRes.json();
        const rides = (Array.isArray(data) ? data : []).map((r) => ({
          ...r,
          id: r.bookingId || r.id,
          _rideType: "RIDE_HAILING",
          _source: "lifecycle",
        }));
        setBookingRides(rides);
      } else {
        setBookingRides([]);
      }

      setError("");
    } catch (err) {
      console.error("Pending rides error:", err);
      setError("Unable to load pending ride requests");
      setRideHailingRides([]);
      setBookingRides([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Classify booking type
  function classifyBookingType(type, ride) {
    if (!type) {
      // Infer from fields
      if (ride.estimatedHours && parseFloat(ride.estimatedHours) > 0)
        return "HOURLY";
      if (ride.pickupTime) {
        const pickupDate = new Date(ride.pickupTime);
        const now = new Date();
        if (pickupDate.getTime() - now.getTime() > 5 * 60 * 1000)
          return "SCHEDULED";
      }
      return "RIDE_HAILING";
    }
    const normalized = type.toLowerCase();
    if (normalized === "schedule" || normalized === "scheduled")
      return "SCHEDULED";
    if (normalized === "hourly") return "HOURLY";
    return "RIDE_HAILING";
  }

  // ================= ACTIONS =================
  const acceptRide = async (ride) => {
    if (!canAcceptRides) {
      showToast(unavailableReason || "Cannot accept rides right now", "error");
      return;
    }
    setActionLoading(ride.id);
    try {
      let res;
      if (ride._source === "lifecycle") {
        res = await apiFetch(`/api/rides/${ride.id}/accept`, { method: "PUT" });
      } else {
        res = await apiFetch(`/api/bookings/${ride.id}/accept`, {
          method: "POST",
        });
      }
      if (res && !res.ok) {
        const body = await res.json().catch(() => ({}));
        let msg =
          body.message || body.error || `Failed to accept (${res.status})`;
        // Provide clearer messages for common error codes
        if (res.status === 409) {
          if (msg.toLowerCase().includes("vehicle not available")) {
            msg =
              "Your vehicle is not available. Complete your current ride first.";
          } else if (msg.toLowerCase().includes("already in active ride")) {
            msg =
              "You already have an active ride. Complete it before accepting another.";
          } else if (msg.toLowerCase().includes("already has a vehicle")) {
            msg = "This ride has already been taken by another driver.";
          }
        }
        showToast(msg, "error");
        loadPendingRides();
        return;
      }
      showToast("Ride accepted successfully!", "success");
      loadPendingRides();
      onAction?.();
    } catch (err) {
      console.error("Accept ride error:", err);
      showToast("Failed to accept ride. Please try again.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const rejectRide = async (ride) => {
    setActionLoading(ride.id);
    try {
      let res;
      if (ride._source === "lifecycle") {
        res = await apiFetch(`/api/rides/${ride.id}/cancel`, {
          method: "PUT",
          body: JSON.stringify({ reason: "Driver rejected" }),
        });
      } else {
        res = await apiFetch(`/api/bookings/${ride.id}/cancel`, {
          method: "POST",
          body: JSON.stringify({ reason: "Driver rejected" }),
        });
      }
      if (res && !res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
          body.message || body.error || `Failed to reject (${res.status})`;
        showToast(msg, "error");
        loadPendingRides();
        return;
      }
      showToast("Ride rejected.", "success");
      loadPendingRides();
    } catch (err) {
      console.error("Reject ride error:", err);
      showToast("Failed to reject ride. Please try again.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // ================= INIT + POLLING =================
  useEffect(() => {
    loadPendingRides();
    const interval = setInterval(loadPendingRides, 5000);
    return () => clearInterval(interval);
  }, [loadPendingRides]);

  // ================= MERGE & FILTER RIDES =================
  // Deduplicate by id, prefer booking source
  const allRides = (() => {
    const map = new Map();
    rideHailingRides.forEach((r) => map.set(r.id, r));
    bookingRides.forEach((r) => {
      if (!map.has(r.id)) map.set(r.id, r);
    });
    return Array.from(map.values());
  })();

  const filteredRides =
    activeTab === "ALL"
      ? allRides
      : allRides.filter((r) => r._rideType === activeTab);

  // Count by type
  const rideCountByType = {};
  allRides.forEach((r) => {
    rideCountByType[r._rideType] = (rideCountByType[r._rideType] || 0) + 1;
  });

  // ================= STATUS BADGE =================
  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { bg: "bg-gray-100", text: "text-gray-700", label: "Pending" },
      BROADCASTED: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "Broadcasted",
      },
      CONFIRMED: {
        bg: "bg-indigo-100",
        text: "text-indigo-700",
        label: "Confirmed",
      },
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
  };

  // ================= TYPE BADGE =================
  const getTypeBadge = (type) => {
    const badges = {
      RIDE_HAILING: {
        bg: "bg-purple-100",
        text: "text-purple-700",
        icon: <FaBroadcastTower className="text-xs" />,
        label: "Ride Hailing",
      },
      SCHEDULED: {
        bg: "bg-orange-100",
        text: "text-orange-700",
        icon: <FaCalendarAlt className="text-xs" />,
        label: "Scheduled",
      },
      HOURLY: {
        bg: "bg-teal-100",
        text: "text-teal-700",
        icon: <FaClock className="text-xs" />,
        label: "Hourly",
      },
    };
    const badge = badges[type] || badges.RIDE_HAILING;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
      >
        {badge.icon} {badge.label}
      </span>
    );
  };

  // ================= UI =================
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-500">Loading pending rides...</span>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-sm">{error}</p>;
  }

  return (
    <div className="space-y-4">
      {/* ============ TYPE TABS ============ */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(RIDE_TYPES).map(([key, { label, icon }]) => {
          const count =
            key === "ALL" ? allRides.length : rideCountByType[key] || 0;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === key
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {icon}
              {label}
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === key
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ============ UNAVAILABILITY BANNER ============ */}
      {!canAcceptRides && unavailableReason && allRides.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <FaCar className="text-amber-500 text-lg flex-shrink-0" />
          <p className="text-amber-700 text-sm font-medium">
            {unavailableReason}
          </p>
        </div>
      )}

      {/* ============ RIDES LIST ============ */}
      {filteredRides.length === 0 ? (
        <div className="text-center py-10">
          <FaCar className="mx-auto text-4xl text-gray-300 mb-3" />
          <p className="text-gray-500">
            No{" "}
            {activeTab === "ALL"
              ? ""
              : RIDE_TYPES[activeTab]?.label.toLowerCase() + " "}
            pending ride requests.
          </p>
          <p className="text-gray-400 text-sm mt-1">
            New requests will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRides.map((ride) => (
            <div
              key={`${ride._source}-${ride.id}`}
              className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200 bg-white"
            >
              {/* Header Row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {ride.bookingCode && (
                    <span className="font-semibold text-gray-800">
                      {ride.bookingCode}
                    </span>
                  )}
                  {getTypeBadge(ride._rideType)}
                  {getStatusBadge(ride.status)}
                </div>
                {(ride.totalCost || ride.estimatedCost || ride.fare) && (
                  <div className="flex items-center gap-1 text-green-600 font-bold text-lg">
                    <FaDollarSign className="text-sm" />₹
                    {ride.totalCost || ride.estimatedCost || ride.fare}
                  </div>
                )}
              </div>

              {/* Location Info */}
              <div className="space-y-2 mb-3">
                <div className="flex items-start gap-2">
                  <FaMapMarkerAlt className="text-green-500 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium">Pickup</p>
                    <p className="text-gray-800 text-sm truncate">
                      {ride.pickupAddress || ride.pickup || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FaMapMarkerAlt className="text-red-500 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium">Drop</p>
                    <p className="text-gray-800 text-sm truncate">
                      {ride.dropAddress ||
                        ride.drop ||
                        ride.dropLocation ||
                        "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Details Row */}
              <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-3">
                {ride.requestedVehicleType && (
                  <span className="flex items-center gap-1">
                    <FaCar className="text-gray-400" />
                    {ride.requestedVehicleType || ride.vehicleType}
                  </span>
                )}
                {(ride.passengerCount || ride.passengerCount === 0) && (
                  <span className="flex items-center gap-1">
                    <FaUsers className="text-gray-400" />
                    {ride.passengerCount} passengers
                  </span>
                )}
                {ride.distanceKm && (
                  <span className="flex items-center gap-1">
                    <FaRoad className="text-gray-400" />
                    {ride.distanceKm} km
                  </span>
                )}
                {ride.pickupTime && (
                  <span className="flex items-center gap-1">
                    <FaClock className="text-gray-400" />
                    {new Date(ride.pickupTime).toLocaleString()}
                  </span>
                )}
                {ride.estimatedHours && parseFloat(ride.estimatedHours) > 0 && (
                  <span className="flex items-center gap-1">
                    <FaClock className="text-gray-400" />
                    {ride.estimatedHours} hrs
                  </span>
                )}
              </div>

              {/* Customer Info (if available) */}
              {(ride.customerName || ride.driverName) && (
                <div className="text-xs text-gray-400 mb-3">
                  {ride.customerName && (
                    <span>Customer: {ride.customerName}</span>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  onClick={() => acceptRide(ride)}
                  disabled={actionLoading === ride.id || !canAcceptRides}
                  title={
                    !canAcceptRides ? unavailableReason : "Accept this ride"
                  }
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                    canAcceptRides
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <FaCheckCircle />
                  {actionLoading === ride.id ? "Accepting..." : "Accept"}
                </button>
                <button
                  onClick={() => rejectRide(ride)}
                  disabled={actionLoading === ride.id}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaTimesCircle />
                  {actionLoading === ride.id ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div
            className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
              toast.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <FaCheckCircle className="text-lg flex-shrink-0" />
            ) : (
              <FaTimesCircle className="text-lg flex-shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
