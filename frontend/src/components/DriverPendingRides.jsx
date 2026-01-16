import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";

export default function DriverPendingRides({ onAction }) {
  const [rides, setRides] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // ================= LOAD PENDING RIDES =================
  const loadPendingRides = async () => {
    try {
      const res = await apiFetch("/api/driver/bookings/pending");

      // API reachable → clear error
      setError("");

      if (!res || !res.ok) {
        throw new Error("Pending rides API failed");
      }

      const text = await res.text();

      // 👇 Empty body = no pending rides (VALID STATE)
      if (!text) {
        setRides([]);
        return;
      }

      const data = JSON.parse(text);
      setRides(Array.isArray(data) ? data : []);

    } catch (err) {
      console.error("Pending rides error:", err);
      setError("Unable to load pending ride requests");
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  // ================= ACTIONS =================
  const acceptRide = async (id) => {
    await apiFetch(`/api/driver/bookings/${id}/accept`, {
      method: "POST",
    });

    // refresh both sections
    loadPendingRides();
    onAction?.();
  };

  const rejectRide = async (id) => {
    await apiFetch(`/api/driver/bookings/${id}/reject`, {
      method: "POST",
    });

    loadPendingRides();
  };

  // ================= INIT + POLLING =================
  useEffect(() => {
    loadPendingRides();
    const interval = setInterval(loadPendingRides, 5000);
    return () => clearInterval(interval);
  }, []);

  // ================= UI =================
  if (loading) {
    return <p className="text-gray-500">Loading pending rides...</p>;
  }

  if (error) {
    return <p className="text-red-500 text-sm">{error}</p>;
  }

  if (rides.length === 0) {
    return (
      <p className="text-gray-500 text-sm">
        No pending ride requests.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {rides.map((ride) => (
        <div
          key={ride.id}
          className="border rounded-lg p-4 flex justify-between items-center"
        >
          <div>
            <p><b>Pickup:</b> {ride.pickup}</p>
            <p><b>Drop:</b> {ride.drop || ride.dropLocation || "—"}</p>
            <p className="text-sm text-gray-500">
              Passengers: {ride.passengerCount}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => acceptRide(ride.id)}
              className="bg-green-600 text-white px-3 py-1 rounded"
            >
              Accept
            </button>
            <button
              onClick={() => rejectRide(ride.id)}
              className="bg-red-600 text-white px-3 py-1 rounded"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
