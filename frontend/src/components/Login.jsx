/* eslint-disable no-unused-vars */
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [apiError, setApiError] = useState("");
    
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        setFieldErrors({});
        setApiError("");

        const errors = {};
        if (!email.trim()) {
            errors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            errors.email = "Please enter a valid email address";
        }

        if (!password) {
            errors.password = "Password is required";
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
            throw new Error("Invalid credentials");
            }

            const data = await response.json();

            localStorage.setItem("token", data.token);
            localStorage.setItem("email", data.email);
            localStorage.setItem("role", data.role); // OK for now

            switch (data.role) {
            case "ADMIN":
                navigate("/admin");
                break;
            case "FLEET_MANAGER":
                navigate("/fleet");
                break;
            case "DRIVER":
                navigate("/driver");
                break;
            case "CUSTOMER":
                navigate("/customer");
                break;
            default:
                navigate("/");
            }
        } catch (error) {
            setApiError(error.message || "Login failed. Please try again.");
        }
        };


    return (
        <>
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <form
                    onSubmit={handleSubmit}
                    className="login-form bg-white p-6 rounded shadow-md w-full max-w-sm mx-auto mt-12 items-center"
                    aria-label="Login Form"
                    noValidate 
                >
                    <h2 className="text-xl text-center font-bold mb-6 ">NeuroFleetX</h2>

                    {apiError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm text-center">
                            {apiError}
                        </div>
                    )}

                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-700 font-medium mb-2"> Email</label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
                            }}
                            autoComplete="email"
                            placeholder="Enter your email"
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                fieldErrors.email 
                                    ? "border-red-500 focus:ring-red-200" 
                                    : "border-gray-300 focus:ring-blue-500"
                            }`}
                        />
                        
                        {fieldErrors.email && (
                            <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label htmlFor="password" className="block text-gray-700 font-medium mb-2">Password</label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" });
                            }}
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                fieldErrors.password 
                                    ? "border-red-500 focus:ring-red-200" 
                                    : "border-gray-300 focus:ring-blue-500"
                            }`}
                        />
                        
                        {fieldErrors.password && (
                            <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                        )}
                    </div>

                    <button type="submit" className="w-full bg-blue-500 text-white font-medium mb-2 py-2 rounded-md hover:bg-blue-700 transition">Login</button>

                    <p className="mt-4 font-medium mb-2 text-center">Register for <a href="/register" className="text-blue-700">new account</a></p>
                </form>
            </div>
        </>
    )
}