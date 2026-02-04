import { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { showToast } from "./Toast";
import { bookingService } from "../services/bookingService";
import RideRequestModal from "./RideRequestModal";
import api from "../services/api";

function PendingRideRequests({ userId }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driverVehicleType, setDriverVehicleType] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);

  const stompRef = useRef(null);
  const subsRef = useRef([]);

  useEffect(() => {
    let mounted = true;

    const addRequestSafe = (payload, vehicleType) => {
      if (!payload?.id) return;

      // Only allow pending-like bookings
      const allowed = ["PENDING", "BROADCASTED"];
      if (payload.status && !allowed.includes(payload.status)) return;

      // Filter by requested vehicle type if needed
      if (
        vehicleType &&
        payload.requestedVehicleType &&
        payload.requestedVehicleType !== vehicleType
      ) {
        return;
      }

      setRequests((prev) => {
        // prevent duplicates
        const exists = prev.some((r) => r.id === payload.id);
        if (exists) return prev;
        return [payload, ...prev];
      });
    };


    const loadDriverAndRequests = async () => {
      try {
        setLoading(true);

        // ✅ Load driver profile
        const profile = await api
          .get("/v1/driver/profile")
          .then((r) => r.data)
          .catch(() => null);

        if (!mounted) return;

        const vehicleType = profile?.vehicle?.type || null;
        setDriverVehicleType(vehicleType);
        setDriverProfile(profile || null);

        // ✅ If driver has no vehicle configured
        if (!vehicleType) {
          setRequests([]);
          setLoading(false);
          return;
        }

        // ✅ Load pending bookings filtered server-side
        const data = await bookingService.getPendingBookings(vehicleType);
        if (!mounted) return;

        // Keep only PENDING/BROADCASTED bookings
        const cleaned = (data || []).filter(
          (b) =>
            b &&
            b.id &&
            ["PENDING", "BROADCASTED"].includes(b.status) &&
            b.vehicleId == null
        );

        setRequests(cleaned);
        setLoading(false);

        // ✅ Setup STOMP client
        const backendBase =
          window.location.hostname === "localhost"
            ? `${window.location.protocol}//${window.location.hostname}:8080`
            : window.location.origin;

        const token = localStorage.getItem("authToken");

        const wsUrl = token
          ? `${backendBase}/api/ws?token=${encodeURIComponent(token)}`
          : `${backendBase}/api/ws`;

        const stompClient = new Client({
          webSocketFactory: () => new SockJS(wsUrl),
          connectHeaders: {
            Authorization: token ? `Bearer ${token}` : "",
          },
          reconnectDelay: 5000,
          debug: () => {},
        });

        stompClient.onConnect = () => {
          // ✅ Subscribe global topic
          const sub1 = stompClient.subscribe("/topic/ride-requests", (message) => {
            try {
              const payload = JSON.parse(message.body);
              addRequestSafe(payload, vehicleType);

              showToast(
                `New ride request: ${payload?.pickupAddress || ""} → ${
                  payload?.dropAddress || ""
                }`,
                "info"
              );
            } catch (e) {
              console.error("Error parsing stomp message", e);
            }
          });

          subsRef.current.push(sub1);

          // ✅ Subscribe vehicle-specific topic
          const sub2 = stompClient.subscribe(`/topic/driver/${vehicleType}`, (message) => {
            try {
              const payload = JSON.parse(message.body);
              addRequestSafe(payload, vehicleType);

              showToast(
                `New ${vehicleType} ride request: ${payload?.pickupAddress || ""} → ${
                  payload?.dropAddress || ""
                }`,
                "info"
              );
            } catch (e) {
              console.error("Error parsing stomp message", e);
            }
          });

          subsRef.current.push(sub2);
        };

        stompClient.onStompError = (frame) => {
          console.error("STOMP error", frame);
        };

        stompClient.activate();
        stompRef.current = stompClient;
      } catch (e) {
        console.error("Failed to load driver profile or pending requests", e);
        if (mounted) setLoading(false);
      }
    };

    loadDriverAndRequests();

    return () => {
      mounted = false;

      // ✅ cleanup subscriptions
      subsRef.current.forEach((sub) => {
        try {
          sub.unsubscribe();
        } catch (e) {
          console.error("Error unsubscribing", e);
        }
      });
      subsRef.current = [];

      // ✅ cleanup stomp
      try {
        stompRef.current?.deactivate();
      } catch (e) {
        console.error("Error deactivating STOMP", e);
      }
    };
  }, [userId]);


  const [activeModalRequest, setActiveModalRequest] = useState(null);

  const openAcceptModal = (request) => {
    setActiveModalRequest(request);
  };

  const closeModal = () => {
    setActiveModalRequest(null);
  };

  // ✅ Accept Ride
  const handleConfirmAccept = async (request) => {
    try {
      if (!driverProfile?.email) {
        showToast("Driver profile missing. Please refresh or re-login.", "error");
        return;
      }

      if (driverProfile?.approvalStatus !== "APPROVED") {
        showToast("Your driver profile is not approved to accept bookings.", "error");
        return;
      }

      if (!driverProfile?.vehicle) {
        showToast("No vehicle found on your profile. Please add vehicle details.", "error");
        return;
      }

      if (driverProfile.vehicle.status !== "AVAILABLE") {
        showToast("Your vehicle is not available to accept rides. Free it first.", "error");
        return;
      }

      const acceptedAtIso = new Date().toISOString();

      await bookingService.acceptBooking(
        request.id,
        acceptedAtIso,
        driverProfile?.email
      );

      showToast("✅ Ride accepted — assigned to you", "success");

      // remove accepted request
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      closeModal();
    } catch (error) {
      console.error("Error accepting ride:", error, error?.response?.data);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message ||
        "Failed to accept ride";

      showToast(msg, "error");
    }
  };

  // ✅ Reject Ride (optional backend support)
  const handleReject = async (requestId) => {
    try {
      await bookingService.rejectBooking(requestId);
      showToast("Ride rejected", "info");
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      console.error("Error rejecting ride:", error);
      showToast("Failed to reject ride", "error");
    }
  };

  // ===================== UI =====================

  if (loading) {
    return (
      <div className="driver-section-card">
        <h3 className="driver-section-title">Pending Ride Requests</h3>
        <div className="driver-section-content skeleton" style={{ height: "60px" }}>
          <div className="skeleton-shimmer"></div>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="driver-section-card">
        <h3 className="driver-section-title">Pending Ride Requests</h3>
        <div className="driver-section-content empty">
          {driverVehicleType ? (
            <p className="text-secondary">No pending ride requests.</p>
          ) : (
            <p className="text-secondary">
              No vehicle configured — submit your vehicle details to start receiving ride requests.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="driver-section-card">
      <h3 className="driver-section-title">Pending Ride Requests</h3>

      <div className="driver-section-content">
        <div className="pending-requests-list">
          {requests.map((request) => (
            <div key={request.id} className="pending-request-item">
              <div className="request-details">
                <div className="request-route">
                  <div className="request-location">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{request.pickupAddress}</span>
                  </div>

                  <div className="request-location">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{request.dropAddress}</span>
                  </div>
                </div>

                <div className="request-info">
                  <span className="request-fare">₹{request.totalCost}</span>
                  <span className="request-distance">{request.distanceKm} km</span>
                  <span className="badge badge-secondary ml-sm">
                    {request.requestedVehicleType || "-"}
                  </span>
                </div>
              </div>

              <div className="request-actions">
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => openAcceptModal(request)}
                >
                  Accept
                </button>

                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleReject(request.id)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Modal for confirming acceptance */}
      {activeModalRequest && (
        <RideRequestModal
          request={activeModalRequest}
          driverProfile={driverProfile}
          onClose={closeModal}
          onConfirm={() => handleConfirmAccept(activeModalRequest)}
        />
      )}
    </div>
  );
}

export default PendingRideRequests;
