import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditUserModal({ isOpen, onClose, user, onSave }) {
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    telepon: '',
    tanggal_lahir: '',
    alamat: '',
    peran: 'customer',
    status_akun: 'aktif',
    status_ktp: 'terverifikasi',
    catatan: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        nama: user.nama || '',
        email: user.email || '',
        telepon: user.no_telp || '',
        tanggal_lahir: user.tanggal_lahir || '',
        alamat: user.alamat || '',
        peran: user.peran_pengguna === 'admin' ? 'staff' : 'customer',
        status_akun: 'aktif',
        status_ktp: user.is_verified ? 'terverifikasi' : 'menunggu',
        catatan: ''
      });
      setErrors({});
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTeleponChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, telepon: value }));
    if (value && !/^\d+$/.test(value)) {
      setErrors(prev => ({ ...prev, telepon: 'Format nomor telepon tidak valid.' }));
    } else {
      setErrors(prev => ({ ...prev, telepon: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (errors.telepon) return;
    onSave && onSave({ ...user, ...formData });
    toast.success('Data pengguna berhasil diperbarui', {
      icon: <CheckCircle2 className="text-green-500" />
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-card z-10">
          <h2 className="text-xl font-bold text-gray-800">Edit Data Pengguna</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-8">
          {/* Section 1: Informasi Dasar */}
          <div>
            <h3 className="text-lg font-semibold text-emerald-800 border-b pb-2 mb-4">1. Informasi Dasar</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${errors.telepon ? 'text-red-500' : 'text-foreground'}`}>Telepon</label>
                  <input
                    type="text"
                    name="telepon"
                    value={formData.telepon}
                    onChange={handleTeleponChange}
                    className={`w-full px-3 py-2 border rounded focus:outline-none text-sm ${errors.telepon ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'}`}
                  />
                  {errors.telepon && (
                    <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.telepon}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Tanggal Lahir</label>
                <input
                  type="date"
                  name="tanggal_lahir"
                  value={formData.tanggal_lahir}
                  onChange={handleChange}
                  className="w-1/2 px-3 py-2 border rounded border-gray-300 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Alamat</label>
                <textarea
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-none focus:border-emerald-500 text-sm resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Section 2: Pengaturan Akun */}
          <div>
            <h3 className="text-lg font-semibold text-emerald-800 border-b pb-2 mb-4">2. Pengaturan Akun</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-2">Peran (Role)</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="peran"
                      value="customer"
                      checked={formData.peran === 'customer'}
                      onChange={handleChange}
                      className="text-emerald-700 accent-emerald-700 w-4 h-4"
                    />
                    Customer
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="peran"
                      value="staff"
                      checked={formData.peran === 'staff'}
                      onChange={handleChange}
                      className="text-emerald-700 accent-emerald-700 w-4 h-4"
                    />
                    Staff
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Status Akun</label>
                <select
                  name="status_akun"
                  value={formData.status_akun}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-none focus:border-emerald-500 text-sm bg-card"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                  <option value="banned">Banned</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Status KTP */}
          <div>
            <h3 className="text-lg font-semibold text-emerald-800 border-b pb-2 mb-4">3. Status KTP</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Status Verifikasi KTP</label>
                <select
                  name="status_ktp"
                  value={formData.status_ktp}
                  onChange={handleChange}
                  className="w-1/2 px-3 py-2 border rounded border-gray-300 focus:outline-none focus:border-emerald-500 text-sm bg-card"
                >
                  <option value="terverifikasi">Terverifikasi</option>
                  <option value="menunggu">Menunggu Verifikasi</option>
                  <option value="ditolak">Ditolak</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Catatan Admin (Opsional)</label>
                <textarea
                  name="catatan"
                  value={formData.catatan}
                  onChange={handleChange}
                  placeholder="Tambahkan catatan khusus mengenai verifikasi pengguna ini..."
                  rows="2"
                  className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-none focus:border-emerald-500 text-sm resize-none placeholder:text-muted-foreground"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2 bg-muted -mx-6 px-6 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-foreground bg-card border border-gray-300 rounded hover:bg-muted transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-emerald-800 rounded hover:bg-emerald-900 transition"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
