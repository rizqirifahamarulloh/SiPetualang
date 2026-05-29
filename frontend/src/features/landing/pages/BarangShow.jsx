import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { chatService } from '@/features/customer/services/chatService';
import KtpVerificationModal from '@/components/KtpVerificationModal';
import { API_URL, BASE_URL } from '@/services/api';
import { cartService } from '@/features/customer/services/cartService';

import Navbar from '@/features/landing/components/Navbar';
import Footer from '@/features/landing/components/Footer';

import {
  Loader2,
  MapPin,
  CreditCard,
  Truck,
  Store,
  MessageCircle,
  ShoppingCart,
  Zap,
  Calendar,
  Info,
  Star,
} from 'lucide-react';

import '@/features/landing/landing.css';
import bannerBg from '@/assets/sewaalat/banner BG.png';

const MIDTRANS_CLIENT_KEY = 'Mid-client-4bv4cHzWqRv44v7s';
const PLACEHOLDER_IMAGE = 'https://placehold.co/600x400/f0fdf4/166534?text=Gambar+Tidak+Tersedia';

// Lokasi toko/pemilik
const getStoreLocation = (barang) => ({
  name: barang?.pemilik?.nama || "SiPetualang Rental",
  address: barang?.pemilik?.alamat || "Jl. Merdeka No. 123, Jakarta Pusat",
  lat: -6.2088,
  lng: 106.8456,
});

