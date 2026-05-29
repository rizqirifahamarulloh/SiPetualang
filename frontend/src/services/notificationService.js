// frontend/src/services/notificationService.js
import api from '@/services/api';

export const notificationService = {
  // Get all notifications for current user
  async getNotifications() {
    const response = await api.get('/notifikasi');
    return response.data;
  },

  async deleteNotification(id) {
    const response = await api.delete(`/notifikasi/${id}`);
    return response.data;
  },

  async markNotificationRead(id) {
    const response = await api.patch(`/notifikasi/${id}/read`);
    return response.data;
  },

  async clearAllNotifications() {
    const response = await api.delete('/notifikasi');
    return response.data;
  },
};
