// frontend/src/features/admin/services/dashboardService.js
import api from '@/services/api';

export const dashboardService = {
    async getStats() {
        const response = await api.get('/admin/dashboard');
        return response;
    },
};