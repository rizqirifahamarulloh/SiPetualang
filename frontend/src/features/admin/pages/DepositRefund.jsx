import { useEffect, useState } from "react";
import TablePagination, { paginateArray } from "@/components/TablePagination";
import { adminService } from "../services/adminService";
import {
  Wallet,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  User,
  Package,
  Calendar,
  DollarSign,
  Ban,
  ArrowDownCircle,
  Loader2,
  ImagePlus,
  Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getStorageUrl } from "@/utils/storageUrl";

const formatRupiah = (val) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val || 0);

export default function DepositRefund() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 6;

  // Modal
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [refundForm, setRefundForm] = useState({
    refund_amount: "",
    refund_method: "Transfer Bank BCA",
    refund_note: "",
    refund_proof: null,
  });
  const [proofPreview, setProofPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewProof, setViewProof] = useState(null);

  const getData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getDepositRefunds();
      setData(response?.data ?? []);
      setStats(response?.stats ?? {});
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat data deposit");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const openRefundModal = (trx) => {
    setSelectedTrx(trx);
    setRefundForm({
      refund_amount: trx.calculated_sisa_deposit || 0,
      refund_method: "Transfer Bank BCA",
      refund_note: "",
      refund_proof: null,
    });
    setProofPreview(null);
  };

  const handleProofChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }
      setRefundForm((prev) => ({ ...prev, refund_proof: file }));
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!selectedTrx) return;
    setSubmitting(true);
    try {
      await adminService.processDepositRefund(selectedTrx.id_transaksi, refundForm);
      toast.success("Refund deposit berhasil diproses!");
      setSelectedTrx(null);
      getData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal memproses refund");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter & Search
  const filteredData = data.filter((item) => {
    const matchesSearch =
      (item.nama_barang || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.id_transaksi || "").toString().includes(search) ||
      (item.penyewa?.nama || "").toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "semua") return true;
    if (activeTab === "pending") return item.deposit_status === "pending";
    if (activeTab === "refunded")
      return item.deposit_status === "refunded" || item.deposit_status === "partial_refund";
    if (activeTab === "forfeited") return item.deposit_status === "forfeited";
    return true;
  });

  const getStatusBadge = (status) => {
    const map = {
      pending: {
        label: "Menunggu Refund",
        cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        icon: Clock,
      },
      refunded: {
        label: "Sudah Direfund",
        cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        icon: CheckCircle2,
      },
      partial_refund: {
        label: "Refund Sebagian",
        cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        icon: ArrowDownCircle,
      },
      forfeited: {
        label: "Deposit Hangus",
        cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        icon: Ban,
      },
      none: {
        label: "Belum Diproses",
        cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        icon: Clock,
      },
    };
    const s = map[status] || map.none;
    const Icon = s.icon;
    return (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 w-fit ${s.cls}`}>
        <Icon className="size-3" /> {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wallet className="size-6 text-emerald-600" />
            Refund Deposit
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola pengembalian deposit customer setelah barang diterima kembali dengan kondisi baik.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border shadow-sm bg-gradient-to-br from-card to-muted/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Menunggu Refund</p>
              <h3 className="text-xl font-bold text-foreground">{stats.pending || 0}</h3>
              <p className="text-[10px] text-amber-600 font-semibold">
                {formatRupiah(stats.total_pending_amount || 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-gradient-to-br from-card to-muted/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Sudah Direfund</p>
              <h3 className="text-xl font-bold text-foreground">{stats.refunded || 0}</h3>
              <p className="text-[10px] text-emerald-600 font-semibold">
                {formatRupiah(stats.total_refunded_amount || 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-gradient-to-br from-card to-muted/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-red-100 text-red-700 rounded-2xl">
              <Ban className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Deposit Hangus</p>
              <h3 className="text-xl font-bold text-foreground">{stats.forfeited || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-gradient-to-br from-card to-muted/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
              <DollarSign className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Transaksi</p>
              <h3 className="text-xl font-bold text-foreground">{stats.total || 0}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-3 rounded-xl border">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari ID, nama barang, penyewa..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="pl-9 pr-4 py-2 w-full text-sm border rounded-lg focus:outline-none focus:border-emerald-500 bg-muted/30 dark:bg-muted dark:border-border"
          />
        </div>

        <div className="flex flex-wrap gap-1 w-full md:w-auto">
          {[
            { id: "pending", label: `Menunggu (${stats.pending || 0})` },
            { id: "refunded", label: `Direfund (${stats.refunded || 0})` },
            { id: "forfeited", label: `Hangus (${stats.forfeited || 0})` },
            { id: "semua", label: `Semua (${stats.total || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-card border rounded-2xl p-12 text-center text-muted-foreground">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
            <p className="text-sm font-medium">Memuat data deposit...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-8 text-center text-sm font-medium flex flex-col items-center gap-2">
          <AlertCircle className="size-8" />
          {error}
          <Button variant="outline" size="sm" onClick={getData} className="mt-2">Coba Lagi</Button>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="bg-card border rounded-2xl p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
          <Wallet className="size-12 text-muted-foreground" />
          <p className="text-sm font-medium">Tidak ada data deposit yang sesuai filter.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {paginateArray(filteredData, currentPage, PER_PAGE).map((item) => (
              <Card key={item.id_transaksi} className="border shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-card">
                {/* Header */}
                <div className="border-b bg-muted/30 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20">
                      <Package className="size-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">
                        #{item.id_transaksi} — {item.nama_barang}
                      </h3>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <User className="size-3" /> {item.penyewa?.nama || "-"}
                        <span className="mx-1">•</span>
                        <Calendar className="size-3" /> {new Date(item.updated_at).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(item.deposit_status)}
                </div>

                {/* Body */}
                <CardContent className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Deposit Awal */}
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Deposit Awal</p>
                    <p className="font-bold text-foreground">{formatRupiah(item.nominal_deposit)}</p>
                  </div>

                  {/* Potongan */}
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total Potongan</p>
                    <p className={`font-bold ${item.calculated_total_potongan > 0 ? "text-red-600" : "text-foreground"}`}>
                      {item.calculated_total_potongan > 0 ? `- ${formatRupiah(item.calculated_total_potongan)}` : "-"}
                    </p>
                    {item.calculated_denda_terlambat > 0 && (
                      <p className="text-[10px] text-red-500">Terlambat: {formatRupiah(item.calculated_denda_terlambat)}</p>
                    )}
                    {item.calculated_denda_kerusakan > 0 && (
                      <p className="text-[10px] text-red-500">Kerusakan: {formatRupiah(item.calculated_denda_kerusakan)}</p>
                    )}
                  </div>

                  {/* Sisa / Refund */}
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      {item.deposit_status === "refunded" || item.deposit_status === "partial_refund"
                        ? "Jumlah Direfund"
                        : "Sisa Deposit"}
                    </p>
                    <p className="font-bold text-emerald-600">
                      {item.deposit_status === "refunded" || item.deposit_status === "partial_refund"
                        ? formatRupiah(item.deposit_refund_amount)
                        : formatRupiah(item.calculated_sisa_deposit)}
                    </p>
                    {item.deposit_refund_method && (
                      <p className="text-[10px] text-muted-foreground">via {item.deposit_refund_method}</p>
                    )}
                    {item.deposit_refunded_at && (
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(item.deposit_refunded_at).toLocaleDateString("id-ID", {
                          day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>

                  {/* Action */}
                  <div className="flex items-center justify-end">
                    {item.deposit_status === "pending" ? (
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-sm font-semibold"
                        onClick={() => openRefundModal(item)}
                      >
                        <Wallet className="size-4" /> Proses Refund
                      </Button>
                    ) : item.deposit_status === "forfeited" ? (
                      <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30">
                        <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                          <Ban className="size-3" /> Deposit Hangus
                        </p>
                        <p className="text-[10px] text-muted-foreground">Denda melebihi deposit</p>
                      </div>
                    ) : (
                      <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 space-y-1.5">
                        <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="size-3" /> Sudah Direfund
                        </p>
                        {item.deposit_refund_proof && (
                          <button
                            onClick={() => setViewProof(getStorageUrl(item.deposit_refund_proof))}
                            className="text-[10px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mx-auto underline"
                          >
                            <Eye className="size-3" /> Lihat Bukti
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <TablePagination
            currentPage={currentPage}
            totalItems={filteredData.length}
            perPage={PER_PAGE}
            onPageChange={setCurrentPage}
            label="transaksi deposit"
          />
        </>
      )}

      {/* Refund Modal */}
      {selectedTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setSelectedTrx(null)}>
          <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Wallet className="size-5 text-emerald-600" />
                Proses Refund Deposit
              </h2>
              <button
                onClick={() => setSelectedTrx(null)}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1 hover:bg-muted transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProcessRefund} className="p-6 space-y-4">
              {/* Info */}
              <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl text-xs space-y-1.5 text-emerald-800 dark:text-emerald-400">
                <p><strong>Transaksi:</strong> #{selectedTrx.id_transaksi}</p>
                <p><strong>Barang:</strong> {selectedTrx.nama_barang}</p>
                <p><strong>Penyewa:</strong> {selectedTrx.penyewa?.nama || "-"}</p>
                <p><strong>Kondisi:</strong> {selectedTrx.pengembalian?.kondisi_barang || "Baik"}</p>
              </div>

              {/* Kalkulasi */}
              <div className="bg-muted dark:bg-muted/20 p-4 rounded-xl space-y-2 border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kalkulasi Deposit</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deposit Awal:</span>
                    <span className="font-semibold text-foreground">{formatRupiah(selectedTrx.nominal_deposit)}</span>
                  </div>
                  {selectedTrx.calculated_denda_terlambat > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Denda Terlambat:</span>
                      <span>- {formatRupiah(selectedTrx.calculated_denda_terlambat)}</span>
                    </div>
                  )}
                  {selectedTrx.calculated_denda_kerusakan > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Denda Kerusakan:</span>
                      <span>- {formatRupiah(selectedTrx.calculated_denda_kerusakan)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 font-bold text-foreground mt-1">
                    <span>Sisa Deposit:</span>
                    <span className="text-emerald-600">{formatRupiah(selectedTrx.calculated_sisa_deposit)}</span>
                  </div>
                </div>
              </div>

              {/* Jumlah Refund */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Jumlah Refund (Rp)</label>
                <input
                  type="number"
                  value={refundForm.refund_amount}
                  onChange={(e) => setRefundForm((prev) => ({ ...prev, refund_amount: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-card dark:border-border"
                  min="0"
                  max={selectedTrx.calculated_sisa_deposit}
                  required
                />
                <p className="text-[10px] text-muted-foreground mt-1">Maksimal: {formatRupiah(selectedTrx.calculated_sisa_deposit)}</p>
              </div>

              {/* Metode */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Metode Transfer</label>
                <select
                  value={refundForm.refund_method}
                  onChange={(e) => setRefundForm((prev) => ({ ...prev, refund_method: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-card dark:border-border"
                  required
                >
                  <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                  <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                  <option value="Transfer Bank BRI">Transfer Bank BRI</option>
                  <option value="Transfer Bank BNI">Transfer Bank BNI</option>
                  <option value="OVO">OVO</option>
                  <option value="GoPay">GoPay</option>
                  <option value="DANA">DANA</option>
                  <option value="ShopeePay">ShopeePay</option>
                  <option value="Cash / Tunai">Cash / Tunai</option>
                </select>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Catatan (Opsional)</label>
                <textarea
                  value={refundForm.refund_note}
                  onChange={(e) => setRefundForm((prev) => ({ ...prev, refund_note: e.target.value }))}
                  placeholder="Catatan tambahan..."
                  rows="2"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-card dark:border-border resize-none"
                />
              </div>

              {/* Bukti Transfer */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Bukti Transfer</label>
                <div className="relative">
                  {proofPreview ? (
                    <div className="relative group">
                      <img
                        src={proofPreview}
                        alt="Bukti Transfer"
                        className="w-full h-44 object-contain border rounded-xl bg-muted/30"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setRefundForm((prev) => ({ ...prev, refund_proof: null }));
                          setProofPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition shadow-md"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/30 hover:border-emerald-400 transition-colors">
                      <ImagePlus className="size-8 text-muted-foreground mb-1.5" />
                      <span className="text-xs text-muted-foreground font-medium">Klik untuk upload bukti transfer</span>
                      <span className="text-[10px] text-muted-foreground">JPG, PNG, WEBP • Maks 5MB</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        onChange={handleProofChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setSelectedTrx(null)} className="rounded-xl">
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !refundForm.refund_amount || Number(refundForm.refund_amount) <= 0}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" /> Konfirmasi Refund
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proof Lightbox */}
      {viewProof && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={() => setViewProof(null)}>
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setViewProof(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition"
            >
              <X size={24} />
            </button>
            <img src={viewProof} alt="Bukti Transfer" className="w-full rounded-2xl shadow-2xl object-contain max-h-[80vh]" />
            <p className="text-center text-white/70 text-xs mt-3">Bukti Transfer Refund Deposit</p>
          </div>
        </div>
      )}
    </div>
  );
}
