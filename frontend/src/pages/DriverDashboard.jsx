import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import DriverStats from "../components/DriverStats";
import CurrentRide from "../components/CurrentRide";
import PendingRideRequests from "../components/PendingRideRequests";
import DriverVehicleDetailsForm from "../components/DriverVehicleDetailsForm";
import DriverProfileCard from "../components/DriverProfileCard";
import DriverVerificationForm from "../components/DriverVerificationForm";
import DriverRideRequests from "../components/DriverRideRequests";
import api from "../services/api";
import { apiFetch } from "../api/api";

function DriverDashboard({ user, onLogout }) {
  const [view, setView] = useState("overview");

  const [driverProfile, setDriverProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [accountStatus, setAccountStatus] = useState(null);

  // ✅ Fetch account status
  const fetchAccountStatus = async () => {
    try {
      // Fetch user details to get account approval status
      const response = await apiFetch("/user/me");
      if (response.ok) {
        const userData = await response.json();
        setAccountStatus(userData.approvalStatus);
      }
    } catch (err) {
      console.error("Failed to fetch account status:", err);
    }
  };

  // ✅ Fetch verification status
  const fetchVerificationStatus = async () => {
    try {
      const response = await apiFetch("/driver/verification/status");
      if (response.ok) {
        const data = await response.json();
        setVerificationStatus(
          data.exists
            ? data.verification.verificationStatus
            : "PENDING_SUBMISSION",
        );
      }
    } catch (err) {
      console.error("Failed to fetch verification status:", err);
    }
  };

  // ✅ Fetch driver profile
  const fetchDriverProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await api.get("/v1/driver/profile");
      setDriverProfile(res.data);
    } catch (err) {
      console.error("Failed to fetch driver profile:", err);
      setDriverProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  // ✅ Fetch profile when Vehicle tab opens
  useEffect(() => {
    if (view === "vehicle") {
      fetchDriverProfile();
    }
  }, [view]);

  // ✅ Load both statuses on mount
  useEffect(() => {
    fetchDriverProfile();
    fetchAccountStatus();
    fetchVerificationStatus();
  }, []);

  // Determine approval phases
  const accountApproved =
    accountStatus === "ACCOUNT_APPROVED" || accountStatus === "APPROVED";
  const rideEligibilityApproved = verificationStatus === "APPROVED";

  return (
    <div className="app-container">
      <Navbar user={user} onLogout={onLogout} />

      <div className="content-wrapper">
        <div className="mb-xl animate-fadeIn">
          <h1 className="text-gradient mb-sm">
            Welcome, {(user?.name || "Driver").split(" ")[0]}!
          </h1>
          <p className="text-secondary">
            Manage your trips and earnings from your driver dashboard
          </p>
        </div>

        {/* Two-Phase Approval Status Banner */}
        <div className="mb-lg space-y-md">
          {/* Phase 1: Account Approval */}
          <div
            className={`p-md rounded-lg border ${accountApproved ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}
          >
            <div className="flex items-center gap-md">
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${accountApproved ? "bg-green-500" : "bg-yellow-500"}`}
              >
                {accountApproved ? (
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                )}
              </div>
              <div>
                <div
                  className={`font-semibold ${accountApproved ? "text-green-800" : "text-yellow-800"}`}
                >
                  Phase 1: Account Approval
                </div>
                <div
                  className={`text-sm ${accountApproved ? "text-green-700" : "text-yellow-700"}`}
                >
                  {accountApproved
                    ? "Your account is approved. You can now submit verification details."
                    : "Your account is pending admin approval. Please wait."}
                </div>
              </div>
            </div>
          </div>

          {/* Phase 2: Ride Eligibility */}
          <div
            className={`p-md rounded-lg border ${rideEligibilityApproved ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"} ${!accountApproved ? "opacity-50" : ""}`}
          >
            <div className="flex items-center gap-md">
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${rideEligibilityApproved ? "bg-green-500" : "bg-yellow-500"}`}
              >
                {rideEligibilityApproved ? (
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                )}
              </div>
              <div>
                <div
                  className={`font-semibold ${rideEligibilityApproved ? "text-green-800" : "text-yellow-800"}`}
                >
                  Phase 2: Ride Eligibility
                </div>
                <div
                  className={`text-sm ${rideEligibilityApproved ? "text-green-700" : "text-yellow-700"}`}
                >
                  {!accountApproved
                    ? "Complete Phase 1 first to submit verification."
                    : rideEligibilityApproved
                      ? "Verification approved! You can now accept rides."
                      : verificationStatus === "PENDING_SUBMISSION"
                        ? "Submit your verification details in the Verification tab."
                        : verificationStatus === "PENDING_APPROVAL"
                          ? "Your verification is under admin review."
                          : "Please complete your verification."}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="driver-tabs mb-lg">
          <button
            className={`driver-tab ${view === "overview" ? "active" : ""}`}
            onClick={() => setView("overview")}
          >
            Overview
          </button>

          <button
            className={`driver-tab ${view === "verification" ? "active" : ""}`}
            onClick={() => setView("verification")}
          >
            Verification
          </button>

          <button
            className={`driver-tab ${view === "rides" ? "active" : ""}`}
            onClick={() => setView("rides")}
          >
            Ride Requests
          </button>

          <button
            className={`driver-tab ${view === "trips" ? "active" : ""}`}
            onClick={() => setView("trips")}
          >
            My Trips
          </button>

          <button
            className={`driver-tab ${view === "vehicle" ? "active" : ""}`}
            onClick={() => setView("vehicle")}
          >
            Vehicle Details
          </button>

          <button
            className={`driver-tab ${view === "earnings" ? "active" : ""}`}
            onClick={() => setView("earnings")}
          >
            Earnings
          </button>
        </div>

        {/* Overview */}
        {view === "overview" && (
          <>
            <DriverStats userId={user?.id} />

            <div className="mt-xl">
              {/* ✅ Current active ride for THIS DRIVER */}
              <CurrentRide />
            </div>

            <div className="mt-xl">
              {/* ✅ Pending requests filtered by driver vehicle type */}
              <PendingRideRequests userId={user?.id} />
            </div>
          </>
        )}

        {/* Verification Tab */}
        {view === "verification" && (
          <div className="animate-fadeIn">
            {!accountApproved ? (
              <div className="driver-section-card">
                <div className="driver-section-content text-center py-12">
                  <div className="text-yellow-600 mb-md">
                    <svg
                      className="w-16 h-16 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-sm">
                    Account Pending Approval
                  </h3>
                  <p className="text-secondary">
                    Your account is awaiting admin approval. You'll be able to
                    submit verification details once your account is approved.
                  </p>
                </div>
              </div>
            ) : (
              <DriverVerificationForm
                onVerificationUpdate={fetchVerificationStatus}
              />
            )}
          </div>
        )}

        {/* Ride Requests Tab */}
        {view === "rides" && (
          <div className="animate-fadeIn">
            {!accountApproved ? (
              <div className="driver-section-card">
                <div className="driver-section-content text-center py-12">
                  <div className="text-yellow-600 mb-md">
                    <svg
                      className="w-16 h-16 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-sm">
                    Account Pending Approval
                  </h3>
                  <p className="text-secondary">
                    Complete Phase 1 (Account Approval) before accessing ride
                    requests.
                  </p>
                </div>
              </div>
            ) : !rideEligibilityApproved ? (
              <div className="driver-section-card">
                <div className="driver-section-content text-center py-12">
                  <div className="text-yellow-600 mb-md">
                    <svg
                      className="w-16 h-16 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      ></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-sm">
                    Verification Required
                  </h3>
                  <p className="text-secondary mb-md">
                    {verificationStatus === "PENDING_SUBMISSION"
                      ? "Please submit your verification details in the Verification tab to start accepting rides."
                      : verificationStatus === "PENDING_APPROVAL"
                        ? "Your verification is under admin review. You'll be able to accept rides once approved."
                        : "Complete your verification to access ride requests."}
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => setView("verification")}
                  >
                    Go to Verification
                  </button>
                </div>
              </div>
            ) : (
              <DriverRideRequests />
            )}
          </div>
        )}

        {/* Trips */}
        {view === "trips" && (
          <div className="driver-section-card">
            <h3 className="driver-section-title">My Trips</h3>
            <div className="driver-section-content empty">
              <p className="text-secondary">
                Trip history will be displayed here
              </p>
            </div>
          </div>
        )}

        {/* Vehicle */}
        {view === "vehicle" && (
          <div className="animate-fadeIn space-y-lg">
            {profileLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">Loading profile...</p>
              </div>
            ) : (
              <>
                {driverProfile?.approvalStatus === "APPROVED" ? (
                  <DriverProfileCard />
                ) : (
                  <DriverVehicleDetailsForm
                    user={user}
                    onSubmitSuccess={() => {
                      fetchDriverProfile();
                    }}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Earnings */}
        {view === "earnings" && (
          <div className="driver-section-card">
            <h3 className="driver-section-title">Earnings</h3>
            <div className="driver-section-content empty">
              <p className="text-secondary">
                Earnings summary will be displayed here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DriverDashboard;
