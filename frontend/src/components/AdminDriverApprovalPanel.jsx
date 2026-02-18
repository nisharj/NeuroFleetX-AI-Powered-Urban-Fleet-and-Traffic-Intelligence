import { useState, useEffect } from "react";
import { apiFetch } from "../api/api";

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

  const handleApproveAccount = async (driverId, driverName) => {
    if (
      !window.confirm(
        `Approve account for ${driverName}? They will be able to login but not receive rides yet.`,
      )
    ) {
      return;
    }

    try {
      const res = await apiFetch(
        `/api/v1/drivers/${driverId}/approve-account`,
        {
          method: "POST",
        },
      );

      if (res.ok) {
        alert(`✅ Account approved for ${driverName}. Phase 1 complete.`);
        loadDrivers();
      } else {
        alert("Failed to approve account");
      }
    } catch (err) {
      console.error("Error approving account:", err);
      alert("Error approving account");
    }
  };

  const handleApproveRides = async (driverId, driverName) => {
    if (
      !window.confirm(
        `Approve ${driverName} for ride eligibility? They will be able to receive ride requests.`,
      )
    ) {
      return;
    }

    try {
      const res = await apiFetch(`/api/v1/drivers/${driverId}/approve-rides`, {
        method: "POST",
      });

      if (res.ok) {
        alert(
          `✅ Ride eligibility approved for ${driverName}. Phase 2 complete.`,
        );
        loadDrivers();
      } else {
        const errMsg = await res.text();
        alert(`Failed to approve rides: ${errMsg}`);
      }
    } catch (err) {
      console.error("Error approving rides:", err);
      alert("Error approving rides");
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
        alert(`❌ Driver ${driverName} rejected.`);
        loadDrivers();
      } else {
        alert("Failed to reject driver");
      }
    } catch (err) {
      console.error("Error rejecting driver:", err);
      alert("Error rejecting driver");
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
                  onApprove={() => handleApproveAccount(driver.id, driver.name)}
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
                  onApprove={() => handleApproveRides(driver.id, driver.name)}
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
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
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
                      Vehicle
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {driver.vehicle
                          ? `${driver.vehicle.type} - ${driver.vehicle.status}`
                          : "No vehicle"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
              <div className="grid grid-cols-2 gap-2">
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
              </div>
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
