import { useEffect, useState, useCallback } from "react";
import MetricCard from "../MetricCard";
import DashboardLayout from "../Layout/DashboardLayout";
import {
  FaBook,
  FaPlayCircle,
  FaHistory,
  FaCar,
  FaPlusCircle,
  FaMapMarkerAlt,
  FaRoad,
  FaDollarSign,
  FaClock,
  FaTimesCircle,
  FaCheckCircle,
  FaBarcode,
  FaBroadcastTower,
  FaUserCheck,
  FaCarSide,
  FaStar,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import bookingService from "../../services/bookingService";
import { showToast } from "../Toast";

const normalizeStatus = (status) =>
  typeof status === "string" ? status.trim().toUpperCase() : "";

const ACTIVE_STATUSES = [
  "PENDING",
  "BROADCASTED",
  "CONFIRMED",
  "ACCEPTED",
  "ARRIVED",
  "IN_PROGRESS",
  "STARTED",
];

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-700",
    icon: FaClock,
  },
  BROADCASTED: {
    label: "Finding Driver",
    color: "bg-orange-100 text-orange-700",
    icon: FaBroadcastTower,
  },
  CONFIRMED: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-700",
    icon: FaCheckCircle,
  },
  ACCEPTED: {
    label: "Driver Assigned",
    color: "bg-indigo-100 text-indigo-700",
    icon: FaUserCheck,
  },
  ARRIVED: {
    label: "Driver Arrived",
    color: "bg-purple-100 text-purple-700",
    icon: FaMapMarkerAlt,
  },
  STARTED: {
    label: "In Progress",
    color: "bg-green-100 text-green-700",
    icon: FaCarSide,
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-green-100 text-green-700",
    icon: FaCarSide,
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-gray-100 text-gray-700",
    icon: FaCheckCircle,
  },
};

