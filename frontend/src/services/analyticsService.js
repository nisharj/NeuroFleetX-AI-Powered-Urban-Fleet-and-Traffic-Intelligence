import api from './api';

export const analyticsService = {
  /**
   * Get revenue chart data
   * @param {string} timeRange - 'day', 'week', 'month', or 'year'
   * @returns {Promise} Revenue chart data
   */
  getRevenueData: async (timeRange = 'week') => {
    try {
      const response = await api.get('/analytics/revenue', {
        params: { timeRange }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      throw error;
    }
  },

  /**
   * Get heatmap data for trip density
   * @param {string} timeRange - 'day', 'week', 'month', or 'year'
   * @returns {Promise} Heatmap data
   */
  getHeatmapData: async (timeRange = 'week') => {
    try {
      const response = await api.get('/analytics/heatmap', {
        params: { timeRange }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
      throw error;
    }
  },

  /**
   * Get admin dashboard statistics
   * @param {string} timeRange - 'day', 'week', 'month', or 'year'
   * @returns {Promise} Admin stats data
   */
  getAdminStats: async (timeRange = 'week') => {
    try {
      const response = await api.get('/analytics/stats', {
        params: { timeRange }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  }
};

export default analyticsService;
