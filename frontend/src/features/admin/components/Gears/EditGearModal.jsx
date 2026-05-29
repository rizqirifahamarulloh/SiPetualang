import { useState, useRef, useEffect } from "react";
import { X, ImageIcon, CheckCircle2 } from "lucide-react";

export default function EditGearModal({ isOpen, onClose, gear, categories = [], destinations = [], onSave }) {
  const [formData, setFormData] = useState({
    nama_barang: "", deskripsi: "", id_kategori: "", harga_sewa: "",
    min_durasi_sewa: 1, jumlah_stok: "", status_barang: "tersedia", status_approval: "pending", destinasi_ids: [],
  });
  const [errors, setErrors] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (!gear || !isOpen) return;
    setFormData({
      nama_barang: gear.nama_barang || "",
      deskripsi: gear.deskripsi || "",
      id_kategori: gear.id_kategori ? String(gear.id_kategori) : "",
      harga_sewa: gear.harga_sewa || "",
      min_durasi_sewa: gear.min_durasi_sewa || 1,
      jumlah_stok: gear.jumlah_stok || "",
      status_barang: gear.status_barang || "tersedia",
      status_approval: gear.status_approval || "pending",
      destinasi_ids: gear.destinasi_ids || [],
    });
    setPreviewUrl(null);
    setErrors({});
    setSaved(false);
  }, [gear?.id_barang, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleDestinasiToggle = (id) => {
    setFormData((prev) => ({
      ...prev,
      destinasi_ids: prev.destinasi_ids.includes(id)
        ? prev.destinasi_ids.filter((d) => d !== id)
        : [...prev.destinasi_ids, id],
    }));
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErrors((p) => ({ ...p, foto: "Ukuran file maksimal 5MB." })); return; }
    setPreviewUrl(URL.createObjectURL(file));
    setFormData((prev) => ({ ...prev, foto_barang: file }));
    setErrors((p) => ({ ...p, foto: "" }));
  };

  const validate = () => {
    const e = {};
    if (!formData.nama_barang.trim()) e.nama_barang = "Nama alat wajib diisi.";
    if (!formData.id_kategori) e.id_kategori = "Kategori wajib dipilih.";
    if (!formData.harga_sewa || isNaN(formData.harga_sewa)) e.harga_sewa = "Harga harus berupa angka.";
    if (!formData.jumlah_stok || isNaN(formData.jumlah_stok)) e.jumlah_stok = "Stok harus berupa angka.";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const ve = validate();
    if (Object.keys(ve).length > 0) { setErrors(ve); return; }
    onSave(formData);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">✏️ Edit Data Alat</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nama Alat</label>
            <input type="text" name="nama_barang" value={formData.nama_barang} onChange={handleChange}
              className={`w-full px-3 py-2 border rounded focus:outline-none text-sm ${errors.nama_barang ? "border-red-400 bg-red-50" : "border-gray-300 focus:border-emerald-500"}`} />
            {errors.nama_barang && <p className="text-red-500 text-[10px] mt-1">{errors.nama_barang}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Deskripsi</label>
            <textarea name="deskripsi" value={formData.deskripsi} onChange={handleChange} rows={3}
              className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-none focus:border-emerald-500 text-sm resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Kategori</label>
              <select name="id_kategori" value={formData.id_kategori} onChange={handleChange}
                className={`w-full px-3 py-2 border rounded focus:outline-none text-sm bg-white ${errors.id_kategori ? "border-red-400" : "border-gray-300 focus:border-emerald-500"}`}>
                <option value="">Pilih Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id_kategori} value={cat.id_kategori}>{cat.nama_kategori}</option>
                ))}
              </select>
              {errors.id_kategori && <p className="text-red-500 text-[10px] mt-1">{errors.id_kategori}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status Alat</label>
              <select name="status_barang" value={formData.status_barang} onChange={handleChange}
                className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-none focus:border-emerald-500 text-sm bg-white">
                <option value="tersedia">Tersedia</option>
                <option value="habis">Habis</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Jumlah Stok</label>
              <input type="number" name="jumlah_stok" value={formData.jumlah_stok} onChange={handleChange} min={0}
                className={`w-full px-3 py-2 border rounded focus:outline-none text-sm ${errors.jumlah_stok ? "border-red-400 bg-red-50" : "border-gray-300 focus:border-emerald-500"}`} />
              {errors.jumlah_stok && <p className="text-red-500 text-[10px] mt-1">{errors.jumlah_stok}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Harga per Hari (Rp)</label>
              <input type="number" name="harga_sewa" value={formData.harga_sewa} onChange={handleChange} min={0}
                className={`w-full px-3 py-2 border rounded focus:outline-none text-sm ${errors.harga_sewa ? "border-red-400 bg-red-50" : "border-gray-300 focus:border-emerald-500"}`} />
              {errors.harga_sewa && <p className="text-red-500 text-[10px] mt-1">{errors.harga_sewa}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Min. Durasi Sewa (Hari)</label>
              <input type="number" name="min_durasi_sewa" value={formData.min_durasi_sewa} onChange={handleChange} min={1}
                className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-none focus:border-emerald-500 text-sm" />
              <p className="text-[10px] text-gray-400 mt-1">Customer harus sewa minimal {formData.min_durasi_sewa || 1} hari</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status Approval</label>
              <select name="status_approval" value={formData.status_approval} onChange={handleChange}
                className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-none focus:border-emerald-500 text-sm bg-white">
                <option value="pending">Pending</option>
                <option value="disetujui">Disetujui</option>
                <option value="ditolak">Ditolak</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Upload Foto</label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition"
              onClick={() => fileRef.current?.click()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setPreviewUrl(URL.createObjectURL(f)); setFormData((prev) => ({ ...prev, foto_barang: f })); } }}
              onDragOver={(e) => e.preventDefault()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="h-32 object-contain rounded mb-2" />
              ) : (
                <>
                  <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-3">
                    <ImageIcon size={22} className="text-emerald-600" />
                  </div>
                  <p className="text-sm text-emerald-600 font-medium">Klik untuk upload atau drag &amp; drop</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
            {previewUrl && (
              <button type="button" onClick={() => setPreviewUrl(null)} className="text-xs text-red-500 mt-1 hover:underline">
                Hapus foto
              </button>
            )}
            {errors.foto && <p className="text-red-500 text-[10px] mt-1">{errors.foto}</p>}
          </div>

          {destinations.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Destinasi yang Sesuai</label>
              <div className="border rounded-lg p-4 grid grid-cols-2 gap-2">
                {destinations.map((dest) => (
                  <label key={dest.id_destinasi} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={formData.destinasi_ids.includes(dest.id_destinasi)}
                      onChange={() => handleDestinasiToggle(dest.id_destinasi)}
                      className="accent-emerald-700 w-4 h-4 rounded" />
                    {dest.nama_destinasi}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 bg-slate-50 -mx-6 px-6 pb-2">
            <button type="button" onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition">
              Batal
            </button>
            <button type="submit"
              className={`px-5 py-2 text-sm font-medium text-white rounded transition flex items-center gap-2 ${saved ? "bg-emerald-500" : "bg-emerald-800 hover:bg-emerald-900"}`}>
              {saved ? <><CheckCircle2 size={16} /> Tersimpan!</> : <><span>💾</span> Simpan Perubahan</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
