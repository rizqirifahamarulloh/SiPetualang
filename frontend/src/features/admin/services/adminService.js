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

  // Get sidebar badge counts (lightweight)
  async getSidebarBadges() {
    const response = await api.get('/admin/sidebar-badges')
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
  },

  // 💰 Deposit Refund
  async getDepositRefunds() {
    const response = await api.get('/admin/deposit-refund')
    return response.data
  },

  async processDepositRefund(id, data) {
    const formData = new FormData()
    formData.append('refund_amount', data.refund_amount)
    formData.append('refund_method', data.refund_method)
    if (data.refund_note) formData.append('refund_note', data.refund_note)
    if (data.refund_proof) formData.append('refund_proof', data.refund_proof)
    const response = await api.post(`/admin/deposit-refund/${id}/process`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }
}