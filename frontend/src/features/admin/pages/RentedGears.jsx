import { useEffect, useState } from "react";
import TablePagination, { paginateArray } from "@/components/TablePagination";
import { adminService } from "../services/adminService";
import { 
  Package, 
  MapPin, 
  User, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  X, 
  Store,
  Truck,
  Clock,
  Settings,
  DollarSign,
  HelpCircle,
  FileText
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BASE_URL } from "@/services/api";

export default function RentedGears() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("semua");
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 5;

  // State Modals
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  // Form States
  const [returnForm, setReturnForm] = useState({
    kondisi_barang: "baik",
    catatan: "",
    denda_kerusakan: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const getData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getBarangDisewa();
      const items = response?.data ?? response ?? [];
      setData(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Fetch rented gears error:", err);
      setError(err?.response?.data?.message || err?.message || "Gagal memuat data barang disewakan");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminService.konfirmasiKembali(selectedTrx.id_transaksi, returnForm);
      toast.success("Barang sewaan berhasil ditandai sebagai dikembalikan!");
      setIsReturnModalOpen(false);
      setSelectedTrx(null);
      getData();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal mengonfirmasi pengembalian");
    } finally {
      setSubmitting(false);
    }
  };

  const openReturnModal = (trx) => {
    setSelectedTrx(trx);
    setReturnForm({
      kondisi_barang: "baik",
      catatan: "",
      denda_kerusakan: ""
    });
    setIsReturnModalOpen(true);
  };

  // Filter & Search Logic
  const filteredData = data.filter((item) => {
    // Search filter
    const matchesSearch = 
      item.nama_barang.toLowerCase().includes(search.toLowerCase()) ||
      item.id_transaksi.toString().includes(search) ||
      (item.penyewa?.nama || "").toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    // Tab filter
    if (activeTab === "semua") return true;
    if (activeTab === "sedang_disewa") {
      return item.status_sewa === "sedang_disewa" && item.status_kembali === "belum";
    }
    if (activeTab === "proses_kembali") {
      return item.status_sewa === "sedang_disewa" && item.status_kembali === "proses";
    }
    if (activeTab === "selesai") {
      return item.status_sewa === "selesai";
    }

    return true;
  });

  const calculateReturnSummary = () => {
    if (!selectedTrx) return null;
    
    const tanggalKembali = new Date();
    tanggalKembali.setHours(0,0,0,0);
    
    const tanggalSelesaiSewa = new Date(selectedTrx.tanggal_selesai);
    tanggalSelesaiSewa.setHours(0,0,0,0);
    
    let hariKeterlambatan = 0;
    if (tanggalKembali > tanggalSelesaiSewa) {
      hariKeterlambatan = Math.ceil((tanggalKembali - tanggalSelesaiSewa) / (1000 * 60 * 60 * 24));
    }
    
    const dendaPerHari = 20000;
    const totalDendaTerlambat = hariKeterlambatan * dendaPerHari;
    const dendaKerusakan = Number(returnForm.denda_kerusakan || 0);
    const nominalDeposit = Number(selectedTrx.nominal_deposit || 0);
    
    const totalPotongan = totalDendaTerlambat + dendaKerusakan;
    const sisaDeposit = Math.max(0, nominalDeposit - totalPotongan);
    
    return {
      hariKeterlambatan,
      totalDendaTerlambat,
      dendaKerusakan,
      nominalDeposit,
      sisaDeposit
    };
  };

  const summary = calculateReturnSummary();

  const getStatusBadge = (trx) => {
    if (trx.status_sewa === "selesai") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-foreground dark:bg-gray-800 dark:text-gray-300 flex items-center gap-1.5 w-fit">
          <CheckCircle2 className="size-3.5" /> Selesai & Kembali
        </span>
      );
    }

    if (trx.status_kembali === "proses") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1.5 w-fit animate-pulse">
          <Clock className="size-3.5" /> Proses Pengembalian
        </span>
      );
    }

    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-1.5 w-fit">
        <Package className="size-3.5" /> Sedang Disewa
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="size-6 text-emerald-600" />
            Status Barang yang Disewakan
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola barang sewaan aktif, lacak proses pengembalian customer, dan selesaikan transaksi dengan hitung denda otomatis.
          </p>
        </div>
      </div>

      {/* Stats Counter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border shadow-sm bg-gradient-to-br from-card to-muted/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl dark:bg-blue-900/20">
              <Package className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Sedang Disewa (Aktif)</p>
              <h3 className="text-xl font-bold text-foreground">
                {data.filter(t => t.status_sewa === 'sedang_disewa' && t.status_kembali === 'belum').length}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-gradient-to-br from-card to-muted/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl dark:bg-amber-900/20">
              <Clock className="size-5 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Proses Pengembalian</p>
              <h3 className="text-xl font-bold text-foreground">
                {data.filter(t => t.status_sewa === 'sedang_disewa' && t.status_kembali === 'proses').length}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-gradient-to-br from-card to-muted/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl dark:bg-emerald-900/20">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Selesai</p>
              <h3 className="text-xl font-bold text-foreground">
                {data.filter(t => t.status_sewa === 'selesai').length}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-3 rounded-xl border">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari transaksi, customer, barang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm border rounded-lg focus:outline-none focus:border-emerald-500 bg-muted/30 dark:bg-muted dark:border-border"
          />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 w-full md:w-auto">
          {[
            { id: "semua", label: "Semua" },
            { id: "sedang_disewa", label: "Sedang Disewa (Aktif)" },
            { id: "proses_kembali", label: "Proses Pengembalian" },
            { id: "selesai", label: "Riwayat Selesai" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground dark:text-muted-foreground dark:hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table / List */}
      {loading ? (
        <div className="bg-card border rounded-2xl p-12 text-center text-muted-foreground">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
            <p className="text-sm font-medium">Memuat data barang disewakan...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900 rounded-2xl p-8 text-center text-sm font-medium flex flex-col items-center justify-center gap-2">
          <AlertCircle className="size-8" />
          {error}
          <Button variant="outline" size="sm" onClick={getData} className="mt-2">Coba Lagi</Button>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="bg-card border rounded-2xl p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
          <Package className="size-12 text-muted-foreground" />
          <p className="text-sm font-medium">Tidak ada data penyewaan yang sesuai filter.</p>
        </div>
      ) : (
        <>
        <div className="grid gap-4">
          {paginateArray(filteredData, currentPage, PER_PAGE).map((item) => (
            <Card key={item.id_transaksi} className="border shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-card">
              {/* Header Box */}
              <div className="border-b bg-muted/30 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                    <Package className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">
                      ID Transaksi: #{item.id_transaksi}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="size-3" />
                      Masa Sewa: {new Date(item.tanggal_mulai).toLocaleDateString("id-ID")} s/d {new Date(item.tanggal_selesai).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(item)}
                </div>
              </div>

              {/* Content Grid */}
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Kolom 1: Detail Alat & Customer */}
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Peralatan Sewa</p>
                    <p className="font-semibold text-foreground dark:text-muted-foreground text-sm">
                      {item.nama_barang}
                    </p>
                    <p className="text-xs text-muted-foreground">Jumlah: {item.jumlah} unit | Pemilik: {item.pemilik?.nama || '-'}</p>
                    {Number(item.nominal_deposit) > 0 && (
                      <p className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded w-fit mt-1 border border-emerald-100 flex items-center gap-1">
                        Jaminan Deposit: Rp {Number(item.nominal_deposit).toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 border-t pt-2">
                    <User className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground">
                        Penyewa: {item.penyewa?.nama || "Penyewa"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{item.penyewa?.no_telp || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Kolom 2: Metode & Status Pengembalian */}
                <div className="space-y-2 border-t md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Status Pengembalian</p>
                  
                  {item.status_sewa === 'sedang_disewa' ? (
                    <div className="space-y-2 text-xs">
                      {item.status_kembali === 'proses' ? (
                        <>
                          <p className="text-muted-foreground dark:text-muted-foreground flex items-center gap-1.5">
                            {item.metode_kembali === 'delivery' ? (
                              <>
                                <Truck className="size-4 text-amber-600" />
                                <span>Metode: **Delivery (Kurir)**</span>
                              </>
                            ) : (
                              <>
                                <Store className="size-4 text-amber-600" />
                                <span>Metode: **Datang Langsung**</span>
                              </>
                            )}
                          </p>
                          {item.no_resi_kembali && (
                            <p className="text-muted-foreground dark:text-muted-foreground">
                              <strong className="text-foreground">Resi Pengembalian:</strong> {item.no_resi_kembali}
                            </p>
                          )}
                          <p className="text-muted-foreground italic">Barang sedang dalam perjalanan kembali ke gudang.</p>
                        </>
                      ) : (
                        <p className="text-muted-foreground italic">Barang masih aktif digunakan oleh customer (belum diajukan pengembalian).</p>
                      )}
                    </div>
                  ) : (
                    // SELESAI
                    <div className="space-y-2 text-xs">
                      <p className="text-muted-foreground dark:text-muted-foreground">
                        <strong className="text-foreground">Tanggal Pengembalian:</strong> {item.tanggal_kembali_real || item.pengembalian?.tanggal_kembali}
                      </p>
                      <p className="text-muted-foreground dark:text-muted-foreground">
                        <strong className="text-foreground">Kondisi Barang:</strong> <span className="capitalize font-semibold text-foreground dark:text-muted-foreground">{item.pengembalian?.kondisi_barang || 'Baik'}</span>
                      </p>
                      {Number(item.nominal_deposit) > 0 && (
                        <>
                          <p className="text-muted-foreground dark:text-muted-foreground">
                            <strong className="text-foreground">Deposit Awal:</strong> Rp {Number(item.nominal_deposit).toLocaleString()}
                          </p>
                          <p className="text-muted-foreground dark:text-muted-foreground">
                            <strong className="text-foreground">Denda Kerusakan:</strong> Rp {Number(item.pengembalian?.denda_kerusakan || 0).toLocaleString()}
                          </p>
                        </>
                      )}
                      {item.pengembalian?.total_denda > 0 ? (
                        <p className="text-red-600 font-bold">
                          Denda Keterlambatan: Rp {Number(item.pengembalian.total_denda).toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-emerald-600 font-bold">Bebas Denda Keterlambatan</p>
                      )}
                      {Number(item.nominal_deposit) > 0 && (
                        <p className="text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded w-fit border border-emerald-100 dark:border-emerald-900/30 mt-1.5">
                          Sisa Deposit Refund: Rp {Math.max(0, Number(item.nominal_deposit) - Number(item.pengembalian?.denda_kerusakan || 0) - Number(item.pengembalian?.total_denda || 0)).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Kolom 3: Aksi Konfirmasi Admin */}
                <div className="flex flex-col justify-center gap-2 border-t md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0">
                  {item.status_sewa === 'sedang_disewa' ? (
                    <Button 
                      className="bg-amber-600 hover:bg-amber-700 text-white w-full gap-2 py-5 text-sm font-semibold"
                      onClick={() => openReturnModal(item)}
                    >
                      <CheckCircle2 className="size-4" />
                      Alat Dikembalikan
                    </Button>
                  ) : (
                    <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30">
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="size-3.5" /> Transaksi Selesai
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Sewa tuntas & barang telah diterima kembali di gudang.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalItems={filteredData.length}
          perPage={PER_PAGE}
          onPageChange={setCurrentPage}
          label="transaksi"
        />
        </>
      )}

      {/* Modal Konfirmasi Alat Dikembalikan */}
      {isReturnModalOpen && selectedTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-card z-10">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-600" />
                Konfirmasi Penerimaan Pengembalian
              </h2>
              <button 
                onClick={() => { setIsReturnModalOpen(false); setSelectedTrx(null); }} 
                className="text-muted-foreground hover:text-muted-foreground rounded-lg p-1 hover:bg-muted transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="p-6 space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl text-xs space-y-1.5 text-amber-800 dark:text-amber-400">
                <p><strong>Transaksi ID:</strong> #{selectedTrx.id_transaksi}</p>
                <p><strong>Alat Sewa:</strong> {selectedTrx.nama_barang} ({selectedTrx.jumlah} unit)</p>
                <p><strong>Batas Waktu:</strong> {selectedTrx.tanggal_selesai}</p>
                <p><strong>Metode Pengembalian:</strong> {selectedTrx.status_kembali === 'proses' ? (selectedTrx.metode_kembali === 'delivery' ? 'Delivery (Kurir)' : 'Datang Langsung') : 'Belum Ditentukan'}</p>
                {selectedTrx.no_resi_kembali && <p><strong>Nomor Resi:</strong> {selectedTrx.no_resi_kembali}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground dark:text-muted-foreground mb-1.5">Kondisi Barang Saat Kembali</label>
                <select
                  value={returnForm.kondisi_barang}
                  onChange={(e) => setReturnForm(prev => ({ ...prev, kondisi_barang: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-card dark:border-border"
                >
                  <option value="baik">Sangat Baik / Lengkap (Kondisi Bagus)</option>
                  <option value="rusak">Rusak / Sobek (Dikenakan Biaya Tambahan)</option>
                  <option value="hilang">Hilang Sebagian / Seluruhnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground dark:text-muted-foreground mb-1.5">Denda Kerusakan Fisik (Rp)</label>
                <input
                  type="number"
                  placeholder="Masukkan nominal denda kerusakan jika ada..."
                  value={returnForm.denda_kerusakan}
                  onChange={(e) => setReturnForm(prev => ({ ...prev, denda_kerusakan: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-card dark:border-border"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground dark:text-muted-foreground mb-1.5">Catatan Khusus Admin (Opsional)</label>
                <textarea
                  placeholder="Masukkan catatan mengenai kondisi detail pengembalian barang sewaan..."
                  value={returnForm.catatan}
                  onChange={(e) => setReturnForm(prev => ({ ...prev, catatan: e.target.value }))}
                  rows="3"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-card dark:border-border resize-none"
                />
              </div>

              <div className="bg-muted dark:bg-muted/30 p-3 rounded-xl text-[10px] text-muted-foreground flex items-start gap-1.5 border border-dashed leading-normal">
                <AlertCircle className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Info Penting:</strong> Sistem akan mendeteksi tanggal pengembalian secara otomatis hari ini ({new Date().toLocaleDateString('id-ID')}). Jika melewati batas waktu ({selectedTrx.tanggal_selesai}), sistem otomatis membebankan denda Rp 20.000/hari kepada customer.
                </span>
              </div>

              {summary && Number(summary.nominalDeposit) > 0 && (
                <div className="bg-muted dark:bg-muted/20 p-4 rounded-xl space-y-2 border border-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estimasi Kalkulasi Deposit & Potongan</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deposit Awal:</span>
                      <span className="font-semibold text-foreground">Rp {summary.nominalDeposit.toLocaleString()}</span>
                    </div>
                    {summary.hariKeterlambatan > 0 && (
                      <div className="flex justify-between text-red-600 font-medium">
                        <span>Denda Terlambat ({summary.hariKeterlambatan} hari):</span>
                        <span>- Rp {summary.totalDendaTerlambat.toLocaleString()}</span>
                      </div>
                    )}
                    {summary.dendaKerusakan > 0 && (
                      <div className="flex justify-between text-red-600 font-medium">
                        <span>Denda Kerusakan:</span>
                        <span>- Rp {summary.dendaKerusakan.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2 font-bold text-foreground dark:text-white mt-1">
                      <span>Sisa Deposit Refund:</span>
                      <span className="text-emerald-600">Rp {summary.sisaDeposit.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setIsReturnModalOpen(false); setSelectedTrx(null); }}
                  className="rounded-xl border-border"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl"
                >
                  {submitting ? "Memproses..." : "Konfirmasi & Selesaikan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
