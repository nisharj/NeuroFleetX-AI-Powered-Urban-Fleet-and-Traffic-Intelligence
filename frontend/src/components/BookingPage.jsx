import { useState, useEffect, useRef } from "react";
import bookingService from "../services/bookingService";
import Toast from "./Toast";
import axios from "axios";

function BookingPage({ user }) {
  const [formData, setFormData] = useState({
    pickupAddress: "",
    dropAddress: "",
    passengerCount: 1,
    vehicleType: "",
    contactNumber: "",
    bookingType: "now",
    scheduledTime: "",
    pickupLatitude: null,
    pickupLongitude: null,
    dropLatitude: null,
    dropLongitude: null,
  });

  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [toast, setToast] = useState(null);
  const [step, setStep] = useState(1); // 1: Form, 2: Vehicle Selection, 3: Confirmation
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [pickupSearching, setPickupSearching] = useState(false);
  const [dropSearching, setDropSearching] = useState(false);

  const pickupInputRef = useRef(null);
  const dropInputRef = useRef(null);


  const searchNominatim = async (query) => {
    if (!query || query.length < 3) {
      return [];
    }
    try {
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            q: query,
            format: "json",
            limit: 5,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Nominatim search error:", error);
      return [];
    }
  };

  // Pickup location search
  const handlePickupSearch = async (value) => {
    setFormData((prev) => ({ ...prev, pickupAddress: value }));
    if (!value || value.length < 3) {
      setPickupSuggestions([]);
      return;
    }
    setPickupSearching(true);
    const suggestions = await searchNominatim(value);
    setPickupSuggestions(suggestions);
    setPickupSearching(false);
  };

  // Drop location search
  const handleDropSearch = async (value) => {
    setFormData((prev) => ({ ...prev, dropAddress: value }));
    if (!value || value.length < 3) {
      setDropSuggestions([]);
      return;
    }
    setDropSearching(true);
    const suggestions = await searchNominatim(value);
    setDropSuggestions(suggestions);
    setDropSearching(false);
  };

  // Select pickup suggestion
  const handlePickupSelect = (place) => {
    setFormData((prev) => ({
      ...prev,
      pickupAddress: place.display_name,
      pickupLatitude: parseFloat(place.lat),
      pickupLongitude: parseFloat(place.lon),
    }));
    setPickupSuggestions([]);
  };

  // Select drop suggestion
  const handleDropSelect = (place) => {
    setFormData((prev) => ({
      ...prev,
      dropAddress: place.display_name,
      dropLatitude: parseFloat(place.lat),
      dropLongitude: parseFloat(place.lon),
    }));
    setDropSuggestions([]);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.pickupAddress) {
      showToast("Please enter pickup address", "error");
      return false;
    }
    if (!formData.dropAddress) {
      showToast("Please enter drop address", "error");
      return false;
    }
    if (!formData.passengerCount || formData.passengerCount < 1) {
      showToast("Please enter valid passenger count", "error");
      return false;
    }
    if (!formData.vehicleType) {
      showToast("Please select vehicle type", "error");
      return false;
    }
    if (!formData.contactNumber || formData.contactNumber.length < 10) {
      showToast("Please enter valid contact number", "error");
      return false;
    }
    if (formData.bookingType === "schedule" && !formData.scheduledTime) {
      showToast("Please select scheduled time", "error");
      return false;
    }
    return true;
  };

  const handleSearchVehicles = async () => {
    if (!validateForm()) return;

    setSearching(true);
    try {
      const startTime =
        formData.bookingType === "now"
          ? new Date().toISOString()
          : new Date(formData.scheduledTime).toISOString();

      const endTime = new Date(
        new Date(startTime).getTime() + 3600000,
      ).toISOString(); // +1 hour default

      const vehicles = await bookingService.getAvailableVehicles(
        startTime,
        endTime,
      );

      const filtered = vehicles.filter(
        (v) =>
          v.type === formData.vehicleType &&
          v.capacity >= formData.passengerCount,
      );

      setAvailableVehicles(filtered);
      setStep(2);

      if (filtered.length === 0) {
        showToast("No vehicles available for your criteria", "warning");
      }
    } catch (error) {
      console.error("Error searching vehicles:", error);
      showToast("Failed to search vehicles. Please try again.", "error");
    } finally {
      setSearching(false);
    }
  };

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
    setStep(3);
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      const bookingData = {
        vehicleId: selectedVehicle.id,
        pickupAddress: formData.pickupAddress,
        dropAddress: formData.dropAddress,
        passengerCount: formData.passengerCount,
        vehicleType: formData.vehicleType,
        contactNumber: formData.contactNumber,
        bookingType: formData.bookingType,
        pickupLatitude: formData.pickupLatitude,
        pickupLongitude: formData.pickupLongitude,
        dropLatitude: formData.dropLatitude,
        dropLongitude: formData.dropLongitude,
        pickupTime:
          formData.bookingType === "now"
            ? new Date().toISOString()
            : new Date(formData.scheduledTime).toISOString(),
        returnTime: new Date(
          new Date(
            formData.bookingType === "now"
              ? new Date()
              : formData.scheduledTime,
          ).getTime() + 3600000,
        ).toISOString(),
      };

      await bookingService.createBooking(bookingData);
      showToast("Booking confirmed successfully!", "success");

      setTimeout(() => {
        resetForm();
      }, 2000);
    } catch (error) {
      console.error("Error creating booking:", error);
      showToast("Failed to create booking. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      pickupAddress: "",
      dropAddress: "",
      passengerCount: 1,
      vehicleType: "",
      contactNumber: "",
      bookingType: "now",
      scheduledTime: "",
      pickupLatitude: null,
      pickupLongitude: null,
      dropLatitude: null,
      dropLongitude: null,
    });
    setSelectedVehicle(null);
    setAvailableVehicles([]);
    setStep(1);
  };

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const vehicleTypes = [
    { value: "SEDAN", label: "Sedan", icon: "🚗", seats: "4-5" },
    { value: "SUV", label: "SUV", icon: "🚙", seats: "6-7" },
    { value: "EV", label: "Electric Vehicle", icon: "⚡", seats: "4-5" },
    { value: "BIKE", label: "Bike", icon: "🏍️", seats: "2" },
    { value: "AUTO", label: "Auto", icon: "🛺", seats: "3" },
  ];


  return (
    <div className="animate-fadeIn">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="glass-card mb-xl">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center" style={{ flex: 1 }}>
              <div
                className={`flex items-center justify-center rounded-full font-bold transition-all ${
                  step >= s
                    ? "bg-gradient-primary text-white"
                    : "bg-tertiary text-secondary"
                }`}
                style={{ width: "40px", height: "40px" }}
              >
                {s}
              </div>
              <div className="ml-sm">
                <div
                  className={`font-semibold ${step >= s ? "text-primary" : "text-secondary"}`}
                >
                  {s === 1
                    ? "Booking Details"
                    : s === 2
                      ? "Select Vehicle"
                      : "Confirmation"}
                </div>
              </div>
              {s < 3 && (
                <div
                  className="mx-md"
                  style={{
                    flex: 1,
                    height: "2px",
                    background:
                      step > s
                        ? "var(--gradient-primary)"
                        : "var(--bg-tertiary)",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Booking Form */}
      {step === 1 && (
        <div className="glass-card">
          <h2 className="text-2xl font-bold mb-xl text-gradient">
            Book Your Ride
          </h2>

          <div className="grid grid-cols-2 gap-lg mb-lg">
            {/* Pickup Address */}
            <div className="form-group">
              <label className="form-label">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="var(--accent-cyan)"
                  style={{ display: "inline", marginRight: "8px" }}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                Pickup Address *
              </label>
              <input
                ref={pickupInputRef}
                type="text"
                className="form-input"
                placeholder="Enter pickup location"
                value={formData.pickupAddress}
                onChange={(e) => handlePickupSearch(e.target.value)}
              />
              {pickupSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1">
                  {pickupSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="p-2 cursor-pointer hover:bg-gray-100 text-sm border-b last:border-b-0"
                      onClick={() => handlePickupSelect(suggestion)}
                    >
                      <div className="font-semibold text-gray-800">
                        {suggestion.address?.road ||
                          suggestion.address?.village ||
                          suggestion.display_name.split(",")[0]}
                      </div>
                      <div className="text-xs text-gray-500">
                        {suggestion.display_name.split(",").slice(1).join(",")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drop Address */}
            <div className="form-group">
              <label className="form-label">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="var(--accent-orange)"
                  style={{ display: "inline", marginRight: "8px" }}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                Drop Address *
              </label>
              <input
                ref={dropInputRef}
                type="text"
                className="form-input"
                placeholder="Enter drop location"
                value={formData.dropAddress}
                onChange={(e) => handleDropSearch(e.target.value)}
              />
              {dropSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1">
                  {dropSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="p-2 cursor-pointer hover:bg-gray-100 text-sm border-b last:border-b-0"
                      onClick={() => handleDropSelect(suggestion)}
                    >
                      <div className="font-semibold text-gray-800">
                        {suggestion.address?.road ||
                          suggestion.address?.village ||
                          suggestion.display_name.split(",")[0]}
                      </div>
                      <div className="text-xs text-gray-500">
                        {suggestion.display_name.split(",").slice(1).join(",")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Type Selection */}
          <div className="form-group mb-lg">
            <label className="form-label">Vehicle Type *</label>
            <div className="grid grid-cols-5 gap-md">
              {vehicleTypes.map((type) => (
                <div
                  key={type.value}
                  className={`glass-card cursor-pointer transition-all ${
                    formData.vehicleType === type.value ? "border-2" : ""
                  }`}
                  style={{
                    borderColor:
                      formData.vehicleType === type.value
                        ? "var(--accent-cyan)"
                        : "transparent",
                    padding: "16px",
                    textAlign: "center",
                  }}
                  onClick={() => handleInputChange("vehicleType", type.value)}
                >
                  <div style={{ fontSize: "2rem", marginBottom: "8px" }}>
                    {type.icon}
                  </div>
                  <div className="font-semibold mb-xs">{type.label}</div>
                  <div className="text-xs text-secondary">
                    {type.seats} seats
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-lg mb-lg">
            {/* Passenger Count */}
            <div className="form-group">
              <label className="form-label">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  style={{ display: "inline", marginRight: "8px" }}
                >
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                Passenger Count *
              </label>
              <input
                type="number"
                className="form-input"
                min="1"
                max="12"
                value={formData.passengerCount}
                onChange={(e) =>
                  handleInputChange("passengerCount", parseInt(e.target.value))
                }
              />
            </div>

            {/* Contact Number */}
            <div className="form-group">
              <label className="form-label">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  style={{ display: "inline", marginRight: "8px" }}
                >
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                Contact Number *
              </label>
              <input
                type="tel"
                className="form-input"
                placeholder="+1 (555) 000-0000"
                value={formData.contactNumber}
                onChange={(e) =>
                  handleInputChange("contactNumber", e.target.value)
                }
              />
            </div>
          </div>

          {/* Booking Type */}
          <div className="form-group mb-lg">
            <label className="form-label">When do you need the ride? *</label>
            <div className="flex gap-md mb-md">
              <button
                className={`btn ${formData.bookingType === "now" ? "btn-primary" : "btn-secondary"}`}
                style={{ flex: 1 }}
                onClick={() => handleInputChange("bookingType", "now")}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                Book Now
              </button>
              <button
                className={`btn ${formData.bookingType === "schedule" ? "btn-primary" : "btn-secondary"}`}
                style={{ flex: 1 }}
                onClick={() => handleInputChange("bookingType", "schedule")}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                Schedule for Later
              </button>
            </div>

            {formData.bookingType === "schedule" && (
              <input
                type="datetime-local"
                className="form-input"
                value={formData.scheduledTime}
                onChange={(e) =>
                  handleInputChange("scheduledTime", e.target.value)
                }
                min={new Date().toISOString().slice(0, 16)}
              />
            )}
          </div>

          <button
            className="btn btn-primary w-full"
            onClick={handleSearchVehicles}
            disabled={searching}
          >
            {searching ? (
              <>
                <div
                  className="loading-spinner"
                  style={{ width: "20px", height: "20px" }}
                ></div>
                Searching...
              </>
            ) : (
              <>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
                Search Available Vehicles
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 2: Vehicle Selection */}
      {step === 2 && (
        <div>
          <div className="flex items-center justify-between mb-lg">
            <h2 className="text-2xl font-bold text-gradient">
              Available Vehicles ({availableVehicles.length})
            </h2>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Form
            </button>
          </div>

          {availableVehicles.length === 0 ? (
            <div className="glass-card text-center" style={{ padding: "64px" }}>
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="var(--text-secondary)"
                style={{ margin: "0 auto 16px" }}
              >
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
              </svg>
              <h3 className="text-xl font-bold mb-sm">No Vehicles Available</h3>
              <p className="text-secondary">
                Try adjusting your search criteria or schedule for a different
                time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3">
              {availableVehicles.map((vehicle) => (
                <div key={vehicle.id} className="glass-card">
                  <div className="mb-md">
                    <h4 className="font-bold text-lg mb-xs">
                      {vehicle.name || `${vehicle.type} ${vehicle.model}`}
                    </h4>
                    <div className="flex items-center gap-md text-sm text-secondary mb-sm">
                      <div className="flex items-center gap-xs">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                        </svg>
                        {vehicle.capacity} seats
                      </div>
                      <div className="flex items-center gap-xs">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="var(--accent-orange)"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {vehicle.rating || "4.5"}
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-between pt-md"
                    style={{ borderTop: "1px solid var(--glass-border)" }}
                  >
                    <div>
                      <div className="text-xl font-bold text-gradient">
                        ${vehicle.pricePerHour || "25"}
                      </div>
                      <div className="text-xs text-secondary">per hour</div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleVehicleSelect(vehicle)}
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && selectedVehicle && (
        <div className="glass-card">
          <h2 className="text-2xl font-bold mb-xl text-gradient">
            Confirm Your Booking
          </h2>

          <div className="grid grid-cols-2 gap-lg mb-xl">
            {/* Trip Details */}
            <div>
              <h3 className="font-bold mb-md">Trip Details</h3>
              <div
                className="p-md rounded-md"
                style={{ background: "var(--bg-ghost)" }}
              >
                <div className="mb-md">
                  <div className="text-xs text-secondary mb-xs">Pickup</div>
                  <div className="font-semibold">{formData.pickupAddress}</div>
                </div>
                <div className="mb-md">
                  <div className="text-xs text-secondary mb-xs">Drop</div>
                  <div className="font-semibold">{formData.dropAddress}</div>
                </div>
                <div className="mb-md">
                  <div className="text-xs text-secondary mb-xs">Passengers</div>
                  <div className="font-semibold">
                    {formData.passengerCount} person(s)
                  </div>
                </div>
                <div className="mb-md">
                  <div className="text-xs text-secondary mb-xs">Contact</div>
                  <div className="font-semibold">{formData.contactNumber}</div>
                </div>
                <div>
                  <div className="text-xs text-secondary mb-xs">
                    Booking Type
                  </div>
                  <div className="font-semibold">
                    {formData.bookingType === "now"
                      ? "Immediate"
                      : `Scheduled: ${new Date(formData.scheduledTime).toLocaleString()}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div>
              <h3 className="font-bold mb-md">Vehicle Details</h3>
              <div
                className="p-md rounded-md"
                style={{ background: "var(--bg-ghost)" }}
              >
                <div className="mb-md">
                  <div className="text-xs text-secondary mb-xs">Vehicle</div>
                  <div className="font-semibold">
                    {selectedVehicle.name ||
                      `${selectedVehicle.type} ${selectedVehicle.model}`}
                  </div>
                </div>
                <div className="mb-md">
                  <div className="text-xs text-secondary mb-xs">Type</div>
                  <div className="font-semibold">{selectedVehicle.type}</div>
                </div>
                <div className="mb-md">
                  <div className="text-xs text-secondary mb-xs">Capacity</div>
                  <div className="font-semibold">
                    {selectedVehicle.capacity} seats
                  </div>
                </div>
                <div>
                  <div className="text-xs text-secondary mb-xs">Rate</div>
                  <div className="font-semibold text-gradient text-xl">
                    ${selectedVehicle.pricePerHour || "25"}/hour
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-md">
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => setStep(2)}
            >
              Back to Vehicles
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 2 }}
              onClick={handleConfirmBooking}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div
                    className="loading-spinner"
                    style={{ width: "20px", height: "20px" }}
                  ></div>
                  Confirming...
                </>
              ) : (
                <>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Confirm Booking
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingPage;
