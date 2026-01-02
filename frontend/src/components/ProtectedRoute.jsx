import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles, children }) {
    const role = localStorage.getItem("role");

    if (!role || !allowedRoles.includes(role)) {
        return <Navigate to="/" replace />;
    }

    return children;
}
