import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaLocationArrow,
  FaCalendarAlt,
  FaClock,
  FaArrowLeft,
} from "react-icons/fa";
import api from "../services/api";
import LocationSearch from "../components/LocationSearch";
import { showToast } from "../components/Toast";
import RouteMap from "../components/RouteMap";

// ================= HELPERS =================
const getTodayDate = () => new Date().toISOString().split("T")[0];
const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

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

  const [fareInfo, setFareInfo] = useState({
    distanceKm: null,
    estimatedFare: null,
  });

  const [routeSummary, setRouteSummary] = useState({
    distanceKm: null,
    durationMin: null,
  });

  // ✅ prevents infinite updates
  const lastRouteRef = useRef({ distanceKm: null, durationMin: null });

  // ================= ROUTE CHANGE HANDLER =================
  const handleRouteInfoChange = useCallback(({ distanceKm, durationMin }) => {
    if (distanceKm == null || durationMin == null) return;

    // ✅ rounding prevents continuous tiny changes
    const dist = Number(Number(distanceKm).toFixed(3));
    const dur = Number(Number(durationMin).toFixed(2));

    const last = lastRouteRef.current;
    if (last.distanceKm === dist && last.durationMin === dur) return;

    lastRouteRef.current = { distanceKm: dist, durationMin: dur };

    setRouteSummary({ distanceKm: dist, durationMin: dur });
  }, []);

  // ================= FARE CALCULATION =================
  useEffect(() => {
    if (!routeSummary.distanceKm || !form.vehicleType) {
      setFareInfo({ distanceKm: null, estimatedFare: null });
      return;
    }

    const rates = {
      BIKE: 10,
      AUTO: 15,
      SUV: 20,
      SEDAN: 18,
      ELECTRICAL_VEHICLE: 17,
    };

    const rate = rates[form.vehicleType] || 20;
    const distance = Number(routeSummary.distanceKm);
    const fare = 50 + rate * distance;

    setFareInfo((prev) => {
      const newFare = Math.round(fare);
      if (prev.distanceKm === distance && prev.estimatedFare === newFare)
        return prev;

      return { distanceKm: distance, estimatedFare: newFare };
    });
  }, [routeSummary.distanceKm, form.vehicleType]);

  // ================= HANDLE CHANGE =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "rideType" && value === "NOW") {
      setForm((prev) => ({
        ...prev,
        rideType: value,
        rideDate: getTodayDate(),
        rideTime: getCurrentTime(),
      }));
    } else if (name === "rideType" && value === "SCHEDULED") {
      setForm((prev) => ({
        ...prev,
        rideType: value,
        rideDate: "",
        rideTime: "",
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    setErrors((prev) => ({ ...prev, [name]: "" }));
    setApiError("");
  };

  //================== USE CURRENT LOCATION =================
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation not supported", "error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { Accept: "application/json" } }
          );
          const data = await response.json();

          setForm((prev) => ({
            ...prev,
            pickup:
              data.address?.road ||
              data.address?.village ||
              data.address?.city ||
              "Current location",
            pickupLat: lat,
            pickupLng: lng,
          }));
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          setForm((prev) => ({
            ...prev,
            pickup: "Current location",
            pickupLat: lat,
            pickupLng: lng,
          }));
        }
      },
      () => showToast("Unable to fetch location", "error")
    );
  };

  // ================= VALIDATION =================
  const validateForm = () => {
    const newErrors = {};

    if (!form.pickup.trim()) newErrors.pickup = "Pickup location is required";
    if (!form.drop.trim()) newErrors.drop = "Drop location is required";

    if (!form.pickupLat || !form.pickupLng)
      newErrors.pickup = "Please select pickup location from suggestions";

    if (!form.dropLat || !form.dropLng)
      newErrors.drop = "Please select drop location from suggestions";

    if (!form.vehicleType)
      newErrors.vehicleType = "Please select a vehicle type";

    if (!/^\d{10}$/.test(form.contactNumber))
      newErrors.contactNumber = "Enter a valid 10-digit mobile number";

    if (form.passengerCount < 1 || form.passengerCount > 6)
      newErrors.passengerCount = "Passenger count must be between 1 and 6";

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
      const pickupTime =
        form.rideType === "NOW"
          ? new Date().toISOString().slice(0, 19)
          : `${form.rideDate}T${form.rideTime}:00`;

      const payload = {
        vehicleId: null,
        pickupAddress: form.pickup,
        dropAddress: form.drop,
        pickupLatitude: parseFloat(form.pickupLat),
        pickupLongitude: parseFloat(form.pickupLng),
        returnLatitude: parseFloat(form.dropLat),
        returnLongitude: parseFloat(form.dropLng),
        passengerCount: parseInt(form.passengerCount),
        vehicleType: form.vehicleType,
        contactNumber: form.contactNumber,
        bookingType: form.rideType.toLowerCase(),
        pickupTime: pickupTime,
        returnTime: null,
      };

      await api.post("/v1/bookings", payload);

      showToast("🚗 Ride booked successfully!", "success");

      navigate("/dashboard");
    } catch (err) {
      console.error("=== BOOKING ERROR ===", err);

      const msg =
        err.response?.data?.message || err.message || "Failed to book ride";

      setApiError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================
  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <header className="bg-white shadow-sm w-full">
        <div className="max-w-6xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium transition"
            >
              <FaArrowLeft className="text-sm" />
              Back
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">
              Book a Ride
            </h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT CARD - Ride Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Ride Details
            </h2>

            {apiError && (
              <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl">
                <p className="text-sm text-red-800 font-medium">{apiError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pickup */}
              <div>
                <p className="flex items-center gap-2 font-semibold text-gray-800 mb-2">
                  <FaMapMarkerAlt className="text-green-600" />
                  Pickup Location
                </p>

                <LocationSearch
                  value={{
                    address: form.pickup,
                    lat: form.pickupLat,
                    lng: form.pickupLng,
                  }}
                  onChange={({ address, lat, lng }) =>
                    setForm((prev) => ({
                      ...prev,
                      pickup: address,
                      pickupLat: lat,
                      pickupLng: lng,
                    }))
                  }
                  placeholder="Search pickup location"
                  className="w-full"
                />

                <button
                  type="button"
                  onClick={useCurrentLocation}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Use Current Location
                </button>

                {errors.pickup && (
                  <p className="mt-2 text-xs text-red-600">{errors.pickup}</p>
                )}
              </div>

              {/* Drop */}
              <div>
                <p className="flex items-center gap-2 font-semibold text-gray-800 mb-2">
                  <FaLocationArrow className="text-red-500" />
                  Drop Location
                </p>

                <LocationSearch
                  value={{
                    address: form.drop,
                    lat: form.dropLat,
                    lng: form.dropLng,
                  }}
                  onChange={({ address, lat, lng }) =>
                    setForm((prev) => ({
                      ...prev,
                      drop: address,
                      dropLat: lat,
                      dropLng: lng,
                    }))
                  }
                  placeholder="Search drop location"
                  className="w-full"
                />

                {errors.drop && (
                  <p className="mt-2 text-xs text-red-600">{errors.drop}</p>
                )}
              </div>

              {/* Passengers */}
              <div>
                <p className="font-semibold text-gray-800 mb-2">Passengers</p>
                <select
                  name="passengerCount"
                  value={form.passengerCount}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      passengerCount: Number(e.target.value),
                    }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>

                {errors.passengerCount && (
                  <p className="mt-2 text-xs text-red-600">
                    {errors.passengerCount}
                  </p>
                )}
              </div>

              {/* Vehicle Type */}
              <div>
                <p className="font-semibold text-gray-800 mb-2">Vehicle Type</p>
                <select
                  name="vehicleType"
                  value={form.vehicleType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select vehicle</option>
                  <option value="BIKE">Bike</option>
                  <option value="AUTO">Auto</option>
                  <option value="SUV">SUV</option>
                  <option value="SEDAN">Sedan</option>
                  <option value="ELECTRICAL_VEHICLE">Electrical Vehicle</option>
                </select>

                {errors.vehicleType && (
                  <p className="mt-2 text-xs text-red-600">
                    {errors.vehicleType}
                  </p>
                )}
              </div>

              {/* Contact Number */}
              <div>
                <p className="font-semibold text-gray-800 mb-2">
                  Contact Number
                </p>
                <input
                  type="tel"
                  name="contactNumber"
                  value={form.contactNumber}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />

                {errors.contactNumber && (
                  <p className="mt-2 text-xs text-red-600">
                    {errors.contactNumber}
                  </p>
                )}
              </div>

              {/* Ride type */}
              <div className="pt-2">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rideType"
                      value="NOW"
                      checked={form.rideType === "NOW"}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Ride Now
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rideType"
                      value="SCHEDULED"
                      checked={form.rideType === "SCHEDULED"}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Schedule Ride
                    </span>
                  </label>
                </div>
              </div>

              {/* Scheduled Inputs */}
              {form.rideType === "SCHEDULED" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="flex items-center gap-2 font-semibold text-gray-800 mb-2">
                      <FaCalendarAlt className="text-blue-600" />
                      Date
                    </p>
                    <input
                      type="date"
                      name="rideDate"
                      value={form.rideDate}
                      min={getTodayDate()}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {errors.rideDate && (
                      <p className="mt-2 text-xs text-red-600">
                        {errors.rideDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="flex items-center gap-2 font-semibold text-gray-800 mb-2">
                      <FaClock className="text-blue-600" />
                      Time
                    </p>
                    <input
                      type="time"
                      name="rideTime"
                      value={form.rideTime}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {errors.rideTime && (
                      <p className="mt-2 text-xs text-red-600">
                        {errors.rideTime}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-lg font-semibold text-white transition-all ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loading ? "Booking..." : "Confirm Ride"}
              </button>
            </form>
          </div>

          {/* RIGHT CARD - Ride Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Ride Summary
            </h2>

            <div className="space-y-4">
              <div>
                <p className="font-semibold text-gray-800">Pickup:</p>
                <p className="text-gray-600 text-sm">{form.pickup || "—"}</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">Drop:</p>
                <p className="text-gray-600 text-sm">{form.drop || "—"}</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">Date:</p>
                <p className="text-gray-600 text-sm">{form.rideDate || "—"}</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">Time:</p>
                <p className="text-gray-600 text-sm">{form.rideTime || "—"}</p>
              </div>

              <div className="border-t border-gray-200 pt-6" />

              <div>
                <p className="font-semibold text-gray-800 mb-2">
                  Estimated Fare
                </p>

                {fareInfo.estimatedFare ? (
                  <div>
                    <p className="text-3xl font-bold text-gray-900">
                      ₹{fareInfo.estimatedFare}
                    </p>
                    {fareInfo.distanceKm && (
                      <p className="mt-2 text-xs text-gray-500">
                        Distance: {fareInfo.distanceKm.toFixed(2)} km
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Select pickup, drop and vehicle to calculate fare
                  </p>
                )}
              </div>

              {/* Route Map */}
              <div className="mt-6">
                <RouteMap
                  pickup={
                    form.pickupLat && form.pickupLng
                      ? {
                          lat: Number(form.pickupLat),
                          lng: Number(form.pickupLng),
                        }
                      : null
                  }
                  drop={
                    form.dropLat && form.dropLng
                      ? { lat: Number(form.dropLat), lng: Number(form.dropLng) }
                      : null
                  }
                  onRouteInfoChange={handleRouteInfoChange}
                />

                {routeSummary.distanceKm !== null && (
                  <div className="mt-3 px-3 py-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-700">
                      <strong>{routeSummary.distanceKm.toFixed(2)} km</strong> •{" "}
                      <span>{Math.round(routeSummary.durationMin)} min</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
