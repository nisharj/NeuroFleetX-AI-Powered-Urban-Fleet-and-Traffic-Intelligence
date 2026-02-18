import { useState, useEffect } from "react";
import { apiFetch } from "../api/api";
import {
  FaUserShield,
  FaCar,
  FaUsers,
  FaCheckCircle,
  FaBan,
  FaSearch,
  FaEdit,
  FaTrash,
  FaUsersCog,
} from "react-icons/fa";

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Fetch all users or filter by role
  const fetchUsers = async (role) => {
    setLoading(true);
    setError("");
    try {
      let endpoint = "/api/admin/users";
      if (role !== "ALL") {
        endpoint += `?role=${role}`;
      }

      const res = await apiFetch(endpoint);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      console.log(`📊 Fetched ${role === "ALL" ? "all" : role} users:`, data);
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(
        `Failed to load ${role === "ALL" ? "all" : role.toLowerCase()} users`,
      );
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users when tab changes
  useEffect(() => {
    fetchUsers(activeTab);
    setSearchTerm("");
    setStatusFilter("ALL");
  }, [activeTab]);

  // Apply search and status filters
  useEffect(() => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Apply status filter
    if (statusFilter === "ACTIVE") {
      filtered = filtered.filter((user) => user.isActive);
    } else if (statusFilter === "INACTIVE") {
      filtered = filtered.filter((user) => !user.isActive);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, statusFilter, users]);

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

  // Delete user
  const deleteUser = async (userId, userName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete user "${userName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const res = await apiFetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete user");
      }

      alert(`User "${userName}" deleted successfully`);
      // Refresh the list
      fetchUsers(activeTab);
    } catch (err) {
      console.error("Error deleting user:", err);
      alert(`Failed to delete user: ${err.message}`);
    }
  };

  // Tab configuration
  const tabs = [
    { key: "ALL", label: "All Users", icon: <FaUsersCog /> },
    { key: "FLEET_MANAGER", label: "Fleet Managers", icon: <FaUserShield /> },
    { key: "DRIVER", label: "Drivers", icon: <FaCar /> },
    { key: "CUSTOMER", label: "Customers", icon: <FaUsers /> },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Comprehensive User Management
        </h2>
        <p className="text-gray-600">
          Manage all users across the platform - view, search, activate,
          deactivate, and delete users
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600 hover:text-indigo-600"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.key === "ALL" && users.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                {users.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div className="md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>

        {/* Results Count */}
        <div className="flex items-center text-gray-600">
          <span className="font-medium">
            {filteredUsers.length}{" "}
            {filteredUsers.length === 1 ? "user" : "users"}
          </span>
        </div>
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
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FaUsers className="mx-auto text-gray-400 text-5xl mb-3" />
              <p className="text-gray-600 font-medium">
                {searchTerm || statusFilter !== "ALL"
                  ? "No users match your search criteria"
                  : `No ${activeTab === "ALL" ? "" : activeTab.toLowerCase().replace("_", " ")} users found`}
              </p>
              {(searchTerm || statusFilter !== "ALL") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("ALL");
                  }}
                  className="mt-3 text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Approval Status
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
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            {user.phone && (
                              <div className="text-sm text-gray-500">
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === "ADMIN"
                              ? "bg-purple-100 text-purple-800"
                              : user.role === "FLEET_MANAGER"
                                ? "bg-blue-100 text-blue-800"
                                : user.role === "DRIVER"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.approvalStatus === "APPROVED" ||
                            user.approvalStatus === "ACCOUNT_APPROVED"
                              ? "bg-green-100 text-green-800"
                              : user.approvalStatus ===
                                  "PENDING_ACCOUNT_APPROVAL"
                                ? "bg-yellow-100 text-yellow-800"
                                : user.approvalStatus === "REJECTED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.approvalStatus?.replace(/_/g, " ") || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                              title="Deactivate user"
                            >
                              <FaBan size={12} />
                              <span className="hidden lg:inline">
                                Deactivate
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={() => updateUserStatus(user.id, true)}
                              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                              title="Activate user"
                            >
                              <FaCheckCircle size={12} />
                              <span className="hidden lg:inline">Activate</span>
                            </button>
                          )}
                          <button
                            onClick={() => deleteUser(user.id, user.name)}
                            className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                            title="Delete user"
                          >
                            <FaTrash size={12} />
                            <span className="hidden lg:inline">Delete</span>
                          </button>
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
