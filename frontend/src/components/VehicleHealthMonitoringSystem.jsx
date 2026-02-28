import { useMemo, useState } from "react";
import {
  FaHeartbeat,
  FaBell,
  FaChartLine,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSkullCrossbones,
} from "react-icons/fa";

const STATUS_META = {
  HEALTHY: {
    label: "Healthy",
    color: "text-green-700",
    bg: "bg-green-100",
    icon: FaCheckCircle,
  },
  ATTENTION: {
    label: "Needs Attention",
    color: "text-amber-700",
    bg: "bg-amber-100",
    icon: FaExclamationTriangle,
  },
  CRITICAL: {
    label: "Critical Risk",
    color: "text-red-700",
    bg: "bg-red-100",
    icon: FaSkullCrossbones,
  },
};

function getCompositeScore(vehicle) {
  const battery = vehicle.batteryLevel ?? 100;
  const engine = vehicle.engineHealth ?? 100;
  const tire = vehicle.tireHealth ?? 100;
  const brake = vehicle.brakeHealth ?? 100;

  return Math.max(
    0,
    Math.min(100, Math.round(battery * 0.35 + engine * 0.35 + tire * 0.15 + brake * 0.15)),
  );
}

function getHealthTier(score) {
  if (score >= 80) return "HEALTHY";
  if (score >= 55) return "ATTENTION";
  return "CRITICAL";
}

function PieChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let startAngle = 0;
  const radius = 42;
  const center = 50;

  const toXY = (angle) => {
    const rad = (Math.PI / 180) * angle;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  const slices = data.map((item) => {
    const angle = (item.value / total) * 360;
    const endAngle = startAngle + angle;
    const start = toXY(startAngle - 90);
    const end = toXY(endAngle - 90);
    const largeArc = angle > 180 ? 1 : 0;
    const path = `M ${center} ${center} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
    const slice = { ...item, path };
    startAngle = endAngle;
    return slice;
  });

  return (
    <svg viewBox="0 0 100 100" className="w-44 h-44">
      {slices.map((slice) => (
        <path key={slice.label} d={slice.path} fill={slice.color} />
      ))}
      <circle cx="50" cy="50" r="20" fill="white" />
      <text x="50" y="53" textAnchor="middle" className="text-[9px] fill-gray-600">
        {total}
      </text>
    </svg>
  );
}

function LineChart({ timeline }) {
  if (!timeline.length) {
    return <div className="text-sm text-gray-500">No trend data yet.</div>;
  }

  const width = 260;
  const height = 120;
  const max = 100;
  const min = 0;
  const points = timeline.map((item, index) => {
    const x = (index / Math.max(1, timeline.length - 1)) * (width - 20) + 10;
    const y = height - ((item.avgScore - min) / (max - min)) * (height - 20) - 10;
    return `${x},${y}`;
  });

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[280px] h-[140px]">
        <polyline fill="none" stroke="#6366f1" strokeWidth="3" points={points.join(" ")} />
      </svg>
      <div className="flex justify-between text-[10px] text-gray-500 max-w-[280px]">
        <span>{timeline[0].time}</span>
        <span>{timeline[timeline.length - 1].time}</span>
      </div>
    </div>
  );
}

export default function VehicleHealthMonitoringSystem({ vehicles, timeline }) {
  const [showAnalytics, setShowAnalytics] = useState(false);

  const healthData = useMemo(() => {
    const mapped = vehicles.map((v) => {
      const score = getCompositeScore(v);
      const tier = getHealthTier(score);
      return { ...v, compositeScore: score, tier };
    });

    const counts = {
      HEALTHY: mapped.filter((v) => v.tier === "HEALTHY").length,
      ATTENTION: mapped.filter((v) => v.tier === "ATTENTION").length,
      CRITICAL: mapped.filter((v) => v.tier === "CRITICAL").length,
    };

    const alerts = mapped
      .filter((v) => v.tier !== "HEALTHY" || (v.healthAlerts && v.healthAlerts.length))
      .sort((a, b) => a.compositeScore - b.compositeScore)
      .slice(0, 5);

    return { mapped, counts, alerts };
  }, [vehicles]);

  const pieData = [
    { label: "Healthy", value: healthData.counts.HEALTHY, color: "#22c55e" },
    { label: "Attention", value: healthData.counts.ATTENTION, color: "#f59e0b" },
    { label: "Critical", value: healthData.counts.CRITICAL, color: "#ef4444" },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Vehicle Health Monitoring System</h3>
          <p className="text-sm text-gray-600">
            Composite health score from battery and component health with automatic status classification.
          </p>
        </div>
        <button
          onClick={() => setShowAnalytics(true)}
          className="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          View Health Analytics
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {Object.entries(STATUS_META).map(([key, meta]) => {
          const Icon = meta.icon;
          return (
            <div key={key} className={`${meta.bg} rounded-lg p-3`}>
              <p className={`text-sm font-semibold flex items-center gap-2 ${meta.color}`}>
                <Icon /> {meta.label}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{healthData.counts[key]}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <p className="font-semibold text-amber-800 flex items-center gap-2">
          <FaBell /> Real-Time Alerts
        </p>
        {healthData.alerts.length === 0 ? (
          <p className="text-sm text-amber-700 mt-1">No active health alerts right now.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-amber-800">
            {healthData.alerts.map((v) => (
              <li key={v.id}>
                {v.vehicleNumber || v.vehicleCode || v.name}: score {v.compositeScore}% ({STATUS_META[v.tier].label})
              </li>
            ))}
          </ul>
        )}
      </div>

      {showAnalytics && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={() => setShowAnalytics(false)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-3xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold flex items-center gap-2">
                <FaHeartbeat className="text-indigo-600" />
                Fleet Health Analytics
              </h4>
              <button onClick={() => setShowAnalytics(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm font-semibold mb-2">Resource Distribution</p>
                <div className="flex items-center gap-4">
                  <PieChart data={pieData} />
                  <div className="space-y-2 text-sm">
                    {pieData.map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.label}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <FaChartLine className="text-indigo-600" />
                  Health Over Time
                </p>
                <LineChart timeline={timeline} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
