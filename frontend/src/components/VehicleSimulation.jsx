import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../api/api";
import {
  FaCar,
  FaBolt,
  FaMotorcycle,
  FaTruck,
  FaGasPump,
  FaMapMarkerAlt,
  FaTachometerAlt,
  FaWrench,
  FaBatteryFull,
  FaBatteryThreeQuarters,
  FaBatteryHalf,
  FaBatteryQuarter,
  FaBatteryEmpty,
  FaSync,
  FaThLarge,
  FaList,
  FaCircle,
  FaCog,
  FaRoad,
  FaOilCan,
} from "react-icons/fa";
import VehicleHealthMonitoringSystem from "./VehicleHealthMonitoringSystem";

const STATUS_CONFIG = {
  AVAILABLE: {
    label: "Available",
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-500",
    border: "border-green-300",
  },
  BOOKED: {
    label: "Booked",
    bg: "bg-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
    border: "border-blue-300",
  },
  IN_USE: {
    label: "In Use",
    bg: "bg-cyan-100",
    text: "text-cyan-700",
    dot: "bg-cyan-500",
    border: "border-cyan-300",
  },
  MAINTENANCE: {
    label: "Maintenance",
    bg: "bg-orange-100",
    text: "text-orange-700",
    dot: "bg-orange-500",
    border: "border-orange-300",
  },
  OFFLINE: {
    label: "Offline",
    bg: "bg-gray-100",
    text: "text-gray-500",
    dot: "bg-gray-400",
    border: "border-gray-300",
  },
};

const TYPE_ICONS = {
  ELECTRICAL_VEHICLE: FaBolt,
  SEDAN: FaCar,
  SUV: FaTruck,
  AUTO: FaCar,
  BIKE: FaMotorcycle,
};

const TYPE_LABELS = {
  ELECTRICAL_VEHICLE: "Electric",
  SEDAN: "Sedan",
  SUV: "SUV",
  AUTO: "Auto",
  BIKE: "Bike",
};

function BatteryIconDisplay({ level }) {
  if (level >= 80) return <FaBatteryFull className={getBatteryColor(level)} />;
  if (level >= 60)
    return <FaBatteryThreeQuarters className={getBatteryColor(level)} />;
  if (level >= 40) return <FaBatteryHalf className={getBatteryColor(level)} />;
  if (level >= 20)
    return <FaBatteryQuarter className={getBatteryColor(level)} />;
  return <FaBatteryEmpty className={getBatteryColor(level)} />;
}

function getBatteryColor(level) {
  if (level >= 60) return "text-green-500";
  if (level >= 30) return "text-yellow-500";
  return "text-red-500";
}

