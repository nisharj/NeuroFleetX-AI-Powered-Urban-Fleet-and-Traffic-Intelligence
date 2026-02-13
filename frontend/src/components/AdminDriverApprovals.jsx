import { useState, useEffect } from "react";
import { apiFetch } from "../api/api";

export default function AdminDriverApprovals() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING_APPROVAL");
  const [selectedVerification, setSelectedVerification] = useState(null);

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const res = await apiFetch("/api/driver/verification/all");
      if (res.ok) {
        const data = await res.json();
        setVerifications(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching verifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (verificationId, remarks = "") => {
    try {
      const res = await apiFetch(
        `/api/driver/verification/${verificationId}/approve`,
        {
          method: "POST",
          body: JSON.stringify({ remarks }),
        },
      );

      if (res.ok) {
        const data = await res.json();
        alert(data.message || "Driver approved successfully!");
        await fetchVerifications();
        setSelectedVerification(null);
      } else {
        const error = await res.json();
        alert(error.message || "Failed to approve driver");
      }
    } catch (error) {
      console.error("Error approving driver:", error);
      alert("Error approving driver");
    }
  };

  const handleReject = async (verificationId) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    try {
      const res = await apiFetch(
        `/api/driver/verification/${verificationId}/reject`,
        {
          method: "POST",
          body: JSON.stringify({ reason }),
        },
      );

      if (res.ok) {
        const data = await res.json();
        alert(data.message || "Driver rejected");
        await fetchVerifications();
        setSelectedVerification(null);
      } else {
        const error = await res.json();
        alert(error.message || "Failed to reject driver");
      }
    } catch (error) {
      console.error("Error rejecting driver:", error);
      alert("Error rejecting driver");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING_SUBMISSION: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        label: "Pending Submission",
      },
      PENDING_APPROVAL: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Pending Approval",
      },
      APPROVED: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Approved",
      },
      REJECTED: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
      RESUBMISSION_REQUIRED: {
        bg: "bg-orange-100",
        text: "text-orange-800",
        label: "Resubmission Required",
      },
    };

    const badge = badges[status] || badges.PENDING_SUBMISSION;
    return (
      <span
        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
  };

  const filteredVerifications = verifications.filter((v) =>
    filter === "ALL" ? true : v.verificationStatus === filter,
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Driver Verification Management
        </h2>

        <div className="flex gap-2">
          {["ALL", "PENDING_APPROVAL", "APPROVED", "REJECTED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {filteredVerifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          <p className="text-lg">
            No verifications found with status: {filter}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredVerifications.map((verification) => (
            <div
              key={verification.id}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {verification.driver?.name || "Unknown Driver"}
                  </h3>
                  <p className="text-gray-600">{verification.driver?.email}</p>
                  <p className="text-gray-600">{verification.driver?.phone}</p>
                </div>
                {getStatusBadge(verification.verificationStatus)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* License Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-2">
                    License Details
                  </h4>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Number:</span>{" "}
                    {verification.licenseNumber}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">State:</span>{" "}
                    {verification.licenseState}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Expiry:</span>{" "}
                    {verification.licenseExpiryDate}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Experience:</span>{" "}
                    {verification.experienceYears} years
                  </p>
                </div>

                {/* Vehicle Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-2">
                    Vehicle Details
                  </h4>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Make/Model:</span>{" "}
                    {verification.vehicleMake} {verification.vehicleModel}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Year:</span>{" "}
                    {verification.vehicleYear}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Color:</span>{" "}
                    {verification.vehicleColor}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Plate:</span>{" "}
                    {verification.vehiclePlateNumber}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Type:</span>{" "}
                    {verification.vehicleType}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Capacity:</span>{" "}
                    {verification.vehicleCapacity} passengers
                  </p>
                </div>

                {/* Insurance Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-2">
                    Insurance Details
                  </h4>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Company:</span>{" "}
                    {verification.insuranceCompany}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Policy:</span>{" "}
                    {verification.insurancePolicyNumber}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Expiry:</span>{" "}
                    {verification.insuranceExpiryDate}
                  </p>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Emergency Contact:</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      {verification.emergencyContactName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {verification.emergencyContactNumber}
                    </p>
                  </div>
                </div>
              </div>

              {verification.notes && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Driver Notes:</span>{" "}
                    {verification.notes}
                  </p>
                </div>
              )}

              {verification.adminRemarks && (
                <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Admin Remarks:</span>{" "}
                    {verification.adminRemarks}
                  </p>
                </div>
              )}

              <div className="flex gap-3 text-sm text-gray-600 mb-4">
                <p>
                  <span className="font-medium">Submitted:</span>{" "}
                  {new Date(verification.createdAt).toLocaleString()}
                </p>
                {verification.approvedAt && (
                  <p>
                    <span className="font-medium">Approved:</span>{" "}
                    {new Date(verification.approvedAt).toLocaleString()}
                  </p>
                )}
                {verification.rejectedAt && (
                  <p>
                    <span className="font-medium">Rejected:</span>{" "}
                    {new Date(verification.rejectedAt).toLocaleString()}
                  </p>
                )}
              </div>

              {verification.verificationStatus === "PENDING_APPROVAL" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(verification.id)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    ✓ Approve Driver
                  </button>
                  <button
                    onClick={() => handleReject(verification.id)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  >
                    ✗ Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
