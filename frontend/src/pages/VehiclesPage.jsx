import { useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import VehicleGrid from "../components/vehicles/VehicleGrid";
import VehicleForm from "../components/vehicles/VehicleForm";

export default function VehiclesPage() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [refresh, setRefresh] = useState(false);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this vehicle?"
    );

    if (!confirmDelete) return;

    const res = await fetch(
      `http://localhost:8080/api/fleet/vehicles/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      }
    );

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
