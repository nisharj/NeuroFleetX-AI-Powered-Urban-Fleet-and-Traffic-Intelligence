import { useState, useEffect } from "react";
import {
  FaCar,
  FaIdCard,
  FaPhone,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
} from "react-icons/fa";
import api from "../services/api";
import { showToast } from "./Toast";
import DriverProfileCard from "./DriverProfileCard";

export default function DriverVehicleDetailsForm({ user, onSubmitSuccess }) {
  const [eligibilityStatus, setEligibilityStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    vehicleName: "",
    vehicleType: "",
    model: "",
    manufacturer: "",
    year: new Date().getFullYear(),
    seats: 4,
    fuelType: "",
    pricePerHour: "",
    licensePlate: "",
    batteryLevel: 100,
    licenseNumber: "",
    phone: user?.phone || "",
    address: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    checkEligibility();
  }, []);

  const checkEligibility = async () => {
    setLoading(true);
    try {
      const response = await api.get("/v1/driver/eligibility");
      setEligibilityStatus(response.data);
    } catch (error) {
      console.error("Error checking eligibility:", error);
      // If endpoint doesn't exist yet, assume not eligible
      setEligibilityStatus({
        eligible: false,
        reason: "Vehicle details not submitted",
        requiresAction: "SUBMIT_DETAILS",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vehicleName.trim())
      newErrors.vehicleName = "Vehicle name is required";
    if (!formData.vehicleType)
      newErrors.vehicleType = "Vehicle type is required";
    if (!formData.model.trim()) newErrors.model = "Model is required";
    if (!formData.manufacturer.trim())
      newErrors.manufacturer = "Manufacturer is required";
    if (formData.year < 1990 || formData.year > new Date().getFullYear() + 1)
      newErrors.year = "Enter a valid year";
    if (formData.seats < 1 || formData.seats > 50)
      newErrors.seats = "Seats must be between 1 and 50";
    if (!formData.fuelType) newErrors.fuelType = "Fuel type is required";
    if (!formData.pricePerHour || formData.pricePerHour <= 0)
      newErrors.pricePerHour = "Enter a valid price per hour";
    if (!formData.licenseNumber.trim())
      newErrors.licenseNumber = "Driver's license number is required";
    if (!formData.phone.trim() || !/^\+?[\d\s-()]+$/.test(formData.phone))
      newErrors.phone = "Enter a valid phone number";
    if (!formData.address.trim()) newErrors.address = "Address is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast("Please fix the errors in the form", "error");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        vehicleName: formData.vehicleName,
        vehicleType: formData.vehicleType,
        model: formData.model,
        manufacturer: formData.manufacturer,
        year: parseInt(formData.year),
        seats: parseInt(formData.seats),
        fuelType: formData.fuelType,
        pricePerHour: parseFloat(formData.pricePerHour),
        licensePlate: formData.licensePlate || null,
        batteryLevel: parseInt(formData.batteryLevel),
        licenseNumber: formData.licenseNumber,
        phone: formData.phone,
        address: formData.address,
      };

      await api.post("/v1/driver/vehicle-details", payload);

      showToast(
        "✅ Vehicle details submitted successfully! Pending admin approval.",
        "success",
      );

      // Refresh eligibility status
      await checkEligibility();

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error("Error submitting vehicle details:", error);
      showToast(
        error.response?.data?.message || "Failed to submit vehicle details",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Status Banner Component
  const StatusBanner = () => {
    if (loading) return null;

    if (!eligibilityStatus) return null;

    const { eligible, reason, requiresAction } = eligibilityStatus;

    if (eligible) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <FaCheckCircle className="text-green-600 text-3xl flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-green-900 mb-1">
                ✅ You're Approved!
              </h3>
              <p className="text-green-700">{reason}</p>
              <p className="text-green-600 text-sm mt-2">
                You can now accept ride requests from customers.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (requiresAction === "WAIT_FOR_APPROVAL") {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <FaClock className="text-yellow-600 text-3xl flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-yellow-900 mb-1">
                ⏳ Pending Approval
              </h3>
              <p className="text-yellow-700">{reason}</p>
              <p className="text-yellow-600 text-sm mt-2">
                Your application is being reviewed by our team. You'll be
                notified once approved.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (requiresAction === "CONTACT_SUPPORT") {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <FaExclamationTriangle className="text-red-600 text-3xl flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-red-900 mb-1">
                ❌ Action Required
              </h3>
              <p className="text-red-700">{reason}</p>
              <p className="text-red-600 text-sm mt-2">
                Please contact support for assistance.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // SUBMIT_DETAILS or default
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <FaCar className="text-blue-600 text-3xl flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-bold text-blue-900 mb-1">
              📝 Submit Your Vehicle Details
            </h3>
            <p className="text-blue-700">
              To start receiving ride requests, please submit your vehicle and
              driver information below.
            </p>
            <p className="text-blue-600 text-sm mt-2">
              Your details will be reviewed by our team before approval.
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  // If already approved or pending approval, show status and profile
  if (
    eligibilityStatus?.requiresAction === "WAIT_FOR_APPROVAL" ||
    eligibilityStatus?.eligible
  ) {
    return (
      <div className="space-y-6">
        <StatusBanner />
        <DriverProfileCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatusBanner />

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Vehicle & Driver Information
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vehicle Information Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaCar className="text-indigo-600" />
              Vehicle Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vehicle Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vehicle Name *
                </label>
                <input
                  type="text"
                  name="vehicleName"
                  value={formData.vehicleName}
                  onChange={handleChange}
                  placeholder="e.g., Honda Civic 2020"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.vehicleName ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-indigo-500 outline-none`}
                />
                {errors.vehicleName && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.vehicleName}
                  </p>
                )}
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vehicle Type *
                </label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.vehicleType ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-indigo-500 outline-none`}
                >
                  <option value="">Select vehicle</option>
                  <option value="BIKE">Bike</option>
                  <option value="AUTO">Auto</option>
                  <option value="SUV">SUV</option>
                  <option value="SEDAN">Sedan</option>
                  <option value="ELECTRICAL_VEHICLE">Electrical Vehicle</option>
                </select>
                {errors.vehicleType && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.vehicleType}
                  </p>
                )}
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Model *
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="e.g., Civic"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.model ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-indigo-500 outline-none`}
                />
                {errors.model && (
                  <p className="mt-1 text-xs text-red-600">{errors.model}</p>
                )}
              </div>

              {/* Manufacturer */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Manufacturer *
                </label>
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                  placeholder="e.g., Honda"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.manufacturer ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-indigo-500 outline-none`}
                />
                {errors.manufacturer && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.manufacturer}
                  </p>
                )}
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Year *
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.year ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-indigo-500 outline-none`}
                />
                {errors.year && (
                  <p className="mt-1 text-xs text-red-600">{errors.year}</p>
                )}
              </div>

              {/* Seats */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Seats *
                </label>
                <input
                  type="number"
                  name="seats"
                  value={formData.seats}
                  onChange={handleChange}
                  min="1"
                  max="50"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.seats ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-indigo-500 outline-none`}
                />
                {errors.seats && (
                  <p className="mt-1 text-xs text-red-600">{errors.seats}</p>
                )}
              </div>

              {/* Fuel Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fuel Type *
                </label>
                <select
                  name="fuelType"
                  value={formData.fuelType}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.fuelType ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-indigo-500 outline-none`}
                >
                  <option value="">Select fuel type</option>
                  <option value="Electric">Electric</option>
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
                {errors.fuelType && (
                  <p className="mt-1 text-xs text-red-600">{errors.fuelType}</p>
                )}
              </div>

              {/* Price Per Hour */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price Per Hour (₹) *
                </label>
                <input
                  type="number"
                  name="pricePerHour"
                  value={formData.pricePerHour}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="e.g., 25.00"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.pricePerHour ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-indigo-500 outline-none`}
                />
                {errors.pricePerHour && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.pricePerHour}
                  </p>
                )}
              </div>

              {/* License Plate */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  License Plate *
                </label>
                <input
                  type="text"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleChange}
                  placeholder="e.g., ABC-1234"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Battery Level (for EVs) */}
              {formData.fuelType === "Electric" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Battery Level (%)
                  </label>
                  <input
                    type="number"
                    name="batteryLevel"
                    value={formData.batteryLevel}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Driver Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaIdCard className="text-indigo-600" />
              Driver Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* License Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Driver's License Number *
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  placeholder="e.g., DL123456789"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.licenseNumber ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-indigo-500 outline-none`}
                />
                {errors.licenseNumber && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.licenseNumber}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaPhone className="text-sm" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g., +1-555-1234"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-indigo-500 outline-none`}
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                )}
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-sm" />
                  Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your full address"
                  rows={3}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.address ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-indigo-500 outline-none`}
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-red-600">{errors.address}</p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 rounded-lg font-semibold text-white transition-all ${
                submitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl"
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </span>
              ) : (
                "Submit for Approval"
              )}
            </button>
            <p className="text-center text-sm text-gray-500 mt-3">
              Your details will be reviewed by our team within 24-48 hours
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
