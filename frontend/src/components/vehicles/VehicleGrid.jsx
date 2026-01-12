import { useEffect, useState } from "react";
import VehicleCard from "./VehicleCard";

export default function VehicleGrid({ onEdit, onDelete, refresh }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");


  // 🔹 NEW: filter state
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const fetchVehicles = () => {
    fetch("http://localhost:8080/api/fleet/vehicles", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setVehicles(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const filteredVehicles = vehicles.filter(v => {
    const statusMatch =
      statusFilter === "ALL" || v.status === statusFilter;

    const typeMatch =
      typeFilter === "ALL" ||
      v.type?.toUpperCase() === typeFilter;

    const searchMatch =
      v.vehicleNumber
        .toLowerCase()
        .includes(search.toLowerCase());

    return statusMatch && typeMatch && searchMatch;
  });
  

  if (loading) {
    return <p className="text-center text-gray-500">Loading vehicles...</p>;
  }

  return (
    <>
      {/* FILTER BAR */}
      <div className="flex flex-wrap gap-4 mb-6">

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="ALL">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="IN_USE">In Use</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="ALL">All Types</option>
          <option value="EV">EV</option>
          <option value="DIESEL">Diesel</option>
          <option value="HYBRID">Hybrid</option>
        </select>

        <input type="text" placeholder="Search by vehicle number..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-64"
        />
      </div>

      {/* VEHICLE GRID */}
      {filteredVehicles.length === 0 ? (
        <p className="text-center text-gray-500">No vehicles match filters.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredVehicles.map(vehicle => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </>
  );
}
