import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";

export default function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const email = localStorage.getItem("email"); 
  const role = localStorage.getItem("role");

  const avatarLetter = email.charAt(0).toUpperCase();


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full bg-blue-600 text-white  flex items-center justify-center font-bold text-lg hover:bg-blue-700 transition"
      >
        {/* <FaUserCircle size={28} /> */}
        {avatarLetter || "U"}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-64 bg-white rounded-lg shadow-lg border z-50">
          
          <div className="p-4 border-b">
            <p className="text-sm font-semibold text-gray-800">
              {email} {/* ✅ Username */}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {role?.toLowerCase().replace("_", " ")}
            </p>
          </div>

          <button
            onClick={logout}
            className="w-full px-4 py-3 flex items-center gap-2 text-red-600 hover:bg-gray-100"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
