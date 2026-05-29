import api from '@/services/api'

export const gearService = {
  // Get all gears (dengan pagination & filter)
  async getGears(params) {
    const response = await api.get('/admin/barang', { params })
    return response.data
  },

  // Get gear by ID
  async getGearById(id) {
    const response = await api.get(`/admin/barang/${id}`)
    return response.data
  },

  // Update gear
  async updateGear(id, data) {
    const response = await api.post(`/admin/barang/${id}?_method=PUT`, data)
    return response.data
  },

  // Update gear dengan foto (FormData)
  async updateGearWithPhoto(id, formData) {
    const response = await api.post(`/admin/barang/${id}?_method=PUT`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  // Delete gear
  async deleteGear(id) {
    const response = await api.delete(`/admin/barang/${id}`)
    return response.data
  },

  // Get gear stats
  async getGearStats() {
    const response = await api.get('/admin/barang/stats')
    return response.data
  },

  // Get all categories
  async getCategories() {
    const response = await api.get('/admin/kategori')
    return response.data
  },

  // Get all destinations
  async getDestinations() {
    const response = await api.get('/admin/destinasi')
    return response.data
  },
}
