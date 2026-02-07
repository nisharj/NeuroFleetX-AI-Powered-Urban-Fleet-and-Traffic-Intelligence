import React, { useState, useEffect, useRef, useCallback } from "react";
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

  const [activeModalRequest, setActiveModalRequest] = useState(null);

  // ✅ Helpers
  const isPendingLike = (status) => ["PENDING", "BROADCASTED"].includes(status);

  const addRequestSafe = useCallback((payload, vehicleType) => {
    if (!payload?.id) return;

    if (payload.status && !isPendingLike(payload.status)) return;

    if (
      vehicleType &&
      payload.requestedVehicleType &&
      payload.requestedVehicleType !== vehicleType
    ) {
      return;
    }

    setRequests((prev) => {
      const exists = prev.some((r) => r.id === payload.id);
      if (exists) return prev;
      return [payload, ...prev];
    });
  }, []);

  // ✅ Load driver profile
  const fetchDriverProfile = useCallback(async () => {
    const profile = await api
      .get("/v1/driver/profile")
      .then((r) => r.data)
      .catch(() => null);

    setDriverProfile(profile || null);

    const vehicleType = profile?.vehicle?.type || null;
    setDriverVehicleType(vehicleType);

    return { profile, vehicleType };
  }, []);

  // ✅ Load pending requests
  const fetchPendingRequests = useCallback(async (vehicleType) => {
    if (!vehicleType) {
      setRequests([]);
      return;
    }

    const data = await bookingService.getPendingBookings(vehicleType);

    const cleaned = (data || []).filter(
      (b) => b && b.id && isPendingLike(b.status) && b.vehicleId == null,
    );

    setRequests(cleaned);
  }, []);

  // ✅ Setup websocket
  const setupWebSocket = useCallback(
    (vehicleType) => {
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
        const sub1 = stompClient.subscribe(
          "/topic/ride-requests",
          (message) => {
            try {
              const payload = JSON.parse(message.body);
              addRequestSafe(payload, vehicleType);

              showToast(
                `New ride request: ${payload?.pickupAddress || ""} → ${
                  payload?.dropAddress || ""
                }`,
                "info",
              );
            } catch (e) {
              console.error("Error parsing stomp message", e);
            }
          },
        );

        subsRef.current.push(sub1);

        const sub2 = stompClient.subscribe(
          `/topic/driver/${vehicleType}`,
          (message) => {
            try {
              const payload = JSON.parse(message.body);
              addRequestSafe(payload, vehicleType);

              showToast(
                `New ${vehicleType} ride request: ${payload?.pickupAddress || ""} → ${
                  payload?.dropAddress || ""
                }`,
                "info",
              );
            } catch (e) {
              console.error("Error parsing stomp message", e);
            }
          },
        );

        subsRef.current.push(sub2);
      };

      stompClient.onStompError = (frame) => {
        console.error("STOMP error", frame);
      };

      stompClient.activate();
      stompRef.current = stompClient;
    },
    [addRequestSafe],
  );

  // ✅ Main loader
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);

        const { vehicleType } = await fetchDriverProfile();
        if (!mounted) return;

        if (!vehicleType) {
          setRequests([]);
          setLoading(false);
          return;
        }

        await fetchPendingRequests(vehicleType);
        if (!mounted) return;

        setupWebSocket(vehicleType);
      } catch (e) {
        console.error("Failed to load pending rides", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;

      subsRef.current.forEach((sub) => {
        try {
          sub.unsubscribe();
        } catch {}
      });
      subsRef.current = [];

      try {
        stompRef.current?.deactivate();
      } catch {}
    };
  }, [userId, fetchDriverProfile, fetchPendingRequests, setupWebSocket]);

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
        showToast(
          "Driver profile missing. Please refresh or re-login.",
          "error",
        );
        return;
      }

      if (driverProfile?.approvalStatus !== "APPROVED") {
        showToast(
          "Your driver profile is not approved to accept bookings.",
          "error",
        );
        return;
      }

      if (!driverProfile?.vehicle) {
        showToast(
          "No vehicle found on your profile. Please add vehicle details.",
          "error",
        );
        return;
      }

      if (driverProfile.vehicle.status !== "AVAILABLE") {
        showToast(
          `Your vehicle is not available (status: ${driverProfile.vehicle.status}). Complete current trip first.`,
          "error",
        );
        return;
      }

      const acceptedAtIso = new Date().toISOString();

      await bookingService.acceptBooking(
        request.id,
        acceptedAtIso,
        driverProfile?.email,
      );

      showToast("✅ Ride accepted — assigned to you", "success");

      // ✅ Remove accepted request
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      closeModal();

      // ✅ refresh profile + pending list
      const { vehicleType } = await fetchDriverProfile();
      await fetchPendingRequests(vehicleType);

      // ✅ notify CurrentRide to refresh automatically
      window.dispatchEvent(new Event("driverRideChanged"));
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

  // ✅ Reject Ride
  const handleReject = async (requestId) => {
    try {
      await bookingService.rejectBooking(requestId);
      showToast("Ride rejected", "info");
      setRequests((prev) => prev.filter((r) => r.id !== requestId));

      // ✅ notify CurrentRide (in case ride changed)
      window.dispatchEvent(new Event("driverRideChanged"));
    } catch (error) {
      console.error("Error rejecting ride:", error);
      showToast("Failed to reject ride", "error");
    }
  };

  // ================= UI =================

  if (loading) {
    return (
      <div className="driver-section-card">
        <h3 className="driver-section-title">Pending Ride Requests</h3>
        <div
          className="driver-section-content skeleton"
          style={{ height: "60px" }}
        >
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
              No vehicle configured — submit your vehicle details to start
              receiving ride requests.
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
                  <span className="request-fare">
                    ₹{Number(request.totalCost || 0).toFixed(2)}
                  </span>
                  <span className="request-distance">
                    {Number(request.distanceKm || 0).toFixed(2)} km
                  </span>
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

      {/* ✅ Modal */}
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