export default function BarangShow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  const today = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const [barang, setBarang] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState(null);

  const [selectedJumlah, setSelectedJumlah] = useState(1);
  const [tanggalMulai, setTanggalMulai] = useState(today);
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.alamat || '');
  const [isKtpModalOpen, setIsKtpModalOpen] = useState(false);
  
  // State untuk ongkir & jarak
  const [shippingCost, setShippingCost] = useState(0);
  const [distance, setDistance] = useState(0);
  const [isCalculatingOngkir, setIsCalculatingOngkir] = useState(false);

  const minDurasi = barang?.min_durasi_sewa || 1;

  // Auto-set tanggalSelesai
  useEffect(() => {
    if (!tanggalMulai) return;
    const start = new Date(tanggalMulai);
    const minEnd = new Date(start);
    minEnd.setDate(minEnd.getDate() + (minDurasi - 1));
    const minEndStr = minEnd.toISOString().split('T')[0];
    
    if (!tanggalSelesai || tanggalSelesai < minEndStr) {
      setTanggalSelesai(minEndStr);
    }
  }, [tanggalMulai, minDurasi, tanggalSelesai]);

  const totalHari = useMemo(() => {
    if (!tanggalMulai || !tanggalSelesai) return 0;
    const start = new Date(tanggalMulai);
    const end = new Date(tanggalSelesai);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  }, [tanggalMulai, tanggalSelesai]);

  const totalHarga = useMemo(() => {
    if (!barang) return 0;
    return barang.harga_sewa * totalHari * selectedJumlah;
  }, [barang, totalHari, selectedJumlah]);

  const totalDeposit = useMemo(() => {
    if (!barang) return 0;
    return (barang.nominal_deposit || 0) * selectedJumlah;
  }, [barang, selectedJumlah]);

  const grandTotal = useMemo(() => {
    return totalHarga + totalDeposit + shippingCost;
  }, [totalHarga, totalDeposit, shippingCost]);

  // Fungsi hitung jarak (Haversine formula)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const earthRadius = 6371;
    const latDiff = (lat2 - lat1) * Math.PI / 180;
    const lngDiff = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(lngDiff / 2) * Math.sin(lngDiff / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  };

  // Fungsi hitung ongkir pake Nominatim (OpenStreetMap)
  const calculateOngkir = useCallback(async (address) => {
    if (deliveryMethod !== 'delivery' || !address || address.trim() === '') {
      setShippingCost(0);
      setDistance(0);
      return;
    }

    setIsCalculatingOngkir(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const storeLoc = getStoreLocation(barang);
        const distanceKm = calculateDistance(lat, lng, storeLoc.lat, storeLoc.lng);
        setDistance(distanceKm);
        const cost = Math.round(distanceKm * 1000);
        setShippingCost(cost);
      } else {
        setDistance(0);
        setShippingCost(0);
        alert("Alamat tidak ditemukan. Silakan masukkan alamat yang lebih spesifik.");
      }
    } catch (error) {
      console.error("Error calculating distance:", error);
      setDistance(0);
      setShippingCost(0);
      alert("Gagal menghitung ongkir. Periksa koneksi internet Anda.");
    } finally {
      setIsCalculatingOngkir(false);
    }
  }, [deliveryMethod, barang]);

  // Ambil lokasi otomatis dari browser
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung geolocation");
      return;
    }

    setIsCalculatingOngkir(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const storeLoc = getStoreLocation(barang);
        const distanceKm = calculateDistance(lat, lng, storeLoc.lat, storeLoc.lng);
        setDistance(distanceKm);
        setShippingCost(Math.round(distanceKm * 1000));
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await response.json();
          if (data.display_name) {
            setDeliveryAddress(data.display_name);
          }
        } catch (e) {
          console.log("Gagal reverse geocoding");
        }
        setIsCalculatingOngkir(false);
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
        alert(errorMsg);
        setIsCalculatingOngkir(false);
      }
    );
  };

  // Debounce hitung ongkir saat alamat berubah
  useEffect(() => {
    if (deliveryMethod === 'delivery' && deliveryAddress && deliveryAddress.length > 10) {
      const timeout = setTimeout(() => {
        calculateOngkir(deliveryAddress);
      }, 1000);
      return () => clearTimeout(timeout);
    } else {
      setShippingCost(0);
      setDistance(0);
    }
  }, [deliveryAddress, deliveryMethod, calculateOngkir]);

  // Load Midtrans
  useEffect(() => {
    if (!window.snap) {
      const script = document.createElement('script');
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
      document.body.appendChild(script);
    }
  }, []);

  // Fetch barang
  useEffect(() => {
    const fetchBarang = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get(`${API_URL}/rental/barang/${id}`);
        setBarang(response.data);
      } catch (err) {
        console.error(err);
        setError('Gagal memuat detail barang');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchBarang();
    }
  }, [id]);

  const addToCart = async () => {
    if (!user) {
      alert('Silakan login terlebih dahulu');
      navigate('/login');
      return;
    }

    if (!barang) return;

    if (selectedJumlah > barang.jumlah_stok) {
      alert(`Stok tidak mencukupi. Sisa ${barang.jumlah_stok}`);
      return;
    }

    try {
      setLoadingAction(true);

      const cartItem = {
        id_cart: Date.now(),
        id_barang: barang.id_barang,
        nama_barang: barang.nama_barang,
        harga_sewa: barang.harga_sewa,
        nominal_deposit: barang.nominal_deposit || 0,
        jumlah: selectedJumlah,
        tanggal_mulai: tanggalMulai,
        tanggal_selesai: tanggalSelesai,
        total_hari: totalHari,
        total_harga: Number(barang.harga_sewa) * selectedJumlah * totalHari,
        foto_barang: barang.foto_barang,
        pemilik: barang.pemilik,
        id_pemilik: barang.id_pemilik,
      };

      const result = await cartService.addToCart(cartItem);

      if (result.alreadyExists) {
        alert('Barang ini sudah ada di keranjang');
        navigate('/customer/cart');
        return;
      }

      window.dispatchEvent(new CustomEvent('cart-updated'));
      alert('Berhasil ditambahkan ke keranjang');
      navigate('/customer/cart');
    } catch (err) {
      console.error(err);
      alert('Gagal tambah keranjang');
    } finally {
      setLoadingAction(false);
    }
  };

  const buyNow = async () => {
    if (!user) {
      alert('Silakan login');
      navigate('/login');
      return;
    }

    const isApproved = user?.is_verified === true || user?.is_verified === 1 || user?.is_verified === 'true' || user?.verification_status === 'disetujui';
    if (!isApproved) {
      setIsKtpModalOpen(true);
      return;
    }

    if (!barang) return;

    if (deliveryMethod === 'delivery' && (!deliveryAddress || deliveryAddress.trim() === '')) {
      alert('Mohon isi alamat pengiriman terlebih dahulu');
      return;
    }

    try {
      setLoadingAction(true);

      const checkoutData = {
        items: [{
          id_barang: barang.id_barang,
          jumlah: selectedJumlah,
          tanggal_mulai: tanggalMulai,
          tanggal_selesai: tanggalSelesai,
        }],
        metode_pengiriman: deliveryMethod,
        alamat_pengiriman: deliveryMethod === 'delivery' ? deliveryAddress : null,
        biaya_pengiriman: shippingCost,
      };

      const response = await axios.post(
        `${API_URL}/customer/transaksi/checkout`,
        checkoutData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      window.snap.pay(response.data.snap_token, {
        onSuccess: () => {
          alert('Pembayaran berhasil');
          navigate('/customer/transactions');
        },
        onPending: () => {
          alert('Pembayaran pending');
          navigate('/customer/transactions');
        },
        onError: (err) => {
          console.error(err);
          alert('Pembayaran gagal');
        },
      });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Checkout gagal');
    } finally {
      setLoadingAction(false);
    }
  };

  const startChatWithOwner = async () => {
    if (!user) {
      alert('Login terlebih dahulu');
      navigate('/login');
      return;
    }

    try {
      const response = await chatService.getOrCreateConversation(barang.pemilik.id_pengguna);
      const conversationId = response.data.id_conversation;
      await chatService.sendMessage(conversationId, `Halo saya tertarik dengan ${barang.nama_barang}`);
      navigate('/customer/chat');
    } catch (err) {
      console.error(err);
      alert('Gagal memulai chat');
    }
  };

  const getImageUrl = useCallback(() => {
    if (!barang) return PLACEHOLDER_IMAGE;
    
    if (barang.foto_barang) {
      if (barang.foto_barang.startsWith('http')) {
        return barang.foto_barang;
      }
      return `${BASE_URL}/storage/${barang.foto_barang}`;
    }
    
    return PLACEHOLDER_IMAGE;
  }, [barang]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#00A779]" />
      </div>
    );
  }

  if (error || !barang) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{error || 'Barang tidak ditemukan'}</p>
      </div>
    );
  }

  return (
    <div className="landing-scrollbar bg-white">
      <Navbar />

      {/* HERO BANNER */}
      <section
        className="relative w-full bg-white"
        style={{ padding: '16px 16px 0 16px' }}
      >
        <div className="relative w-full">
          <div className="relative w-full h-[300px] md:h-[600px] rounded-[16px] md:rounded-[24px] overflow-hidden">
            <img
              src={bannerBg}
              alt="Product Banner"
              className="w-full h-full object-cover object-center block"
            />
            <div className="absolute inset-0 bg-black/10 pointer-events-none" />
            <div className="absolute inset-0 z-[1] flex items-center justify-center px-8">
              <h1 className="text-[32px] md:text-[54px] font-extrabold text-white leading-none tracking-tight select-none text-center line-clamp-2" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
                {barang.nama_barang}
              </h1>
            </div>
          </div>
          {/* Breadcrumb */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10 flex items-end">
            <div className="w-[20px] h-[20px] bg-transparent" style={{ boxShadow: '8px 8px 0 8px white', borderRadius: '0 0 16px 0' }} />
            <div className="bg-white px-12 py-3 rounded-t-[18px]">
              <div className="flex items-center gap-2 text-[13px] font-medium text-gray-400 whitespace-nowrap">
                <Link to="/" className="hover:text-emerald-500 transition-colors no-underline text-gray-400">
                  Home
                </Link>
                <span className="text-gray-300 font-light">&gt;</span>
                <Link to="/sewa-alat" className="hover:text-emerald-500 transition-colors no-underline text-gray-400">
                  Sewa Alat
                </Link>
                <span className="text-gray-300 font-light">&gt;</span>
                <span className="text-gray-700 font-semibold max-w-[200px] truncate">{barang.nama_barang}</span>
              </div>
            </div>
            <div className="w-[20px] h-[20px] bg-transparent" style={{ boxShadow: '-8px 8px 0 8px white', borderRadius: '0 0 0 16px' }} />
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 pt-10 pb-20 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Kolom Kiri */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border">
              <img
                src={getImageUrl()}
                alt={barang.nama_barang}
                className="w-full h-[500px] object-cover"
                onError={(e) => {
                  e.target.src = PLACEHOLDER_IMAGE;
                }}
              />
            </div>

            <div className="bg-white mt-4 rounded-3xl p-5 border shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#F1F3F5] flex items-center justify-center">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <Link
                      to={`/toko/${barang.id_pemilik}`}
                      className="font-bold text-black no-underline"
                    >
                      {barang.pemilik?.nama || 'Vendor'}
                    </Link>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <MapPin className="w-3 h-3" />
                      {barang.pemilik?.kota || 'Indonesia'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={startChatWithOwner}
                  className="bg-black text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </button>
              </div>
            </div>
          </div>

          {/* Kolom Kanan */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Info Barang */}
            <div className="bg-white rounded-3xl p-8 border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">READY</span>
                <span className="text-xs text-gray-500">{barang.jumlah_stok} stok tersedia</span>
              </div>

              <h1 className="text-3xl font-black text-gray-900">{barang.nama_barang}</h1>

              {/* Star Rating */}
              {(() => {
                const rating = ((barang.id_barang * 7 + 13) % 15 + 36) / 10;
                const reviewCount = (barang.id_barang * 17 + 5) % 80 + 12;
                return (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const fill = Math.min(1, Math.max(0, rating - (star - 1)));
                        return (
                          <div key={star} className="relative w-5 h-5">
                            <Star className="w-5 h-5 text-gray-200" fill="#e5e7eb" strokeWidth={0} />
                            <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                              <Star className="w-5 h-5 text-amber-400" fill="#fbbf24" strokeWidth={0} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <span className="text-sm font-bold text-gray-800">{rating.toFixed(1)}</span>
                    <span className="text-xs text-gray-400">({reviewCount} ulasan)</span>
                  </div>
                );
              })()}

              <div className="mt-5 flex flex-col gap-1">
                <div>
                  <span className="text-3xl font-black text-[#00A779]">
                    Rp {Number(barang.harga_sewa).toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-400"> / hari</span>
                </div>
                {Number(barang.nominal_deposit) > 0 && (
                  <div className="mt-2 text-sm text-slate-500 flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 self-start">
                    <span className="font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-md text-xs">Jaminan Deposit</span>
                    <span>Rp {Number(barang.nominal_deposit).toLocaleString()}</span>
                    <span className="text-[11px] text-slate-400">(Refundable)</span>
                  </div>
                )}
                {minDurasi > 1 && (
                  <div className="mt-2 text-sm text-amber-700 flex items-center gap-1.5 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200 self-start">
                    <span className="font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-md text-xs">Min. Durasi</span>
                    <span className="font-semibold">{minDurasi} hari</span>
                  </div>
                )}
              </div>

              <div className="mt-8 border-t pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-[#00A779]" />
                  <h2 className="font-bold">Deskripsi</h2>
                </div>
                <p className="text-gray-600 leading-relaxed">{barang.deskripsi}</p>
              </div>
            </div>

            {/* Form Rental */}
            <div className="bg-white rounded-3xl p-8 border shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-[#00A779]" />
                <h2 className="font-bold text-lg">Konfigurasi Rental</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold">Jumlah</label>
                  <input
                    type="number"
                    min="1"
                    max={barang.jumlah_stok}
                    value={selectedJumlah}
                    onChange={(e) => setSelectedJumlah(parseInt(e.target.value) || 1)}
                    className="w-full mt-2 px-4 py-3 rounded-xl border"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Mulai</label>
                  <input
                    type="date"
                    value={tanggalMulai}
                    min={today}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    className="w-full mt-2 px-4 py-3 rounded-xl border"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Selesai</label>
                  <input
                    type="date"
                    value={tanggalSelesai}
                    min={(() => {
                      if (!tanggalMulai) return '';
                      const d = new Date(tanggalMulai);
                      d.setDate(d.getDate() + (minDurasi - 1));
                      return d.toISOString().split('T')[0];
                    })()}
                    onChange={(e) => setTanggalSelesai(e.target.value)}
                    className="w-full mt-2 px-4 py-3 rounded-xl border"
                  />
                </div>
              </div>

              {minDurasi > 1 && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                  <p className="text-xs text-amber-700 font-medium">
                    Minimum durasi sewa: {minDurasi} hari
                  </p>
                </div>
              )}

              {/* Metode Pengiriman */}
              <div className="mt-6">
                <label className="text-sm font-semibold">Metode Pengiriman</label>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <button
                    onClick={() => {
                      setDeliveryMethod('pickup');
                      setShippingCost(0);
                      setDistance(0);
                    }}
                    className={`py-3 rounded-xl border flex items-center justify-center gap-2 transition ${
                      deliveryMethod === 'pickup' 
                        ? 'bg-[#00A779] text-white' 
                        : 'bg-white'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    Pickup
                  </button>
                  <button
                    onClick={() => setDeliveryMethod('delivery')}
                    className={`py-3 rounded-xl border flex items-center justify-center gap-2 transition ${
                      deliveryMethod === 'delivery' 
                        ? 'bg-[#00A779] text-white' 
                        : 'bg-white'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    Delivery
                  </button>
                </div>
              </div>

              {/* Form Alamat Delivery */}
              {deliveryMethod === 'delivery' && (
                <div className="mt-5">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Alamat Pengiriman
                  </label>
                  
                  <textarea
                    rows={3}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Contoh: Jl. Sudirman No. 123, Jakarta Pusat"
                    className="w-full border rounded-2xl p-4 mt-2 focus:outline-none focus:border-[#00A779]"
                  />
                  
                  {/* DUA TOMBOL */}
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={() => calculateOngkir(deliveryAddress)} 
                      disabled={isCalculatingOngkir || !deliveryAddress}
                      className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition"
                    >
                      <MapPin className="w-4 h-4" /> 
                      {isCalculatingOngkir ? "Memuat..." : "Cek Ongkir"}
                    </button>
                    <button 
                      onClick={getCurrentLocation} 
                      disabled={isCalculatingOngkir}
                      className="flex-1 bg-[#00A779] text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#008f68] transition"
                    >
                      <span className="text-lg">📍</span> Lokasi Saya
                    </button>
                  </div>

                  {/* Tampilkan Jarak & Ongkir */}
                  {distance > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-[#00A779]" />
                          <span className="text-sm font-semibold text-gray-700">
                            Biaya Pengiriman:
                          </span>
                        </div>
                        {isCalculatingOngkir ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#00A779]" />
                        ) : (
                          <span className="font-bold text-[#00A779] text-lg">
                            Rp {shippingCost.toLocaleString("id-ID")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <span>📍 Jarak: {distance.toFixed(2)} km</span>
                        <span className="mx-1">•</span>
                        <span>💰 Rp 1.000/km</span>
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Dari: {barang.pemilik?.kota || "Jakarta"}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Total Harga */}
              <div className="bg-[#F8F9FA] rounded-2xl p-5 mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Biaya Sewa ({selectedJumlah} barang x {totalHari} hari)</span>
                  <span className="font-semibold">Rp {totalHarga.toLocaleString()}</span>
                </div>

                {totalDeposit > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      Deposit Jaminan
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">Refundable</span>
                    </span>
                    <span className="font-semibold">Rp {totalDeposit.toLocaleString()}</span>
                  </div>
                )}

                {deliveryMethod === 'delivery' && shippingCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Biaya Pengiriman</span>
                    <span className="font-semibold">Rp {shippingCost.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-black mt-4 border-t pt-4">
                  <span>Total Pembayaran</span>
                  <span className="text-[#00A779] text-xl">
                    Rp {grandTotal.toLocaleString()}
                  </span>
                </div>

                {totalDeposit > 0 && (
                  <p className="text-[11px] text-gray-400 mt-2">
                    💡 Deposit akan dikembalikan setelah barang kembali dalam kondisi baik
                  </p>
                )}
              </div>

              {/* Payment Info */}
              <div className="bg-[#F8F9FA] border rounded-2xl p-4 mt-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-[#00A779]" />
                  <div>
                    <p className="font-bold text-sm">Pembayaran Midtrans</p>
                    <p className="text-xs text-gray-500">Transfer / QRIS / E-Wallet</p>
                  </div>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">AKTIF</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  onClick={addToCart}
                  disabled={loadingAction}
                  className="bg-gray-100 hover:bg-gray-200 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {loadingAction ? 'Loading...' : 'Keranjang'}
                </button>

                <button
                  onClick={buyNow}
                  disabled={loadingAction || (deliveryMethod === 'delivery' && isCalculatingOngkir)}
                  className="bg-[#00A779] hover:bg-[#008f68] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <Zap className="w-5 h-5" />
                  {loadingAction ? 'Processing...' : 'Sewa Sekarang'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <KtpVerificationModal 
        isOpen={isKtpModalOpen}
        onClose={() => setIsKtpModalOpen(false)}
        status={user?.verification_status}
      />
    </div>
  );
}