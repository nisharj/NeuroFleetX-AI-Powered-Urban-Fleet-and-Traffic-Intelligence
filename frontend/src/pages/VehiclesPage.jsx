import DashboardLayout from "../components/Layout/DashboardLayout";
import VehicleGrid from "../components/vehicles/VehicleGrid";

export default function VehiclesPage() {
  return (
    <DashboardLayout title="Fleet Vehicles">
      <VehicleGrid />
    </DashboardLayout>
  );
}
