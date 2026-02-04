import api from './api';

const adminService = {
  // Get all pending approvals
  getPendingApprovals: async () => {
    try {
      const response = await api.get('/admin/pending-approvals');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch pending approvals';
    }
  },

  // Get all users
  getAllUsers: async () => {
    try {
      const response = await api.get('/admin/users');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch users';
    }
  },

  // Approve user
  approveUser: async (userId) => {
    try {
      const response = await api.post(`/admin/approve-user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to approve user';
    }
  },

  // Reject user
  rejectUser: async (userId, reason) => {
    try {
      const response = await api.post(`/admin/reject-user/${userId}`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to reject user';
    }
  },

  // Toggle user status
  toggleUserStatus: async (userId) => {
    try {
      const response = await api.post(`/admin/toggle-user-status/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to toggle user status';
    }
  }
};

export default adminService;
