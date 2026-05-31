import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cartService } from "../services/cartService";
import api from "@/services/api";
import { getStorageUrl } from "@/utils/storageUrl";
import Navbar from "@/features/landing/components/Navbar";
import Footer from "@/features/landing/components/Footer";
import bannerBg from '@/assets/sewaalat/banner BG.png';
import KtpVerificationModal from "@/components/KtpVerificationModal";

import {
  Loader2,
  Trash2,
  ShoppingBag,
  Store,
  ShieldCheck,
  CreditCard,
  Minus,
  Plus,
  ArrowRight,
  Truck,
  MapPin,
  CheckCircle,
  XCircle,
  Info,
  X,
} from "lucide-react";

const storeLocation = {
  name: "SiPetualang Rental Center",
  address: "Jl. Merdeka No. 123, Jakarta Pusat, 10340",
  lat: -6.2088,
  lng: 106.8456,
};

export default function CartPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [processing, setProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isKtpModalOpen, setIsKtpModalOpen] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState(user?.alamat || "");
  const [shippingCost, setShippingCost] = useState(0);
  const [distance, setDistance] = useState(0);
  const [calculatingOngkir, setCalculatingOngkir] = useState(false);
  const [notificationModal, setNotificationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info"
  });

  // Load Midtrans Snap.js
  useEffect(() => {
    if (!window.snap) {
      const script = document.createElement('script');
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', 'Mid-client-4bv4cHzWqRv44v7s');
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // LOAD CART
  const loadCart = async () => {
    try {
      setIsLoading(true);

      const response = await cartService.getCart();
      const cartData = response.data || [];

      const fixedCart = cartData.map(item => {
        const start = new Date(item.tanggal_mulai);
        const end = new Date(item.tanggal_selesai);
        const totalHari = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
        const totalHarga = Number(item.harga_sewa) * Number(item.jumlah) * totalHari;
        return { ...item, total_hari: totalHari, total_harga: totalHarga };
      });

      setCart(fixedCart);

      const initialSelected = {};
      fixedCart.forEach((item) => {
        initialSelected[item.id_cart] = true;
      });
      setSelectedItems(initialSelected);
    } catch {
      console.log("Gagal load cart");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadCart();
    });
  }, []);

  // Auto-calculate shipping when address changes
  useEffect(() => {
    if (deliveryMethod === 'delivery' && deliveryAddress) {
      calculateOngkir();
    } else {
      setShippingCost(0);
      setDistance(0);
    }
  }, [deliveryAddress, deliveryMethod]);

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

  const calculateOngkir = async () => {
    if (!deliveryAddress) {
      setNotificationModal({
        isOpen: true,
        title: "Alamat Kosong",
        message: "Masukkan alamat pengiriman terlebih dahulu",
        type: "error"
      });
      return;
    }
    
    setCalculatingOngkir(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(deliveryAddress)}&format=json&limit=1`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const distanceKm = calculateDistance(lat, lng, storeLocation.lat, storeLocation.lng);
        setDistance(distanceKm);
        const cost = distanceKm * 1000;
        setShippingCost(Math.round(cost));
        setNotificationModal({
          isOpen: true,
          title: "✅ Alamat Ditemukan",
          message: `📍 Jarak: ${distanceKm.toFixed(2)} km\n💰 Ongkir: Rp ${Math.round(cost).toLocaleString("id-ID")}`,
          type: "success"
        });
      } else {
        setDistance(0);
        setShippingCost(0);
        setNotificationModal({
          isOpen: true,
          title: "❌ Alamat Tidak Ditemukan",
          message: `"${deliveryAddress}"\n\nSilakan gunakan format alamat yang lebih spesifik.\nContoh: Jalan Sudirman No. 123, Jakarta`,
          type: "error"
        });
      }
    } catch (error) {
      console.error("Error calculating distance:", error);
      setDistance(0);
      setShippingCost(0);
      setNotificationModal({
        isOpen: true,
        title: "⚠️ Gagal Menghitung Jarak",
        message: "Periksa koneksi internet Anda",
        type: "error"
      });
    } finally {
      setCalculatingOngkir(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setNotificationModal({
        isOpen: true,
        title: "⚠️ Geolocation Error",
        message: "Browser Anda tidak mendukung geolocation",
        type: "error"
      });
      return;
    }

    setCalculatingOngkir(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const distanceKm = calculateDistance(lat, lng, storeLocation.lat, storeLocation.lng);
        setDistance(distanceKm);
        setShippingCost(Math.round(distanceKm * 1000));
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await response.json();
          if (data.display_name) {
            setDeliveryAddress(data.display_name);
            setNotificationModal({
              isOpen: true,
              title: "✅ Lokasi Ditemukan",
              message: `📍 Jarak: ${distanceKm.toFixed(2)} km\n💰 Ongkir: Rp ${Math.round(distanceKm * 1000).toLocaleString("id-ID")}`,
              type: "success"
            });
          } else {
            setNotificationModal({
              isOpen: true,
              title: "📍 Lokasi Terdeteksi",
              message: `Jarak: ${distanceKm.toFixed(2)} km\nOngkir: Rp ${Math.round(distanceKm * 1000).toLocaleString("id-ID")}`,
              type: "info"
            });
          }
        } catch (e) {
          setNotificationModal({
            isOpen: true,
            title: "📍 Lokasi Terdeteksi",
            message: `Jarak: ${distanceKm.toFixed(2)} km\nOngkir: Rp ${Math.round(distanceKm * 1000).toLocaleString("id-ID")}`,
            type: "info"
          });
        }
        setCalculatingOngkir(false);
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
        setNotificationModal({
          isOpen: true,
          title: "⚠️ Gagal Mendapatkan Lokasi",
          message: errorMsg,
          type: "error"
        });
        setCalculatingOngkir(false);
      }
    );
  };

  // REMOVE ITEM
  const handleRemoveItem = async (cartId) => {
    if (!confirm("Hapus item ini?")) return;

    try {
      await cartService.removeFromCart(cartId);
      setCart((prev) => prev.filter((item) => item.id_cart !== cartId));
      setSelectedItems((prev) => {
        const updated = { ...prev };
        delete updated[cartId];
        return updated;
      });
    } catch {
      alert("Gagal menghapus item");
    }
  };

  // UPDATE QUANTITY
  const handleUpdateQuantity = async (cartId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      await cartService.updateCartItem(cartId, { jumlah: newQuantity });

      setCart((prev) =>
        prev.map((item) => {
          if (item.id_cart === cartId) {
            const start = new Date(item.tanggal_mulai);
            const end = new Date(item.tanggal_selesai);
            const totalHari = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
            const total = Number(item.harga_sewa) * newQuantity * totalHari;
            return { ...item, jumlah: newQuantity, total_hari: totalHari, total_harga: total };
          }
          return item;
        })
      );
    } catch {
      alert("Gagal update jumlah");
    }
  };

  // SELECT ITEM
  const handleToggleSelect = (cartId) => {
    setSelectedItems((prev) => ({ ...prev, [cartId]: !prev[cartId] }));
  };

  // SELECT ALL
  const handleSelectAll = () => {
    const allSelected = cart.length > 0 && cart.every((item) => selectedItems[item.id_cart]);
    const updated = {};
    cart.forEach((item) => {
      updated[item.id_cart] = !allSelected;
    });
    setSelectedItems(updated);
  };

  const isAllSelected = useMemo(() => {
    return cart.length > 0 && cart.every((item) => selectedItems[item.id_cart]);
  }, [cart, selectedItems]);

  const isAnySelected = useMemo(() => {
    return Object.values(selectedItems).some(Boolean);
  }, [selectedItems]);

  const getSelectedTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      if (selectedItems[item.id_cart]) {
        return total + Number(item.total_harga || 0);
      }
      return total;
    }, 0);
  }, [cart, selectedItems]);

  const getSelectedDepositTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      if (selectedItems[item.id_cart]) {
        return total + (Number(item.nominal_deposit || 0) * Number(item.jumlah || 1));
      }
      return total;
    }, 0);
  }, [cart, selectedItems]);

  const grandTotal = useMemo(() => {
    let total = getSelectedTotal + getSelectedDepositTotal;
    if (deliveryMethod === 'delivery') {
      total += shippingCost;
    }
    return total;
  }, [getSelectedTotal, getSelectedDepositTotal, deliveryMethod, shippingCost]);

  // CHECKOUT
  const handleCheckout = async () => {
    if (!user) {
      alert("Silakan login terlebih dahulu");
      navigate("/login");
      return;
    }

    const isApproved = user?.is_verified === true || user?.is_verified === 1 || 
                       user?.is_verified === 'true' || user?.verification_status === 'disetujui';
    if (!isApproved) {
      setIsKtpModalOpen(true);
      return;
    }

    const selected = cart.filter((item) => selectedItems[item.id_cart]);
    if (selected.length === 0) {
      alert("Pilih minimal satu barang!");
      return;
    }

    if (deliveryMethod === 'delivery') {
      if (!deliveryAddress) {
        alert("Masukkan alamat pengiriman terlebih dahulu!");
        return;
      }
      if (shippingCost === 0 && distance === 0) {
        const confirm = window.confirm("Alamat belum dicek ongkir. Lanjutkan?");
        if (!confirm) return;
      }
    }

    if (!window.snap) {
      alert("Midtrans belum siap, silakan coba lagi dalam beberapa detik.");
      return;
    }

    setProcessing(true);

    try {
      const checkoutData = {
        items: selected.map((item) => ({
          id_barang: item.id_barang,
          jumlah: item.jumlah,
          tanggal_mulai: item.tanggal_mulai,
          tanggal_selesai: item.tanggal_selesai,
        })),
        metode_pengiriman: deliveryMethod,
        alamat_pengiriman: deliveryMethod === "delivery" ? deliveryAddress : null,
        biaya_pengiriman: deliveryMethod === "delivery" ? shippingCost : 0,
      };

      const response = await api.post('/customer/transaksi/checkout', checkoutData);
      const snapToken = response.data.snap_token;

      if (!snapToken) {
        alert("Gagal mendapatkan token pembayaran");
        setProcessing(false);
        return;
      }

      await new Promise((resolve, reject) => {
        window.snap.pay(snapToken, {
          onSuccess: async () => {
            for (const item of selected) {
              await cartService.removeFromCart(item.id_cart);
            }
            resolve();
          },
          onPending: async () => {
            for (const item of selected) {
              await cartService.removeFromCart(item.id_cart);
            }
            resolve();
          },
          onError: (err) => {
            console.error("Pembayaran gagal:", err);
            reject(new Error("Pembayaran gagal"));
          },
          onClose: () => {
            resolve();
          },
        });
      });

      await loadCart();
      navigate("/customer/transactions");
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Gagal checkout: " + (error.response?.data?.message || error.response?.data?.error || error.message));
    } finally {
      setProcessing(false);
    }
  };

  // LOADING
  if (isLoading) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar forceScrolled />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-14 h-14 animate-spin text-emerald-500 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Memuat keranjang...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // BELUM LOGIN
  if (!user) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar forceScrolled />
        <div className="min-h-screen flex items-center justify-center px-5">
          <div className="bg-white p-10 rounded-[30px] shadow-xl text-center max-w-md w-full">
            <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-5" />
            <h1 className="text-3xl font-black text-gray-900 mb-2">Login Dulu</h1>
            <p className="text-gray-500 text-sm mb-7">Kamu harus login untuk melihat keranjang rental.</p>
            <Link to="/login" className="bg-emerald-500 hover:bg-emerald-600 text-white px-7 py-3 rounded-2xl font-semibold inline-flex items-center gap-2 no-underline">
              Login Sekarang <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // CART KOSONG
  if (cart.length === 0) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar forceScrolled />

        {/* HERO BANNER */}
        <section
          className="relative w-full bg-white"
          style={{ padding: '16px 16px 0 16px' }}
        >
          <div className="relative w-full">
            <div className="relative w-full h-[300px] md:h-[600px] rounded-[16px] md:rounded-[24px] overflow-hidden">
              <img
                src={bannerBg}
                alt="Cart Banner"
                className="w-full h-full object-cover object-center block"
              />
              <div className="absolute inset-0 bg-black/10 pointer-events-none" />
              <div className="absolute inset-0 z-[1] flex items-center justify-center">
                <h1 className="text-[40px] md:text-[60px] font-extrabold text-white leading-none tracking-tight select-none text-center" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
                  Keranjang Rental
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
                  <span className="text-gray-700 font-semibold">Keranjang</span>
                </div>
              </div>
              <div className="w-[20px] h-[20px] bg-transparent" style={{ boxShadow: '-8px 8px 0 8px white', borderRadius: '0 0 0 16px' }} />
            </div>
          </div>
        </section>

        {/* Empty State */}
        <div className="flex items-center justify-center px-5 py-20">
          <div className="bg-white p-10 rounded-[30px] shadow-xl text-center max-w-md w-full">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-5" />
            <h1 className="text-3xl font-black text-gray-900 mb-2">Keranjang Kosong</h1>
            <p className="text-gray-500 text-sm mb-7">Yuk cari alat petualangan favoritmu sekarang.</p>
            <Link to="/sewa-alat" className="bg-emerald-500 hover:bg-emerald-600 text-white px-7 py-3 rounded-2xl font-semibold inline-flex items-center gap-2 no-underline">
              Mulai Rental <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <Navbar forceScrolled />

      {/* HERO BANNER */}
      <section
        className="relative w-full bg-white"
        style={{ padding: '16px 16px 0 16px' }}
      >
        <div className="relative w-full">
          <div className="relative w-full h-[300px] md:h-[600px] rounded-[16px] md:rounded-[24px] overflow-hidden">
            <img
              src={bannerBg}
              alt="Cart Banner"
              className="w-full h-full object-cover object-center block"
            />
            <div className="absolute inset-0 bg-black/10 pointer-events-none" />
            <div className="absolute inset-0 z-[1] flex items-center justify-center">
              <h1 className="text-[40px] md:text-[60px] font-extrabold text-white leading-none tracking-tight select-none text-center" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
                Keranjang Rental
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
                <span className="text-gray-700 font-semibold">Keranjang</span>
              </div>
            </div>
            <div className="w-[20px] h-[20px] bg-transparent" style={{ boxShadow: '-8px 8px 0 8px white', borderRadius: '0 0 0 16px' }} />
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-10 pb-20">

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* LEFT */}
          <div className="xl:col-span-8">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="w-5 h-5 accent-emerald-500" />
                <span className="font-semibold text-gray-700">Pilih Semua Barang</span>
              </div>
              <span className="text-sm text-gray-400">{cart.length} Item</span>
            </div>

            <div className="space-y-5">
              {cart.map((item) => (
                <div key={item.id_cart} className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-5 flex flex-col lg:flex-row gap-5">
                    <div className="pt-1">
                      <input type="checkbox" checked={selectedItems[item.id_cart] || false} onChange={() => handleToggleSelect(item.id_cart)} className="w-5 h-5 accent-emerald-500" />
                    </div>
                    <Link to={`/barang/${item.id_barang}`} className="w-full lg:w-44 h-44 bg-[#f7f7f7] rounded-[28px] overflow-hidden">
                      <img src={getStorageUrl(item.foto_barang, "https://via.placeholder.com/300")} alt={item.nama_barang} className="w-full h-full object-cover" />
                    </Link>
                    <div className="flex-1">
                      <div className="flex justify-between gap-4">
                        <div>
                          <Link to={`/barang/${item.id_barang}`} className="hover:text-emerald-500 transition-colors">
                            <h2 className="text-2xl font-black text-gray-900 mb-2">{item.nama_barang}</h2>
                          </Link>
                          <Link to={`/toko/${item.id_pemilik}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-500">
                            <Store className="w-4 h-4" /> {item.pemilik?.nama || "SiPetualang"}
                          </Link>
                          <div className="mt-4 bg-gray-50 rounded-2xl px-4 py-3 inline-block">
                            <p className="text-xs text-gray-400">Tanggal Rental</p>
                            <p className="text-sm font-semibold text-gray-700">{item.tanggal_mulai} — {item.tanggal_selesai}</p>
                          </div>
                        </div>
                        <button onClick={() => handleRemoveItem(item.id_cart)} className="w-12 h-12 rounded-2xl bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mt-8">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Harga Rental</p>
                          <h3 className="text-3xl font-black text-emerald-500">Rp {Number(item.harga_sewa).toLocaleString("id-ID")}</h3>
                          <span className="text-sm text-gray-400 block mb-1">/hari</span>
                          {Number(item.nominal_deposit) > 0 && (
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">Deposit: Rp {Number(item.nominal_deposit).toLocaleString("id-ID")}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-5">
                          <div className="flex items-center bg-gray-100 rounded-2xl overflow-hidden">
                            <button onClick={() => handleUpdateQuantity(item.id_cart, item.jumlah - 1)} className="w-12 h-12"><Minus className="w-4 h-4" /></button>
                            <div className="w-14 text-center font-bold text-gray-800">{item.jumlah}</div>
                            <button onClick={() => handleUpdateQuantity(item.id_cart, item.jumlah + 1)} className="w-12 h-12"><Plus className="w-4 h-4" /></button>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Total</p>
                            <p className="text-2xl font-black text-gray-900">Rp {Number(item.total_harga).toLocaleString("id-ID")}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="xl:col-span-4">
            <div className="sticky top-32">
              <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-6">
                <div className="bg-[#f8fafc] rounded-3xl p-5 mb-6">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center"><Store className="w-6 h-6 text-emerald-500" /></div>
                    <div><h3 className="font-black text-gray-900">{storeLocation.name}</h3><p className="text-xs text-gray-400">Official Store</p></div>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{storeLocation.address}</p>
                </div>

                <div className="mb-6">
                  <label className="text-sm font-semibold text-gray-700">Metode Pengiriman</label>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <button onClick={() => setDeliveryMethod('pickup')} className={`py-3 rounded-xl border flex items-center justify-center gap-2 font-medium text-sm ${deliveryMethod === 'pickup' ? 'bg-[#00A779] text-white border-[#00A779]' : 'bg-white text-gray-600 border-gray-200'}`}>
                      <Store className="w-4 h-4" /> Pickup
                    </button>
                    <button onClick={() => setDeliveryMethod('delivery')} className={`py-3 rounded-xl border flex items-center justify-center gap-2 font-medium text-sm ${deliveryMethod === 'delivery' ? 'bg-[#00A779] text-white border-[#00A779]' : 'bg-white text-gray-600 border-gray-200'}`}>
                      <Truck className="w-4 h-4" /> Delivery
                    </button>
                  </div>
                </div>

                {deliveryMethod === 'delivery' && (
                  <div className="mt-4">
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Alamat Pengiriman</label>
                    <textarea
                      rows="3"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Masukkan alamat lengkap..."
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#00A779]"
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={calculateOngkir} disabled={calculatingOngkir} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm flex items-center justify-center gap-1">
                        <MapPin className="w-3 h-3" /> {calculatingOngkir ? "Memuat..." : "Cek Ongkir"}
                      </button>
                      <button onClick={getCurrentLocation} disabled={calculatingOngkir} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm">
                        📍 Lokasi Saya
                      </button>
                    </div>
                    {distance > 0 && (
                      <div className="mt-2 p-2 bg-emerald-50 rounded-lg text-xs">
                        <p>📍 Jarak: {distance.toFixed(2)} km</p>
                        <p className="font-semibold text-emerald-600">💰 Ongkir: Rp {shippingCost.toLocaleString("id-ID")} (Rp 1.000/km)</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-[#f8fafc] rounded-3xl p-5 mb-6">
                  <div className="flex items-center gap-2 mb-4"><CreditCard className="w-5 h-5 text-emerald-500" /><h3 className="font-bold text-gray-900">Pembayaran</h3></div>
                  <div className="bg-white rounded-2xl p-4 border border-emerald-100 flex justify-between items-center">
                    <div><p className="font-semibold text-gray-900">Midtrans Payment</p><p className="text-xs text-gray-400">QRIS, VA, Transfer, E-Wallet</p></div>
                    <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between"><span className="text-gray-500">Total Barang</span><span className="font-bold text-gray-900">{cart.length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal Sewa</span><span className="font-bold text-gray-900">Rp {getSelectedTotal.toLocaleString("id-ID")}</span></div>
                  {getSelectedDepositTotal > 0 && (<div className="flex justify-between"><span className="text-gray-500">Total Deposit (Refundable)</span><span className="font-semibold text-gray-700">Rp {getSelectedDepositTotal.toLocaleString("id-ID")}</span></div>)}
                  {deliveryMethod === 'delivery' && shippingCost > 0 && (<div className="flex justify-between"><span className="text-gray-500">Ongkir (Rp 1.000/km)</span><span className="font-semibold text-gray-700">Rp {shippingCost.toLocaleString("id-ID")}</span></div>)}
                  <div className="border-t pt-4 flex justify-between items-center"><span className="text-lg font-black text-gray-900">Total</span><span className="text-3xl font-black text-emerald-500">Rp {grandTotal.toLocaleString("id-ID")}</span></div>
                </div>

                <button onClick={handleCheckout} disabled={processing || !isAnySelected} className="w-full mt-8 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2">
                  {processing ? <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</> : <>Checkout Sekarang <ArrowRight className="w-5 h-5" /></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <KtpVerificationModal isOpen={isKtpModalOpen} onClose={() => setIsKtpModalOpen(false)} status={user?.verification_status} />

      {/* MODAL NOTIFICATION */}
      {notificationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-3xl max-w-md w-full mx-4 overflow-hidden shadow-2xl">
            <div className={`p-6 ${notificationModal.type === 'success' ? 'bg-green-50' : notificationModal.type === 'error' ? 'bg-red-50' : 'bg-blue-50'}`}>
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${
                  notificationModal.type === 'success' ? 'bg-green-100' : 
                  notificationModal.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  {notificationModal.type === 'success' && <CheckCircle className="w-6 h-6 text-green-600" />}
                  {notificationModal.type === 'error' && <XCircle className="w-6 h-6 text-red-600" />}
                  {notificationModal.type === 'info' && <Info className="w-6 h-6 text-blue-600" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">{notificationModal.title}</h3>
                  <p className="text-gray-600 text-sm mt-1 whitespace-pre-line">{notificationModal.message}</p>
                </div>
                <button 
                  onClick={() => setNotificationModal(prev => ({ ...prev, isOpen: false }))}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => setNotificationModal(prev => ({ ...prev, isOpen: false }))}
                className={`mt-4 w-full py-2 rounded-xl font-semibold text-sm transition ${
                  notificationModal.type === 'success' ? 'bg-green-500 hover:bg-green-600 text-white' :
                  notificationModal.type === 'error' ? 'bg-red-500 hover:bg-red-600 text-white' :
                  'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}