import { useState, useEffect } from "react";
import { apiFetch } from "../../api/api";

export default function VehicleForm({ selectedVehicle, onSuccess }) {
  const [form, setForm] = useState({
    vehicleNumber: "",
    type: "",
    status: "AVAILABLE",
    batteryLevel: "",
    fuelLevel: "",
    latitude: "",
    longitude: "",
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedVehicle) {
      setForm({
        vehicleNumber: selectedVehicle.vehicleNumber,
        type: selectedVehicle.type || "",
        status: selectedVehicle.status,
        batteryLevel: selectedVehicle.batteryLevel ?? "",
        fuelLevel: selectedVehicle.fuelLevel ?? "",
        latitude: selectedVehicle.latitude ?? "",
        longitude: selectedVehicle.longitude ?? "",
      });
      setErrors({});
      setApiError("");
    }
  }, [selectedVehicle]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setApiError("");
  };

  const validate = () => {
    const newErrors = {};

    if (!form.vehicleNumber.trim()) {
      newErrors.vehicleNumber = "Vehicle number is required";
    }

    if (
      form.batteryLevel !== "" &&
      (form.batteryLevel < 0 || form.batteryLevel > 100)
    ) {
      newErrors.batteryLevel = "Battery must be between 0 and 100";
    }

    if (form.fuelLevel !== "" && (form.fuelLevel < 0 || form.fuelLevel > 100)) {
      newErrors.fuelLevel = "Fuel must be between 0 and 100";
    }

    if (form.latitude < -90 || form.latitude > 90) {
      newErrors.latitude = "Latitude must be between -90 and 90";
    }

    if (form.longitude < -180 || form.longitude > 180) {
      newErrors.longitude = "Longitude must be between -180 and 180";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    const method = selectedVehicle ? "PUT" : "POST";
    const endpoint = selectedVehicle
      ? `/api/fleet/vehicles/${selectedVehicle.id}`
      : "/api/fleet/vehicles";

    const body = {
      ...form,
      batteryLevel: form.batteryLevel === "" ? null : Number(form.batteryLevel),
      fuelLevel: form.fuelLevel === "" ? null : Number(form.fuelLevel),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    };

    try {
      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(body),
      });

      // apiFetch already handles 401 → redirect
      if (!res || !res.ok) {
        const message = res ? await res.text() : "Request failed";
        throw new Error(message);
      }

      onSuccess();
      setForm({
        vehicleNumber: "",
        type: "",
        status: "AVAILABLE",
        batteryLevel: "",
        fuelLevel: "",
        latitude: "",
        longitude: "",
      });
      setErrors({});
      setApiError("");
    } catch (err) {
      setApiError(err.message || "Failed to save vehicle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow mb-6"
    >
      <h2 className="text-lg font-bold mb-4">
        {selectedVehicle ? "Update Vehicle" : "Add Vehicle"}
      </h2>

      {apiError && (
        <p className="mb-4 text-red-600 text-sm font-medium">{apiError}</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <input
            name="vehicleNumber"
            placeholder="Vehicle Number"
            value={form.vehicleNumber}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
          {errors.vehicleNumber && (
            <p className="text-red-500 text-xs mt-1">{errors.vehicleNumber}</p>
          )}
        </div>

        <input
          name="type"
          placeholder="Type (EV / DIESEL / HYBRID)"
          value={form.type}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option>AVAILABLE</option>
          <option>IN_USE</option>
          <option>MAINTENANCE</option>
        </select>

        <div>
          <input
            name="batteryLevel"
            type="number"
            placeholder="Battery %"
            value={form.batteryLevel}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
          {errors.batteryLevel && (
            <p className="text-red-500 text-xs mt-1">{errors.batteryLevel}</p>
          )}
        </div>

        <div>
          <input
            name="fuelLevel"
            type="number"
            placeholder="Fuel %"
            value={form.fuelLevel}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
          {errors.fuelLevel && (
            <p className="text-red-500 text-xs mt-1">{errors.fuelLevel}</p>
          )}
        </div>

        <div>
          <input
            name="latitude"
            type="number"
            step="any"
            placeholder="Latitude"
            value={form.latitude}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
          {errors.latitude && (
            <p className="text-red-500 text-xs mt-1">{errors.latitude}</p>
          )}
        </div>

        <div>
          <input
            name="longitude"
            type="number"
            step="any"
            placeholder="Longitude"
            value={form.longitude}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
          {errors.longitude && (
            <p className="text-red-500 text-xs mt-1">{errors.longitude}</p>
          )}
        </div>
      </div>

      <button
        disabled={loading}
        className={`mt-4 px-6 py-2 rounded text-white ${
          loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Saving..." : selectedVehicle ? "Update" : "Add"}
      </button>
    </form>
  );
}
