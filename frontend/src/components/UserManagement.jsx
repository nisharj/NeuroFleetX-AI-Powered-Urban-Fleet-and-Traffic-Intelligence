import { useState, useEffect } from "react";
import { apiFetch } from "../api/api";
import {
  FaUserShield,
  FaCar,
  FaUsers,
  FaCheckCircle,
  FaBan,
} from "react-icons/fa";

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState("FLEET_MANAGER");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch users based on active tab
  const fetchUsers = async (role) => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`/api/admin/users?role=${role}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      console.log(`📊 Fetched ${role} users:`, data);
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(`Failed to load ${role.toLowerCase()} users`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users when tab changes
  useEffect(() => {
    fetchUsers(activeTab);
  }, [activeTab]);

  // Update user status (activate/deactivate)
  const updateUserStatus = async (userId, isActive) => {
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update status");
      }

      // Refresh the list
      fetchUsers(activeTab);
    } catch (err) {
      console.error("Error updating user status:", err);
      alert(`Failed to update user status: ${err.message}`);
    }
  };

  // Tab configuration
  const tabs = [
    { key: "FLEET_MANAGER", label: "Fleet Managers", icon: <FaUserShield /> },
    { key: "DRIVER", label: "Drivers", icon: <FaCar /> },
    { key: "CUSTOMER", label: "Customers", icon: <FaUsers /> },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6">
        Quick Actions – User Management
      </h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600 hover:text-indigo-600"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-gray-500 mt-2">Loading users...</p>
        </div>
      ) : (
        <>
          {/* Users Table */}
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No {activeTab.toLowerCase().replace("_", " ")} users found
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
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          {user.isActive ? (
                            <button
                              onClick={() => updateUserStatus(user.id, false)}
                              className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                            >
                              <FaBan size={12} />
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => updateUserStatus(user.id, true)}
                              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                            >
                              <FaCheckCircle size={12} />
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
