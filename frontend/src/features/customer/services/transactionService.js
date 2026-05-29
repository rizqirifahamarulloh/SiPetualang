import api from '@/services/api';

export const transactionService = {
  // Checkout langsung (beli sekarang)
  async checkout(data) {
    const response = await api.post('/customer/transaksi/checkout', data);
    return response.data;
  },

  // Get transaksi sebagai penyewa (customer yang menyewa barang)
  async getTransaksiSebagaiPenyewa() {
    const response = await api.get('/customer/transaksi/sebagai-penyewa');
    return response.data;
  },

  // Get transaksi sebagai pemilik (customer yang menerima sewa)
  async getTransaksiSebagaiPemilik() {
    const response = await api.get('/customer/transaksi/sebagai-pemilik');
    return response.data;
  },

  // Update status transaksi
  async updateStatus(transactionId, status) {
    const response = await api.put(`/customer/transaksi/${transactionId}/status`, { 
      status_sewa: status 
    });
    return response.data;
  },

  // Get detail transaksi by ID
  async getDetail(transactionId) {
    const response = await api.get(`/customer/transaksi/${transactionId}`);
    return response.data;
  },

  // Konfirmasi barang sudah diterima (penyewa)
  async confirmBarangDiterima(transactionId) {
    return await this.updateStatus(transactionId, 'sedang_disewa');
  },

  // Konfirmasi barang sudah dikembalikan (pemilik)
  async confirmBarangKembali(transactionId) {
    return await this.updateStatus(transactionId, 'selesai');
  },

  // Batalkan transaksi
  async cancelTransaction(transactionId) {
    return await this.updateStatus(transactionId, 'dibatalkan');
  },

  // Kembalikan barang (Penyewa)
  async kembalikanBarang(transactionId, data) {
    const response = await api.post(`/customer/pengiriman/${transactionId}/kembalikan`, data);
    return response.data;
  }
};

export default transactionService;