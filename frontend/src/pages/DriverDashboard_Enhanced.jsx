// import React, { useState, useEffect, useRef, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   Popup,
//   Polyline,
// } from "react-leaflet";
// import L from "leaflet";
// import axios from "axios";
// import Navbar from "../components/Navbar";
// import "./DriverDashboard.css";

// const API_BASE = "http://localhost:8080/api";
// const WS_URL = "ws://localhost:8080/ws";

// const pickupIcon = L.icon({
//   iconUrl:
//     "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-blue.png",
//   shadowUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
//   popupAnchor: [1, -34],
//   shadowSize: [41, 41],
// });

// const dropoffIcon = L.icon({
//   iconUrl:
//     "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-red.png",
//   shadowUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
//   popupAnchor: [1, -34],
//   shadowSize: [41, 41],
// });

// function DriverDashboard_Enhanced({ user, onLogout }) {
//   const navigate = useNavigate();
//   const wsRef = useRef(null);

//   const [view, setView] = useState("pending"); // 'pending', 'active', 'history'
//   const [pendingRides, setPendingRides] = useState([]);
//   const [activeRide, setActiveRide] = useState(null);
//   const [rideHistory, setRideHistory] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [mapCenter, setMapCenter] = useState([40.7128, -74.006]);
//   const [cancelReason, setCancelReason] = useState("");
//   const [showCancelModal, setShowCancelModal] = useState(false);
//   const [showConfirmAction, setShowConfirmAction] = useState(null);

//   const token = localStorage.getItem("authToken");
//   const vehicleType = localStorage.getItem("vehicle_type") || "sedan";

//   const setupWebSocket = useCallback(() => {
//     try {
//       wsRef.current = new WebSocket(WS_URL);

//       wsRef.current.onopen = () => {
//         console.log("WebSocket connected");
//         const driverId = localStorage.getItem("user_id");
//         wsRef.current.send(
//           JSON.stringify({
//             action: "SUBSCRIBE",
//             destination: `/topic/driver/${driverId}`,
//           }),
//         );
//       };

//       wsRef.current.onmessage = (event) => {
//         try {
//           const message = JSON.parse(event.data);
//           if (message.body) {
//             const update = JSON.parse(message.body);
//             console.log("Driver update received:", update);

//             if (update.status === "PENDING" || update.status === "ACCEPTED") {
//               setActiveRide(update);
//             }
//           }
//         } catch (err) {
//           console.error("Error parsing WebSocket message:", err);
//         }
//       };

//       wsRef.current.onerror = (error) => {
//         console.error("WebSocket error:", error);
//         setError("Real-time connection lost. Updates may be delayed.");
//       };
//     } catch (err) {
//       console.error("WebSocket setup failed:", err);
//     }
//   }, []);

//   const fetchPendingRides = useCallback(async () => {
//     try {
//       const response = await axios.get(`${API_BASE}/rides/pending`, {
//         params: { vehicleType },
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setPendingRides(response.data);
//     } catch (err) {
//       console.error("Failed to fetch pending rides:", err);
//     }
//   }, [token, vehicleType]);

//   const fetchActiveRide = useCallback(async () => {
//     try {
//       const response = await axios.get(`${API_BASE}/rides/active`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setActiveRide(response.data);
//       if (response.data.pickupLat && response.data.pickupLng) {
//         setMapCenter([response.data.pickupLat, response.data.pickupLng]);
//       }
//     } catch {
//       console.log("No active ride");
//     }
//   }, [token]);

//   const fetchRideHistory = useCallback(async () => {
//     try {
//       const response = await axios.get(`${API_BASE}/rides/driver/history`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setRideHistory(response.data);
//       setLoading(false);
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to fetch history");
//       setLoading(false);
//     }
//   }, [token]);

//   useEffect(() => {
//     if (!token) {
//       navigate("/login");
//       return;
//     }

//     // eslint-disable-next-line
//     fetchPendingRides();
//     fetchActiveRide();
//     fetchRideHistory();
//     setupWebSocket();

//     const interval = setInterval(() => {
//       if (view === "pending") {
//         fetchPendingRides();
//       }
//     }, 10000); // Refresh every 10 seconds

