import { useState } from "react";
import DashboardLayout from "../components/Layout/DashboardLayout";
import {
  FaMapMarkerAlt,
  FaLocationArrow,
  FaCalendarAlt,
  FaClock,
} from "react-icons/fa";
import { apiFetch } from "../api/api";
// import MapPicker from "../components/maps/MapPicker";
import LocationSearch from "../components/maps/LocationSearch";

// ================= HELPERS =================
const getTodayDate = () => {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
};

const getCurrentTime = () => {
  const now = new Date();
  return now.toTimeString().slice(0, 5); // HH:mm
};

export default function BookRidePage() {
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

  const handlePickupSelect = ({ address, lat, lng }) => {
    setForm({
      ...form,
      pickup: address,
      pickupLat: lat,
      pickupLng: lng,
    });
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

        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${
            import.meta.env.VITE_GOOGLE_MAPS_KEY
          }`
        );

        const data = await res.json();
        const address =
          data.results?.[0]?.formatted_address || "Current location";

        setForm((prev) => ({
          ...prev,
          pickup: address,
          pickupLat: lat,
          pickupLng: lng,
        }));
      },
      () => alert("Unable to fetch location")
    );
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
      const payload = {
        ...form,
        dropLocation: form.drop
      };

      const res = await apiFetch("/api/customer/bookings", {
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

      alert("🚗 Ride booked successfully!");

      setForm({
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
      setErrors({});
    } catch (err) {
      setApiError("Network error. Please try again." + err.message);
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
              <label className="flex center-item gap-1 text-sm font-medium mb-2 block"><FaMapMarkerAlt className="text-green-600" /> Pickup Location</label>
              <LocationSearch
                placeholder="Search pickup location"
                onSelect={({ address, lat, lng }) =>
                  setForm({
                    ...form,
                    pickup: address,
                    pickupLat: lat,
                    pickupLng: lng,
                  })
                }
              />

              <button type="button" onClick={useCurrentLocation} className="mt-2 text-sm text-indigo-600 hover:underline">
                Use Current Location
              </button>
              {errors.pickup && <p className="text-red-500 text-xs">{errors.pickup}</p>}
            </div>

            {/* Drop */}
            <div>
              <label className="flex center-item gap-1 text-sm font-medium"><FaLocationArrow className="text-red-500" />Drop Location</label>

              <LocationSearch
                placeholder="Search drop location"
                onSelect={({ address, lat, lng }) =>
                  setForm({
                    ...form,
                    drop: address,
                    dropLat: lat,
                    dropLng: lng,
                  })
                }
              />
              {errors.drop && <p className="text-red-500 text-xs">{errors.drop}</p>}
            </div>

            {/* Passenger Count */}
            <div>
              <label className="text-sm font-medium">Passengers</label>
              <select
                name="passengerCount"
                value={form.passengerCount}
                onChange={(e) => setForm({ ...form, passengerCount: Number(e.target.value) }) }
                className="border p-2 rounded w-full"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n}</option>
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
                  {errors.rideDate && <p className="text-red-500 text-xs">{errors.rideDate}</p>}
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
                  {errors.rideTime && <p className="text-red-500 text-xs">{errors.rideTime}</p>}
                </div>
              </div>
            )}

           

            {/* Submit */}
            <button
              disabled={loading}
              className={`w-full py-3 rounded-lg text-white font-medium ${
                loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {loading ? "Booking..." : "Confirm Ride"}
            </button>
          </form>
        </div>

        {/* ================= RIGHT : SUMMARY ================= */}
        <div className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Ride Summary</h2>

          <div className="space-y-3 text-sm">
            <p><b>Pickup:</b> {form.pickup || "—"}</p>
            <p><b>Drop:</b> {form.drop || "—"}</p>
            <p><b>Date:</b> {form.rideDate || "—"}</p>
            <p><b>Time:</b> {form.rideTime || "—"}</p>

            <hr />

            <div className="flex justify-between font-semibold">
              <span>Estimated Fare</span>
              <span>₹ ---</span>
            </div>

            <p className="text-xs text-gray-500">
              Fare will be calculated after driver assignment
            </p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

