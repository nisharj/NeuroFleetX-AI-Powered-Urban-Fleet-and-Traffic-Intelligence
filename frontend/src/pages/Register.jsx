import { useState } from "react";
import { Link } from "react-router-dom";
import { showToast } from "../components/Toast";

function Register({ onRegister }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "customer",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role.toUpperCase(), // Backend expects uppercase enum
            phone: "9999999999", // Default phone for now
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Show success message and redirect to login
      showToast(data.message || "Registration successful! Please log in.", "success");

      // We don't auto-login after register because of potential approval requirement
      // Instead, redirect to login page
      window.location.href = "/login";
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="app-container flex items-center justify-center"
      style={{ minHeight: "100vh", padding: "var(--spacing-xl) 0" }}
    >
      <div
        className="content-wrapper"
        style={{ maxWidth: "480px", width: "100%" }}
      >
        <div className="glass-card animate-fadeIn" style={{ padding: "3rem" }}>
          {/* Title */}
          <div className="text-center mb-xl">
            <h1
              className="text-gradient"
              style={{
                fontSize: "2.5rem",
                fontWeight: "800",
                marginBottom: "0.5rem",
              }}
            >
              Create Account
            </h1>
            <p
              className="text-secondary"
              style={{ fontSize: "0.95rem", color: "#64748B" }}
            >
              Join the NeuroFleetX Platform
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label
                className="form-label"
                htmlFor="name"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#334155",
                  marginBottom: "0.5rem",
                  display: "block",
                  textTransform: "uppercase",
                  letterSpacing: "0.025em",
                }}
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
                style={{ fontSize: "1rem", padding: "0.875rem 1rem" }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label
                className="form-label"
                htmlFor="email"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#334155",
                  marginBottom: "0.5rem",
                  display: "block",
                  textTransform: "uppercase",
                  letterSpacing: "0.025em",
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                style={{ fontSize: "1rem", padding: "0.875rem 1rem" }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label
                className="form-label"
                htmlFor="role"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#334155",
                  marginBottom: "0.5rem",
                  display: "block",
                  textTransform: "uppercase",
                  letterSpacing: "0.025em",
                }}
              >
                Account Type
              </label>
              <select
                id="role"
                name="role"
                className="form-select"
                value={formData.role}
                onChange={handleChange}
                required
                style={{ fontSize: "1rem", padding: "0.875rem 1rem" }}
              >
                <option value="customer">Customer / Commuter</option>
                <option value="driver">Driver</option>
                <option value="fleet_manager">Fleet Manager / Operator</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label
                className="form-label"
                htmlFor="password"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#334155",
                  marginBottom: "0.5rem",
                  display: "block",
                  textTransform: "uppercase",
                  letterSpacing: "0.025em",
                }}
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                style={{ fontSize: "1rem", padding: "0.875rem 1rem" }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label
                className="form-label"
                htmlFor="confirmPassword"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#334155",
                  marginBottom: "0.5rem",
                  display: "block",
                  textTransform: "uppercase",
                  letterSpacing: "0.025em",
                }}
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-input"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                style={{ fontSize: "1rem", padding: "0.875rem 1rem" }}
              />
            </div>

            {error && (
              <div className="form-error mb-md">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13H7v-2h2v2zm0-3H7V4h2v6z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "0.875rem 1.5rem",
                fontSize: "1rem",
                fontWeight: "700",
                marginTop: "0.5rem",
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div
                    className="loading-spinner"
                    style={{
                      width: "20px",
                      height: "20px",
                      borderWidth: "2px",
                    }}
                  ></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div
            className="text-center"
            style={{
              marginTop: "2rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid #E2E8F0",
            }}
          >
            <p className="text-secondary" style={{ fontSize: "0.9rem" }}>
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold"
                style={{
                  color: "#0EA5E9",
                  textDecoration: "none",
                  fontWeight: "600",
                }}
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-lg">
          <p className="text-sm text-muted">
            © 2026 NeuroFleetX. Powered by AI & IoT.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