export default function CustomerDashboard() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const [ratingRide, setRatingRide] = useState(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const data = await bookingService.getUserBookings();
      setBookings(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      console.error("Failed to load customer bookings:", err);
      setError("Failed to load booking data");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 5000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  const cancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this ride?")) return;
    setCancelling(true);
    try {
      await bookingService.cancelBooking(bookingId, "Customer cancelled");
      fetchBookings();
    } catch (err) {
      console.error("Cancel error:", err);
    } finally {
      setCancelling(false);
    }
  };

  const openRatingModal = (ride) => {
    setRatingRide(ride);
    setSelectedRating(ride.customerRating || 0);
    setRatingFeedback(ride.customerFeedback || "");
  };

  const closeRatingModal = () => {
    if (submittingRating) return;
    setRatingRide(null);
    setSelectedRating(0);
    setRatingFeedback("");
  };

  const submitRating = async () => {
    if (!ratingRide || selectedRating < 1 || selectedRating > 5) return;
    setSubmittingRating(true);
    try {
      await bookingService.rateRide(
        ratingRide.id,
        selectedRating,
        ratingFeedback.trim(),
      );
      closeRatingModal();
      await fetchBookings();
    } catch (err) {
      console.error("Rate driver error:", err);
      showToast("Failed to submit rating. Please try again.", "error");
    } finally {
      setSubmittingRating(false);
    }
  };

  const normalizedBookings = bookings.map((b) => ({
    ...b,
    status: normalizeStatus(b.status),
  }));

  const totalBookings = normalizedBookings.length;
  const activeBookings = normalizedBookings.filter((b) =>
    ACTIVE_STATUSES.includes(b.status),
  );
  const completedBookings = normalizedBookings.filter(
    (b) => b.status === "COMPLETED",
  );

  const sortedActive = activeBookings
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const activeRide = sortedActive[0] || null;

  const recentRides = completedBookings
    .slice()
    .sort(
      (a, b) =>
        new Date(b.pickupTime || b.createdAt) -
        new Date(a.pickupTime || a.createdAt),
    )
    .slice(0, 5);

  if (loading) {
    return (
      <DashboardLayout title="Customer Dashboard">
        <p className="p-6 text-gray-500">Loading dashboard...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Customer Dashboard">
      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Total Bookings"
            value={totalBookings}
            icon={<FaBook />}
            color="bg-blue-600"
          />
          <MetricCard
            title="Active Booking"
            value={activeBookings.length}
            color="bg-green-600"
            icon={<FaPlayCircle />}
          />
          <MetricCard
            title="Ride History"
            value={completedBookings.length}
            color="bg-purple-600"
            icon={<FaHistory />}
          />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FaPlayCircle className="text-green-600" /> Active Ride
            </h2>
            {activeRide && (() => {
              const cfg = STATUS_CONFIG[activeRide.status] || STATUS_CONFIG.PENDING;
              const Icon = cfg.icon;
              return (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${cfg.color}`}
                >
                  <Icon className="text-xs" /> {cfg.label}
                </span>
              );
            })()}
          </div>

          <div className="p-6">
            {error ? (
              <p className="text-red-500 text-sm">{error}</p>
            ) : activeRide ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  {activeRide.bookingCode && (
                    <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-mono">
                      <FaBarcode className="text-xs" /> {activeRide.bookingCode}
                    </span>
                  )}
                  {activeRide.requestedVehicleType && (
                    <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                      <FaCar className="text-xs" /> {activeRide.requestedVehicleType}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {activeRide.distanceKm != null && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <FaRoad className="mx-auto text-indigo-500 mb-1" />
                      <p className="text-xs text-gray-500">Distance</p>
                      <p className="text-gray-900 font-bold">{activeRide.distanceKm} km</p>
                    </div>
                  )}
                  {activeRide.totalCost != null && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <FaDollarSign className="mx-auto text-green-500 mb-1" />
                      <p className="text-xs text-gray-500">Fare</p>
                      <p className="text-green-600 font-bold">{"\u20B9"}{activeRide.totalCost}</p>
                    </div>
                  )}
                  {activeRide.driverName && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <FaUserCheck className="mx-auto text-blue-500 mb-1" />
                      <p className="text-xs text-gray-500">Driver</p>
                      <p className="text-gray-900 font-semibold text-xs">{activeRide.driverName}</p>
                    </div>
                  )}
                  {activeRide.acceptedAt && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <FaClock className="mx-auto text-purple-500 mb-1" />
                      <p className="text-xs text-gray-500">Accepted At</p>
                      <p className="text-gray-900 font-semibold text-xs">
                        {new Date(activeRide.acceptedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  )}
                </div>

                {["PENDING", "BROADCASTED", "CONFIRMED", "ACCEPTED", "ARRIVED"].includes(activeRide.status) && (
                  <div className="pt-2">
                    <button
                      onClick={() => cancelBooking(activeRide.id)}
                      disabled={cancelling}
                      className="flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 px-5 py-2.5 rounded-xl hover:bg-red-100 transition-colors font-medium w-full"
                    >
                      <FaTimesCircle /> {cancelling ? "Cancelling..." : "Cancel Ride"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <FaCar className="mx-auto text-4xl text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No active booking</p>
                <p className="text-gray-400 text-sm mt-1">Book a ride to get started</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              onClick={() => navigate("/customer/book")}
              className="cursor-pointer bg-indigo-600 text-white p-6 rounded-lg shadow hover:scale-105 transition"
            >
              <FaPlusCircle className="text-3xl mb-3" />
              <h3 className="text-lg font-semibold">Book a Ride</h3>
              <p className="text-sm opacity-90">Request a new ride instantly</p>
            </div>

            <div className="bg-gray-700 text-white p-6 rounded-lg shadow">
              <FaCar className="text-3xl mb-3" />
              <h3 className="text-lg font-semibold">Ride History</h3>
              <p className="text-sm opacity-90">View completed rides below</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Rides</h2>

          {recentRides.length === 0 ? (
            <p className="text-gray-500">No completed rides yet</p>
          ) : (
            <ul className="space-y-3">
              {recentRides.map((ride) => (
                <li
                  key={ride.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm border-b pb-2 gap-2"
                >
                  <span>
                    {new Date(ride.pickupTime || ride.createdAt).toLocaleDateString()} - {ride.pickupAddress || "N/A"} {"->"} {ride.dropAddress || "N/A"}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-green-600">{ride.status}</span>
                    {ride.customerRating ? (
                      <span className="inline-flex items-center gap-1 text-amber-500 font-medium">
                        <FaStar /> {ride.customerRating}/5
                      </span>
                    ) : (
                      <button
                        onClick={() => openRatingModal(ride)}
                        className="px-3 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                      >
                        Rate Driver
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {ratingRide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={closeRatingModal}
        >
          <div
            className="bg-white rounded-xl w-full max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">Rate Your Driver</h3>
            <p className="text-sm text-gray-600">
              Ride: {ratingRide.pickupAddress || "N/A"} {"->"} {ratingRide.dropAddress || "N/A"}
            </p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedRating(star)}
                  className={`text-2xl ${star <= selectedRating ? "text-amber-500" : "text-gray-300"}`}
                  disabled={submittingRating}
                >
                  <FaStar />
                </button>
              ))}
            </div>
            <textarea
              value={ratingFeedback}
              onChange={(e) => setRatingFeedback(e.target.value)}
              rows={3}
              placeholder="Share feedback (optional)"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              disabled={submittingRating}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={closeRatingModal}
                className="px-4 py-2 rounded-lg border"
                disabled={submittingRating}
              >
                Cancel
              </button>
              <button
                onClick={submitRating}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:bg-gray-400"
                disabled={submittingRating || selectedRating < 1}
              >
                {submittingRating ? "Submitting..." : "Submit Rating"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
