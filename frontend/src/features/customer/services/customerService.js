import api from '@/services/api'

export const customerService = {
  async submitVerification(formData) {
    const response = await api.post(
      '/customer/verifikasi',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response
  },
}