//     return () => {
//       clearInterval(interval);
//       if (wsRef.current) {
//         wsRef.current.close();
//       }
//     };
//   }, [
//     token,
//     navigate,
//     view,
//     fetchPendingRides,
//     fetchActiveRide,
//     fetchRideHistory,
//     setupWebSocket,
//   ]);

//   const handleAcceptRide = async (rideId) => {
//     try {
//       const response = await axios.put(
//         `${API_BASE}/rides/${rideId}/accept`,
//         {},
//         { headers: { Authorization: `Bearer ${token}` } },
//       );
//       setActiveRide(response.data);
//       setPendingRides(pendingRides.filter((r) => r.bookingId !== rideId));
//       setView("active");
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to accept ride");
//     }
//   };

//   const handleArrived = async () => {
//     if (!activeRide) return;
//     try {
//       const response = await axios.put(
//         `${API_BASE}/rides/${activeRide.bookingId}/arrived`,
//         {},
//         { headers: { Authorization: `Bearer ${token}` } },
//       );
//       setActiveRide(response.data);
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to update arrival");
//     }
//   };

//   const handleStartRide = async () => {
//     if (!activeRide) return;
//     try {
//       const response = await axios.put(
//         `${API_BASE}/rides/${activeRide.bookingId}/start`,
//         {},
//         { headers: { Authorization: `Bearer ${token}` } },
//       );
//       setActiveRide(response.data);
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to start ride");
//     }
//   };

//   const handleCompleteRide = async () => {
//     if (!activeRide) return;
//     try {
//       await axios.put(
//         `${API_BASE}/rides/${activeRide.bookingId}/complete`,
//         { finalLat: 40.7128, finalLng: -74.006 },
//         { headers: { Authorization: `Bearer ${token}` } },
//       );
//       setActiveRide(null);
//       fetchRideHistory();
//       setView("history");
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to complete ride");
//     }
//   };

//   const handleCancelRide = async () => {
//     if (!activeRide || !cancelReason.trim()) {
//       setError("Please provide a cancellation reason");
//       return;
//     }

//     try {
//       await axios.put(
//         `${API_BASE}/rides/${activeRide.bookingId}/cancel`,
//         { reason: cancelReason },
//         { headers: { Authorization: `Bearer ${token}` } },
//       );
//       setActiveRide(null);
//       setShowCancelModal(false);
//       setCancelReason("");
//       fetchPendingRides();
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to cancel ride");
//     }
//   };

//   const getStatusBadgeClass = (status) => {
//     const statusMap = {
//       PENDING: "badge-warning",
//       ACCEPTED: "badge-info",
//       ONGOING: "badge-danger",
//       COMPLETED: "badge-success",
//       CANCELLED: "badge-secondary",
//     };
//     return statusMap[status] || "badge-secondary";
//   };

//   const formatDate = (isoString) => {
//     if (!isoString) return "-";
//     return new Date(isoString).toLocaleDateString();
//   };

//   if (loading) {
//     return (
//       <div className="app-container">
//         <Navbar user={user} onLogout={onLogout} />
//         <div className="loading">Loading...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="app-container">
//       <Navbar user={user} onLogout={onLogout} />

//       <div className="content-wrapper">
//         <h1 className="text-gradient mb-lg">Driver Dashboard</h1>

//         {/* View Tabs */}
//         <div className="driver-tabs mb-lg">
//           <button
//             className={`driver-tab ${view === "pending" ? "active" : ""}`}
//             onClick={() => setView("pending")}
//           >
//             Pending Requests ({pendingRides.length})
//           </button>
//           <button
//             className={`driver-tab ${view === "active" ? "active" : ""}`}
//             onClick={() => setView("active")}
//           >
//             Active Ride
//           </button>
//           <button
//             className={`driver-tab ${view === "history" ? "active" : ""}`}
//             onClick={() => setView("history")}
//           >
//             History
//           </button>
//         </div>

//         {error && <div className="alert alert-error">{error}</div>}

