import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import DriverStats from "../components/DriverStats";
import CurrentRide from "../components/CurrentRide";
import PendingRideRequests from "../components/PendingRideRequests";
import DriverVehicleDetailsForm from "../components/DriverVehicleDetailsForm";
import DriverProfileCard from "../components/DriverProfileCard";
import api from "../services/api";

function DriverDashboard({ user, onLogout }) {
  const [view, setView] = useState("overview");

  const [driverProfile, setDriverProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // ✅ Fetch real profile from backend
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

  // ✅ Load profile only when opening vehicle tab
  useEffect(() => {
    if (view === "vehicle") {
      fetchDriverProfile();
    }
  }, [view]);

  const isApproved =
    driverProfile?.approvalStatus === "APPROVED" ||
    driverProfile?.detailsSubmitted ||
    !!driverProfile?.vehicle;

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

        {/* Tabs */}
        <div className="driver-tabs mb-lg">
          <button
            className={`driver-tab ${view === "overview" ? "active" : ""}`}
            onClick={() => setView("overview")}
          >
            Overview
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
            <DriverStats userId={user.id} />
            <div className="mt-xl">
              <CurrentRide userId={user.id} />
            </div>
            <div className="mt-xl">
              <PendingRideRequests userId={user.id} />
            </div>
          </>
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

        {/* ✅ Vehicle */}
        {view === "vehicle" && (
          <div className="animate-fadeIn space-y-lg">
            {profileLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">Loading profile...</p>
              </div>
            ) : (
              <>
                {/* ✅ Approved drivers should NEVER see fresh form */}
                {isApproved ? (
                  <DriverProfileCard />
                ) : (
                  <DriverVehicleDetailsForm
                    user={user}
                    onSubmitSuccess={() => {
                      // ✅ after submitting, reload profile
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
