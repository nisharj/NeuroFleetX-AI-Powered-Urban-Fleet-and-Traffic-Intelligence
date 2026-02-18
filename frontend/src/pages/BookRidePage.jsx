import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/Layout/DashboardLayout";
import {
  FaMapMarkerAlt,
  FaLocationArrow,
  FaCalendarAlt,
  FaClock,
  FaUsers,
  FaCar,
  FaRoad,
  FaRoute,
} from "react-icons/fa";
import { apiFetch } from "../api/api";
// import MapPicker from "../components/maps/MapPicker";
import LocationSearch from "../components/maps/LocationSearch";
import RouteMap from "../components/RouteMap";
import RouteVisualization from "../components/RouteVisualization";
import { reverseGeocode } from "../utils/googleMapsLoader";

// ================= HELPERS =================
const getTodayDate = () => {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
};

const getCurrentTime = () => {
  const now = new Date();
  return now.toTimeString().slice(0, 5); // HH:mm
};

export default function BookRidePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    pickup: "",
    pickupLat: "",
    pickupLng: "",
    drop: "",
    dropLat: "",
    dropLng: "",
    vehicleType: "",
    rideType: "NOW",
    rideDate: getTodayDate(),
    rideTime: getCurrentTime(),
    passengerCount: 1,
    contactNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [routeInfo, setRouteInfo] = useState({
    distanceKm: null,
    durationMin: null,
  });
  const [optimizedRoutes, setOptimizedRoutes] = useState(null);
  const [showRoutePreview, setShowRoutePreview] = useState(false);

  // ================= CALCULATE FARE =================
  const calculateEstimatedFare = () => {
    if (!routeInfo.distanceKm || !form.vehicleType) return null;

    const baseFares = {
      BIKE: 20,
      AUTO: 30,
      CAR: 50,
    };

    const perKmRates = {
      BIKE: 8,
      AUTO: 12,
      CAR: 15,
    };

    const baseFare = baseFares[form.vehicleType] || 50;
    const perKmRate = perKmRates[form.vehicleType] || 15;

    const fare = baseFare + routeInfo.distanceKm * perKmRate;
    return Math.round(fare);
  };

  const estimatedFare = calculateEstimatedFare();

  // ================= HANDLE CHANGE =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "rideType" && value === "NOW") {
      setForm({
        ...form,
        rideType: value,
        rideDate: getTodayDate(),
        rideTime: getCurrentTime(),
      });
    } else if (name === "rideType" && value === "SCHEDULED") {
      setForm({
        ...form,
        rideType: value,
        rideDate: "",
        rideTime: "",
      });
    } else {
      setForm({ ...form, [name]: value });
    }

    setErrors({ ...errors, [name]: "" });
    setApiError("");
  };

  //================== USE CURRENT LOCATION =================
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Use OpenStreetMap reverse geocoding
        const address = await reverseGeocode(lat, lng);

        setForm((prev) => ({
          ...prev,
          pickup: address,
          pickupLat: lat,
          pickupLng: lng,
        }));
      },
      () => alert("Unable to fetch location"),
    );
  };

  //================== PREVIEW ROUTE OPTIMIZATION =================
  const handlePreviewRoute = async () => {
    if (!form.pickupLat || !form.pickupLng || !form.dropLat || !form.dropLng) {
      alert("Please select both pickup and drop locations first");
      return;
    }

    try {
      const res = await apiFetch(
        `/api/routes/optimize?pickupLat=${form.pickupLat}&pickupLng=${form.pickupLng}&dropLat=${form.dropLat}&dropLng=${form.dropLng}`,
      );

      if (res.ok) {
        const data = await res.json();
        setOptimizedRoutes(data);
        setShowRoutePreview(true);

        if (data.bestRoute) {
          setRouteInfo({
            distanceKm: data.bestRoute.distance / 1000,
            durationMin: data.bestRoute.duration / 60,
          });
        }
      } else {
        alert("Failed to fetch route optimization");
      }
    } catch (err) {
      console.error("Route optimization error:", err);
      alert("Error fetching route preview");
    }
  };

  // ================= VALIDATION =================
  const validateForm = () => {
    const newErrors = {};

    if (!form.pickup.trim()) newErrors.pickup = "Pickup location is required";
    if (!form.drop.trim()) newErrors.drop = "Drop location is required";

    if (!/^\d{10}$/.test(form.contactNumber)) {
      newErrors.contactNumber = "Enter a valid 10-digit mobile number";
    }

    if (!form.pickupLat || !form.pickupLng) {
      newErrors.pickup = "Please select pickup location";
    }

    if (!form.dropLat || !form.dropLng) {
      newErrors.drop = "Select drop location";
    }

    if (!form.vehicleType) {
      newErrors.vehicleType = "Please select a vehicle type";
    }

    if (form.passengerCount < 1 || form.passengerCount > 6) {
      newErrors.passengerCount = "Passenger count must be between 1 and 6";
    }

    if (form.rideType === "SCHEDULED") {
      if (!form.rideDate) newErrors.rideDate = "Ride date is required";
      if (!form.rideTime) newErrors.rideTime = "Ride time is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setApiError("");

    try {
      let pickupTime;
      if (form.rideType === "NOW") {
        pickupTime = new Date().toISOString();
      } else {
        pickupTime = new Date(
          `${form.rideDate}T${form.rideTime}`,
        ).toISOString();
      }

      const payload = {
        pickupAddress: form.pickup,
        dropAddress: form.drop,
        pickupLatitude: parseFloat(form.pickupLat),
        pickupLongitude: parseFloat(form.pickupLng),
        returnLatitude: parseFloat(form.dropLat),
        returnLongitude: parseFloat(form.dropLng),
        vehicleType: form.vehicleType,
        passengerCount: parseInt(form.passengerCount),
        contactNumber: form.contactNumber,
        pickupTime: pickupTime,
        bookingType: form.rideType.toLowerCase(),
      };

      console.log("Sending booking payload:", payload);

      const res = await apiFetch("/api/bookings", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res || !res.ok) {
        if (res?.status === 401) {
          setApiError("Session expired. Please login again.");
        } else {
          const msg = res ? await res.text() : "";
          setApiError(msg || "Failed to book ride");
        }
        return;
      }

      const result = await res.json();
      console.log("Booking created:", result);

      alert("🚗 Ride booked successfully!");

      // Navigate back to customer dashboard to see active ride
      navigate("/customer");
    } catch (err) {
      console.error("Booking error:", err);
      setApiError("Network error. Please try again. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Book a Ride">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ================= LEFT : FORM ================= */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Ride Details</h2>

          {apiError && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Pickup */}
            <div>
              <label className="flex center-item gap-1 text-sm font-medium mb-2 block">
                <FaMapMarkerAlt className="text-green-600" /> Pickup Location
              </label>
              <LocationSearch
                placeholder="Search pickup location"
                value={form.pickup}
                onSelect={({ address, lat, lng }) => {
                  console.log("Pickup selected:", { address, lat, lng });
                  setForm({
                    ...form,
                    pickup: address,
                    pickupLat: lat,
                    pickupLng: lng,
                  });
                }}
              />
              {form.pickup && (
                <div className="mt-1 text-xs text-green-600">
                  ✓ {form.pickup}
                </div>
              )}

              <button
                type="button"
                onClick={useCurrentLocation}
                className="mt-2 text-sm text-indigo-600 hover:underline"
              >
                Use Current Location
              </button>
              {errors.pickup && (
                <p className="text-red-500 text-xs">{errors.pickup}</p>
              )}
            </div>

            {/* Drop */}
            <div>
              <label className="flex center-item gap-1 text-sm font-medium mb-2 block">
                <FaLocationArrow className="text-red-500" />
                Drop Location
              </label>

              <LocationSearch
                placeholder="Search drop location"
                value={form.drop}
                onSelect={({ address, lat, lng }) => {
                  console.log("Drop selected:", { address, lat, lng });
                  setForm({
                    ...form,
                    drop: address,
                    dropLat: lat,
                    dropLng: lng,
                  });
                }}
              />
              {form.drop && (
                <div className="mt-1 text-xs text-red-600">✓ {form.drop}</div>
              )}
              {errors.drop && (
                <p className="text-red-500 text-xs">{errors.drop}</p>
              )}
            </div>

            {/* Passenger Count */}
            <div>
              <label className="text-sm font-medium">Passengers</label>
              <select
                name="passengerCount"
                value={form.passengerCount}
                onChange={(e) =>
                  setForm({ ...form, passengerCount: Number(e.target.value) })
                }
                className="border p-2 rounded w-full"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              {errors.passengerCount && (
                <p className="text-red-500 text-xs">{errors.passengerCount}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Vehicle Type</label>
              <select
                name="vehicleType"
                value={form.vehicleType}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              >
                <option value="">Select vehicle</option>
                <option value="BIKE">Bike</option>
                <option value="AUTO">Auto</option>
                <option value="CAR">Car (4-seater)</option>
                <option value="CAR">Car (6-seater)</option>
              </select>
              {errors.vehicleType && (
                <p className="text-red-500 text-xs">{errors.vehicleType}</p>
              )}
            </div>

            {/* Contact Number */}
            <div>
              <label className="text-sm font-medium">Contact Number</label>
              <input
                name="contactNumber"
                placeholder="10-digit mobile number"
                value={form.contactNumber}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              {errors.contactNumber && (
                <p className="text-red-500 text-xs">{errors.contactNumber}</p>
              )}
            </div>

            {/* Ride Type */}
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="rideType"
                  value="NOW"
                  checked={form.rideType === "NOW"}
                  onChange={handleChange}
                />
                Ride Now
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="rideType"
                  value="SCHEDULED"
                  checked={form.rideType === "SCHEDULED"}
                  onChange={handleChange}
                />
                Schedule Ride
              </label>
            </div>

            {/* Date & Time */}
            {form.rideType === "SCHEDULED" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm mb-1">
                    <FaCalendarAlt /> Ride Date
                  </label>
                  <input
                    type="date"
                    name="rideDate"
                    value={form.rideDate}
                    onChange={handleChange}
                    className="border p-2 rounded w-full"
                  />
                  {errors.rideDate && (
                    <p className="text-red-500 text-xs">{errors.rideDate}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm mb-1">
                    <FaClock /> Ride Time
                  </label>
                  <input
                    type="time"
                    name="rideTime"
                    value={form.rideTime}
                    onChange={handleChange}
                    className="border p-2 rounded w-full"
                  />
                  {errors.rideTime && (
                    <p className="text-red-500 text-xs">{errors.rideTime}</p>
                  )}
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePreviewRoute}
                disabled={!form.pickupLat || !form.dropLat}
                className="flex-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:bg-gray-200 disabled:text-gray-400 transition"
              >
                <FaRoute /> Preview Route
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-3 rounded-lg text-white font-medium ${
                  loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loading ? "Booking..." : "Confirm Ride"}
              </button>
            </div>
          </form>
        </div>

        {/* ================= RIGHT : MAP & SUMMARY ================= */}
        <div className="space-y-6">
          {/* Route Map */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div style={{ height: "350px" }}>
              {showRoutePreview && optimizedRoutes ? (
                <RouteVisualization
                  pickup={{
                    lat: parseFloat(form.pickupLat),
                    lng: parseFloat(form.pickupLng),
                  }}
                  drop={{
                    lat: parseFloat(form.dropLat),
                    lng: parseFloat(form.dropLng),
                  }}
                  routes={optimizedRoutes}
                />
              ) : form.pickupLat &&
                form.pickupLng &&
                form.dropLat &&
                form.dropLng ? (
                <RouteMap
                  pickup={{
                    lat: parseFloat(form.pickupLat),
                    lng: parseFloat(form.pickupLng),
                  }}
                  drop={{
                    lat: parseFloat(form.dropLat),
                    lng: parseFloat(form.dropLng),
                  }}
                  onRouteInfoChange={setRouteInfo}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-100 text-gray-500">
                  <div className="text-center">
                    <FaMapMarkerAlt className="text-4xl mb-2 mx-auto" />
                    <p>Select pickup and drop locations to view route</p>
                  </div>
                </div>
              )}
            </div>
            {showRoutePreview && (
              <div className="p-3 bg-indigo-50 border-t">
                <button
                  onClick={() => setShowRoutePreview(false)}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  ← Back to simple view
                </button>
              </div>
            )}
          </div>

          {/* Ride Summary */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Ride Summary</h2>

            <div className="space-y-3 text-sm">
              {/* Pickup Location */}
              <div className="flex items-start gap-2">
                <FaMapMarkerAlt className="text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-600">Pickup</div>
                  <div className="font-medium">
                    {form.pickup || "Not selected"}
                  </div>
                </div>
              </div>

              {/* Drop Location */}
              <div className="flex items-start gap-2">
                <FaLocationArrow className="text-red-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-600">Drop</div>
                  <div className="font-medium">
                    {form.drop || "Not selected"}
                  </div>
                </div>
              </div>

              <hr className="my-3" />

              {/* Trip Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="text-blue-600" />
                  <div>
                    <div className="text-xs text-gray-600">Date</div>
                    <div className="font-medium">{form.rideDate || "—"}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <FaClock className="text-blue-600" />
                  <div>
                    <div className="text-xs text-gray-600">Time</div>
                    <div className="font-medium">{form.rideTime || "—"}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <FaUsers className="text-purple-600" />
                  <div>
                    <div className="text-xs text-gray-600">Passengers</div>
                    <div className="font-medium">{form.passengerCount}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <FaCar className="text-orange-600" />
                  <div>
                    <div className="text-xs text-gray-600">Vehicle</div>
                    <div className="font-medium">
                      {form.vehicleType || "Not selected"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Route Info */}
              {routeInfo.distanceKm && routeInfo.durationMin && (
                <>
                  <hr className="my-3" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <FaRoad className="text-indigo-600" />
                      <div>
                        <div className="text-xs text-gray-600">Distance</div>
                        <div className="font-medium">
                          {routeInfo.distanceKm.toFixed(2)} km
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <FaClock className="text-indigo-600" />
                      <div>
                        <div className="text-xs text-gray-600">Duration</div>
                        <div className="font-medium">
                          {Math.round(routeInfo.durationMin)} min
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <hr className="my-3" />

              {/* Fare */}
              <div className="flex justify-between items-center font-semibold text-lg">
                <span>Estimated Fare</span>
                <span className="text-green-600">
                  {estimatedFare ? `₹${estimatedFare}` : "—"}
                </span>
              </div>

              {estimatedFare ? (
                <p className="text-xs text-gray-500">
                  Base fare + ₹
                  {form.vehicleType === "BIKE"
                    ? "8"
                    : form.vehicleType === "AUTO"
                      ? "12"
                      : "15"}
                  /km × {routeInfo.distanceKm?.toFixed(2) || 0} km
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  {!form.vehicleType
                    ? "Select vehicle type to see fare"
                    : !routeInfo.distanceKm
                      ? "Select locations to calculate fare"
                      : "Calculating..."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
