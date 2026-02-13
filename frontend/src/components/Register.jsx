import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CUSTOMER");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [apiError, setApiError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const navigate = useNavigate();

  const isValidEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setFieldErrors({});

    const errors = {};

    if (!name.trim()) {
      errors.name = "Name is required";
    } else if (name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!isValidEmail(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!response.ok) {
        // Try to parse error message from backend
        const contentType = response.headers.get("content-type");
        let errorMessage = "Registration failed";

        try {
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            errorMessage = await response.text();
          }
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
        }

        throw new Error(errorMessage);
      }

      // Registration successful
      const data = await response.json();
      // Show success message and redirect to login
      alert(data.message || "Registration successful! Please log in.");
      navigate("/");
    } catch (err) {
      setApiError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-sm"
        aria-label="Register Form"
        noValidate
      >
        <h2 className="text-xl text-center font-bold mb-6">NeuroFleetX</h2>

        {apiError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm text-center">
            {apiError}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name)
                setFieldErrors({ ...fieldErrors, name: "" });
            }}
            autoComplete="name"
            placeholder="Enter your full name"
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.name ? "border-red-500" : "border-gray-300"
            }`}
          />

          {fieldErrors.name && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email)
                setFieldErrors({ ...fieldErrors, email: "" });
            }}
            autoComplete="email"
            placeholder="Enter your email"
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.email ? "border-red-500" : "border-gray-300"
            }`}
          />

          {fieldErrors.email && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password)
                setFieldErrors({ ...fieldErrors, password: "" });
            }}
            autoComplete="new-password"
            placeholder="Enter your password"
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.password ? "border-red-500" : "border-gray-300"
            }`}
          />

          {fieldErrors.password && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword)
                setFieldErrors({ ...fieldErrors, confirmPassword: "" });
            }}
            autoComplete="new-password"
            placeholder="Confirm your password"
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.confirmPassword ? "border-red-500" : "border-gray-300"
            }`}
          />

          {fieldErrors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label
            htmlFor="role"
            className="block text-gray-700 font-medium mb-2"
          >
            {" "}
            Role{" "}
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="CUSTOMER">Customer</option>
            <option value="DRIVER">Driver</option>
            <option value="FLEET_MANAGER">Fleet Manager</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white font-medium py-2 rounded-md hover:bg-blue-700 transition"
        >
          Register
        </button>

        <p className="mt-4 text-center font-medium">
          Already have an account?{" "}
          <Link to="/" className="text-blue-700 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
