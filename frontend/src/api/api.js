import { showToast } from "../components/Toast";

const BASE_URL = "http://localhost:8080";

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("authToken");

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.clear();
    showToast("Session expired. Please login again.", "warning");
    window.location.href = "/";
    return;
  }

  return res;
}
