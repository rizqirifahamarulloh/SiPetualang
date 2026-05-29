import { useState, useEffect } from "react";
import { X, Check, Plus, User, Phone, Mail, MapPin, Calendar, DollarSign } from "lucide-react";

export default function TransactionModal({ isOpen, onClose }) {
  // State lokal untuk form input agar UI tetap interaktif saat diketik
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    telepon: "",
    destinasi: "Gunung Rinjani",
    tanggal_mulai: "",
    tanggal_selesai: "",
    total_biaya: "",
  });

  // Reset isi form setiap kali modal dibuka
  useEffect(() => {
    if (isOpen) {
      setFormData({
        nama: "",
        email: "",
        telepon: "",
        destinasi: "Gunung Rinjani",
        tanggal_mulai: "",
        tanggal_selesai: "",
        total_biaya: "",
      });
    }
  }, [isOpen]);

  // Jika status modal tidak aktif, jangan render apa-apa
  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSimpanPalsu = () => {
    // Murni UI: Hanya menutup modal ketika diklik
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-800">
              <Plus size={14} />
            </div>
            Tambah Transaksi Baru
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <X size={16} />
          </button>
        </div>

        {/* Body Form */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto text-xs">
          
          {/* Data Pelanggan */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Data Pelanggan</p>
            
            <div>
              <label className="block text-gray-600 mb-1 font-medium">Nama Lengkap *</label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-500 font-medium transition"
                  placeholder="Contoh: Ahmad Subari"
                  value={formData.nama}
                  onChange={(e) => handleInputChange("nama", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-600 mb-1 font-medium">No. Telepon *</label>
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-500 font-medium transition"
                    placeholder="081234..."
                    value={formData.telepon}
                    onChange={(e) => handleInputChange("telepon", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Email (Opsional)</label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-500 font-medium transition"
                    placeholder="nama@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Detail Transaksi */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Detail Sewa</p>
            
            <div>
              <label className="block text-gray-600 mb-1 font-medium">Destinasi Jalur Gunung</label>
              <div className="relative">
                <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-slate-700 font-medium focus:outline-none focus:border-emerald-500 transition"
                  value={formData.destinasi}
                  onChange={(e) => handleInputChange("destinasi", e.target.value)}
                >
                  <option>Gunung Rinjani</option>
                  <option>Gunung Gede</option>
                  <option>Gunung Semeru</option>
                  <option>Gunung Prau</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-600 mb-1 font-medium">Mulai Sewa *</label>
                <div className="relative">
                  <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-500 font-medium transition"
                    value={formData.tanggal_mulai}
                    onChange={(e) => handleInputChange("tanggal_mulai", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Batas Kembali *</label>
                <div className="relative">
                  <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-500 font-medium transition"
                    value={formData.tanggal_selesai}
                    onChange={(e) => handleInputChange("tanggal_selesai", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-600 mb-1 font-medium">Total Harga Akhir (Rp) *</label>
              <div className="relative">
                <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-800" />
                <input
                  type="number"
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-500 font-bold text-slate-900 transition"
                  placeholder="Misal: 350000"
                  value={formData.total_biaya}
                  onChange={(e) => handleInputChange("total_biaya", e.target.value)}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer Modal */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-slate-600 rounded-xl transition"
          >
            Batal
          </button>
          <button
            onClick={handleSimpanPalsu}
            className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-1.5 rounded-xl flex items-center gap-1 shadow-sm transition"
          >
            <Check size={13} />
            Simpan Transaksi
          </button>
        </div>

      </div>
    </div>
  );
}
