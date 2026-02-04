import React from "react";

function RideRequestModal({ request, driverProfile, onClose, onConfirm }) {
  if (!request) return null;

  const secondsAgo = request.broadcastedAt
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(request.broadcastedAt).getTime()) / 1000,
        ),
      )
    : null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h3>New Ride Request</h3>
        <p>
          <strong>Pickup:</strong> {request.pickupAddress}
        </p>
        <p>
          <strong>Drop:</strong> {request.dropAddress}
        </p>
        <p>
          <strong>Distance:</strong> {request.distanceKm || "—"} km
        </p>
        <p>
          <strong>Fare:</strong> ₹{request.totalCost}
        </p>
        {secondsAgo !== null && (
          <p className="text-secondary">Requested {secondsAgo}s ago</p>
        )}

        {driverProfile && (
          <div className="mt-3 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-700">
              Accepting as: <strong>{driverProfile.email}</strong>
            </p>
            {driverProfile.vehicle && (
              <p className="text-sm text-gray-700">
                Vehicle: <strong>{driverProfile.vehicle.name}</strong> —{" "}
                <em>{driverProfile.vehicle.status}</em>
              </p>
            )}
            <p className="text-xs text-gray-500">
              (Your email and accept timestamp will be sent to the server for
              assignment)
            </p>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-success" onClick={onConfirm}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default RideRequestModal;
