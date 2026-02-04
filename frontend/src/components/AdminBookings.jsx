import { useState, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { bookingService } from "../services/bookingService";

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const stompRef = useRef(null);

  useEffect(() => {
    fetchBookings();
    setupStomp();
    return () => {
      try {
        stompRef.current && stompRef.current.deactivate();
      } catch (e) {}
    };
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getAllBookings();
      setBookings(data || []);
      setLoading(false);
    } catch (e) {
      console.error("Error fetching bookings", e);
      setLoading(false);
    }
  };

  const setupStomp = () => {
    try {
      const backendBase =
        window.location.hostname === "localhost"
          ? `${window.location.protocol}//${window.location.hostname}:8080`
          : window.location.origin;
      const authToken = localStorage.getItem("authToken");
      const stompClient = new Client({
        webSocketFactory: () => new SockJS(`${backendBase}/api/ws`),
        connectHeaders: {
          Authorization: authToken ? `Bearer ${authToken}` : "",
        },
        reconnectDelay: 5000,
      });
      stompClient.onConnect = () => {
        stompClient.subscribe("/topic/bookings", (message) => {
          try {
            const payload = JSON.parse(message.body);
            // update or insert
            setBookings((prev) => {
              const idx = prev.findIndex((b) => b.id === payload.id);
              if (idx === -1) return [payload, ...prev];
              const copy = [...prev];
              copy[idx] = payload;
              return copy;
            });
          } catch (e) {
            console.error("Error parsing booking update", e);
          }
        });
      };
      stompClient.activate();
      stompRef.current = stompClient;
    } catch (e) {
      console.error("Failed to setup STOMP for AdminBookings", e);
    }
  };

  if (loading) return <div className="glass-card">Loading bookings...</div>;

  return (
    <div className="glass-card">
      <h3 className="section-title">All Bookings</h3>
      {bookings.length === 0 ? (
        <div className="text-secondary">No bookings yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-md">Code</th>
                <th className="p-md">Customer</th>
                <th className="p-md">Driver</th>
                <th className="p-md">Pickup</th>
                <th className="p-md">Drop</th>
                <th className="p-md">Status</th>
                <th className="p-md">Created</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b hover:bg-white/5">
                  <td className="p-md">{b.bookingCode}</td>
                  <td className="p-md">{b.userId}</td>
                  <td className="p-md">{b.driverName || "-"}</td>
                  <td className="p-md">{b.pickupAddress}</td>
                  <td className="p-md">{b.dropAddress}</td>
                  <td className="p-md">{b.status}</td>
                  <td className="p-md">
                    {new Date(b.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminBookings;
