/* eslint-disable no-unused-vars */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login({ onLogin }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      // ✅ Safe JSON parsing
      let data = null;
      try {
        data = await res.json();
      } catch (err) {
        data = null;
      }

      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || `Login failed (HTTP ${res.status})`,
        );
      }

      if (!data?.token) {
        throw new Error("Token missing from server response");
      }

      // ✅ Store token + user
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user_id", data.id);

      const userObj = {
        id: data.id,
        email: data.email,
        name: data.name || data.email?.split("@")[0] || "User",
        role: (data.role || "customer").toLowerCase(),
      };

      localStorage.setItem("neurofleetx_user", JSON.stringify(userObj));

      // ✅ Update app state
      onLogin(userObj);

      // ✅ redirect
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="app-container flex items-center justify-center"
      style={{ minHeight: "100vh" }}
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
              NeuroFleetX
            </h1>
            <p className="text-secondary" style={{ fontSize: "0.95rem" }}>
              AI-Driven Fleet Management Platform
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label" htmlFor="email">
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
              />
            </div>

            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label" htmlFor="password">
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
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Register link */}
          <div
            className="text-center"
            style={{
              marginTop: "2rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid #E2E8F0",
            }}
          >
            <p className="text-secondary" style={{ fontSize: "0.9rem" }}>
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold"
                style={{ color: "#0EA5E9", textDecoration: "none" }}
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-lg">
          <p className="text-sm text-muted">© 2026 NeuroFleetX.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
