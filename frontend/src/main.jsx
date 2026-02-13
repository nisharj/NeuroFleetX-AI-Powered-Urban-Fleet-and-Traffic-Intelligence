import { createRoot } from "react-dom/client";
import "./index.css";
import "leaflet/dist/leaflet.css";
import App from "./App.jsx";

// StrictMode removed to prevent Leaflet map double-initialization in development
createRoot(document.getElementById("root")).render(<App />);
