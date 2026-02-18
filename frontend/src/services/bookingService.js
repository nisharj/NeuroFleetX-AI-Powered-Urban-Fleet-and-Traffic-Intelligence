import api from "./api";

export const bookingService = {
  /**
   * Create a new booking
   * @param {Object} bookingData - Booking details
   * @returns {Promise} Created booking
   */
  createBooking: async (bookingData) => {
    try {
      const response = await api.post("/bookings", bookingData);
      return response.data;
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    }
  },

  /**
   * Get user's booking history
   * @returns {Promise}
   */
  getUserBookings: async () => {
    try {
      const response = await api.get("/bookings/user");
      return response.data;
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      throw error;
    }
  },

  /**
   * Get available vehicles for a time period
   * @param {string} startTime - ISO datetime string
   * @param {string} endTime - ISO datetime string
   * @returns {Promise} List of available vehicles
   */
  getAvailableVehicles: async (startTime, endTime) => {
    try {
      const response = await api.get("/vehicles/available", {
        params: { startTime, endTime },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching available vehicles:", error);
      throw error;
    }
  },

  // Get pending ride-hailing bookings; optional vehicleType param will filter server-side
  getPendingBookings: async (vehicleType) => {
    try {
      const response = await api.get("/bookings/pending", {
        params: vehicleType ? { vehicleType } : {},
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching pending bookings:", error);
      throw error;
    }
  },

  // Driver actions
  acceptBooking: async (
    bookingId,
    acceptedAtIso = null,
    driverEmail = null,
  ) => {
    try {
      const payload = {};
      if (acceptedAtIso) payload.acceptedAt = acceptedAtIso;
      if (driverEmail) payload.driverEmail = driverEmail;
      const response = await api.post(`/bookings/${bookingId}/accept`, payload);
      return response.data;
    } catch (error) {
      console.error("Error accepting booking:", error, error?.response?.data);
      // Re-throw so callers can handle and display server-provided message
      throw error;
    }
  },

  rejectBooking: async (bookingId) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/reject`);
      return response.data;
    } catch (error) {
      console.error("Error rejecting booking:", error);
      throw error;
    }
  },

  // Lifecycle updates
  markArrived: async (bookingId) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/arrived`);
      return response.data;
    } catch (error) {
      console.error("Error marking arrived:", error);
      throw error;
    }
  },

  markStarted: async (bookingId) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/start`);
      return response.data;
    } catch (error) {
      console.error("Error marking started:", error);
      throw error;
    }
  },

  markCompleted: async (bookingId) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/complete`);
      return response.data;
    } catch (error) {
      console.error("Error marking completed:", error);
      throw error;
    }
  },

  cancelBooking: async (bookingId, reason) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/cancel`, {
        reason,
      });
      return response.data;
    } catch (error) {
      console.error("Error cancelling booking:", error);
      throw error;
    }
  },

  // Admin
  getAllBookings: async () => {
    try {
      const response = await api.get("/bookings/all");
      return response.data;
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      throw error;
    }
  },
};

export default bookingService;
