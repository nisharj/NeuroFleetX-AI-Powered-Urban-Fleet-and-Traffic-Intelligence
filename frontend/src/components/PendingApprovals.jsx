import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import { FaCheck, FaTimes, FaSpinner } from "react-icons/fa";
import { showToast } from "./Toast";

export default function PendingApprovals() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/admin/pending-approvals");

      if (!res || !res.ok) {
        throw new Error("Failed to fetch pending approvals");
      }

      const data = await res.json();
      setPendingUsers(data);
      setError("");
    } catch (err) {
      console.error("Error fetching pending approvals:", err);
      setError("Failed to load pending approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const handleApprove = async (userId, userName) => {
    if (!confirm(`Are you sure you want to approve ${userName}?`)) {
      return;
    }

    try {
      setProcessingId(userId);
      const res = await apiFetch(`/api/admin/approve-user/${userId}`, {
        method: "POST",
      });

      if (!res || !res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to approve user");
      }

      const data = await res.json();
      showToast(data.message || "User approved successfully!", "success");

      // Refresh the list
      await fetchPendingApprovals();
    } catch (err) {
      console.error("Error approving user:", err);
      showToast(err.message || "Failed to approve user", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId, userName) => {
    const reason = prompt(`Enter reason for rejecting ${userName} (optional):`);

    if (reason === null) {
      // User cancelled
      return;
    }

    try {
      setProcessingId(userId);
      const res = await apiFetch(`/api/admin/reject-user/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: reason || "No reason provided" }),
      });

      if (!res || !res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to reject user");
      }

      const data = await res.json();
      showToast(data.message || "User rejected successfully!", "success");

      // Refresh the list
      await fetchPendingApprovals();
    } catch (err) {
      console.error("Error rejecting user:", err);
      showToast(err.message || "Failed to reject user", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Pending Approvals</h2>
        <div className="flex items-center justify-center py-8">
          <FaSpinner className="animate-spin text-3xl text-blue-600" />
          <span className="ml-3 text-gray-600">
            Loading pending approvals...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Pending Approvals</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Pending Approvals</h2>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          {pendingUsers.length} pending
        </span>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">No pending approvals</p>
          <p className="text-sm mt-2">
            All registration requests have been processed
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === "DRIVER"
                          ? "bg-green-100 text-green-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {user.role === "FLEET_MANAGER"
                        ? "Fleet Manager"
                        : user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {user.phone || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {formatDate(user.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApprove(user.id, user.name)}
                        disabled={processingId === user.id}
                        className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {processingId === user.id ? (
                          <FaSpinner className="animate-spin mr-1" />
                        ) : (
                          <FaCheck className="mr-1" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(user.id, user.name)}
                        disabled={processingId === user.id}
                        className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {processingId === user.id ? (
                          <FaSpinner className="animate-spin mr-1" />
                        ) : (
                          <FaTimes className="mr-1" />
                        )}
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
