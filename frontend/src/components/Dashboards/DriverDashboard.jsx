import { useEffect, useState, useCallback } from "react";
import MetricCard from "../MetricCard";
import DashboardLayout from "../Layout/DashboardLayout.jsx";
import { apiFetch } from "../../api/api";
import {
  FaClipboardCheck,
  FaCheckCircle,
  FaCarSide,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaIdCard,
  FaMapMarkerAlt,
  FaCar,
  FaGasPump,
  FaChair,
  FaDollarSign,
  FaBarcode,
  FaTimes,
  FaChevronRight,
  FaClock,
  FaRoad,
  FaUsers,
  FaRoute,
  FaBroadcastTower,
} from "react-icons/fa";

import DriverPendingRides from "../DriverPendingRides";
import DriverVehicleDetailsForm from "../DriverVehicleDetailsForm";

export default function DriverDashboard() {
  // ================= STATE =================
  const [metrics, setMetrics] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);

  const [metricsError, setMetricsError] = useState("");
  const [activeRideError, setActiveRideError] = useState("");
  const [driverInfoError, setDriverInfoError] = useState("");

  const [loading, setLoading] = useState(true);
  const [showDriverModal, setShowDriverModal] = useState(false);

  // ================= LOAD METRICS =================
  const loadMetrics = useCallback(async () => {
    try {
      // TODO: Replace with actual backend endpoint when available
      // For now using mock data
      setMetrics({
        assignedTrips: 0,
        completedTrips: 0,
        vehicleStatus: "Active",
      });
      setMetricsError("");
    } catch {
      setMetricsError("Unable to load metrics");
    }
  }, []);

  // ================= LOAD ACTIVE RIDE =================
  const loadActiveRide = useCallback(async () => {
    try {
      const res = await apiFetch("/api/bookings/driver/active");

      // API reachable → clear error
      setActiveRideError("");

      if (!res || !res.ok) {
        throw new Error("Active ride API failed");
      }

      const text = await res.text();

      // 👇 IMPORTANT: empty response = no active ride
      if (!text) {
        setActiveRide(null);
        return;
      }

      const data = JSON.parse(text);
      setActiveRide(data || null);
    } catch (err) {
      console.error("Active ride error:", err);
      setActiveRide(null);
      setActiveRideError("Unable to load active ride");
    }
  }, []);

  // ================= LOAD DRIVER INFO =================
  const loadDriverInfo = useCallback(async () => {
    try {
      const res = await apiFetch("/api/user/me");
      if (res && res.ok) {
        const data = await res.json();
        setDriverInfo(data);
        setDriverInfoError("");
      } else {
        throw new Error("Failed to load driver info");
      }
    } catch (err) {
      console.error("Driver info error:", err);
      setDriverInfoError("Unable to load driver details");
    }
  }, []);

  // ================= ACTIONS =================
  const markArrived = async () => {
    await apiFetch(`/api/bookings/${activeRide.id}/arrived`, {
      method: "POST",
    });
    loadActiveRide();
    loadMetrics();
  };

  const startRide = async () => {
    await apiFetch(`/api/bookings/${activeRide.id}/start`, {
      method: "POST",
    });
    loadActiveRide();
    loadMetrics();
  };

  const completeRide = async () => {
    await apiFetch(`/api/bookings/${activeRide.id}/complete`, {
      method: "POST",
    });
    loadActiveRide();
    loadMetrics();
  };

  // ================= INIT + POLLING =================
  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([loadMetrics(), loadActiveRide(), loadDriverInfo()]);
      setLoading(false);
    };

    loadAll();
    const interval = setInterval(loadAll, 5000);
    return () => clearInterval(interval);
  }, [loadMetrics, loadActiveRide, loadDriverInfo]);

  // ================= LOADING STATE =================
  if (loading) {
    return (
      <DashboardLayout title="Driver Dashboard">
        <p className="p-6 text-gray-500">Loading dashboard...</p>
      </DashboardLayout>
    );
  }

  // ================= UI =================
  return (
    <DashboardLayout title="Driver Dashboard">
      <div className="p-6 space-y-8">
        {/* ================= METRICS ================= */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Overview</h2>

          {metricsError ? (
            <p className="text-red-500 text-sm">{metricsError}</p>
          ) : metrics ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Assigned Trips"
                value={metrics.assignedTrips}
                color="bg-blue-600"
                icon={<FaClipboardCheck />}
              />
              <MetricCard
                title="Completed Trips"
                value={metrics.completedTrips}
                color="bg-green-600"
                icon={<FaCheckCircle />}
              />
              <MetricCard
                title="Vehicle Status"
                value={metrics.vehicleStatus}
                color="bg-purple-600"
                icon={<FaCarSide />}
              />
            </div>
          ) : null}
        </div>

        {/* ================= DRIVER DETAIL CARD (Clickable) ================= */}
        {driverInfoError ? (
          <div
            className="bg-white rounded-lg shadow overflow-hidden p-5"
            style={{ borderLeft: "4px solid #ef4444" }}
          >
            <p className="text-red-500 text-sm">{driverInfoError}</p>
          </div>
        ) : !driverInfo ? (
          <div
            className="bg-white rounded-lg shadow overflow-hidden p-5"
            style={{ borderLeft: "4px solid #4f46e5" }}
          >
            <p className="text-gray-400 text-sm">Loading driver details...</p>
          </div>
        ) : driverInfo.approvalStatus === "APPROVED" && driverInfo.vehicle ? (
          /* ---- APPROVED: show compact card ---- */
          <div
            onClick={() => setShowDriverModal(true)}
            className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
            style={{ borderLeft: "4px solid #4f46e5" }}
          >
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow">
                  {(driverInfo.name || "D").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {driverInfo.name || "Driver"}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <FaEnvelope className="text-xs" /> {driverInfo.email || "—"}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <FaPhone className="text-xs" />{" "}
                    {driverInfo.phone || "Not provided"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium">
                  <FaCheckCircle className="text-xs" /> Approved
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium">
                  <FaCar className="text-xs" />
                  {driverInfo.vehicle.name ||
                    driverInfo.vehicle.model ||
                    "Vehicle"}
                  <span
                    className={`ml-2 inline-block w-2 h-2 rounded-full ${
                      driverInfo.vehicle.status === "AVAILABLE"
                        ? "bg-green-500"
                        : driverInfo.vehicle.status === "BOOKED"
                          ? "bg-blue-500"
                          : driverInfo.vehicle.status === "IN_USE"
                            ? "bg-yellow-500"
                            : "bg-gray-400"
                    }`}
                  />
                </div>
                <FaChevronRight className="text-gray-400 text-lg" />
              </div>
            </div>
          </div>
        ) : (
          /* ---- NOT APPROVED: show prompt card + form ---- */
          <div className="space-y-4">
            <div
              onClick={() => setShowDriverModal(true)}
              className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
              style={{
                borderLeft: `4px solid ${
                  driverInfo.approvalStatus === "PENDING_APPROVAL"
                    ? "#eab308"
                    : driverInfo.approvalStatus === "REJECTED"
                      ? "#ef4444"
                      : "#3b82f6"
                }`,
              }}
            >
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow">
                    {(driverInfo.name || "D").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {driverInfo.name || "Driver"}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <FaEnvelope className="text-xs" />{" "}
                      {driverInfo.email || "—"}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <FaPhone className="text-xs" />{" "}
                      {driverInfo.phone || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                      driverInfo.approvalStatus === "PENDING_APPROVAL"
                        ? "bg-yellow-50 text-yellow-700"
                        : driverInfo.approvalStatus === "REJECTED"
                          ? "bg-red-50 text-red-700"
                          : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {driverInfo.approvalStatus === "PENDING_APPROVAL"
                      ? "⏳ Pending Approval"
                      : driverInfo.approvalStatus === "REJECTED"
                        ? "❌ Rejected"
                        : "📝 Submit Details"}
                  </div>
                  <FaChevronRight className="text-gray-400 text-lg" />
                </div>
              </div>
            </div>

            {/* Inline Vehicle Details Form */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <DriverVehicleDetailsForm
                user={driverInfo}
                onSubmitSuccess={() => {
                  loadDriverInfo();
                }}
              />
            </div>
          </div>
        )}

        {/* ================= DRIVER DETAIL POPUP MODAL ================= */}
        {showDriverModal && driverInfo && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => setShowDriverModal(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FaUser /> Driver & Vehicle Details
                </h2>
                <button
                  onClick={() => setShowDriverModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Driver Info */}
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FaIdCard className="text-indigo-600" />
                    Driver Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <FaUser className="text-xs" /> Name
                      </div>
                      <p className="text-gray-900 font-semibold">
                        {driverInfo.name || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <FaEnvelope className="text-xs" /> Email
                      </div>
                      <p className="text-gray-900">{driverInfo.email || "—"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <FaPhone className="text-xs" /> Phone
                      </div>
                      <p className="text-gray-900">
                        {driverInfo.phone || "Not provided"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <FaIdCard className="text-xs" /> License Number
                      </div>
                      <p className="text-gray-900 font-mono">
                        {driverInfo.licenseNumber || "Not provided"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 sm:col-span-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <FaMapMarkerAlt className="text-xs" /> Address
                      </div>
                      <p className="text-gray-900">
                        {driverInfo.address || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vehicle Info */}
                {driverInfo.vehicle ? (
                  <div className="border-t border-gray-200 pt-5">
                    <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FaCar className="text-indigo-600" />
                      Vehicle Information
                    </h3>
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">
                            Vehicle Name
                          </span>
                          <p className="text-gray-900 font-semibold text-lg">
                            {driverInfo.vehicle.name || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Type</span>
                          <p>
                            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                              {driverInfo.vehicle.type || "—"}
                            </span>
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Model</span>
                          <p className="text-gray-900">
                            {driverInfo.vehicle.model || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">
                            Manufacturer
                          </span>
                          <p className="text-gray-900">
                            {driverInfo.vehicle.manufacturer || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Year</span>
                          <p className="text-gray-900">
                            {driverInfo.vehicle.year || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <FaChair className="text-xs" /> Seats
                          </span>
                          <p className="text-gray-900">
                            {driverInfo.vehicle.seats || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <FaGasPump className="text-xs" /> Fuel Type
                          </span>
                          <p className="text-gray-900">
                            {driverInfo.vehicle.fuelType || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <FaDollarSign className="text-xs" /> Price Per Hour
                          </span>
                          <p className="text-gray-900 font-bold text-lg text-green-600">
                            ₹{driverInfo.vehicle.pricePerHour ?? "—"}
                          </p>
                        </div>
                        {driverInfo.vehicle.vehicleCode && (
                          <div>
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <FaBarcode className="text-xs" /> Vehicle Code
                            </span>
                            <p className="text-gray-900 font-mono bg-white px-2 py-1 rounded border border-gray-200 inline-block">
                              {driverInfo.vehicle.vehicleCode}
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="text-sm text-gray-500">Status</span>
                          <p>
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                                driverInfo.vehicle.status === "AVAILABLE"
                                  ? "bg-green-100 text-green-700"
                                  : driverInfo.vehicle.status === "BOOKED"
                                    ? "bg-blue-100 text-blue-700"
                                    : driverInfo.vehicle.status === "IN_USE"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {(driverInfo.vehicle.status || "UNKNOWN").replace(
                                "_",
                                " ",
                              )}
                            </span>
                          </p>
                        </div>
                        {driverInfo.vehicle.fuelType === "Electric" &&
                          driverInfo.vehicle.batteryLevel != null && (
                            <div>
                              <span className="text-sm text-gray-500">
                                Battery Level
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{
                                      width: `${driverInfo.vehicle.batteryLevel}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="text-gray-900 font-semibold text-sm">
                                  {driverInfo.vehicle.batteryLevel}%
                                </span>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-gray-200 pt-5">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                      <FaCar className="text-blue-500 text-xl flex-shrink-0" />
                      <p className="text-blue-700 text-sm">
                        No vehicle assigned yet. Please submit your vehicle
                        details to start receiving ride requests.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= ACTIVE RIDE ================= */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FaRoute className="text-indigo-600" /> Current Ride
            </h2>
            {activeRide && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                  activeRide.status === "ACCEPTED" ||
                  activeRide.status === "CONFIRMED"
                    ? "bg-blue-100 text-blue-700"
                    : activeRide.status === "ARRIVED"
                      ? "bg-purple-100 text-purple-700"
                      : activeRide.status === "STARTED" ||
                          activeRide.status === "IN_PROGRESS"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                }`}
              >
                {activeRide.status?.replace(/_/g, " ")}
              </span>
            )}
          </div>

          <div className="p-6">
            {activeRideError ? (
              <p className="text-red-500 text-sm">{activeRideError}</p>
            ) : activeRide ? (
              <div className="space-y-5">
                {/* Booking Code + Type */}
                <div className="flex flex-wrap items-center gap-3">
                  {activeRide.bookingCode && (
                    <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-mono">
                      <FaBarcode className="text-xs" /> {activeRide.bookingCode}
                    </span>
                  )}
                  {activeRide.requestedVehicleType && (
                    <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                      <FaCar className="text-xs" />{" "}
                      {activeRide.requestedVehicleType}
                    </span>
                  )}
                </div>

                {/* Route Card */}
                <div className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center mt-1">
                      <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow" />
                      <div className="w-0.5 h-8 bg-gray-300" />
                      <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase">
                          Pickup
                        </p>
                        <p className="text-gray-900 font-semibold">
                          {activeRide.pickupAddress || activeRide.pickup || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase">
                          Drop-off
                        </p>
                        <p className="text-gray-900 font-semibold">
                          {activeRide.dropAddress ||
                            activeRide.dropLocation ||
                            "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ride Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {activeRide.distanceKm && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <FaRoad className="mx-auto text-indigo-500 mb-1" />
                      <p className="text-xs text-gray-500">Distance</p>
                      <p className="text-gray-900 font-bold">
                        {activeRide.distanceKm} km
                      </p>
                    </div>
                  )}
                  {activeRide.totalCost && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <FaDollarSign className="mx-auto text-green-500 mb-1" />
                      <p className="text-xs text-gray-500">Fare</p>
                      <p className="text-green-600 font-bold">
                        ₹{activeRide.totalCost}
                      </p>
                    </div>
                  )}
                  {activeRide.acceptedAt && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <FaClock className="mx-auto text-blue-500 mb-1" />
                      <p className="text-xs text-gray-500">Accepted</p>
                      <p className="text-gray-900 font-semibold text-xs">
                        {new Date(activeRide.acceptedAt).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                  )}
                  {activeRide.vehicleName && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <FaCar className="mx-auto text-purple-500 mb-1" />
                      <p className="text-xs text-gray-500">Vehicle</p>
                      <p className="text-gray-900 font-semibold text-xs">
                        {activeRide.vehicleName}
                      </p>
                    </div>
                  )}
                </div>

                {/* Customer Info */}
                {activeRide.customerName && (
                  <div className="flex items-center gap-3 bg-blue-50 rounded-lg px-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                      {(activeRide.customerName || "C").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {activeRide.customerName}
                      </p>
                      <p className="text-xs text-gray-500">Customer</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {(activeRide.status === "ACCEPTED" ||
                    activeRide.status === "CONFIRMED") && (
                    <button
                      onClick={markArrived}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm"
                    >
                      <FaMapMarkerAlt /> Mark Arrived
                    </button>
                  )}

                  {activeRide.status === "ARRIVED" && (
                    <button
                      onClick={startRide}
                      className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                    >
                      <FaCarSide /> Start Ride
                    </button>
                  )}

                  {(activeRide.status === "STARTED" ||
                    activeRide.status === "IN_PROGRESS" ||
                    activeRide.status === "ONGOING") && (
                    <button
                      onClick={completeRide}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors font-medium shadow-sm"
                    >
                      <FaCheckCircle /> Complete Ride
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FaCarSide className="mx-auto text-4xl text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">
                  No current ride assigned yet
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Accept a pending ride request to get started
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ================= PENDING RIDES ================= */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Pending Ride Requests</h2>

          <DriverPendingRides
            onAction={loadActiveRide}
            vehicleStatus={driverInfo?.vehicle?.status || null}
            hasActiveRide={!!activeRide}
            isApproved={
              driverInfo?.approvalStatus === "APPROVED" && !!driverInfo?.vehicle
            }
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
