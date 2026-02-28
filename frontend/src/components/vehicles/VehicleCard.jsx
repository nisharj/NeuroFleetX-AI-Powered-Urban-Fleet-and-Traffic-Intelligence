import {
  FaMapMarkerAlt,
  FaBatteryHalf,
  FaUser,
  FaEdit,
  FaTrash,
  FaRoute,
} from "react-icons/fa";

export default function VehicleCard({ vehicle, onEdit, onDelete }) {
  const statusColor = {
    AVAILABLE: "bg-green-100 text-green-700 border-green-300",
    BOOKED: "bg-amber-100 text-amber-700 border-amber-300",
    IN_USE: "bg-blue-100 text-blue-700 border-blue-300",
    MAINTENANCE: "bg-red-100 text-red-700 border-red-300",
    OFFLINE: "bg-gray-100 text-gray-700 border-gray-300",
  };

  const healthColor = {
    HEALTHY: "bg-green-100 text-green-700 border-green-300",
    MAINTENANCE_DUE: "bg-amber-100 text-amber-700 border-amber-300",
    UNDER_MAINTENANCE: "bg-red-100 text-red-700 border-red-300",
    INACTIVE: "bg-gray-100 text-gray-700 border-gray-300",
  };

  const statusLabel = vehicle.status === "IN_USE" ? "ON RIDE" : (vehicle.status || "UNKNOWN").replace("_", " ");
  const healthLabel = (vehicle.healthStatus || "HEALTHY").replaceAll("_", " ");

  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition p-5 space-y-4 border">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg tracking-wide">
          {vehicle.vehicleNumber || vehicle.vehicleCode}
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColor[vehicle.status]}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold border ${healthColor[vehicle.healthStatus] || healthColor.HEALTHY}`}
        >
          {healthLabel}
        </span>
        {vehicle.lockedForRide && (
          <span className="px-2 py-1 rounded-full text-xs font-semibold border bg-blue-100 text-blue-700 border-blue-300">
            Ride Locked
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <FaMapMarkerAlt className="text-red-500" />
        <span>
          {vehicle.currentLatitude?.toFixed(4) ?? "--"}, {vehicle.currentLongitude?.toFixed(4) ?? "--"}
        </span>
      </div>

      {vehicle.batteryLevel !== null && (
        <div>
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="flex items-center gap-2">
              <FaBatteryHalf className="text-green-600" />
              Battery
            </span>
            <span className="font-medium">{vehicle.batteryLevel}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-green-500 h-2 transition-all"
              style={{ width: `${vehicle.batteryLevel}%` }}
            />
          </div>
        </div>
      )}

      {vehicle.currentTrip && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm">
          <div className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <FaRoute />
            Current Trip ({vehicle.currentTrip.bookingCode})
          </div>
          <p className="text-gray-700">
            {vehicle.currentTrip.pickupLocation} → {vehicle.currentTrip.dropLocation}
          </p>
          <div className="text-gray-600 mt-1 flex items-center gap-2">
            <FaUser />
            Passenger: {vehicle.currentTrip.passengerName || "N/A"}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Started:{" "}
            {vehicle.currentTrip.rideStartTime
              ? new Date(vehicle.currentTrip.rideStartTime).toLocaleString()
              : "--"}
          </p>
        </div>
      )}

      {!!vehicle.healthAlerts?.length && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
          {vehicle.healthAlerts.join(" | ")}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-gray-50 rounded p-2">
          <p className="text-gray-500">Engine</p>
          <p className="font-semibold">{vehicle.engineHealth ?? "--"}%</p>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <p className="text-gray-500">Tire</p>
          <p className="font-semibold">{vehicle.tireHealth ?? "--"}%</p>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <p className="text-gray-500">Brake</p>
          <p className="font-semibold">{vehicle.brakeHealth ?? "--"}%</p>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-3 border-t">
        {typeof onEdit === "function" && (
          <button
            onClick={() => onEdit(vehicle)}
            disabled={vehicle.lockedForRide}
            className={`flex items-center gap-1 text-sm font-medium transition ${
              vehicle.lockedForRide
                ? "text-gray-400 cursor-not-allowed"
                : "text-blue-600 hover:text-blue-800"
            }`}
          >
            <FaEdit />
            Edit
          </button>
        )}

        {typeof onDelete === "function" && (
          <button
            onClick={() => onDelete(vehicle.id)}
            disabled={vehicle.lockedForRide}
            className={`flex items-center gap-1 text-sm font-medium transition ${
              vehicle.lockedForRide
                ? "text-gray-400 cursor-not-allowed"
                : "text-red-600 hover:text-red-800"
            }`}
          >
            <FaTrash />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