function getBarColor(level) {
  if (level >= 70) return "bg-green-500";
  if (level >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

function formatType(type) {
  return TYPE_LABELS[type] || type;
}

export default function VehicleSimulation({ compact = false }) {
  const [vehicles, setVehicles] = useState([]);
  const [healthTimeline, setHealthTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVehicles = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      const res = await apiFetch("/api/fleet/vehicles");
      if (res && res.ok) {
        const data = await res.json();
        setVehicles(data);
        const avgScore = data.length
          ? Math.round(
              data.reduce((sum, v) => {
                const battery = v.batteryLevel ?? 100;
                const engine = v.engineHealth ?? 100;
                const tire = v.tireHealth ?? 100;
                const brake = v.brakeHealth ?? 100;
                const score = battery * 0.35 + engine * 0.35 + tire * 0.15 + brake * 0.15;
                return sum + score;
              }, 0) / data.length,
            )
          : 100;

        const timeLabel = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setHealthTimeline((prev) => [...prev.slice(-11), { time: timeLabel, avgScore }]);
        setLastUpdated(new Date());
        setError("");
      } else {
        console.warn("Vehicles endpoint not available");
        setError("Could not load vehicles");
      }
    } catch (err) {
      console.error("Failed to fetch vehicles:", err);
      setError("Failed to load vehicles");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
    const interval = setInterval(() => fetchVehicles(), 15000);
    return () => clearInterval(interval);
  }, [fetchVehicles]);

  // Status summary
  const statusCounts = vehicles.reduce((acc, v) => {
    const s = v.status || "OFFLINE";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const filteredVehicles =
    filterStatus === "ALL"
      ? vehicles
      : vehicles.filter((v) => v.status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSync className="animate-spin text-indigo-500 text-2xl mr-3" />
        <span className="text-gray-500">Loading vehicles...</span>
      </div>
    );
  }

  if (error && vehicles.length === 0) {
    return (
      <div className="text-center py-8">
        <FaCar className="text-4xl text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">{error}</p>
        <button
          onClick={() => fetchVehicles(true)}
          className="mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-800">
            Vehicle Fleet{" "}
            <span className="text-sm font-normal text-gray-500">
              ({vehicles.length} registered)
            </span>
          </h3>
          {/* Live indicator */}
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 border border-green-200 text-xs text-green-700">
            <FaCircle className="text-green-500 text-[6px] animate-pulse" />
            Live
          </span>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => fetchVehicles(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
          >
            <FaSync className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          {!compact && (
            <div className="flex bg-gray-100 rounded-md p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded ${viewMode === "grid" ? "bg-white shadow-sm text-indigo-600" : "text-gray-400"}`}
              >
                <FaThLarge size={14} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded ${viewMode === "list" ? "bg-white shadow-sm text-indigo-600" : "text-gray-400"}`}
              >
                <FaList size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setFilterStatus("ALL")}
          className={`px-3 py-1.5 text-xs rounded-full font-medium transition ${
            filterStatus === "ALL"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All ({vehicles.length})
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full font-medium transition ${
              filterStatus === key
                ? `${cfg.bg} ${cfg.text} ring-1 ring-current`
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <FaCircle
              className={`text-[6px] ${filterStatus === key ? cfg.text : "text-gray-400"}`}
            />
            {cfg.label} ({statusCounts[key] || 0})
          </button>
        ))}
      </div>

      {/* Status summary bar */}
      {!compact && vehicles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = statusCounts[key] || 0;
            const pct = vehicles.length
              ? Math.round((count / vehicles.length) * 100)
              : 0;
            return (
              <div
                key={key}
                className={`flex items-center gap-3 p-3 rounded-lg border ${cfg.border} ${cfg.bg} bg-opacity-50`}
              >
                <div
                  className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center`}
                >
                  <span className={`text-sm font-bold ${cfg.text}`}>
                    {count}
                  </span>
                </div>
                <div>
                  <p className={`text-xs font-medium ${cfg.text}`}>
                    {cfg.label}
                  </p>
                  <p className="text-xs text-gray-400">{pct}%</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!compact && (
        <VehicleHealthMonitoringSystem vehicles={vehicles} timeline={healthTimeline} />
      )}

      {/* VEHICLE CARDS */}
      {filteredVehicles.length === 0 ? (
        <div className="text-center py-10">
          <FaCar className="text-4xl text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No vehicles match this filter</p>
        </div>
      ) : viewMode === "grid" || compact ? (
        <div
          className={`grid gap-4 ${compact ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}`}
        >
          {filteredVehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} compact={compact} />
          ))}
        </div>
      ) : (
        <VehicleListView vehicles={filteredVehicles} />
      )}
    </div>
  );
}

/* ─── Vehicle Card (Grid View) ─── */
function VehicleCard({ vehicle: v, compact }) {
  const status = STATUS_CONFIG[v.status] || STATUS_CONFIG.OFFLINE;
  const TypeIcon = TYPE_ICONS[v.type] || FaCar;
  const batteryLevel = v.batteryLevel ?? 100;
  const engineHealth = v.engineHealth ?? 100;
  const tireHealth = v.tireHealth ?? 100;
  const brakeHealth = v.brakeHealth ?? 100;
  const avgHealth = Math.round((engineHealth + tireHealth + brakeHealth) / 3);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
      {/* Card Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg ${status.bg} flex items-center justify-center`}
            >
              <TypeIcon className={`${status.text} text-lg`} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 text-sm">
                {v.name || v.vehicleCode || `Vehicle #${v.id}`}
              </h4>
              <p className="text-xs text-gray-400">
                {v.manufacturer} {v.model} {v.year ? `• ${v.year}` : ""}
              </p>
            </div>
          </div>
          <span
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold ${status.bg} ${status.text}`}
          >
            <FaCircle
              className={`text-[5px] ${v.status === "IN_USE" || v.status === "AVAILABLE" ? "animate-pulse" : ""}`}
            />
            {status.label}
          </span>
        </div>

        {/* Type & Fuel */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded text-gray-500 font-medium">
            {formatType(v.type)}
          </span>
          {v.fuelType && (
            <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded text-gray-500 font-medium flex items-center gap-1">
              <FaGasPump className="text-[8px]" />
              {v.fuelType}
            </span>
          )}
          {v.seats && (
            <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded text-gray-500 font-medium">
              {v.seats} seats
            </span>
          )}
        </div>

        {/* Battery / Fuel Level */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500 flex items-center gap-1">
              <BatteryIconDisplay level={batteryLevel} />
              {v.fuelType === "ELECTRIC" ? "Battery" : "Fuel"}
            </span>
            <span className={`font-semibold ${getBatteryColor(batteryLevel)}`}>
              {batteryLevel}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${getBarColor(batteryLevel)}`}
              style={{ width: `${batteryLevel}%` }}
            />
          </div>
        </div>

        {/* Health Metrics */}
        {!compact && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-gray-500">Health Score</span>
              <span
                className={`font-semibold ${getBarColor(avgHealth).replace("bg-", "text-")}`}
              >
                {avgHealth}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <HealthMini
                label="Engine"
                value={engineHealth}
                icon={<FaCog className="text-[9px]" />}
              />
              <HealthMini
                label="Tires"
                value={tireHealth}
                icon={<FaRoad className="text-[9px]" />}
              />
              <HealthMini
                label="Brakes"
                value={brakeHealth}
                icon={<FaOilCan className="text-[9px]" />}
              />
            </div>
          </div>
        )}
      </div>

      {/* Card Footer */}
          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <FaMapMarkerAlt className="text-[10px]" />
          {v.currentCityName || v.currentCity?.name || "Unknown"}
        </span>
        <span className="flex items-center gap-1">
          <FaTachometerAlt className="text-[10px]" />
          {(v.mileage || 0).toLocaleString()} mi
        </span>
        {v.pricePerHour != null && (
          <span className="font-medium text-gray-600">
            ₹{v.pricePerHour}/hr
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Small health metric ─── */
function HealthMini({ label, value, icon }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2 text-center">
      <div className="flex items-center justify-center gap-1 mb-1 text-gray-400">
        {icon}
        <span className="text-[10px]">{label}</span>
      </div>
      <div
        className={`text-xs font-bold ${getBarColor(value).replace("bg-", "text-")}`}
      >
        {value}%
      </div>
      <div className="w-full h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${getBarColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

/* ─── List View ─── */
function VehicleListView({ vehicles }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
              Vehicle
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
              Type
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
              Status
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
              Battery
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
              Health
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
              Location
            </th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
              Mileage
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {vehicles.map((v) => {
            const status = STATUS_CONFIG[v.status] || STATUS_CONFIG.OFFLINE;
            const TypeIcon = TYPE_ICONS[v.type] || FaCar;
            const batteryLevel = v.batteryLevel ?? 100;
            const avgHealth = Math.round(
              ((v.engineHealth ?? 100) +
                (v.tireHealth ?? 100) +
                (v.brakeHealth ?? 100)) /
                3,
            );
            return (
              <tr key={v.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <TypeIcon className="text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-800">
                        {v.name || v.vehicleCode || `#${v.id}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {v.manufacturer} {v.model}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {formatType(v.type)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full ${status.bg} ${status.text}`}
                  >
                    <FaCircle className="text-[5px]" />
                    {status.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getBarColor(batteryLevel)}`}
                        style={{ width: `${batteryLevel}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-semibold ${getBatteryColor(batteryLevel)}`}
                    >
                      {batteryLevel}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-semibold ${getBarColor(avgHealth).replace("bg-", "text-")}`}
                  >
                    {avgHealth}%
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {v.currentCity?.name || "Unknown"}
                </td>
                <td className="px-4 py-3 text-right text-gray-600 font-medium">
                  {(v.mileage || 0).toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