//         {/* Pending Rides Tab */}
//         {view === "pending" && (
//           <div className="pending-rides-container">
//             {pendingRides.length > 0 ? (
//               <div className="rides-grid">
//                 {pendingRides.map((ride) => (
//                   <div key={ride.bookingId} className="ride-request-card">
//                     <div className="card-header">
//                       <span
//                         className={`badge ${getStatusBadgeClass(ride.status)}`}
//                       >
//                         {ride.status}
//                       </span>
//                       <span className="booking-code">{ride.bookingCode}</span>
//                     </div>

//                     <div className="card-body">
//                       <h3>{ride.customerName}</h3>
//                       <p className="phone">📱 {ride.customerPhone}</p>

//                       <div className="location-section">
//                         <p className="location-label">📍 Pickup</p>
//                         <p className="location-value">{ride.pickupAddress}</p>
//                       </div>

//                       <div className="location-section">
//                         <p className="location-label">📍 Dropoff</p>
//                         <p className="location-value">{ride.dropAddress}</p>
//                       </div>

//                       <div className="ride-stats">
//                         <span>{ride.distance?.toFixed(1)} km</span>
//                         <span>₹{ride.fare?.toFixed(0)}</span>
//                         <span>
//                           {ride.passengerCount} passenger
//                           {ride.passengerCount !== 1 ? "s" : ""}
//                         </span>
//                       </div>
//                     </div>

//                     <div className="card-footer">
//                       <button
//                         className="btn btn-primary btn-block"
//                         onClick={() => handleAcceptRide(ride.bookingId)}
//                       >
//                         Accept Ride
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="empty-state">
//                 <p>No pending ride requests</p>
//                 <p className="text-secondary">Check back soon!</p>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Active Ride Tab */}
//         {view === "active" && (
//           <div className="active-ride-container">
//             {activeRide ? (
//               <>
//                 <div className="map-container">
//                   <MapContainer
//                     center={mapCenter}
//                     zoom={13}
//                     style={{ height: "100%", width: "100%" }}
//                   >
//                     <TileLayer
//                       url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                       attribution="&copy; OpenStreetMap contributors"
//                     />
//                     {activeRide.pickupLat && (
//                       <Marker
//                         position={[activeRide.pickupLat, activeRide.pickupLng]}
//                         icon={pickupIcon}
//                       >
//                         <Popup>Pickup: {activeRide.pickupAddress}</Popup>
//                       </Marker>
//                     )}
//                     {activeRide.dropLat && (
//                       <Marker
//                         position={[activeRide.dropLat, activeRide.dropLng]}
//                         icon={dropoffIcon}
//                       >
//                         <Popup>Dropoff: {activeRide.dropAddress}</Popup>
//                       </Marker>
//                     )}
//                   </MapContainer>
//                 </div>

//                 <div className="ride-details">
//                   <div className="status-banner">
//                     <h2>
//                       Status:{" "}
//                       <span
//                         className={`badge ${getStatusBadgeClass(activeRide.status)}`}
//                       >
//                         {activeRide.status}
//                       </span>
//                     </h2>
//                   </div>

//                   <div className="customer-section">
//                     <h3>Customer Information</h3>
//                     <div className="info-grid">
//                       <div className="info-item">
//                         <span className="label">Name:</span>
//                         <span className="value">{activeRide.customerName}</span>
//                       </div>
//                       <div className="info-item">
//                         <span className="label">Phone:</span>
//                         <span className="value">
//                           {activeRide.customerPhone}
//                         </span>
//                       </div>
//                       <div className="info-item">
//                         <span className="label">Passengers:</span>
//                         <span className="value">
//                           {activeRide.passengerCount}
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="ride-info">
//                     <h3>Ride Details</h3>
//                     <div className="info-grid">
//                       <div className="info-item">
//                         <span className="label">Pickup:</span>
//                         <span className="value">
//                           {activeRide.pickupAddress}
//                         </span>
//                       </div>
//                       <div className="info-item">
//                         <span className="label">Dropoff:</span>
//                         <span className="value">{activeRide.dropAddress}</span>
//                       </div>
//                       <div className="info-item">
//                         <span className="label">Distance:</span>
//                         <span className="value">
//                           {activeRide.distance?.toFixed(2)} km
//                         </span>
//                       </div>
//                       <div className="info-item">
//                         <span className="label">Fare:</span>
//                         <span className="value amount">
//                           ₹{activeRide.fare?.toFixed(2)}
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="actions">
//                     {activeRide.status === "ACCEPTED" && (
//                       <>
//                         <button
//                           className="btn btn-primary"
//                           onClick={() => setShowConfirmAction("arrived")}
//                         >
//                           I've Arrived at Pickup
//                         </button>
//                         <button
//                           className="btn btn-danger"
//                           onClick={() => setShowCancelModal(true)}
//                         >
//                           Cancel Ride
//                         </button>
//                       </>
//                     )}
//                     {activeRide.status === "ARRIVED" && (
//                       <>
//                         <button
//                           className="btn btn-success"
//                           onClick={() => setShowConfirmAction("start")}
//                         >
//                           Start Ride
//                         </button>
//                         <button
//                           className="btn btn-danger"
//                           onClick={() => setShowCancelModal(true)}
//                         >
//                           Cancel Ride
//                         </button>
//                       </>
//                     )}
//                     {activeRide.status === "ONGOING" && (
//                       <button
//                         className="btn btn-success"
//                         onClick={() => setShowConfirmAction("complete")}
//                       >
//                         Complete Ride
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               </>
//             ) : (
//               <div className="no-active-ride">
//                 <p>No active ride</p>
//                 <button
//                   className="btn btn-primary"
//                   onClick={() => setView("pending")}
//                 >
//                   View Pending Requests
//                 </button>
//               </div>
//             )}
//           </div>
//         )}

