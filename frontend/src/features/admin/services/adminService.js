// frontend/src/features/admin/services/adminService.js
import api from '@/services/api'

export const adminService = {
  // Get all users
  async getUsers(params) {
    const response = await api.get('/admin/users', { params })
    return response
  },

  // Get user by ID
  async getUserById(id) {
    const response = await api.get(`/admin/users/${id}`)
    return response
  },

  // Reset user password
  async resetPassword(userId) {
    const response = await api.post(`/admin/users/${userId}/reset-password`)
    return response
  },

  // Update user
  async updateUser(id, data) {
    const response = await api.put(`/admin/users/${id}`, data)
    return response
  },

  // Delete user
  async deleteUser(userId) {
    const response = await api.delete(`/admin/users/${userId}`)
    return response
  },

  // Get dashboard stats
  async getStats() {
    const response = await api.get('/admin/dashboard')
    return response
  },

  // Get verifications
  async getVerifications() {
    const response = await api.get('/admin/verifikasi')
    return response.data
  },

  // Approve verification
  async approveVerification(id, activateRental = false) {
    const response = await api.post(`/admin/verifikasi/${id}/approve`, { activate_rental: activateRental })
    return response
  },

  // Reject verification
  async rejectVerification(id, catatan) {
    const response = await api.post(`/admin/verifikasi/${id}/reject`, { catatan_admin: catatan })
    return response
  },
  
  async getRevenueStats() {
    const response = await api.get('/admin/revenue')
    return response.data
  },
  
  async getAllTransactions() {
    const response = await api.get('/admin/transactions')
    return response.data
  },
  
  async getOwnerEarnings() {
    const response = await api.get('/admin/owner-earnings')
    return response.data
  },
  
  // Shipping endpoints
  async getPengiriman() {
    const response = await api.get('/admin/pengiriman')
    return response.data
  },
  
  async kirimBarang(id, data) {
    const response = await api.post(`/admin/pengiriman/${id}/kirim`, data)
    return response.data
  },
  
  async updateLokasi(idPengiriman, data) {
    const response = await api.put(`/admin/pengiriman/${idPengiriman}/lokasi`, data)
    return response.data
  },
  
  async getBarangDisewa() {
    const response = await api.get('/admin/pengiriman/disewa')
    return response.data
  },
  
  async konfirmasiKembali(id, data) {
    const response = await api.post(`/admin/pengiriman/${id}/konfirmasi-kembali`, data)
    return response.data
  },

  async pickupBarangDiambil(id) {
    const response = await api.post(`/admin/pengiriman/${id}/pickup-diambil`)
    return response.data
  }
}