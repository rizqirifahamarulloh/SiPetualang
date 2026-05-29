// frontend/src/features/admin/services/destinationService.js
import api from '@/services/api';

export const destinationService = {
  // Get all destinations
  async getDestinations() {
    const response = await api.get('/admin/destinasi');
    return response.data;
  },

  // Create a new destination
  async createDestination(data) {
    const response = await api.post('/admin/destinasi', data);
    return response.data;
  },

  // Update destination by ID
  async updateDestination(id, data) {
    const response = await api.put(`/admin/destinasi/${id}`, data);
    return response.data;
  },

  // Delete destination by ID
  async deleteDestination(id) {
    const response = await api.delete(`/admin/destinasi/${id}`);
    return response.data;
  }
};
