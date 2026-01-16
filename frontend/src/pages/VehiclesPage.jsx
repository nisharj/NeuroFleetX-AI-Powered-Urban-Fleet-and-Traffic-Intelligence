import { useState } from "react";
import DashboardLayout from "../components/Layout/DashboardLayout";
import VehicleGrid from "../components/vehicles/VehicleGrid";
import VehicleForm from "../components/vehicles/VehicleForm";
import { apiFetch } from "../api/api";

export default function VehiclesPage() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [refresh, setRefresh] = useState(false);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this vehicle?"
    );

    if (!confirmDelete) return;

    const res = await apiFetch(`/api/fleet/vehicles/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setRefresh(!refresh);
    } else {
      alert("Failed to delete vehicle");
    }
  };

  return (
    <DashboardLayout title="Fleet Vehicles">
      <VehicleForm
        selectedVehicle={selectedVehicle}
        onSuccess={() => {
          setSelectedVehicle(null);
          setRefresh(!refresh);
        }}
      />

      <VehicleGrid
        onEdit={setSelectedVehicle}
        onDelete={handleDelete}
        refresh={refresh}
      />
    </DashboardLayout>
  );
}
