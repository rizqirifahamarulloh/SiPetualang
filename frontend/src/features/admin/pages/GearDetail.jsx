import { useState, useEffect } from "react";
import { Package, ArrowLeft, Edit, Trash2, Tag, Star, MapPin, ExternalLink, ShieldAlert } from "lucide-react";
import EditGearModal from "../components/Gears/EditGearModal";
import DeleteGearModal from "../components/Gears/DeleteGearModal";
import { gearService } from "../services/GearService";
import { toast } from "sonner";
import { BASE_URL } from "@/services/api";
import { getStorageUrl } from "@/utils/storageUrl";

// Config & Dummy data logic specific to the Detail View
const STATUS_CONFIG = {
  tersedia: { label: "Tersedia", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  habis:    { label: "Habis",    dot: "bg-red-500",     badge: "bg-red-50 text-red-700 border border-red-200" },
};

const STATUS_KEMBALI_CONFIG = {
  dikembalikan: { label: "Dikembalikan", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  terlambat:    { label: "Terlambat",    className: "bg-red-50 text-red-700 border border-red-200" },
  aktif:        { label: "Aktif",        className: "bg-orange-50 text-orange-700 border border-orange-200" },
  menunggu:     { label: "Menunggu",     className: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
};

const APPROVAL_CONFIG = {
  pending:   { label: "Pending",   className: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
  disetujui: { label: "Disetujui", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  ditolak:   { label: "Ditolak",   className: "bg-red-50 text-red-700 border border-red-200" },
};

const formatHarga = (val) => `Rp ${Number(val || 0).toLocaleString("id-ID")}`;
const formatTanggal = (val) =>
  val ? new Date(val).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

export default function GearDetail({ gearId, onBack, onGearUpdate, onGearDelete, categories, destinations, gearsData }) {
  const [gear, setGear] = useState(null);
  const [activeTab, setActiveTab] = useState("transaksi");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleUpdateStatus = async (status_barang) => {
    try {
      const res = await gearService.updateGear(gear.id_barang, { status_barang });
      if (res.status === 'success') {
        const updated = { ...gear, status_barang };
        setGear(updated);
        onGearUpdate(updated);
        toast.success(`Status alat berhasil diubah menjadi ${status_barang === 'tersedia' ? 'Tersedia' : 'Nonaktif (Habis)'}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memperbarui status alat");
    }
  };

  const handleUpdateApproval = async (status_approval, status_barang = null) => {
    try {
      const payload = { status_approval };
      if (status_barang) payload.status_barang = status_barang;
      
      const res = await gearService.updateGear(gear.id_barang, payload);
      if (res.status === 'success') {
        const updated = { ...gear, status_approval, ...(status_barang ? { status_barang } : {}) };
        setGear(updated);
        onGearUpdate(updated);
        toast.success(`Persetujuan alat berhasil diubah menjadi: ${status_approval.toUpperCase()}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memperbarui persetujuan alat");
    }
  };

  useEffect(() => {
    const found = gearsData.find((g) => g.id_barang === gearId);
    setGear(found ? { ...found } : null);
  }, [gearId, gearsData]);

  if (!gear) return <div className="p-8 text-center text-muted-foreground">Alat tidak ditemukan.</div>;

  const statusCfg = STATUS_CONFIG[gear.status_barang] || STATUS_CONFIG.habis;
  const transaksiList = gear.detail_transaksi || [];

  const handleSaveEdit = async (formData) => {
    try {
      const res = await gearService.updateGear(gear.id_barang, formData);
      if (res.status === 'success') {
        const updatedGear = {
          ...gear,
          ...formData,
          id_kategori: Number(formData.id_kategori),
          harga_sewa: Number(formData.harga_sewa),
          jumlah_stok: Number(formData.jumlah_stok),
          kategori: { nama_kategori: categories.find((c) => c.id_kategori === Number(formData.id_kategori))?.nama_kategori || gear.kategori?.nama_kategori },
          destinasi: destinations.filter((d) => formData.destinasi_ids.includes(d.id_destinasi)),
        };
        setGear(updatedGear);
        onGearUpdate(updatedGear);
        toast.success("Data alat berhasil disimpan!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan data alat");
    }
  };

  const statsItems = [
    { label: "Total Disewa", value: gear.total_disewa ?? transaksiList.length, suffix: "Kali" },
    { label: "Stok Total", value: gear.jumlah_stok ?? 0, suffix: "Unit" },
    { label: "Tersedia", value: gear.stok_tersedia ?? gear.jumlah_stok ?? 0, suffix: "Unit" },
    { label: "Kondisi", value: gear.kondisi ?? "Baik", suffix: "" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-xs text-muted-foreground">
              Dashboard &gt;{" "}
              <span onClick={onBack} className="cursor-pointer hover:underline text-foreground">Manajemen Alat</span>
              {" "}&gt; Detail Alat
            </p>
            <h1 className="text-2xl font-bold">Detail Alat</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-emerald-700 border border-emerald-500 rounded-full hover:bg-emerald-50 transition bg-card shadow-xs">
            <Edit size={15} /> Edit
          </button>
          <button onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-full hover:bg-red-700 transition shadow-xs">
            <Trash2 size={15} /> Hapus
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Foto & Stats */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
          <div className="relative rounded-xl overflow-hidden bg-muted border border-border mb-4 h-64 flex items-center justify-center">
            {gear.foto_barang ? (
              <img src={getStorageUrl(gear.foto_barang)} alt={gear.nama_barang} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-gray-300">
                <Package size={48} className="mb-3" />
                <span className="text-sm">Belum ada foto</span>
              </div>
            )}
            <div className="absolute top-3 left-3">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusCfg.dot}`}></span>
                {statusCfg.label}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {statsItems.map((s, i) => (
              <div key={i} className="bg-muted rounded-xl p-3 text-center border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-tight mb-1">{s.label}</p>
                <p className="font-bold text-base leading-tight">{s.value}</p>
                {s.suffix && <p className="text-[10px] text-muted-foreground">{s.suffix}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Info Alat */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border border-border bg-muted text-foreground uppercase tracking-wide">
              <Tag size={11} />{gear.kategori?.nama_kategori || "-"}
            </span>
            {gear.rating && (
              <span className="flex items-center gap-1 text-sm text-amber-600 font-medium">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                {gear.rating} ({gear.jumlah_ulasan || 0} Ulasan)
              </span>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-1">{gear.nama_barang}</h2>
            <p className="text-2xl font-bold text-emerald-700">{formatHarga(gear.harga_sewa)}<span className="text-sm font-normal text-muted-foreground"> / hari</span></p>
            {(gear.min_durasi_sewa || 1) > 1 && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                📅 Minimum sewa: <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">{gear.min_durasi_sewa} hari</span>
              </p>
            )}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">{gear.deskripsi || "Tidak ada deskripsi."}</p>

          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pemilik</span>
              <span className="font-medium">{gear.pemilik?.nama || "-"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status Approval</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${APPROVAL_CONFIG[gear.status_approval]?.className || ""}`}>
                {APPROVAL_CONFIG[gear.status_approval]?.label || gear.status_approval}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Metode Penyerahan Barang</span>
              <span className="font-semibold text-foreground">
                {gear.metode_penyerahan === 'delivery' ? '🚚 Kirim via Kurir (Delivery)' : '🏪 Datang Langsung ke Gudang'}
              </span>
            </div>
            {gear.metode_penyerahan === 'delivery' && gear.no_resi_penyerahan && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">No. Resi Pengiriman</span>
                <span className="font-mono font-semibold text-foreground bg-slate-100 px-2 py-0.5 rounded text-xs">
                  {gear.no_resi_penyerahan}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status Penyerahan ke Gudang</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                gear.status_penyerahan === 'diterima' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                gear.status_penyerahan === 'dikirim' ? 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse' :
                'bg-muted text-muted-foreground border-slate-200'
              }`}>
                {gear.status_penyerahan === 'diterima' ? '✓ Diterima di Gudang' :
                 gear.status_penyerahan === 'dikirim' ? 'Dalam Pengiriman' :
                 'Belum Dikirim / Diambil'}
              </span>
            </div>
          </div>

          {gear.destinasi && gear.destinasi.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><MapPin size={12} /> Destinasi yang Sesuai</p>
              <div className="flex flex-wrap gap-2">
                {gear.destinasi.map((d) => (
                  <span key={d.id_destinasi} className="px-2.5 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {d.nama_destinasi}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Admin Control Panel Card */}
          <div className="bg-muted border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-emerald-700" /> Panel Kontrol Admin
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Sebagai admin, Anda memiliki otoritas penuh untuk menyetujui, menolak, atau menonaktifkan barang sewaan ini sebelum ditampilkan ke pelanggan.
            </p>
            
            <div className="grid grid-cols-2 gap-2">
              {gear.status_approval !== "disetujui" ? (
                <button
                  type="button"
                  onClick={() => handleUpdateApproval("disetujui", "tersedia")}
                  className="px-3 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                >
                  ✓ Setujui & Aktifkan
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleUpdateApproval("pending", "habis")}
                  className="px-3 py-2 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition cursor-pointer"
                >
                  ⚠ Nonaktifkan (Tunda)
                </button>
              )}
              
              <button
                type="button"
                onClick={() => handleUpdateApproval("ditolak", "habis")}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  gear.status_approval === "ditolak"
                    ? "bg-slate-300 text-foreground cursor-not-allowed"
                    : "text-white bg-rose-600 hover:bg-rose-700"
                }`}
                disabled={gear.status_approval === "ditolak"}
              >
                ✕ Tolak Barang
              </button>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold">Status Barang:</span>
              <button
                type="button"
                onClick={() => handleUpdateStatus(gear.status_barang === "tersedia" ? "habis" : "tersedia")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  gear.status_barang === "tersedia" 
                    ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100" 
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                {gear.status_barang === "tersedia" ? "Nonaktifkan (Set Habis)" : "Aktifkan (Set Tersedia)"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-6 px-2">
        {["transaksi", "ulasan"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold ${activeTab === tab ? "border-b-2 border-emerald-700 text-emerald-800" : "text-muted-foreground hover:text-foreground"}`}>
            {tab === "transaksi" ? "Riwayat Transaksi Alat" : "Ulasan"}
          </button>
        ))}
      </div>

      {activeTab === "transaksi" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-sm">Riwayat Transaksi Alat</h3>
            <button className="text-xs text-emerald-600 hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer">
              Lihat Semua <ExternalLink size={11} />
            </button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                {["Nama Penyewa", "Tanggal Mulai", "Durasi", "Status Pengembalian", "Aksi"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transaksiList.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Belum ada riwayat transaksi.</td></tr>
              ) : transaksiList.map((trx, i) => {
                const sk = trx.status_sewa || "aktif";
                const skCfg = STATUS_KEMBALI_CONFIG[sk] || STATUS_KEMBALI_CONFIG.aktif;
                const durasi = trx.tanggal_mulai && trx.tanggal_selesai
                  ? Math.ceil((new Date(trx.tanggal_selesai) - new Date(trx.tanggal_mulai)) / 86400000) : "-";
                return (
                  <tr key={trx.id_transaksi || i} className="border-b border-gray-50 hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold shrink-0">
                          {(trx.penyewa?.nama || "?").slice(0, 2).toUpperCase()}
                        </div>
                        <span>{trx.penyewa?.nama || "-"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatTanggal(trx.tanggal_mulai)}</td>
                    <td className="px-4 py-3">{durasi !== "-" ? `${durasi} Hari` : "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${skCfg.className}`}>
                        {sk === "dikembalikan" && "✓ "}{skCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="p-1.5 text-muted-foreground hover:text-foreground rounded bg-transparent border-none cursor-pointer"><ExternalLink size={13} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {transaksiList.length > 0 && (
            <div className="bg-muted border-t p-5 flex justify-end gap-16">
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Total Transaksi</p>
                <p className="font-bold text-xl">{transaksiList.length}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Total Pendapatan</p>
                <p className="font-bold text-xl text-emerald-800">
                  {formatHarga(transaksiList.reduce((s, t) => s + Number(t.total_biaya || 0), 0))}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "ulasan" && (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground shadow-xs">
          <Star size={32} className="mx-auto mb-3 opacity-30 text-amber-500" />
          <p className="text-sm">Belum ada ulasan untuk alat ini.</p>
        </div>
      )}

      <EditGearModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}
        gear={gear} categories={categories} destinations={destinations} onSave={handleSaveEdit} />
      <DeleteGearModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => { setIsDeleteModalOpen(false); onGearDelete(gear.id_barang); onBack(); }}
        itemName={gear?.nama_barang || "Alat ini"} />
    </div>
  );
}