//         {/* History Tab */}
//         {view === "history" && (
//           <div className="history-container">
//             {rideHistory.length > 0 ? (
//               <div className="rides-list">
//                 {rideHistory.map((ride) => (
//                   <div key={ride.bookingId} className="ride-card">
//                     <div className="ride-header">
//                       <span
//                         className={`badge ${getStatusBadgeClass(ride.status)}`}
//                       >
//                         {ride.status}
//                       </span>
//                       <span className="date">{formatDate(ride.createdAt)}</span>
//                     </div>
//                     <div className="ride-body">
//                       <div className="customer-info">
//                         <p className="name">{ride.customerName}</p>
//                         <p className="phone">{ride.customerPhone}</p>
//                       </div>
//                       <div className="location">
//                         <p className="pickup">{ride.pickupAddress}</p>
//                         <p className="arrow">↓</p>
//                         <p className="dropoff">{ride.dropAddress}</p>
//                       </div>
//                       <div className="ride-meta">
//                         <span>{ride.distance?.toFixed(2)} km</span>
//                         <span>₹{ride.fare?.toFixed(2)}</span>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p className="empty-state">No completed rides yet</p>
//             )}
//           </div>
//         )}

//         {/* Cancel Modal */}
//         {showCancelModal && (
//           <div className="modal-overlay">
//             <div className="modal">
//               <h2>Cancel Ride</h2>
//               <textarea
//                 placeholder="Why are you cancelling?"
//                 value={cancelReason}
//                 onChange={(e) => setCancelReason(e.target.value)}
//               />
//               <div className="modal-actions">
//                 <button
//                   className="btn btn-secondary"
//                   onClick={() => setShowCancelModal(false)}
//                 >
//                   Keep Ride
//                 </button>
//                 <button className="btn btn-danger" onClick={handleCancelRide}>
//                   Cancel Ride
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Confirm Action Modal */}
//         {showConfirmAction && (
//           <div className="modal-overlay">
//             <div className="modal">
//               <h2>Confirm Action</h2>
//               <p>
//                 Are you sure you want to{" "}
//                 {showConfirmAction === "arrived" && "mark yourself as arrived?"}
//                 {showConfirmAction === "start" && "start the ride?"}
//                 {showConfirmAction === "complete" && "complete the ride?"}
//               </p>
//               <div className="modal-actions">
//                 <button
//                   className="btn btn-secondary"
//                   onClick={() => setShowConfirmAction(null)}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   className="btn btn-primary"
//                   onClick={() => {
//                     if (showConfirmAction === "arrived") handleArrived();
//                     else if (showConfirmAction === "start") handleStartRide();
//                     else if (showConfirmAction === "complete")
//                       handleCompleteRide();
//                     setShowConfirmAction(null);
//                   }}
//                 >
//                   Confirm
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default DriverDashboard_Enhanced;
