import React from "react";

function RideRequestModal({ request, driverProfile, onClose, onConfirm }) {
  if (!request) return null;

  const secondsAgo = request.broadcastedAt
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(request.broadcastedAt).getTime()) / 1000
        )
      )
    : null;

  const formatMoney = (v) => {
    const n = Number(v);
    if (Number.isNaN(n)) return "-";
    return n.toFixed(2);
  };

  const formatKm = (v) => {
    const n = Number(v);
    if (Number.isNaN(n)) return "-";
    return n.toFixed(2);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h3 style={{ marginBottom: 10 }}>🚖 New Ride Request</h3>

        <div style={{ display: "grid", gap: 8 }}>
          <p>
            <strong>Pickup:</strong> {request.pickupAddress || "-"}
          </p>
          <p>
            <strong>Drop:</strong> {request.dropAddress || "-"}
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <p>
              <strong>Distance:</strong> {formatKm(request.distanceKm)} km
            </p>
            <p>
              <strong>Fare:</strong> ₹{formatMoney(request.totalCost)}
            </p>
            {request.requestedVehicleType && (
              <p>
                <strong>Type:</strong>{" "}
                <span className="badge badge-secondary">
                  {request.requestedVehicleType}
                </span>
              </p>
            )}
          </div>

          {secondsAgo !== null && (
            <p className="text-secondary" style={{ fontSize: 13 }}>
              Requested {secondsAgo}s ago
            </p>
          )}
        </div>

        {/* Driver info */}
        {driverProfile && (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              background: "#f8fafc",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
            }}
          >
            <p style={{ fontSize: 14, marginBottom: 6 }}>
              Accepting as: <strong>{driverProfile.email}</strong>
            </p>

            {driverProfile.vehicle ? (
              <>
                <p style={{ fontSize: 14, marginBottom: 4 }}>
                  Vehicle: <strong>{driverProfile.vehicle.name}</strong>
                </p>
                <p style={{ fontSize: 13, color: "#64748B" }}>
                  Status: <strong>{driverProfile.vehicle.status}</strong> | Type:{" "}
                  <strong>{driverProfile.vehicle.type}</strong>
                </p>
              </>
            ) : (
              <p style={{ fontSize: 13, color: "#ef4444" }}>
                ⚠ No vehicle linked to your profile
              </p>
            )}

            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
              (Your driver email + accept timestamp will be sent to the server.)
            </p>
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: 18 }}>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>

          <button className="btn btn-success" onClick={onConfirm}>
            Accept Ride
          </button>
        </div>
      </div>
    </div>
  );
}

export default RideRequestModal;
