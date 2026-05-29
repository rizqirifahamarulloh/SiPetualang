import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { chatService } from '@/features/customer/services/chatService';
import Navbar from '@/features/landing/components/Navbar';
import Footer from '@/features/landing/components/Footer';
import { API_URL, BASE_URL } from '@/services/api';


import {
  Store,
  MapPin,
  MessageCircle,
  Package,
  Filter,
  X,
  ArrowLeft,
  Star,
  ShieldCheck,
  Boxes,
  TrendingUp,
} from 'lucide-react';

export default function TokoPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pemilik, setPemilik] = useState(null);
  const [produkList, setProdukList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [selectedKategori, setSelectedKategori] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState('');

  // =========================
// FETCH DATA
// =========================
useEffect(() => {
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [pemilikRes, produkRes] = await Promise.all([
        axios.get(`${API_URL}/toko/pengguna/${id}`),
        axios.get(`${API_URL}/toko/barang/${id}`),
      ]);

      const pemilikData = pemilikRes.data.data || pemilikRes.data;
      const produkData = produkRes.data.data || produkRes.data || [];

      setPemilik(pemilikData);
      setProdukList(produkData);

      // kategori unik
      const kategoriMap = {};

      produkData.forEach((item) => {
        if (
          item.kategori &&
          !kategoriMap[item.kategori.id_kategori]
        ) {
          kategoriMap[item.kategori.id_kategori] = item.kategori;
        }
      });

      setKategoriList(Object.values(kategoriMap));
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data toko');
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, [id]); // ✅ hanya depends on id

  // =========================
  // FILTER PRODUK
  // =========================
  const filteredProduk = useMemo(() => {
    let result = produkList;

    if (selectedKategori) {
      result = result.filter(
        (item) =>
          item.kategori?.id_kategori ===
          parseInt(selectedKategori)
      );
    }

    if (sortBy === 'paling_laku') {
      result = [...result].sort((a, b) => (b.total_disewa || 0) - (a.total_disewa || 0));
    } else if (sortBy === 'harga_termurah') {
      result = [...result].sort((a, b) => Number(a.harga_sewa) - Number(b.harga_sewa));
    } else if (sortBy === 'harga_termahal') {
      result = [...result].sort((a, b) => Number(b.harga_sewa) - Number(a.harga_sewa));
    }

    return result;
  }, [produkList, selectedKategori, sortBy]);

  // =========================
  // CHAT
  // =========================
  const startChat = async () => {
    if (!user) {
      alert('Silakan login terlebih dahulu');
      navigate('/login');
      return;
    }

    if (user.id_pengguna === parseInt(id)) {
      alert('Tidak bisa chat dengan akun sendiri');
      return;
    }

    try {
      const response =
        await chatService.getOrCreateConversation(
          parseInt(id)
        );

      const conversationId =
        response.data.id_conversation;

      const pesanAwal =
        'Halo, saya tertarik dengan produk di toko Anda.';

      await chatService.sendMessage(
        conversationId,
        pesanAwal
      );

      navigate('/customer/chat');
    } catch (err) {
      console.error(err);
      alert('Gagal memulai chat');
    }
  };

  // =========================
  // IMAGE
  // =========================
  const getImageUrl = (foto) => {
    if (!foto)
      return 'https://via.placeholder.com/600x400?text=No+Image';

    if (foto.startsWith('http')) return foto;

    return `${BASE_URL}/storage/${foto}`;
  };

  // =========================
  // LOADING
  // =========================
  if (isLoading) {
    return (
      <div className="bg-[#f8fafc] min-h-screen">
        <Navbar forceScrolled={true} />

        <div className="pt-40 flex justify-center items-center">
          <div className="text-center">
            <div className="w-14 h-14 border-[5px] border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-5"></div>

            <p className="text-gray-500 font-medium">
              Memuat toko...
            </p>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================
  if (error || !pemilik) {
    return (
      <div className="bg-[#f8fafc] min-h-screen">
        <Navbar forceScrolled={true} />

        <div className="pt-40 flex justify-center items-center px-4">
          <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 text-center max-w-md w-full">
            <h2 className="text-2xl font-black text-gray-800 mb-3">
              Toko Tidak Ditemukan
            </h2>

            <p className="text-gray-500 mb-6">
              {error || 'Data toko gagal dimuat'}
            </p>

            <Link
              to="/sewa-alat"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl font-semibold transition no-underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen overflow-x-hidden">
      <Navbar forceScrolled={true} />

      <main className="container mx-auto px-4 pt-32 pb-20">
        {/* BACK */}
        <Link
          to="/sewa-alat"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-emerald-500 transition mb-7 no-underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Rental
        </Link>

        {/* HERO TOKO */}
        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-8 lg:p-10 text-white shadow-xl mb-10">
          <div className="absolute top-0 right-0 opacity-10">
            <Store className="w-72 h-72" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex flex-col sm:flex-row gap-5">
              {/* AVATAR */}
              <div className="w-28 h-28 rounded-3xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
                <Store className="w-14 h-14 text-white" />
              </div>

              {/* INFO */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-white/15 border border-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                    VERIFIED STORE
                  </span>

                  <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    TOP RENTAL
                  </span>
                </div>

                <h1 className="text-3xl lg:text-5xl font-black tracking-tight">
                  {pemilik.nama}
                </h1>

                <div className="flex flex-wrap gap-4 mt-4 text-sm text-white/90">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {pemilik.kota ||
                      'Lokasi belum tersedia'}
                  </div>

                  <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4" />
                    {produkList.length} Produk
                  </div>

                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Rental Aman
                  </div>
                </div>

                <p className="mt-5 text-white/80 max-w-2xl leading-relaxed">
                  {pemilik.alamat ||
                    'Pemilik belum mengisi alamat lengkap toko.'}
                </p>
              </div>
            </div>

            {/* BUTTON */}
            {user &&
              user.id_pengguna !==
                pemilik.id_pengguna && (
                <button
                  onClick={startChat}
                  className="bg-white text-emerald-700 hover:bg-emerald-50 transition px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg"
                >
                  <MessageCircle className="w-5 h-5" />
                  Hubungi Penjual
                </button>
              )}
          </div>
        </section>

        {/* FILTER */}
        <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900">
              Produk Rental
            </h2>

            <p className="text-gray-500 mt-1">
              Jelajahi perlengkapan terbaik dari toko ini
            </p>
          </div>

          {kategoriList.length > 0 && (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  setShowFilter(!showFilter)
                }
                className="bg-white border border-gray-200 hover:border-emerald-400 hover:text-emerald-600 transition px-5 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-sm"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>

              {(selectedKategori || sortBy) && (
                <button
                  onClick={() => {
                    setSelectedKategori('');
                    setSortBy('');
                  }}
                  className="bg-red-50 text-red-500 hover:bg-red-100 transition px-5 py-3 rounded-2xl font-semibold flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Reset
                </button>
              )}
            </div>
          )}
        </section>

        {/* FILTER PANEL */}
        {showFilter &&
          kategoriList.length > 0 && (
            <section className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-8">
              <h3 className="font-black text-gray-800 mb-4">
                Pilih Kategori
              </h3>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    setSelectedKategori('')
                  }
                  className={`px-5 py-2 rounded-2xl text-sm font-bold transition ${
                    selectedKategori === ''
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Semua
                </button>

                {kategoriList.map((kat) => (
                  <button
                    key={kat.id_kategori}
                    onClick={() =>
                      setSelectedKategori(
                        kat.id_kategori.toString()
                      )
                    }
                    className={`px-5 py-2 rounded-2xl text-sm font-bold transition ${
                      selectedKategori ===
                      kat.id_kategori.toString()
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {kat.nama_kategori}
                  </button>
                ))}
              </div>

              {/* Urutkan */}
              <h3 className="font-black text-gray-800 mb-4 mt-6">
                Urutkan
              </h3>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: '', label: 'Default' },
                  { value: 'paling_laku', label: '🔥 Paling Laku' },
                  { value: 'harga_termurah', label: 'Harga Termurah' },
                  { value: 'harga_termahal', label: 'Harga Termahal' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`px-5 py-2 rounded-2xl text-sm font-bold transition ${
                      sortBy === opt.value
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>
          )}

        {/* EMPTY */}
        {filteredProduk.length === 0 ? (
          <section className="bg-white rounded-[32px] p-16 text-center border border-gray-100 shadow-sm">
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-5" />

            <h3 className="text-2xl font-black text-gray-700">
              Produk Tidak Ditemukan
            </h3>

            <p className="text-gray-500 mt-2">
              Tidak ada produk untuk kategori ini
            </p>
          </section>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
            {filteredProduk.map((produk) => (
              <Link
                key={produk.id_barang}
                to={`/barang/${produk.id_barang}`}
                className="group no-underline"
              >
                <div className="bg-white rounded-[28px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                  {/* IMAGE */}
                  <div className="relative h-64 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    <img
                      src={getImageUrl(
                        produk.foto_barang
                      )}
                      alt={produk.nama_barang}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                      onError={(e) => {
                        e.target.src =
                          'https://via.placeholder.com/600x400?text=No+Image';
                      }}
                    />

                    {/* BADGE */}
                    {produk.jumlah_stok <= 3 &&
                      produk.jumlah_stok > 0 && (
                        <div className="absolute top-4 right-4 bg-amber-400 text-amber-900 text-xs font-black px-3 py-1 rounded-full shadow">
                          Stok Tipis
                        </div>
                      )}

                    {produk.kategori && (
                      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md text-gray-800 text-xs font-bold px-3 py-1 rounded-full">
                        {
                          produk.kategori
                            .nama_kategori
                        }
                      </div>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="p-5">
                    <h3 className="font-black text-lg text-gray-800 line-clamp-1 group-hover:text-emerald-600 transition">
                      {produk.nama_barang}
                    </h3>

                    <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                      {produk.deskripsi ||
                        'Tidak ada deskripsi produk'}
                    </p>

                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <p className="text-emerald-600 font-black text-2xl leading-none">
                          Rp{' '}
                          {Number(
                            produk.harga_sewa
                          ).toLocaleString()}
                        </p>

                        <span className="text-xs text-gray-400 font-medium">
                          /hari
                        </span>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          Stok
                        </p>

                        <p className="font-bold text-gray-700">
                          {produk.jumlah_stok}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}