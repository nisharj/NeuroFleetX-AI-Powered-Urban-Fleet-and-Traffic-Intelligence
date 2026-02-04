import { useState, useEffect } from "react";
import {
  FaCar,
  FaUser,
  FaPhone,
  FaIdCard,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
} from "react-icons/fa";
import api from "../services/api";

export default function DriverProfileCard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/v1/driver/profile");
      setProfile(response.data);
    } catch (error) {
      console.error("Error fetching driver profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        icon: <FaClock />,
        label: "Pending",
      },
      PENDING_APPROVAL: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        icon: <FaClock />,
        label: "Pending Approval",
      },
      APPROVED: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: <FaCheckCircle />,
        label: "Approved",
      },
      REJECTED: {
        bg: "bg-red-100",
        text: "text-red-700",
        icon: <FaExclamationCircle />,
        label: "Rejected",
      },
      SUSPENDED: {
        bg: "bg-orange-100",
        text: "text-orange-700",
        icon: <FaExclamationCircle />,
        label: "Suspended",
      },
    };

    const badge = badges[status] || badges.PENDING;

    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}
      >
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-center text-gray-500">
          <p>Unable to load driver profile. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  // If no details submitted, show a minimal profile
  if (!profile.detailsSubmitted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaUser />
            My Profile
          </h2>
        </div>
        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Driver Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Name
                </label>
                <p className="text-gray-900 font-semibold">{profile.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Email
                </label>
                <p className="text-gray-900">{profile.email}</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-700 text-sm">
              ℹ️ Please submit your vehicle details to start receiving ride
              requests.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaUser />
            My Profile
          </h2>
          {getStatusBadge(profile.approvalStatus)}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Driver Information */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaIdCard className="text-indigo-600" />
            Driver Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-gray-900 font-semibold">{profile.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900">{profile.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <FaPhone className="text-xs" />
                Phone
              </label>
              <p className="text-gray-900">{profile.phone || "Not provided"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                License Number
              </label>
              <p className="text-gray-900 font-mono">
                {profile.licenseNumber || "Not provided"}
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <FaMapMarkerAlt className="text-xs" />
                Address
              </label>
              <p className="text-gray-900">
                {profile.address || "Not provided"}
              </p>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        {profile.vehicle && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaCar className="text-indigo-600" />
              Vehicle Information
            </h3>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Vehicle Name
                  </label>
                  <p className="text-gray-900 font-semibold text-lg">
                    {profile.vehicle.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Type
                  </label>
                  <p className="text-gray-900">
                    <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                      {profile.vehicle.type}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Model
                  </label>
                  <p className="text-gray-900">{profile.vehicle.model}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Manufacturer
                  </label>
                  <p className="text-gray-900">
                    {profile.vehicle.manufacturer}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Year
                  </label>
                  <p className="text-gray-900">{profile.vehicle.year}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Seats
                  </label>
                  <p className="text-gray-900">{profile.vehicle.seats}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Fuel Type
                  </label>
                  <p className="text-gray-900">{profile.vehicle.fuelType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Price Per Hour
                  </label>
                  <p className="text-gray-900 font-bold text-lg text-green-600">
                    ₹{profile.vehicle.pricePerHour}
                  </p>
                </div>
                {profile.vehicle.vehicleCode && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Vehicle Code
                    </label>
                    <p className="text-gray-900 font-mono bg-white px-2 py-1 rounded border border-gray-200 inline-block">
                      {profile.vehicle.vehicleCode}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Status
                  </label>
                  <p className="text-gray-900">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        profile.vehicle.status === "AVAILABLE"
                          ? "bg-green-100 text-green-700"
                          : profile.vehicle.status === "BOOKED"
                            ? "bg-blue-100 text-blue-700"
                            : profile.vehicle.status === "IN_USE"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {profile.vehicle.status.replace("_", " ")}
                    </span>
                  </p>
                </div>
                {profile.vehicle.fuelType === "Electric" && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Battery Level
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${profile.vehicle.batteryLevel}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-900 font-semibold">
                        {profile.vehicle.batteryLevel}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status Message */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          {profile.approvalStatus === "APPROVED" && (
            <p className="text-sm text-green-700">
              ✅ Your profile is approved! You can now accept ride requests.
            </p>
          )}
          {profile.approvalStatus === "PENDING_APPROVAL" && (
            <p className="text-sm text-yellow-700">
              ⏳ Your profile is under review. You'll be notified once approved.
            </p>
          )}
          {profile.approvalStatus === "REJECTED" && (
            <p className="text-sm text-red-700">
              ❌ Your profile was rejected. Please contact support for more
              information.
            </p>
          )}
          {profile.approvalStatus === "SUSPENDED" && (
            <p className="text-sm text-orange-700">
              ⚠️ Your account is suspended. Please contact support.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
