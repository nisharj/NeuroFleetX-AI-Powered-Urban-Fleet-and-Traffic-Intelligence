import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Register from "./Register";

export default function Login(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const response = await fetch("http://localhost:8080/api/auth/login",{
            method: "POST",
            headers:{"Content-Type": "application/json"},
            body: JSON.stringify({email, password})
        });

        if(response.ok){
            navigate("/dashboard");
        }
        else{
            alert("Invalid credentials");
        }
    };

    return (
        <>
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <form 
                    onSubmit={handleSubmit}
                    className="login-form bg-white p-6 rounded shadow-md w-full max-w-sm mx-auto mt-12 items-center"
                    aria-label="Login Form"
                >
                    <h2 className="text-xl text-center font-bold mb-6 ">Login</h2>

                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-700 font-medium mb-2"> Email</label>
                        <input type="email" name="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required 
                            autoComplete="email"
                            placeholder="Enter your email" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" 
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="password" className="block text-gray-700 font-medium mb-2">Password</label>
                        <input type="password" name="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required 
                            autoComplete="current-password"
                            placeholder="Enter your password" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                        />
                    </div>

                    <button type="submit" className="w-full bg-blue-500 font-medium mb-2 py-2 rounded-md hover:bg-blue-700 transition">Login</button>

                    <p className="mt-4 font-medium mb-2 text-center">Register for <a href="/register" className="text-blue-700">new account</a></p>
                </form>
            </div>
        </>
    )
}