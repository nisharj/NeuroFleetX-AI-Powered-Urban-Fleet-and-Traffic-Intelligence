const API_URL = "http://localhost:8080/api";

export async function fetchMetrics(role) {
  const token = localStorage.getItem("token");

  const endpointMap = {
    ADMIN: "/admin/metrics",
    FLEET_MANAGER: "/fleet/metrics",
    DRIVER: "/driver/metrics",
    CUSTOMER: "/customer/metrics",
  };

  const response = await fetch(API_URL + endpointMap[role], {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch metrics");
  }

  return response.json();
}
