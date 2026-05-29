import React, { useState, useRef, useEffect } from "react";
import {
  Search, Package, PackageCheck, PackageX, AlertTriangle,
  MoreHorizontal, Eye, Edit, Trash2, ChevronLeft, ChevronRight,
  Filter, Download
} from "lucide-react";
import GearDetail from "./GearDetail";
import EditGearModal from "../components/Gears/EditGearModal";
import DeleteGearModal from "../components/Gears/DeleteGearModal";
import { gearService } from "../services/GearService";
import { BASE_URL } from "@/services/api";
import { getStorageUrl } from "@/utils/storageUrl";
import { toast } from "sonner";



const STATUS_CONFIG = {
  tersedia: { label: "Tersedia", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  habis:    { label: "Habis",    dot: "bg-red-500",     badge: "bg-red-50 text-red-700 border border-red-200" },
};

const formatHarga = (val) => `Rp ${Number(val || 0).toLocaleString("id-ID")}`;

const getStokColor = (stok) => {
  if (stok <= 0) return "bg-red-100 text-red-700 font-bold";
  if (stok <= 1) return "bg-red-100 text-red-700 font-bold";
  if (stok <= 5) return "bg-orange-100 text-orange-700 font-semibold";
  return "bg-emerald-100 text-emerald-700 font-semibold";
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, dot: "bg-gray-400", badge: "bg-muted text-foreground border border-border" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${cfg.dot}`}></span>
      {cfg.label}
    </span>
  );
}

function ActionMenu({ onView, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-gray-100 rounded-lg transition">
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[140px]">
          <button onClick={() => { onView(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left">
            <Eye size={14} /> Lihat Detail
          </button>
          <button onClick={() => { onEdit(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left">
            <Edit size={14} /> Edit Data
          </button>
          <button onClick={() => { onDelete(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-red-600 text-left">
            <Trash2 size={14} /> Hapus Alat
          </button>
        </div>
      )}
    </div>
  );
}

export default function Gears() {
  const [gears, setGears] = useState([]);
  const [categories, setCategories] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [stats, setStats] = useState({ total_alat: 0, tersedia: 0, habis: 0, stok_kritis: 0 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showKategoriMenu, setShowKategoriMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingGear, setEditingGear] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [gearToDelete, setGearToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [detailGearId, setDetailGearId] = useState(null);

  const PER_PAGE = 5;

  const fetchGearsData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterKategori) params.id_kategori = filterKategori;
      if (filterStatus) params.status_barang = filterStatus;
      if (search) params.search = search;

      const [gearsRes, catsRes, destsRes, statsRes] = await Promise.all([
        gearService.getGears(params),
        gearService.getCategories(),
        gearService.getDestinations(),
        gearService.getGearStats()
      ]);

      setGears(gearsRes.data || []);
      setCategories(catsRes.data || []);
      setDestinations(destsRes.data || []);
      setStats(statsRes.data || { total_alat: 0, tersedia: 0, habis: 0, stok_kritis: 0 });
    } catch (err) {
      console.error("Gagal memuat data alat outdoor:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGearsData();
  }, [search, filterKategori, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(gears.length / PER_PAGE));
  const paginated = gears.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const kritisItems = gears.filter((g) => g.jumlah_stok <= 1);

  const handleDelete = async (id) => {
    try {
      await gearService.deleteGear(id);
      setIsDeleteModalOpen(false);
      setGearToDelete(null);
      fetchGearsData();
    } catch (err) {
      console.error("Gagal menghapus alat:", err);
    }
  };

  const handleSaveEdit = async (formData) => {
    if (!editingGear) return;
    try {
      if (formData.foto_barang instanceof File) {
        const data = new FormData();
        data.append("_method", "PUT");
        data.append("nama_barang", formData.nama_barang);
        data.append("deskripsi", formData.deskripsi);
        data.append("id_kategori", formData.id_kategori);
        data.append("harga_sewa", formData.harga_sewa);
        data.append("jumlah_stok", formData.jumlah_stok);
        data.append("status_barang", formData.status_barang);
        data.append("status_approval", formData.status_approval);
        data.append("foto_barang", formData.foto_barang);
        if (formData.destinasi_ids) {
          formData.destinasi_ids.forEach((id) => data.append("destinasi_ids[]", id));
        }
        await gearService.updateGearWithPhoto(editingGear.id_barang, data);
      } else {
        await gearService.updateGear(editingGear.id_barang, formData);
      }
      toast.success("Data alat berhasil diperbarui!");
      setIsEditModalOpen(false);
      setEditingGear(null);
      fetchGearsData();
    } catch (err) {
      console.error("Gagal mengupdate alat:", err);
      const errMsg = err.response?.data?.message || err.message || "Gagal mengupdate alat";
      toast.error(errMsg);
    }
  };

  const pageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  if (detailGearId !== null) {
    return (
      <GearDetail
        gearId={detailGearId}
        onBack={() => setDetailGearId(null)}
        onGearUpdate={fetchGearsData}
        onGearDelete={handleDelete}
        categories={categories}
        destinations={destinations}
        gearsData={gears}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          Dashboard &gt; <span className="text-foreground font-medium">Manajemen Alat</span>
        </p>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-2xl font-bold">Manajemen Alat</h1>
          <button className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-muted transition">
            <Download size={15} /> Ekspor CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Alat", value: stats.total_alat, icon: <Package size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Alat Tersedia", value: stats.tersedia, icon: <PackageCheck size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Stok Habis", value: stats.habis, icon: <PackageX size={18} />, color: "bg-red-50 text-red-600" },
          { label: "Stok Kritis", value: stats.stok_kritis, icon: <AlertTriangle size={18} />, color: "bg-orange-50 text-orange-600",
            extra: stats.stok_kritis > 0 ? <span className="text-sm text-red-500 ml-2 font-medium">item kritis</span> : null },
        ].map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-6 shadow-xs">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
              <div className={`p-2 rounded-lg ${card.color}`}>{card.icon}</div>
            </div>
            <div className="flex items-end">
              <h2 className="text-3xl font-bold">{card.value.toLocaleString()}</h2>
              {card.extra}
            </div>
          </div>
        ))}
      </div>

      {/* Peringatan Stok Kritis */}
      {kritisItems.length > 0 && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-5 py-3 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">Peringatan Stok Kritis (≤ 1)</p>
              <p className="text-xs text-red-500 mt-0.5">{kritisItems.map((i) => i.nama_barang).join(", ")}</p>
            </div>
          </div>
          <button onClick={() => { setFilterStatus("habis"); setCurrentPage(1); }} className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition">
            Lihat Stok Kritis
          </button>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        {/* Filter Bar */}
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between gap-4 items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-muted focus:outline-none focus:border-emerald-400"
              placeholder="Cari nama alat..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {/* Filter Kategori */}
            <div className="relative">
              <button onClick={() => { setShowKategoriMenu(!showKategoriMenu); setShowStatusMenu(false); }}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition">
                <Filter size={15} />
                {filterKategori ? (categories.find((c) => String(c.id_kategori) === filterKategori)?.nama_kategori || "Kategori") : "Semua Kategori"}
              </button>
              {showKategoriMenu && (
                <div className="absolute top-full mt-1 left-0 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[160px]">
                  <button onClick={() => { setFilterKategori(""); setShowKategoriMenu(false); setCurrentPage(1); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted">Semua Kategori</button>
                  {categories.map((cat) => (
                    <button key={cat.id_kategori} onClick={() => { setFilterKategori(String(cat.id_kategori)); setShowKategoriMenu(false); setCurrentPage(1); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-muted">{cat.nama_kategori}</button>
                  ))}
                </div>
              )}
            </div>
            {/* Filter Status */}
            <div className="relative">
              <button onClick={() => { setShowStatusMenu(!showStatusMenu); setShowKategoriMenu(false); }}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition">
                <Filter size={15} />
                {filterStatus ? STATUS_CONFIG[filterStatus]?.label : "Semua Status"}
              </button>
              {showStatusMenu && (
                <div className="absolute top-full mt-1 left-0 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[140px]">
                  <button onClick={() => { setFilterStatus(""); setShowStatusMenu(false); setCurrentPage(1); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted">Semua Status</button>
                  {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                    <button key={key} onClick={() => { setFilterStatus(key); setShowStatusMenu(false); setCurrentPage(1); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-muted">{val.label}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-muted-foreground">Memuat data alat...</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  {["No", "Nama Alat", "Kategori", "Pemilik", "Stok", "Harga/Hari", "Status", "Approval", "Aksi"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-xs font-semibold text-muted-foreground ${i === 0 || i === 4 || i === 8 ? "text-center" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-10 text-muted-foreground">Tidak ada alat ditemukan.</td></tr>
                ) : paginated.map((gear, index) => (
                  <tr key={gear.id_barang} className="border-b border-gray-50 hover:bg-muted/50 transition">
                    <td className="px-4 py-3 text-center text-muted-foreground">{(currentPage - 1) * PER_PAGE + index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center border border-border shrink-0 overflow-hidden">
                          {gear.foto_barang ? (
                            <img src={getStorageUrl(gear.foto_barang)} alt={gear.nama_barang} className="w-full h-full object-cover" />
                          ) : (
                            <Package size={16} className="text-emerald-600" />
                          )}
                        </div>
                        <span className="font-medium">{gear.nama_barang}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-100 text-muted-foreground px-2.5 py-0.5 rounded-full">
                        {gear.kategori?.nama_kategori || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{gear.pemilik?.nama || "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs ${getStokColor(gear.jumlah_stok)}`}>{gear.jumlah_stok}</span>
                    </td>
                    <td className="px-4 py-3">{formatHarga(gear.harga_sewa)}</td>
                    <td className="px-4 py-3"><StatusBadge status={gear.status_barang} /></td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                        gear.status_approval === "disetujui" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                        gear.status_approval === "pending" ? "bg-amber-50 text-amber-700 border-amber-100" :
                        "bg-red-50 text-red-700 border-red-100"
                      }`}>
                        {gear.status_approval}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="relative inline-block">
                        <ActionMenu
                          onView={() => setDetailGearId(gear.id_barang)}
                          onEdit={() => { setEditingGear(gear); setIsEditModalOpen(true); }}
                          onDelete={() => { setGearToDelete(gear); setIsDeleteModalOpen(true); }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {paginated.length > 0 ? (currentPage - 1) * PER_PAGE + 1 : 0}–{(currentPage - 1) * PER_PAGE + paginated.length} of {gears.length} alat
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="p-1.5 border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition bg-card">
              <ChevronLeft size={14} />
            </button>
            {pageNumbers().map((p, i) =>
              p === "..." ? (
                <span key={i} className="px-2">...</span>
              ) : (
                <button key={p} onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 text-xs rounded-lg border transition ${p === currentPage ? "bg-emerald-700 text-white border-emerald-700" : "border-border hover:bg-muted bg-card text-foreground"}`}>
                  {p}
                </button>
              )
            )}
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="p-1.5 border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition bg-card">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditGearModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}
        gear={editingGear} categories={categories} destinations={destinations} onSave={handleSaveEdit} />

      {/* Delete Modal */}
      <DeleteGearModal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setGearToDelete(null); }}
        onConfirm={() => gearToDelete && handleDelete(gearToDelete.id_barang)}
        itemName={gearToDelete?.nama_barang || "Alat ini"} />
    </div>
  );
}
