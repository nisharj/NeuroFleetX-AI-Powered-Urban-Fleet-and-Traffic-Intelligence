import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("CUSTOMER");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password ,role })
            });

            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || "Registration failed");
            }

            navigate("/");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded shadow-md w-full max-w-sm"
                aria-label="Register Form"
            >
                <h2 className="text-xl text-center font-bold mb-6">Register</h2>

                {error && (
                    <p className="text-red-600 text-sm mb-4 text-center">
                        {error}
                    </p>
                )}

                <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        placeholder="Enter your email"
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                        Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        placeholder="Enter your password"
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        placeholder="Confirm your password"
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="role" className="block text-gray-700 font-medium mb-2"> Role </label>
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
