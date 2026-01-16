import { Link } from "react-router-dom";
import Breadcrumb from "./Breadcrumb";
import ProfileDropdown from "./ProfileDropdown";

export default function Topbar() {
  const role = localStorage.getItem("role");

  {(role === "ADMIN" || role === "FLEET_MANAGER") && (
    <Link to="/fleet/vehicles">Fleet Vehicles</Link>
  )}


  return (
    <header className="bg-white shadow px-6 py-4">
      
      <div className="flex justify-between items-center">
        
        <h1 className="text-xl font-bold text-blue-600">
          NeuroFleetX
        </h1>

        <div className="flex items-center gap-6">
          
          <nav className="flex gap-6 font-medium">
            {role === "ADMIN" && <Link to="/admin">Dashboard</Link>}
            {role === "FLEET_MANAGER" && <Link to="/fleet">Dashboard</Link>}
            {role === "DRIVER" && <Link to="/driver">Dashboard</Link>}
            {role === "CUSTOMER" && <Link to="/customer">Dashboard</Link>}
          </nav>

          <ProfileDropdown />
        </div>
      </div>

      {/* <div className="mt-2">
        <Breadcrumb />
      </div> */}

    </header>
  );
}
