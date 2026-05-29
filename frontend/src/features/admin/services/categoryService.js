// frontend/src/features/admin/services/categoryService.js
import api from '@/services/api';

export const categoryService = {
  // Get all categories
  async getCategories() {
    const response = await api.get('/admin/kategori');
    return response.data;
  },

  // Create a new category
  async createCategory(data) {
    const response = await api.post('/admin/kategori', data);
    return response.data;
  },

  // Update category by ID
  async updateCategory(id, data) {
    const response = await api.put(`/admin/kategori/${id}`, data);
    return response.data;
  },

  // Delete category by ID
  async deleteCategory(id) {
    const response = await api.delete(`/admin/kategori/${id}`);
    return response.data;
  }
};
