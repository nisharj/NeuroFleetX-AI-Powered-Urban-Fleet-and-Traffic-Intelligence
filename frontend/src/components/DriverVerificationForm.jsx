import { useState, useEffect } from "react";
import { apiFetch } from "../api/api";
import { showToast } from "./Toast";

export default function DriverVerificationForm() {
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    licenseNumber: "",
    licenseExpiryDate: "",
    licenseState: "",
    licenseCountry: "India",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    vehicleColor: "",
    vehiclePlateNumber: "",
    vehicleType: "SEDAN",
    vehicleCapacity: 4,
    insuranceCompany: "",
    insurancePolicyNumber: "",
    insuranceExpiryDate: "",
    experienceYears: 0,
    emergencyContactName: "",
    emergencyContactNumber: "",
    notes: "",
  });

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const res = await apiFetch("/api/driver/verification/status");
      const data = await res.json();

      if (data.exists && data.verification) {
        setVerification(data.verification);
        setFormData({
          licenseNumber: data.verification.licenseNumber || "",
          licenseExpiryDate: data.verification.licenseExpiryDate || "",
          licenseState: data.verification.licenseState || "",
          licenseCountry: data.verification.licenseCountry || "India",
          vehicleMake: data.verification.vehicleMake || "",
          vehicleModel: data.verification.vehicleModel || "",
          vehicleYear: data.verification.vehicleYear || "",
          vehicleColor: data.verification.vehicleColor || "",
          vehiclePlateNumber: data.verification.vehiclePlateNumber || "",
          vehicleType: data.verification.vehicleType || "SEDAN",
          vehicleCapacity: data.verification.vehicleCapacity || 4,
          insuranceCompany: data.verification.insuranceCompany || "",
          insurancePolicyNumber: data.verification.insurancePolicyNumber || "",
          insuranceExpiryDate: data.verification.insuranceExpiryDate || "",
          experienceYears: data.verification.experienceYears || 0,
          emergencyContactName: data.verification.emergencyContactName || "",
          emergencyContactNumber:
            data.verification.emergencyContactNumber || "",
          notes: data.verification.notes || "",
        });
      }
    } catch (error) {
      console.error("Error fetching verification status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await apiFetch("/api/driver/verification/submit", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message || "Verification submitted successfully!", "success");
        await fetchVerificationStatus();
      } else {
        const error = await res.json();
        showToast(error.message || "Failed to submit verification", "error");
      }
    } catch (error) {
      console.error("Error submitting verification:", error);
      showToast("Error submitting verification", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isApproved = verification?.verificationStatus === "APPROVED";
  const isPending = verification?.verificationStatus === "PENDING_APPROVAL";
  const canEdit = !isApproved && !isPending;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Driver Verification
          </h2>
          {verification && getStatusBadge(verification.verificationStatus)}
        </div>

        {verification?.adminRemarks && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              verification.verificationStatus === "APPROVED"
                ? "bg-green-50 border border-green-200"
                : verification.verificationStatus === "REJECTED"
                  ? "bg-red-50 border border-red-200"
                  : "bg-yellow-50 border border-yellow-200"
            }`}
          >
            <h3 className="font-semibold mb-2">Admin Remarks:</h3>
            <p className="text-gray-700">{verification.adminRemarks}</p>
          </div>
        )}

        {isApproved && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">
              ✓ Your driver verification has been approved! You can now accept
              ride requests.
            </p>
          </div>
        )}

        {isPending && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              ⏳ Your verification is pending admin approval. Please wait for
              the review to complete.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* License Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">License Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  License Number *
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  name="licenseExpiryDate"
                  value={formData.licenseExpiryDate}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  State *
                </label>
                <input
                  type="text"
                  name="licenseState"
                  value={formData.licenseState}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Country
                </label>
                <input
                  type="text"
                  name="licenseCountry"
                  value={formData.licenseCountry}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">Vehicle Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Make *</label>
                <input
                  type="text"
                  name="vehicleMake"
                  value={formData.vehicleMake}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  placeholder="e.g., Maruti Suzuki"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Model *
                </label>
                <input
                  type="text"
                  name="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  placeholder="e.g., Swift"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Year *</label>
                <input
                  type="number"
                  name="vehicleYear"
                  value={formData.vehicleYear}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  min="2000"
                  max="2026"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Color *
                </label>
                <input
                  type="text"
                  name="vehicleColor"
                  value={formData.vehicleColor}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Plate Number *
                </label>
                <input
                  type="text"
                  name="vehiclePlateNumber"
                  value={formData.vehiclePlateNumber}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  placeholder="e.g., MH01AB1234"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Vehicle Type *
                </label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="SEDAN">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="HATCHBACK">Hatchback</option>
                  <option value="LUXURY">Luxury</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Capacity *
                </label>
                <input
                  type="number"
                  name="vehicleCapacity"
                  value={formData.vehicleCapacity}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  min="1"
                  max="8"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Insurance Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">
              Insurance Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Insurance Company *
                </label>
                <input
                  type="text"
                  name="insuranceCompany"
                  value={formData.insuranceCompany}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Policy Number *
                </label>
                <input
                  type="text"
                  name="insurancePolicyNumber"
                  value={formData.insurancePolicyNumber}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  name="insuranceExpiryDate"
                  value={formData.insuranceExpiryDate}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Experience (Years) *
                </label>
                <input
                  type="number"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Emergency Contact Name *
                </label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Emergency Contact Number *
                </label>
                <input
                  type="tel"
                  name="emergencyContactNumber"
                  value={formData.emergencyContactNumber}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  disabled={!canEdit}
                  rows="3"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="Any additional information..."
                />
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
              >
                {submitting ? "Submitting..." : "Submit for Approval"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
