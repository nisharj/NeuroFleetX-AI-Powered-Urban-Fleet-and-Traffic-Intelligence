import { Link, useLocation } from "react-router-dom";

export default function Breadcrumb() {
  const location = useLocation();

  // Split path: /admin/vehicles -> ["admin", "vehicles"]
  const pathnames = location.pathname.split("/").filter(Boolean);

  return (
    <nav className="text-sm text-gray-600">
      <ol className="flex items-center space-x-2">
        <li>
          <Link to="/" className="hover:text-blue-600">
            Home
          </Link>
        </li>

        {pathnames.map((value, index) => {
          const to = "/" + pathnames.slice(0, index + 1).join("/");
          const isLast = index === pathnames.length - 1;

          return (
            <li key={to} className="flex items-center space-x-2">
              <span>/</span>
              {isLast ? (
                <span className="font-medium capitalize text-gray-800">
                  {value.replace("-", " ")}
                </span>
              ) : (
                <Link
                  to={to}
                  className="hover:text-blue-600 capitalize"
                >
                  {value.replace("-", " ")}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
