import { useEffect, useState } from "react";
import TablePagination, { paginateArray } from "@/components/TablePagination";
import { adminService } from "../services/adminService";
import { 
  Truck, 
  MapPin, 
  User, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  X, 
  Package,
  Navigation,
  HandMetal,
  LocateFixed,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ShippingStatus() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("semua");
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 5;

  // State Modals
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [isShipModalOpen, setIsShipModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Form States
  const [shipForm, setShipForm] = useState({
    kurir: "SiPetualang Delivery",
    no_resi: "",
    lokasi_terakhir: "Gudang Utama SiPetualang"
  });

  const [updateForm, setUpdateForm] = useState({
    lokasi_terakhir: "",
    status_pengiriman: "dikirim"
  });

  const [returnForm, setReturnForm] = useState({
    kondisi_barang: "baik",
    catatan: "",
    denda_kerusakan: 0
  });

  const getData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getPengiriman();
      const items = response?.data ?? response ?? [];
      setData(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Fetch pengiriman error:", err);
      setError(err?.response?.data?.message || err?.message || "Gagal memuat data pengiriman");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const handleShipSubmit = async (e) => {
    e.preventDefault();
    if (!shipForm.kurir || !shipForm.no_resi || !shipForm.lokasi_terakhir) {
      toast.error("Semua field pengiriman wajib diisi!");
      return;
    }

    try {
      await adminService.kirimBarang(selectedTrx.id_transaksi, shipForm);
      toast.success("Barang berhasil ditandai sebagai dikirim & resi tercatat!");
      setIsShipModalOpen(false);
      setSelectedTrx(null);
      setShipForm({
        kurir: "SiPetualang Delivery",
        no_resi: "",
        lokasi_terakhir: "Gudang Utama SiPetualang"
      });
      getData();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal mengirim barang");
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!updateForm.lokasi_terakhir) {
      toast.error("Nama lokasi saat ini wajib diisi!");
      return;
    }

    try {
      const idPengiriman = selectedTrx.pengiriman.id_pengiriman;
      await adminService.updateLokasi(idPengiriman, updateForm);
      toast.success("Detail lokasi & status pengiriman berhasil diperbarui!");
      setIsUpdateModalOpen(false);
      setSelectedTrx(null);
      getData();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal memperbarui lokasi");
    }
  };

  const handlePickupDiambil = async (trx) => {
    if (!confirm(`Konfirmasi bahwa customer "${trx.penyewa?.nama}" telah mengambil barang "${trx.nama_barang}"?`)) return;
    
    try {
      await adminService.pickupBarangDiambil(trx.id_transaksi);
      toast.success("Barang berhasil ditandai sebagai diambil! Status sewa aktif.");
      getData();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal memperbarui status pengambilan");
    }
  };

  const openReturnModal = (trx) => {
    setSelectedTrx(trx);
    setReturnForm({
      kondisi_barang: "baik",
      catatan: "",
      denda_kerusakan: 0
    });
    setIsReturnModalOpen(true);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnForm.kondisi_barang) {
      toast.error("Kondisi barang wajib diisi!");
      return;
    }

    try {
      await adminService.konfirmasiKembali(selectedTrx.id_transaksi, returnForm);
      toast.success("Pengembalian barang berhasil dikonfirmasi & transaksi selesai!");
      setIsReturnModalOpen(false);
      setSelectedTrx(null);
      getData();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal mengonfirmasi pengembalian");
    }
  };

  // Generate nomor resi otomatis (panggil saat diperlukan, bukan saat render)
  const generateNoResi = () => {
    const prefix = "SP";
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${year}${month}${day}-${random}-${timestamp}`;
  };

  const openShipModal = (trx) => {
    setSelectedTrx(trx);
    setShipForm({
      kurir: "SiPetualang Delivery",
      no_resi: generateNoResi(),
      lokasi_terakhir: "Gudang Utama SiPetualang"
    });
    setIsShipModalOpen(true);
  };

  const openUpdateModal = (trx) => {
    setSelectedTrx(trx);
    setUpdateForm({
      lokasi_terakhir: trx.pengiriman?.lokasi_terakhir || "",
      status_pengiriman: trx.pengiriman?.status_pengiriman || "dikirim"
    });
    setIsUpdateModalOpen(true);
  };

  const getCurrentLocationForAdmin = () => {
    if (!navigator.geolocation) {
      toast.error("Browser Anda tidak mendukung geolocation");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await response.json();
          
          if (data.display_name) {
            let address = data.display_name;
            if (address.length > 200) {
              address = address.substring(0, 200) + "...";
            }
            setUpdateForm(prev => ({
              ...prev,
              lokasi_terakhir: address
            }));
            toast.success("Lokasi berhasil diambil dari GPS!");
          } else {
            setUpdateForm(prev => ({
              ...prev,
              lokasi_terakhir: `Lokasi: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
            }));
            toast.info("Lokasi diambil berdasarkan koordinat GPS");
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          setUpdateForm(prev => ({
            ...prev,
            lokasi_terakhir: `Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
          }));
          toast.info("Lokasi diambil berdasarkan koordinat GPS");
        }
      },
      (error) => {
        let errorMsg = "";
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "Izin lokasi ditolak. Beri izin akses lokasi.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "Informasi lokasi tidak tersedia.";
            break;
          case error.TIMEOUT:
            errorMsg = "Waktu permintaan lokasi habis.";
            break;
          default:
            errorMsg = error.message;
        }
        toast.error(errorMsg);
        setIsGettingLocation(false);
      }
    ).finally(() => {
      setIsGettingLocation(false);
    });
  };

  // Filter & Search Logic
  const filteredData = data.filter((item) => {
    // Search filter - mencakup customer, barang, ID transaksi, dan NO RESI
    const matchesSearch = 
      item.nama_barang?.toLowerCase().includes(search.toLowerCase()) ||
      (item.detail_transaksi || []).some(d => (d.nama_barang || d.barang?.nama_barang || '').toLowerCase().includes(search.toLowerCase())) ||
      item.id_transaksi.toString().includes(search) ||
      (item.penyewa?.nama || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.pengiriman?.no_resi || "").toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    // Tab filter
    if (activeTab === "semua") return true;
    if (activeTab === "pickup") return item.metode_pengiriman === "pickup";
    if (activeTab === "delivery") return item.metode_pengiriman === "delivery";
    
    if (activeTab === "perlu_dikirim") {
      return item.metode_pengiriman === "delivery" && (!item.pengiriman || item.pengiriman.status_pengiriman === "pending");
    }
    if (activeTab === "dikirim") {
      return item.metode_pengiriman === "delivery" && item.pengiriman?.status_pengiriman === "dikirim";
    }
    if (activeTab === "sampai") {
      return item.metode_pengiriman === "delivery" && item.pengiriman?.status_pengiriman === "sampai";
    }
    if (activeTab === "diterima") {
      return (item.metode_pengiriman === "delivery" && item.pengiriman?.status_pengiriman === "diterima") ||
             (item.metode_pengiriman === "pickup" && item.status_sewa === "sedang_disewa");
    }
    if (activeTab === "pickup_menunggu") {
      return item.metode_pengiriman === "pickup" && item.status_sewa === "dibayar";
    }
    if (activeTab === "pickup_disewa") {
      return item.metode_pengiriman === "pickup" && item.status_sewa === "sedang_disewa" && item.status_kembali === "belum";
    }
    if (activeTab === "pickup_kembali") {
      return item.metode_pengiriman === "pickup" && item.status_kembali === "proses";
    }
    if (activeTab === "proses_kembali") {
      return item.status_kembali === "proses";
    }

    return true;
  });

  const getStatusBadge = (trx) => {
    if (trx.metode_pengiriman === "pickup") {
      if (trx.status_sewa === "dibayar") {
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 flex items-center gap-1.5 w-fit">
            <Package className="size-3.5" /> Menunggu Diambil
          </span>
        );
      }
      if (trx.status_sewa === "sedang_disewa" && trx.status_kembali === "proses") {
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 flex items-center gap-1.5 w-fit animate-pulse">
            <Package className="size-3.5" /> Proses Pengembalian
          </span>
        );
      }
      if (trx.status_sewa === "sedang_disewa") {
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 flex items-center gap-1.5 w-fit">
            <CheckCircle2 className="size-3.5" /> Sedang Disewa
          </span>
        );
      }
      if (trx.status_sewa === "selesai") {
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1.5 w-fit">
            <CheckCircle2 className="size-3.5" /> Selesai
          </span>
        );
      }
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground flex items-center gap-1.5 w-fit">
          <Package className="size-3.5" /> Pick Up
        </span>
      );
    }

    const status = trx.pengiriman?.status_pengiriman || "pending";
    switch (status) {
      case "pending":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 flex items-center gap-1.5 w-fit">
            <AlertCircle className="size-3.5" /> Siap Dikirim
          </span>
        );
      case "dikirim":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 flex items-center gap-1.5 w-fit animate-pulse">
            <Truck className="size-3.5" /> Sedang Dikirim
          </span>
        );
      case "sampai":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 flex items-center gap-1.5 w-fit">
            <MapPin className="size-3.5" /> Tiba di Tujuan
          </span>
        );
      case "diterima":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1.5 w-fit">
            <CheckCircle2 className="size-3.5" /> Diterima Customer
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Truck className="size-6 text-emerald-600" />
            Status Pengiriman Barang
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola pengiriman barang sewaan dengan kurir pengantar, lokasi pos, dan pelacakan customer.
          </p>
        </div>
      </div>

      {/* Stats Card Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
              <Package className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Perlu Dikirim</p>
              <h3 className="text-xl font-bold">
                {data.filter(t => t.metode_pengiriman === 'delivery' && (!t.pengiriman || t.pengiriman.status_pengiriman === 'pending')).length}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
              <Truck className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Dalam Perjalanan</p>
              <h3 className="text-xl font-bold">
                {data.filter(t => t.metode_pengiriman === 'delivery' && t.pengiriman?.status_pengiriman === 'dikirim').length}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
              <HandMetal className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Pickup Menunggu</p>
              <h3 className="text-xl font-bold">
                {data.filter(t => t.metode_pengiriman === 'pickup' && t.status_sewa === 'dibayar').length}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-orange-100 text-orange-700 rounded-2xl">
              <Package className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Proses Kembali</p>
              <h3 className="text-xl font-bold">
                {data.filter(t => t.status_kembali === 'proses').length}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-green-100 text-green-700 rounded-2xl">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Selesai/Diterima</p>
              <h3 className="text-xl font-bold">
                {data.filter(t => 
                  (t.metode_pengiriman === 'delivery' && t.pengiriman?.status_pengiriman === 'diterima') ||
                  (t.metode_pengiriman === 'pickup' && t.status_sewa === 'sedang_disewa')
                ).length}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Section */}
      <Card className="border shadow-sm overflow-hidden">
        {/* Search Row */}
        <div className="px-5 py-4 border-b bg-card flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama, barang, ID transaksi, atau No Resi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-sm border rounded-lg focus:outline-none focus:border-emerald-500 bg-muted/30"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {filteredData.length} dari {data.length} transaksi
            </p>
            {search && (
              <button onClick={() => setSearch("")} className="text-xs text-red-500 hover:text-red-600 whitespace-nowrap font-medium">
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-5 py-3 bg-muted/20 flex flex-wrap gap-1.5">
          {[
            { id: "semua", label: "Semua", count: data.length },
            { id: "delivery", label: "🚚 Delivery", count: data.filter(t => t.metode_pengiriman === 'delivery').length },
            { id: "perlu_dikirim", label: "Perlu Dikirim", count: data.filter(t => t.metode_pengiriman === 'delivery' && (!t.pengiriman || t.pengiriman.status_pengiriman === 'pending')).length },
            { id: "dikirim", label: "Dalam Perjalanan", count: data.filter(t => t.metode_pengiriman === 'delivery' && t.pengiriman?.status_pengiriman === 'dikirim').length },
            { id: "pickup", label: "🏪 Pick Up", count: data.filter(t => t.metode_pengiriman === 'pickup').length },
            { id: "pickup_menunggu", label: "Menunggu Diambil", count: data.filter(t => t.metode_pengiriman === 'pickup' && t.status_sewa === 'dibayar').length },
            { id: "proses_kembali", label: "Proses Kembali", count: data.filter(t => t.status_kembali === 'proses').length },
            { id: "diterima", label: "Diterima", count: data.filter(t => (t.metode_pengiriman === 'delivery' && t.pengiriman?.status_pengiriman === 'diterima') || (t.metode_pengiriman === 'pickup' && t.status_sewa === 'sedang_disewa')).length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground bg-card border border-border"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 ${
                  activeTab === tab.id ? "bg-white/25 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Main Table / List Card */}
      {loading ? (
        <div className="bg-card border rounded-2xl p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
            <p className="text-sm font-medium">Memuat data pengiriman sewaan...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-8 text-center text-sm font-medium flex flex-col items-center justify-center gap-2">
          <AlertCircle className="size-8" />
          {error}
          <Button variant="outline" size="sm" onClick={getData} className="mt-2">Coba Lagi</Button>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="bg-card border rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <Truck className="size-12 text-muted-foreground" />
          <p className="text-sm font-medium">Tidak ada data transaksi pengiriman yang sesuai filter.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {paginateArray(filteredData, currentPage, PER_PAGE).map((item) => (
              <Card key={item.id_transaksi} className="border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="border-b bg-muted/30 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                      <Package className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-bold">ID Transaksi: #{item.id_transaksi}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="size-3" />
                        Mulai: {new Date(item.tanggal_mulai).toLocaleDateString("id-ID")} - Selesai: {new Date(item.tanggal_selesai).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(item)}
                  </div>
                </div>

                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Kolom 1 */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Peralatan Alat</p>
                      {item.detail_transaksi && item.detail_transaksi.length > 0 ? (
                        <div className="space-y-1">
                          {item.detail_transaksi.map((detail, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <p className="font-semibold text-sm">
                                {detail.nama_barang || detail.barang?.nama_barang}
                                <span className="text-xs text-muted-foreground font-normal ml-1">({detail.jumlah_pinjam} unit)</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <p className="font-semibold text-sm">{item.nama_barang}</p>
                          <p className="text-xs text-muted-foreground">Jumlah: {item.jumlah} unit</p>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 border-t pt-2">
                      <User className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-semibold">{item.penyewa?.nama || "Penyewa"}</p>
                        <p className="text-[10px] text-muted-foreground">{item.penyewa?.no_telp || "-"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Kolom 2 */}
                  <div className="space-y-2 border-t md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Informasi Lokasi & Alamat</p>
                    
                    {item.metode_pengiriman === "delivery" ? (
                      <div className="space-y-2 text-xs">
                        <p><strong>Tujuan:</strong> {item.alamat_pengiriman || "Alamat tidak diinput"}</p>
                        {item.pengiriman ? (
                          <>
                            <p><strong>Kurir:</strong> {item.pengiriman.kurir} ({item.pengiriman.no_resi})</p>
                            <p className="flex items-start gap-1">
                              <Navigation className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span><strong>Posisi Terakhir:</strong> {item.pengiriman.lokasi_terakhir}</span>
                            </p>
                          </>
                        ) : (
                          <p className="italic">Belum dikirim. Silakan klik tombol "Kirim Barang" di samping.</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs">
                        <p>Customer memilih metode <strong>Ambil di Tempat (Pick Up)</strong>.</p>
                        <p>Status Sewa: <span className="font-semibold capitalize">{item.status_sewa?.replace('_', ' ')}</span></p>
                        {item.status_kembali && item.status_kembali !== 'belum' && (
                          <p>Status Pengembalian: <span className={`font-semibold capitalize ${item.status_kembali === 'proses' ? 'text-orange-600' : 'text-green-600'}`}>{item.status_kembali}</span></p>
                        )}
                        {item.metode_kembali && (
                          <p>Metode Kembali: <span className="font-medium">{item.metode_kembali === 'delivery' ? 'Kirim via Kurir' : 'Datang Langsung'}</span></p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Kolom 3 */}
                  <div className="flex flex-col justify-center gap-2 border-t md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0">
                    {/* Konten aksi - sama seperti sebelumnya */}
                    {item.metode_pengiriman === "delivery" ? (
                      <>
                        {(!item.pengiriman || item.pengiriman.status_pengiriman === "pending") && (
                          <Button className="bg-emerald-700 hover:bg-emerald-800 text-white w-full gap-2 py-5 text-sm" onClick={() => openShipModal(item)}>
                            <Truck className="size-4" /> Kirim Barang
                          </Button>
                        )}
                        {item.pengiriman?.status_pengiriman === "dikirim" && (
                          <Button variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 w-full gap-2 py-5 text-sm" onClick={() => openUpdateModal(item)}>
                            <Navigation className="size-4" /> Update Lokasi
                          </Button>
                        )}
                        {item.pengiriman?.status_pengiriman === "sampai" && (
                          <div className="text-center p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                            <p className="text-xs text-indigo-700 font-semibold flex items-center justify-center gap-1.5">
                              <MapPin className="size-3.5" /> Sudah Tiba di Lokasi
                            </p>
                          </div>
                        )}
                        {item.pengiriman?.status_pengiriman === "diterima" && (
                          <>
                            {item.status_kembali === "proses" ? (
                              <Button className="bg-orange-600 hover:bg-orange-700 text-white w-full gap-2 py-5 text-sm" onClick={() => openReturnModal(item)}>
                                <CheckCircle2 className="size-4" /> Konfirmasi Barang Diterima
                              </Button>
                            ) : item.status_sewa === "selesai" ? (
                              <div className="text-center p-3 rounded-lg bg-green-50 border border-green-100">
                                <p className="text-xs text-green-700 font-semibold flex items-center justify-center gap-1.5">
                                  <CheckCircle2 className="size-3.5" /> Transaksi Selesai
                                </p>
                              </div>
                            ) : (
                              <div className="text-center p-3 rounded-lg bg-green-50 border border-green-100">
                                <p className="text-xs text-green-700 font-semibold flex items-center justify-center gap-1.5">
                                  <CheckCircle2 className="size-3.5" /> Selesai Diterima
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        {item.status_sewa === "dibayar" && (
                          <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full gap-2 py-5 text-sm" onClick={() => handlePickupDiambil(item)}>
                            <HandMetal className="size-4" /> Barang Sudah Diambil
                          </Button>
                        )}
                        {item.status_sewa === "sedang_disewa" && item.status_kembali === "belum" && (
                          <div className="text-center p-4 rounded-xl border bg-blue-50">
                            <p className="text-xs text-blue-700 font-semibold">Sedang Disewa</p>
                          </div>
                        )}
                        {item.status_sewa === "sedang_disewa" && item.status_kembali === "proses" && (
                          <Button className="bg-orange-600 hover:bg-orange-700 text-white w-full gap-2 py-5 text-sm" onClick={() => openReturnModal(item)}>
                            <CheckCircle2 className="size-4" /> Konfirmasi Barang Diterima
                          </Button>
                        )}
                        {item.status_sewa === "selesai" && (
                          <div className="text-center p-4 rounded-xl border bg-green-50">
                            <p className="text-xs text-green-700 font-semibold">Transaksi Selesai</p>
                          </div>
                        )}
                      </>
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
            label="transaksi"
          />
        </>
      )}

      {/* Modal 1: Kirim Barang */}
      {isShipModalOpen && selectedTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Truck className="size-5 text-emerald-600" />
                Proses Kirim Barang
              </h2>
              <button onClick={() => { setIsShipModalOpen(false); setSelectedTrx(null); }} className="text-muted-foreground hover:text-muted-foreground rounded-lg p-1 hover:bg-muted">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleShipSubmit} className="p-6 space-y-4">
              <div className="bg-emerald-50 p-4 rounded-xl text-xs space-y-1.5 text-emerald-800">
                <p><strong>Alat Sewaan:</strong> {selectedTrx.nama_barang} ({selectedTrx.jumlah} unit)</p>
                <p><strong>Penyewa:</strong> {selectedTrx.penyewa?.nama}</p>
                <p><strong>Alamat Kirim:</strong> {selectedTrx.alamat_pengiriman}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Nama Kurir / Pengantar</label>
                <select value={shipForm.kurir} onChange={(e) => setShipForm(prev => ({ ...prev, kurir: e.target.value }))} className="w-full px-3.5 py-2.5 border rounded-xl text-sm">
                  <option value="SiPetualang Delivery">SiPetualang Delivery (Internal)</option>
                  <option value="JNE Express">JNE Express</option>
                  <option value="J&T Express">J&T Express</option>
                  <option value="SiCepat Express">SiCepat Express</option>
                  <option value="GoSend / GrabExpress">GoSend / GrabExpress</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Nomor Resi Pengiriman</label>
                <div className="flex gap-2">
                  <input type="text" value={shipForm.no_resi} onChange={(e) => setShipForm(prev => ({ ...prev, no_resi: e.target.value }))} className="flex-1 px-3.5 py-2.5 border rounded-xl text-sm" />
                  <button type="button" onClick={() => setShipForm(prev => ({ ...prev, no_resi: generateNoResi() }))} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm flex items-center gap-1.5">
                    <RefreshCw className="size-4" /> Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Lokasi Awal Keberangkatan</label>
                <input type="text" value={shipForm.lokasi_terakhir} onChange={(e) => setShipForm(prev => ({ ...prev, lokasi_terakhir: e.target.value }))} className="w-full px-3.5 py-2.5 border rounded-xl text-sm" />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t mt-4">
                <Button type="button" variant="outline" onClick={() => { setIsShipModalOpen(false); setSelectedTrx(null); }}>Batal</Button>
                <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white">Mulai Pengiriman</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Update Lokasi */}
      {isUpdateModalOpen && selectedTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Navigation className="size-5 text-emerald-600" />
                Perbarui Lokasi & Status
              </h2>
              <button onClick={() => { setIsUpdateModalOpen(false); setSelectedTrx(null); }} className="text-muted-foreground hover:text-muted-foreground rounded-lg p-1 hover:bg-muted">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
              <div className="bg-muted p-4 rounded-xl text-xs space-y-1.5">
                <p><strong>Kurir:</strong> {selectedTrx.pengiriman?.kurir}</p>
                <p><strong>Nomor Resi:</strong> {selectedTrx.pengiriman?.no_resi}</p>
                <p><strong>Lokasi Terakhir:</strong> {selectedTrx.pengiriman?.lokasi_terakhir}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Lokasi Pos Terkini</label>
                <div className="flex gap-2">
                  <input type="text" value={updateForm.lokasi_terakhir} onChange={(e) => setUpdateForm(prev => ({ ...prev, lokasi_terakhir: e.target.value }))} className="flex-1 px-3.5 py-2.5 border rounded-xl text-sm" />
                  <button type="button" onClick={getCurrentLocationForAdmin} disabled={isGettingLocation} className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-1.5">
                    <LocateFixed className="size-4" /> {isGettingLocation ? "Memuat..." : "Lokasi Saya"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Status Pengiriman</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setUpdateForm(prev => ({ ...prev, status_pengiriman: "dikirim" }))} className={`py-3 rounded-xl border text-sm ${updateForm.status_pengiriman === "dikirim" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-border"}`}>
                    <Truck className="size-4" /> Dalam Perjalanan
                  </button>
                  <button type="button" onClick={() => setUpdateForm(prev => ({ ...prev, status_pengiriman: "sampai" }))} className={`py-3 rounded-xl border text-sm ${updateForm.status_pengiriman === "sampai" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-border"}`}>
                    <MapPin className="size-4" /> Sudah Sampai
                  </button>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t mt-4">
                <Button type="button" variant="outline" onClick={() => { setIsUpdateModalOpen(false); setSelectedTrx(null); }}>Batal</Button>
                <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white">Perbarui Posisi</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Konfirmasi Pengembalian */}
      {isReturnModalOpen && selectedTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <CheckCircle2 className="size-5 text-orange-600" />
                Konfirmasi Pengembalian Barang
              </h2>
              <button onClick={() => { setIsReturnModalOpen(false); setSelectedTrx(null); }} className="text-muted-foreground hover:text-muted-foreground rounded-lg p-1 hover:bg-muted">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="p-6 space-y-4">
              <div className="bg-orange-50 p-4 rounded-xl text-xs space-y-1.5 text-orange-800">
                <p><strong>Alat Sewaan:</strong> {selectedTrx.nama_barang} ({selectedTrx.jumlah} unit)</p>
                <p><strong>Penyewa:</strong> {selectedTrx.penyewa?.nama}</p>
                <p><strong>Metode Pengiriman:</strong> {selectedTrx.metode_pengiriman === 'pickup' ? 'Ambil di Tempat' : 'Delivery'}</p>
                <p><strong>Batas Waktu Sewa:</strong> {new Date(selectedTrx.tanggal_selesai).toLocaleDateString("id-ID")}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Kondisi Barang Saat Diterima</label>
                <select value={returnForm.kondisi_barang} onChange={(e) => setReturnForm(prev => ({ ...prev, kondisi_barang: e.target.value }))} className="w-full px-3.5 py-2.5 border rounded-xl text-sm">
                  <option value="baik">Baik (Tidak Ada Kerusakan)</option>
                  <option value="rusak_ringan">Rusak Ringan</option>
                  <option value="rusak_berat">Rusak Berat</option>
                  <option value="hilang_komponen">Hilang Komponen</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Denda Kerusakan (Rp)</label>
                <input type="number" min="0" value={returnForm.denda_kerusakan} onChange={(e) => setReturnForm(prev => ({ ...prev, denda_kerusakan: Number(e.target.value) }))} className="w-full px-3.5 py-2.5 border rounded-xl text-sm" placeholder="0" />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Catatan Admin (Opsional)</label>
                <textarea value={returnForm.catatan} onChange={(e) => setReturnForm(prev => ({ ...prev, catatan: e.target.value }))} className="w-full px-3.5 py-2.5 border rounded-xl text-sm" rows={3} placeholder="Catatan tentang kondisi barang..." />
              </div>

              {Number(selectedTrx.nominal_deposit) > 0 && (
                <div className="bg-emerald-50 p-3 rounded-xl text-xs">
                  <p className="font-bold text-emerald-800">Informasi Deposit:</p>
                  <p>Deposit Awal: <strong>Rp {Number(selectedTrx.nominal_deposit).toLocaleString()}</strong></p>
                  <p>Denda Kerusakan: <strong>Rp {Number(returnForm.denda_kerusakan).toLocaleString()}</strong></p>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t mt-4">
                <Button type="button" variant="outline" onClick={() => { setIsReturnModalOpen(false); setSelectedTrx(null); }}>Batal</Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">Konfirmasi & Selesaikan</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}