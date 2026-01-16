import {
  FaMapMarkerAlt,
  FaBatteryHalf,
  FaGasPump,
  FaTachometerAlt,
  FaEdit,
  FaTrash
} from "react-icons/fa";

export default function VehicleCard({ vehicle, onEdit, onDelete }) {
  const statusColor = {
    AVAILABLE: "bg-green-100 text-green-700 border-green-300",
    IN_USE: "bg-blue-100 text-blue-700 border-blue-300",
    MAINTENANCE: "bg-red-100 text-red-700 border-red-300"
  };

  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition p-5 space-y-4 border">

      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg tracking-wide">
          {vehicle.vehicleNumber}
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColor[vehicle.status]}`}
        >
          {vehicle.status.replace("_", " ")}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <FaMapMarkerAlt className="text-red-500" />
        <span>
          {vehicle.latitude?.toFixed(4)}, {vehicle.longitude?.toFixed(4)}
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

      {vehicle.fuelLevel !== null && (
        <div>
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="flex items-center gap-2">
              <FaGasPump className="text-yellow-600" />
              Fuel
            </span>
            <span className="font-medium">{vehicle.fuelLevel}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-yellow-500 h-2 transition-all"
              style={{ width: `${vehicle.fuelLevel}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex justify-between items-center text-sm">
        <span className="flex items-center gap-2 text-gray-600">
          <FaTachometerAlt />
          Speed
        </span>
        <span
          className={`font-semibold ${
            vehicle.speed > 40
              ? "text-red-600"
              : vehicle.speed > 0
              ? "text-green-600"
              : "text-gray-400"
          }`}
        >
          {vehicle.speed} km/h
        </span>
      </div>

      <div className="flex justify-end gap-4 pt-3 border-t">
        {typeof onEdit === "function" && (
          <button
            onClick={() => onEdit(vehicle)}
            className="flex items-center gap-1 text-blue-600 text-sm font-medium hover:text-blue-800 transition"
          >
            <FaEdit />
            Edit
          </button>
        )}

        {typeof onDelete === "function" && (
          <button
            onClick={() => onDelete(vehicle.id)}
            className="flex items-center gap-1 text-red-600 text-sm font-medium hover:text-red-800 transition"
          >
            <FaTrash />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
