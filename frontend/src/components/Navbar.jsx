import { Link, useNavigate } from "react-router-dom";

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  // ✅ Safe fallback values
  const userName = user?.name || user?.email || "Guest";
  const userRole = user?.role
    ? user.role.replace("_", " ").toUpperCase()
    : "USER";

  const handleLogout = () => {
    // ✅ prevent crash if onLogout not passed
    if (onLogout) onLogout();

    // ✅ always redirect after logout
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          <div className="navbar-logo">NF</div>
          <span>NeuroFleetX</span>
        </Link>

        <ul className="navbar-nav">
          <li>
            <span className="nav-link">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
                style={{ display: "inline", marginRight: "8px" }}
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>

              {/* ✅ FIXED */}
              {userName}
            </span>
          </li>

          <li>
            {/* ✅ FIXED */}
            <span className="badge badge-primary">{userRole}</span>
          </li>

          <li>
            {/* ✅ FIXED */}
            <button onClick={handleLogout} className="btn btn-ghost btn-sm">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                  clipRule="evenodd"
                />
              </svg>
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
