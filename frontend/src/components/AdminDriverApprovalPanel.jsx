import { useState, useEffect } from "react";
import { apiFetch } from "../api/api";
import { showToast } from "./Toast";

/**
 * AdminDriverApprovalPanel - Two-Phase Driver Approval System
 * Phase 1: Account Approval (allows login)
 * Phase 2: Ride Approval (allows receiving rides)
 */
export default function AdminDriverApprovalPanel() {
  const [pendingAccounts, setPendingAccounts] = useState([]);
  const [pendingRides, setPendingRides] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("phase1"); // phase1, phase2, all
  const [confirming, setConfirming] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: null,
    driverId: null,
    driverName: "",
    title: "",
    message: "",
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      // Fetch pending account approvals (Phase 1)
      const phase1Res = await apiFetch(
        "/api/v1/drivers/pending-account-approval",
      );
      if (phase1Res.ok) {
        const phase1Data = await phase1Res.json();
        setPendingAccounts(phase1Data || []);
      }

      // Fetch pending ride approvals (Phase 2)
      const phase2Res = await apiFetch("/api/v1/drivers/pending-ride-approval");
      if (phase2Res.ok) {
        const phase2Data = await phase2Res.json();
        setPendingRides(phase2Data || []);
      }

      // Fetch all drivers
      const allRes = await apiFetch("/api/v1/drivers");
      if (allRes.ok) {
        const allData = await allRes.json();
        setAllDrivers(allData || []);
      }
    } catch (err) {
      console.error("Error loading drivers:", err);
    }
    setLoading(false);
  };

  const approveAccount = async (driverId, driverName) => {
    try {
      const res = await apiFetch(
        `/api/v1/drivers/${driverId}/approve-account`,
        {
          method: "POST",
        },
      );

      if (res.ok) {
        showToast(`Account approved for ${driverName}. Phase 1 complete.`, "success");
        loadDrivers();
      } else {
        showToast("Failed to approve account", "error");
      }
    } catch (err) {
      console.error("Error approving account:", err);
      showToast("Error approving account", "error");
    }
  };

  const approveRides = async (driverId, driverName) => {
    try {
      const res = await apiFetch(`/api/v1/drivers/${driverId}/approve-rides`, {
        method: "POST",
      });

      if (res.ok) {
        showToast(
          `Ride eligibility approved for ${driverName}. Phase 2 complete.`,
          "success",
        );
        loadDrivers();
      } else {
        const errMsg = await res.text();
        showToast(`Failed to approve rides: ${errMsg}`, "error");
      }
    } catch (err) {
      console.error("Error approving rides:", err);
      showToast("Error approving rides", "error");
    }
  };

  const openConfirm = (action, driverId, driverName) => {
    if (action === "approveAccount") {
      setConfirmDialog({
        open: true,
        action,
        driverId,
        driverName,
        title: "Approve Driver Account",
        message: `Approve account for ${driverName}? They will be able to login but not receive rides yet.`,
      });
      return;
    }

    setConfirmDialog({
      open: true,
      action,
      driverId,
      driverName,
      title: "Approve Ride Eligibility",
      message: `Approve ${driverName} for ride eligibility? They will be able to receive ride requests.`,
    });
  };

  const closeConfirm = (force = false) => {
    if (confirming && !force) return;
    setConfirmDialog({
      open: false,
      action: null,
      driverId: null,
      driverName: "",
      title: "",
      message: "",
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.action || !confirmDialog.driverId) return;
    setConfirming(true);
    try {
      if (confirmDialog.action === "approveAccount") {
        await approveAccount(confirmDialog.driverId, confirmDialog.driverName);
      } else if (confirmDialog.action === "approveRides") {
        await approveRides(confirmDialog.driverId, confirmDialog.driverName);
      }
    } finally {
      setConfirming(false);
      closeConfirm(true);
    }
  };

  const handleReject = async (driverId, driverName) => {
    const reason = window.prompt(`Enter rejection reason for ${driverName}:`);
    if (!reason) return;

    try {
      const res = await apiFetch(`/api/v1/drivers/${driverId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        showToast(`Driver ${driverName} rejected.`, "success");
        loadDrivers();
      } else {
        showToast("Failed to reject driver", "error");
      }
    } catch (err) {
      console.error("Error rejecting driver:", err);
      showToast("Error rejecting driver", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 font-medium">
            Loading driver approvals...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Driver Approval System
        </h2>
        <p className="text-gray-600">
          Manage two-phase driver verification and approval workflow
        </p>
      </div>

      {/* Tab Navigation - Upgraded Design */}
      <div className="flex gap-2 mb-8 bg-gray-100 p-2 rounded-lg">
        <button
          onClick={() => setActiveTab("phase1")}
          className={`flex-1 py-3 px-6 font-semibold rounded-lg transition-all duration-200 ${
            activeTab === "phase1"
              ? "bg-white text-indigo-600 shadow-md transform scale-105"
              : "text-gray-600 hover:text-indigo-600 hover:bg-white/50"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="text-xl">⏳</span>
            <span>Phase 1: Accounts</span>
            {pendingAccounts.length > 0 && (
              <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">
                {pendingAccounts.length}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("phase2")}
          className={`flex-1 py-3 px-6 font-semibold rounded-lg transition-all duration-200 ${
            activeTab === "phase2"
              ? "bg-white text-green-600 shadow-md transform scale-105"
              : "text-gray-600 hover:text-green-600 hover:bg-white/50"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="text-xl">📋</span>
            <span>Phase 2: Verification</span>
            {pendingRides.length > 0 && (
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">
                {pendingRides.length}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-3 px-6 font-semibold rounded-lg transition-all duration-200 ${
            activeTab === "all"
              ? "bg-white text-purple-600 shadow-md transform scale-105"
              : "text-gray-600 hover:text-purple-600 hover:bg-white/50"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="text-xl">👥</span>
            <span>All Drivers</span>
            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-bold">
              {allDrivers.length}
            </span>
          </span>
        </button>
      </div>

      {/* Phase 1: Account Approval */}
      {activeTab === "phase1" && (
        <div>
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-l-4 border-indigo-500 rounded-lg p-5 mb-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <p className="text-indigo-900 font-semibold mb-1">
                  Phase 1: Account Approval
                </p>
                <p className="text-indigo-700 text-sm">
                  Approve driver accounts. They will be able to login but cannot
                  receive rides until Phase 2 is complete.
                </p>
              </div>
            </div>
          </div>

          {pendingAccounts.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <span className="text-5xl mb-4 block">✅</span>
              <p className="text-gray-600 font-medium text-lg">
                No pending account approvals
              </p>
              <p className="text-gray-500 text-sm mt-2">
                All drivers have been processed
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingAccounts.map((driver) => (
                <DriverCard
                  key={driver.id}
                  driver={driver}
                  phase="1"
                  onApprove={() =>
                    openConfirm("approveAccount", driver.id, driver.name)
                  }
                  onReject={() => handleReject(driver.id, driver.name)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Phase 2: Ride Approval */}
      {activeTab === "phase2" && (
        <div>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-5 mb-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🚗</span>
              <div>
                <p className="text-green-900 font-semibold mb-1">
                  Phase 2: Ride Eligibility
                </p>
                <p className="text-green-700 text-sm">
                  Approve drivers for ride eligibility. They must have submitted
                  vehicle details and verification documents.
                </p>
              </div>
            </div>
          </div>

          {pendingRides.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <span className="text-5xl mb-4 block">✅</span>
              <p className="text-gray-600 font-medium text-lg">
                No pending ride approvals
              </p>
              <p className="text-gray-500 text-sm mt-2">
                All eligible drivers are verified
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingRides.map((driver) => (
                <DriverCard
                  key={driver.id}
                  driver={driver}
                  phase="2"
                  onApprove={() =>
                    openConfirm("approveRides", driver.id, driver.name)
                  }
                  onReject={() => handleReject(driver.id, driver.name)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Drivers */}
      {activeTab === "all" && (
        <div>
          {allDrivers.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <span className="text-5xl mb-4 block">👤</span>
              <p className="text-gray-600 font-medium text-lg">
                No drivers registered
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Drivers will appear here once registered
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:hidden">
                {allDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {driver.name}
                        </p>
                        <p className="text-xs text-gray-500">{driver.email}</p>
                      </div>
                      <StatusBadge status={driver.approvalStatus} />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-600">
                      <div>
                        <p className="text-gray-400">Phone</p>
                        <p className="font-medium text-gray-800">
                          {driver.phone || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">License</p>
                        <p className="font-medium text-gray-800">
                          {driver.licenseNumber || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Rating</p>
                        {Number(driver.totalDriverRatings || 0) > 0 ? (
                          <p className="font-semibold text-amber-600">
                            â˜… {Number(driver.driverRating || 0).toFixed(1)}
                            <span className="text-gray-400 font-normal">
                              {" "}
                              ({driver.totalDriverRatings})
                            </span>
                          </p>
                        ) : (
                          <p className="text-gray-400">No ratings</p>
                        )}
                      </div>
                      <div>
                        <p className="text-gray-400">Vehicle</p>
                        <p className="font-medium text-gray-800">
                          {driver.vehicle
                            ? driver.vehicle.name || driver.vehicle.type
                            : "No vehicle"}
                        </p>
                      </div>
                    </div>

                    {driver.vehicle && (
                      <div className="mt-3 text-xs text-gray-500">
                        {driver.vehicle.manufacturer} {driver.vehicle.model} (
                        {driver.vehicle.year}) | {driver.vehicle.fuelType} |{" "}
                        {driver.vehicle.seats} seats |{" "}
                        {driver.vehicle.vehicleNumber || "No plate"}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="hidden md:block bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-[900px] w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-purple-600 to-indigo-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      License
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allDrivers.map((driver, index) => (
                    <tr
                      key={driver.id}
                      className={`hover:bg-purple-50 transition ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {driver.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {driver.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {driver.phone || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={driver.approvalStatus} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {Number(driver.totalDriverRatings || 0) > 0 ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-amber-600">
                              ★ {Number(driver.driverRating || 0).toFixed(1)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {driver.totalDriverRatings} ratings
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">No ratings</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {driver.vehicle ? (
                          <div>
                            <span className="font-medium">
                              {driver.vehicle.name || driver.vehicle.type}
                            </span>
                            <br />
                            <span className="text-xs text-gray-500">
                              {driver.vehicle.manufacturer}{" "}
                              {driver.vehicle.model} ({driver.vehicle.year}) |{" "}
                              {driver.vehicle.fuelType} | {driver.vehicle.seats}{" "}
                              seats |{" "}
                              {driver.vehicle.vehicleNumber || "No plate"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">No vehicle</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {driver.licenseNumber || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {confirmDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {confirmDialog.title}
            </h3>
            <p className="text-sm text-gray-700 mb-6">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeConfirm}
                disabled={confirming}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={confirming}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {confirming ? "Processing..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DriverCard({ driver, phase, onApprove, onReject }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex justify-between items-start gap-6">
        <div className="flex-1">
          {/* Driver Header */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {driver.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <span>📧</span>
                {driver.email}
              </span>
            </div>
          </div>

          {/* Driver Info Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Phone Number</p>
              <p className="text-sm font-semibold text-gray-800">
                {driver.phone || "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">License Number</p>
              <p className="text-sm font-semibold text-gray-800">
                {driver.licenseNumber || "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Driver Rating</p>
              <p className="text-sm font-semibold text-amber-600">
                {Number(driver.totalDriverRatings || 0) > 0
                  ? `★ ${Number(driver.driverRating || 0).toFixed(1)}`
                  : "No ratings"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Rated Trips</p>
              <p className="text-sm font-semibold text-gray-800">
                {driver.totalDriverRatings || 0}
              </p>
            </div>
          </div>

          {/* Vehicle Details */}
          {driver.vehicle && (
            <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🚗</span>
                <p className="text-sm font-bold text-blue-900">
                  Vehicle Information
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-blue-700">Vehicle Name</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {driver.vehicle.name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700">Type</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {driver.vehicle.type}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700">Model</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {driver.vehicle.model || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700">Manufacturer</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {driver.vehicle.manufacturer || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700">Year</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {driver.vehicle.year || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700">Seats</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {driver.vehicle.seats || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700">Fuel Type</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {driver.vehicle.fuelType || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700">Price/Hour</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {driver.vehicle.pricePerHour
                      ? `₹${driver.vehicle.pricePerHour}`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700">Vehicle Number</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {driver.vehicle.vehicleNumber || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700">Vehicle Code</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {driver.vehicle.vehicleCode || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700">Battery Level</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {driver.vehicle.batteryLevel != null
                      ? `${driver.vehicle.batteryLevel}%`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700">Status</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {driver.vehicle.status || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Driver Address */}
          {driver.address && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Address</p>
              <p className="text-sm font-medium text-gray-800">
                {driver.address}
              </p>
            </div>
          )}

          {/* Registration Date */}
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <span>📅</span>
            <span>
              Registered: {new Date(driver.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onApprove}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-2"
          >
            <span>✅</span>
            <span>{phase === "1" ? "Approve Account" : "Approve Rides"}</span>
          </button>
          <button
            onClick={onReject}
            className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-2"
          >
            <span>❌</span>
            <span>Reject</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const badgeStyles = {
    PENDING_ACCOUNT_APPROVAL: {
      bg: "bg-gradient-to-r from-yellow-100 to-amber-100",
      text: "text-yellow-800",
      border: "border-yellow-300",
      icon: "⏳",
    },
    ACCOUNT_APPROVED: {
      bg: "bg-gradient-to-r from-blue-100 to-indigo-100",
      text: "text-blue-800",
      border: "border-blue-300",
      icon: "✔️",
    },
    APPROVED: {
      bg: "bg-gradient-to-r from-green-100 to-emerald-100",
      text: "text-green-800",
      border: "border-green-300",
      icon: "✅",
    },
    REJECTED: {
      bg: "bg-gradient-to-r from-red-100 to-rose-100",
      text: "text-red-800",
      border: "border-red-300",
      icon: "❌",
    },
    SUSPENDED: {
      bg: "bg-gradient-to-r from-gray-100 to-slate-100",
      text: "text-gray-800",
      border: "border-gray-300",
      icon: "⏸️",
    },
  };

  const labels = {
    PENDING_ACCOUNT_APPROVAL: "Pending Account",
    ACCOUNT_APPROVED: "Account Approved",
    APPROVED: "Fully Approved",
    REJECTED: "Rejected",
    SUSPENDED: "Suspended",
  };

  const style = badgeStyles[status] || {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-300",
    icon: "•",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border ${style.bg} ${style.text} ${style.border} shadow-sm`}
    >
      <span>{style.icon}</span>
      <span>{labels[status] || status}</span>
    </span>
  );
}
