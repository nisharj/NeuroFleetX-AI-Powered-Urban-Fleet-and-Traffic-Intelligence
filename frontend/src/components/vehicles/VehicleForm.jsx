import { useState, useEffect } from "react";
import { apiFetch } from "../../api/api";

const emptyForm = {
  vehicleCode: "",
  vehicleNumber: "",
  name: "",
  type: "SEDAN",
  model: "",
  manufacturer: "",
  year: "",
  seats: 4,
  fuelType: "PETROL",
  status: "AVAILABLE",
  batteryLevel: 100,
  currentLatitude: "",
  currentLongitude: "",
  mileage: 0,
  engineHealth: 100,
  tireHealth: 100,
  brakeHealth: 100,
  pricePerHour: "",
};

export default function VehicleForm({ selectedVehicle, onSuccess }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedVehicle) return;

    setForm({
      vehicleCode: selectedVehicle.vehicleCode || "",
      vehicleNumber: selectedVehicle.vehicleNumber || "",
      name: selectedVehicle.name || "",
      type: selectedVehicle.type || "SEDAN",
      model: selectedVehicle.model || "",
      manufacturer: selectedVehicle.manufacturer || "",
      year: selectedVehicle.year ?? "",
      seats: selectedVehicle.seats ?? 4,
      fuelType: selectedVehicle.fuelType || "PETROL",
      status: selectedVehicle.status || "AVAILABLE",
      batteryLevel: selectedVehicle.batteryLevel ?? 100,
      currentLatitude: selectedVehicle.currentLatitude ?? "",
      currentLongitude: selectedVehicle.currentLongitude ?? "",
      mileage: selectedVehicle.mileage ?? 0,
      engineHealth: selectedVehicle.engineHealth ?? 100,
      tireHealth: selectedVehicle.tireHealth ?? 100,
      brakeHealth: selectedVehicle.brakeHealth ?? 100,
      pricePerHour: selectedVehicle.pricePerHour ?? "",
    });
    setErrors({});
    setApiError("");
  }, [selectedVehicle]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setApiError("");
  };

  const validate = () => {
    const newErrors = {};

    if (!form.vehicleCode.trim()) newErrors.vehicleCode = "Vehicle code is required";
    if (!form.vehicleNumber.trim()) newErrors.vehicleNumber = "Vehicle number is required";
    if (!form.name.trim()) newErrors.name = "Vehicle name is required";
    if (!form.pricePerHour || Number(form.pricePerHour) <= 0) {
      newErrors.pricePerHour = "Hourly price must be greater than 0";
    }

    if (Number(form.seats) <= 0) newErrors.seats = "Seats must be greater than 0";
    if (Number(form.batteryLevel) < 0 || Number(form.batteryLevel) > 100) {
      newErrors.batteryLevel = "Battery must be between 0 and 100";
    }

    ["engineHealth", "tireHealth", "brakeHealth"].forEach((key) => {
      const val = Number(form[key]);
      if (val < 0 || val > 100) {
        newErrors[key] = "Health must be between 0 and 100";
      }
    });

    if (form.currentLatitude !== "" && (Number(form.currentLatitude) < -90 || Number(form.currentLatitude) > 90)) {
      newErrors.currentLatitude = "Latitude must be between -90 and 90";
    }
    if (form.currentLongitude !== "" && (Number(form.currentLongitude) < -180 || Number(form.currentLongitude) > 180)) {
      newErrors.currentLongitude = "Longitude must be between -180 and 180";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedVehicle?.lockedForRide) {
      setApiError("Vehicle is on an active ride and cannot be edited now.");
      return;
    }

    if (!validate()) return;

    setLoading(true);
    const method = selectedVehicle ? "PUT" : "POST";
    const endpoint = selectedVehicle
      ? `/api/fleet/vehicles/${selectedVehicle.id}`
      : "/api/fleet/vehicles";

    const payload = {
      ...form,
      seats: Number(form.seats),
      year: form.year === "" ? null : Number(form.year),
      batteryLevel: Number(form.batteryLevel),
      currentLatitude: form.currentLatitude === "" ? null : Number(form.currentLatitude),
      currentLongitude: form.currentLongitude === "" ? null : Number(form.currentLongitude),
      mileage: Number(form.mileage || 0),
      engineHealth: Number(form.engineHealth),
      tireHealth: Number(form.tireHealth),
      brakeHealth: Number(form.brakeHealth),
      pricePerHour: Number(form.pricePerHour),
    };

    try {
      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      if (!res || !res.ok) {
        const message = res ? await res.text() : "Request failed";
        throw new Error(message);
      }

      onSuccess();
      setForm(emptyForm);
      setApiError("");
    } catch (err) {
      setApiError(err.message || "Failed to save vehicle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-lg font-bold mb-4">
        {selectedVehicle ? "Update Vehicle" : "Add Vehicle"}
      </h2>

      {selectedVehicle?.lockedForRide && (
        <p className="mb-4 text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded text-sm">
          This vehicle is currently on a ride. Editing is disabled until the trip completes.
        </p>
      )}

      {apiError && <p className="mb-4 text-red-600 text-sm font-medium">{apiError}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input name="vehicleCode" placeholder="Vehicle Code (e.g. VH-1001)" value={form.vehicleCode} onChange={handleChange} className="border p-2 rounded" />
        <input name="vehicleNumber" placeholder="Vehicle Number" value={form.vehicleNumber} onChange={handleChange} className="border p-2 rounded" />
        <input name="name" placeholder="Vehicle Name" value={form.name} onChange={handleChange} className="border p-2 rounded" />

        <select name="type" value={form.type} onChange={handleChange} className="border p-2 rounded">
          <option value="ELECTRICAL_VEHICLE">Electrical Vehicle</option>
          <option value="SEDAN">Sedan</option>
          <option value="SUV">SUV</option>
          <option value="AUTO">Auto</option>
          <option value="BIKE">Bike</option>
        </select>

        <select name="fuelType" value={form.fuelType} onChange={handleChange} className="border p-2 rounded">
          <option value="ELECTRIC">Electric</option>
          <option value="PETROL">Petrol</option>
          <option value="DIESEL">Diesel</option>
          <option value="HYBRID">Hybrid</option>
        </select>

        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          disabled={selectedVehicle?.lockedForRide}
          className="border p-2 rounded disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="MAINTENANCE">MAINTENANCE</option>
          <option value="OFFLINE">OFFLINE</option>
          <option value="BOOKED">BOOKED</option>
        </select>

        <input name="model" placeholder="Model" value={form.model} onChange={handleChange} className="border p-2 rounded" />
        <input name="manufacturer" placeholder="Manufacturer" value={form.manufacturer} onChange={handleChange} className="border p-2 rounded" />
        <input name="year" type="number" placeholder="Year" value={form.year} onChange={handleChange} className="border p-2 rounded" />

        <input name="seats" type="number" placeholder="Seats" value={form.seats} onChange={handleChange} className="border p-2 rounded" />
        <input name="batteryLevel" type="number" placeholder="Battery %" value={form.batteryLevel} onChange={handleChange} className="border p-2 rounded" />
        <input name="mileage" type="number" placeholder="Mileage" value={form.mileage} onChange={handleChange} className="border p-2 rounded" />

        <input name="engineHealth" type="number" placeholder="Engine Health %" value={form.engineHealth} onChange={handleChange} className="border p-2 rounded" />
        <input name="tireHealth" type="number" placeholder="Tire Health %" value={form.tireHealth} onChange={handleChange} className="border p-2 rounded" />
        <input name="brakeHealth" type="number" placeholder="Brake Health %" value={form.brakeHealth} onChange={handleChange} className="border p-2 rounded" />

        <input name="currentLatitude" type="number" step="any" placeholder="Current Latitude" value={form.currentLatitude} onChange={handleChange} className="border p-2 rounded" />
        <input name="currentLongitude" type="number" step="any" placeholder="Current Longitude" value={form.currentLongitude} onChange={handleChange} className="border p-2 rounded" />
        <input name="pricePerHour" type="number" step="0.01" placeholder="Price Per Hour" value={form.pricePerHour} onChange={handleChange} className="border p-2 rounded" />
      </div>

      {!!Object.keys(errors).length && (
        <div className="mt-3 text-xs text-red-600 space-y-1">
          {Object.entries(errors).map(([key, value]) => (
            <p key={key}>{value}</p>
          ))}
        </div>
      )}

      <button
        disabled={loading || selectedVehicle?.lockedForRide}
        className={`mt-4 px-6 py-2 rounded text-white ${
          loading || selectedVehicle?.lockedForRide
            ? "bg-gray-400"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Saving..." : selectedVehicle ? "Update" : "Add"}
      </button>
    </form>
  );
}
