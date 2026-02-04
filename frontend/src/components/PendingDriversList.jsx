import { useState, useEffect } from "react";
import { FaCheck, FaTimes, FaCar, FaUser, FaPhone, FaIdCard, FaClock } from "react-icons/fa";
import api from "../services/api";
import { showToast } from "./Toast";

export default function PendingDriversList() {
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending"); // "pending" or "all"
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(null);

  useEffect(() => {
    loadDrivers();
  }, [activeTab]);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      if (activeTab === "pending") {
        const response = await api.get("/v1/drivers/pending");
        setPendingDrivers(response.data);
      } else {
        const response = await api.get("/v1/drivers/all");
        setAllDrivers(response.data);
      }
    } catch (error) {
      console.error("Error loading drivers:", error);
      showToast("Failed to load drivers", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (driverId, driverName) => {
    if (!window.confirm(`Approve driver ${driverName}?`)) return;

    try {
      await api.post(`/v1/drivers/${driverId}/approve`);
      showToast(`✅ ${driverName} approved successfully!`, "success");
      loadDrivers();
    } catch (error) {
      console.error("Error approving driver:", error);
      showToast(
        error.response?.data?.message || "Failed to approve driver",
        "error"
      );
    }
  };

  const handleReject = async (driverId, driverName) => {
    setShowRejectModal(driverId);
    setSelectedDriver(driverName);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      showToast("Please provide a reason for rejection", "warning");
      return;
    }

    try {
      await api.post(`/v1/drivers/${showRejectModal}/reject`, {
        reason: rejectReason,
      });
      showToast(`❌ ${selectedDriver} rejected`, "success");
      setShowRejectModal(null);
      setRejectReason("");
      setSelectedDriver(null);
      loadDrivers();
    } catch (error) {
      console.error("Error rejecting driver:", error);
      showToast(
        error.response?.data?.message || "Failed to reject driver",
        "error"
      );
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      PENDING: "bg-gray-100 text-gray-800",
      PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      SUSPENDED: "bg-orange-100 text-orange-800",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          statusStyles[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  const DriverCard = ({ driver, showActions = true }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <FaUser className="text-indigo-600 text-xl" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{driver.name}</h3>
            <p className="text-sm text-gray-500">{driver.email}</p>
          </div>
        </div>
        {getStatusBadge(driver.approvalStatus)}
      </div>

      {/* Driver Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <FaPhone className="text-gray-400" />
          <span className="text-gray-700">{driver.phone || "N/A"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <FaIdCard className="text-gray-400" />
          <span className="text-gray-700">
            {driver.licenseNumber || "N/A"}
          </span>
        </div>
        {driver.createdAt && (
          <div className="flex items-center gap-2 text-sm">
            <FaClock className="text-gray-400" />
            <span className="text-gray-700">
              {new Date(driver.createdAt).toLocaleDateString()}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Details Submitted:</span>
          <span
            className={`font-semibold ${
              driver.detailsSubmitted ? "text-green-600" : "text-red-600"
            }`}
          >
            {driver.detailsSubmitted ? "Yes" : "No"}
          </span>
        </div>
      </div>

      {/* Vehicle Details */}
      {driver.vehicle && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <FaCar className="text-indigo-600" />
            <h4 className="font-semibold text-gray-900">Vehicle Details</h4>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Name:</span>
              <p className="font-medium text-gray-900">{driver.vehicle.name}</p>
            </div>
            <div>
              <span className="text-gray-500">Type:</span>
              <p className="font-medium text-gray-900">{driver.vehicle.type}</p>
            </div>
            <div>
              <span className="text-gray-500">Model:</span>
              <p className="font-medium text-gray-900">
                {driver.vehicle.model || "N/A"}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Manufacturer:</span>
              <p className="font-medium text-gray-900">
                {driver.vehicle.manufacturer || "N/A"}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Year:</span>
              <p className="font-medium text-gray-900">
                {driver.vehicle.year || "N/A"}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Seats:</span>
              <p className="font-medium text-gray-900">
                {driver.vehicle.seats}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Fuel Type:</span>
              <p className="font-medium text-gray-900">
                {driver.vehicle.fuelType}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Price/Hour:</span>
              <p className="font-medium text-gray-900">
                ₹{driver.vehicle.pricePerHour}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && driver.approvalStatus === "PENDING_APPROVAL" && (
        <div className="flex gap-3">
          <button
            onClick={() => handleApprove(driver.id, driver.name)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
          >
            <FaCheck /> Approve
          </button>
          <button
            onClick={() => handleReject(driver.id, driver.name)}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
          >
            <FaTimes /> Reject
          </button>
        </div>
      )}

      {/* Status Info for All Drivers Tab */}
      {!showActions && driver.vehicleStatus && (
        <div className="text-sm">
          <span className="text-gray-500">Vehicle Status:</span>
          <span className="ml-2 font-semibold text-gray-900">
            {driver.vehicleStatus}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Driver Management</h2>
        <button
          onClick={loadDrivers}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
        >
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-3 px-4 font-semibold transition ${
            activeTab === "pending"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Pending Approval
          {pendingDrivers.length > 0 && (
            <span className="ml-2 bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full text-xs">
              {pendingDrivers.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-3 px-4 font-semibold transition ${
            activeTab === "all"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All Drivers
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading drivers...</p>
        </div>
      )}

      {/* Pending Drivers */}
      {!loading && activeTab === "pending" && (
        <div>
          {pendingDrivers.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <FaUser className="mx-auto text-5xl text-gray-300 mb-4" />
              <p className="text-gray-600 text-lg">
                No pending driver applications
              </p>
              <p className="text-gray-500 text-sm mt-2">
                New driver applications will appear here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingDrivers.map((driver) => (
                <DriverCard key={driver.id} driver={driver} showActions={true} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Drivers */}
      {!loading && activeTab === "all" && (
        <div>
          {allDrivers.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <FaUser className="mx-auto text-5xl text-gray-300 mb-4" />
              <p className="text-gray-600 text-lg">No drivers found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {allDrivers.map((driver) => (
                <DriverCard key={driver.id} driver={driver} showActions={false} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Reject Driver: {selectedDriver}
            </h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this driver application:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Invalid license number, incomplete documents..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason("");
                  setSelectedDriver(null);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold transition"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
