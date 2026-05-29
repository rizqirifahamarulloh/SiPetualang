import { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, Search, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL, BASE_URL } from '@/services/api';
import { cartService } from '@/features/customer/services/cartService';
import { useAuth } from '@/contexts/AuthContext';

import Navbar from '@/features/landing/components/Navbar';
import Footer from '@/features/landing/components/Footer';
import KatalogProduk from '@/features/landing/components/KatalogProduk';

import '@/features/landing/landing.css';
import bannerBg from '@/assets/sewaalat/banner BG.png';

// Daftar Destinasi (bisa diambil dari API nanti)
// DAFTAR DESTINASI WISATA INDONESIA (100+)
const DESTINATIONS = [
  // JAWA TIMUR
  { id: 1, name: 'Gunung Bromo', location: 'Probolinggo, Jawa Timur', keywords: ['bromo', 'gunung bromo'] },
  { id: 2, name: 'Gunung Semeru', location: 'Lumajang, Jawa Timur', keywords: ['semeru', 'mahameru'] },
  { id: 3, name: 'Gunung Ijen', location: 'Banyuwangi, Jawa Timur', keywords: ['ijen', 'kawah ijen'] },
  { id: 4, name: 'Gunung Kawi', location: 'Malang, Jawa Timur', keywords: ['kawi', 'gunung kawi'] },
  { id: 5, name: 'Gunung Arjuno', location: 'Pasuruan, Jawa Timur', keywords: ['arjuno', 'gunung arjuno'] },
  { id: 6, name: 'Gunung Welirang', location: 'Pasuruan, Jawa Timur', keywords: ['welirang', 'gunung welirang'] },
  { id: 7, name: 'Gunung Penanggungan', location: 'Mojokerto, Jawa Timur', keywords: ['penanggungan'] },
  { id: 8, name: 'Ranu Kumbolo', location: 'Lumajang, Jawa Timur', keywords: ['ranu', 'kumbolo'] },
  { id: 9, name: 'Ranu Pani', location: 'Lumajang, Jawa Timur', keywords: ['ranu pani'] },
  { id: 10, name: 'Ranu Regulo', location: 'Lumajang, Jawa Timur', keywords: ['ranu regulo'] },
  { id: 11, name: 'Tumpak Sewu', location: 'Lumajang, Jawa Timur', keywords: ['tumpak sewu', 'air terjun'] },
  { id: 12, name: 'Madakaripura', location: 'Probolinggo, Jawa Timur', keywords: ['madakaripura', 'air terjun'] },
  { id: 13, name: 'Pantai Balekambang', location: 'Malang, Jawa Timur', keywords: ['balekambang'] },
  { id: 14, name: 'Pantai Goa Cina', location: 'Malang, Jawa Timur', keywords: ['goa cina'] },
  { id: 15, name: 'Pantai Teluk Asmara', location: 'Malang, Jawa Timur', keywords: ['teluk asmara'] },

  // JAWA TENGAH
  { id: 16, name: 'Gunung Merapi', location: 'Yogyakarta/Jawa Tengah', keywords: ['merapi', 'gunung merapi'] },
  { id: 17, name: 'Gunung Merbabu', location: 'Boyolali, Jawa Tengah', keywords: ['merbabu', 'gunung merbabu'] },
  { id: 18, name: 'Gunung Lawu', location: 'Karanganyar, Jawa Tengah', keywords: ['lawu', 'gunung lawu'] },
  { id: 19, name: 'Gunung Slamet', location: 'Banyumas, Jawa Tengah', keywords: ['slamet', 'gunung slamet'] },
  { id: 20, name: 'Gunung Sindoro', location: 'Temanggung, Jawa Tengah', keywords: ['sindoro', 'gunung sindoro'] },
  { id: 21, name: 'Gunung Sumbing', location: 'Temanggung, Jawa Tengah', keywords: ['sumbing', 'gunung sumbing'] },
  { id: 22, name: 'Gunung Prau', location: 'Wonosobo, Jawa Tengah', keywords: ['prau', 'gunung prau'] },
  { id: 23, name: 'Gunung Andong', location: 'Magelang, Jawa Tengah', keywords: ['andong', 'gunung andong'] },
  { id: 24, name: 'Gunung Ungaran', location: 'Semarang, Jawa Tengah', keywords: ['ungaran', 'gunung ungaran'] },
  { id: 25, name: 'Gunung Telomoyo', location: 'Magelang, Jawa Tengah', keywords: ['telomoyo'] },
  { id: 26, name: 'Dieng Plateau', location: 'Wonosobo, Jawa Tengah', keywords: ['dieng', 'plateau'] },
  { id: 27, name: 'Kawah Sikidang', location: 'Dieng, Jawa Tengah', keywords: ['sikidang'] },
  { id: 28, name: 'Telaga Warna', location: 'Dieng, Jawa Tengah', keywords: ['telaga warna'] },
  { id: 29, name: 'Candi Borobudur', location: 'Magelang, Jawa Tengah', keywords: ['borobudur'] },
  { id: 30, name: 'Candi Prambanan', location: 'Yogyakarta', keywords: ['prambanan'] },
  { id: 31, name: 'Pantai Parangtritis', location: 'Yogyakarta', keywords: ['parangtritis'] },
  { id: 32, name: 'Pantai Indrayanti', location: 'Gunungkidul, Jogja', keywords: ['indrayanti'] },
  { id: 33, name: 'Pantai Ngobaran', location: 'Gunungkidul, Jogja', keywords: ['ngobaran'] },
  { id: 34, name: 'Pantai Wediombo', location: 'Gunungkidul, Jogja', keywords: ['wediombo'] },
  { id: 35, name: 'Pantai Sadranan', location: 'Gunungkidul, Jogja', keywords: ['sadranan'] },
  { id: 36, name: 'Pantai Siung', location: 'Gunungkidul, Jogja', keywords: ['siung'] },

  // JAWA BARAT
  { id: 37, name: 'Gunung Gede Pangrango', location: 'Bogor, Jawa Barat', keywords: ['gede', 'pangrango'] },
  { id: 38, name: 'Gunung Ciremai', location: 'Kuningan, Jawa Barat', keywords: ['ciremai', 'gunung ciremai'] },
  { id: 39, name: 'Gunung Papandayan', location: 'Garut, Jawa Barat', keywords: ['papandayan'] },
  { id: 40, name: 'Gunung Galunggung', location: 'Tasikmalaya, Jawa Barat', keywords: ['galunggung'] },
  { id: 41, name: 'Gunung Tangkuban Perahu', location: 'Bandung, Jawa Barat', keywords: ['tangkuban perahu'] },
  { id: 42, name: 'Gunung Patuha', location: 'Bandung, Jawa Barat', keywords: ['patuha'] },
  { id: 43, name: 'Kawah Putih', location: 'Ciwidey, Bandung', keywords: ['kawah putih'] },
  { id: 44, name: 'Situ Patenggang', location: 'Ciwidey, Bandung', keywords: ['situ patenggang'] },
  { id: 45, name: 'Ranca Upas', location: 'Ciwidey, Bandung', keywords: ['ranca upas'] },
  { id: 46, name: 'Gunung Karang', location: 'Pandeglang, Banten', keywords: ['karang', 'gunung karang'] },
  { id: 47, name: 'Pantai Pangumbahan', location: 'Sukabumi, Jawa Barat', keywords: ['pangumbahan'] },
  { id: 48, name: 'Pantai Pelabuhan Ratu', location: 'Sukabumi, Jawa Barat', keywords: ['pelabuhan ratu'] },
  { id: 49, name: 'Pantai Carita', location: 'Pandeglang, Banten', keywords: ['carita'] },
  { id: 50, name: 'Pantai Anyer', location: 'Banten', keywords: ['anyer'] },
  { id: 51, name: 'Ujung Genteng', location: 'Sukabumi, Jawa Barat', keywords: ['ujung genteng'] },

  // BALI & NUSA TENGGARA
  { id: 52, name: 'Gunung Agung', location: 'Bali', keywords: ['agung', 'gunung agung'] },
  { id: 53, name: 'Gunung Batur', location: 'Kintamani, Bali', keywords: ['batur', 'gunung batur'] },
  { id: 54, name: 'Gunung Rinjani', location: 'Lombok, NTB', keywords: ['rinjani', 'gunung rinjani'] },
  { id: 55, name: 'Gunung Tambora', location: 'Sumbawa, NTB', keywords: ['tambora'] },
  { id: 56, name: 'Gunung Kelimutu', location: 'Flores, NTT', keywords: ['kelimutu'] },
  { id: 57, name: 'Pantai Kuta', location: 'Bali', keywords: ['kuta'] },
  { id: 58, name: 'Pantai Sanur', location: 'Bali', keywords: ['sanur'] },
  { id: 59, name: 'Pantai Nusa Dua', location: 'Bali', keywords: ['nusa dua'] },
  { id: 60, name: 'Pantai Padang Padang', location: 'Bali', keywords: ['padang padang'] },
  { id: 61, name: 'Pantai Dreamland', location: 'Bali', keywords: ['dreamland'] },
  { id: 62, name: 'Pantai Tanjung Tinggi', location: 'Belitung', keywords: ['tanjung tinggi'] },
  { id: 63, name: 'Pantai Tanjung Kelayang', location: 'Belitung', keywords: ['kelayang'] },
  { id: 64, name: 'Pink Beach', location: 'Komodo, NTT', keywords: ['pink beach'] },
  { id: 65, name: 'Pulau Komodo', location: 'NTT', keywords: ['komodo'] },
  { id: 66, name: 'Pulau Padar', location: 'NTT', keywords: ['padar'] },
  { id: 67, name: 'Danau Toba', location: 'Medan, Sumut', keywords: ['toba', 'danau toba'] },
  { id: 68, name: 'Pulau Samosir', location: 'Danau Toba', keywords: ['samosir'] },

  // SUMATRA
  { id: 69, name: 'Gunung Kerinci', location: 'Jambi, Sumatra', keywords: ['kerinci', 'gunung kerinci'] },
  { id: 70, name: 'Gunung Sinabung', location: 'Karo, Sumut', keywords: ['sinabung'] },
  { id: 71, name: 'Gunung Sibayak', location: 'Karo, Sumut', keywords: ['sibayak'] },
  { id: 72, name: 'Danau Maninjau', location: 'Agam, Sumbar', keywords: ['maninjau'] },
  { id: 73, name: 'Danau Singkarak', location: 'Sumbar', keywords: ['singkarak'] },
  { id: 74, name: 'Ngarai Sianok', location: 'Bukittinggi, Sumbar', keywords: ['sianok'] },
  { id: 75, name: 'Pantai Air Manis', location: 'Padang, Sumbar', keywords: ['air manis'] },
  { id: 76, name: 'Pantai Pangandaran', location: 'Jabar', keywords: ['pangandaran'] },
  { id: 77, name: 'Pantai Batu Hiu', location: 'Pangandaran', keywords: ['batu hiu'] },
  { id: 78, name: 'Pantai Karang Bolong', location: 'Pangandaran', keywords: ['karang bolong'] },
  { id: 79, name: 'Green Canyon', location: 'Pangandaran', keywords: ['green canyon'] },
  { id: 80, name: 'Gunung Puntang', location: 'Bandung', keywords: ['puntang'] },
  { id: 81, name: 'Orchid Forest Cikole', location: 'Lembang', keywords: ['orchid forest'] },
  { id: 82, name: 'Floating Market', location: 'Lembang', keywords: ['floating market'] },
  { id: 83, name: 'Dusun Bambu', location: 'Bandung', keywords: ['dusun bambu'] },
  { id: 84, name: 'Taman Safari', location: 'Bogor', keywords: ['safari'] },
  { id: 85, name: 'Kebun Raya Bogor', location: 'Bogor', keywords: ['kebun raya'] },
  { id: 86, name: 'Puncak Pass', location: 'Bogor', keywords: ['puncak'] },
  { id: 87, name: 'Taman Bunga Nusantara', location: 'Puncak', keywords: ['taman bunga'] },
  { id: 88, name: 'Gunung Halimun', location: 'Bogor', keywords: ['halimun'] },
  { id: 89, name: 'Pantai Karang Hawu', location: 'Sukabumi', keywords: ['karang hawu'] },
  { id: 90, name: 'Curug Cimarinjung', location: 'Sukabumi', keywords: ['cimarinjung'] },
  { id: 91, name: 'Curug Cikaso', location: 'Sukabumi', keywords: ['cikaso'] },
  { id: 92, name: 'Curug Bugbrug', location: 'Sukabumi', keywords: ['bugbrug'] },
  { id: 93, name: 'Curug Cilember', location: 'Bogor', keywords: ['cilember'] },
  { id: 94, name: 'Curug Leuwi Hejo', location: 'Bogor', keywords: ['leuwi hejo'] },
  { id: 95, name: 'Curug Cibaliung', location: 'Pandeglang', keywords: ['cibaliung'] },
  { id: 96, name: 'Curug Gendang', location: 'Pandeglang', keywords: ['gendang'] },
  { id: 97, name: 'Curug Ciherang', location: 'Bogor', keywords: ['ciherang'] },
  { id: 98, name: 'Curug Cibeureum', location: 'Bogor', keywords: ['cibeureum'] },
  { id: 99, name: 'Kepulauan Seribu', location: 'Jakarta', keywords: ['kepulauan seribu'] },
  { id: 100, name: 'Pulau Pramuka', location: 'Kepulauan Seribu', keywords: ['pramuka'] },

];

export default function SewaAlat() {
  const { isAuthenticated } = useAuth();
  const [barangList, setBarangList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // FILTER STATES
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('');

  // DESTINASI STATES (BARU)
  const [destinasiSearch, setDestinasiSearch] = useState('');
  const [showDestinasiDropdown, setShowDestinasiDropdown] = useState(false);
  const [selectedDestinasi, setSelectedDestinasi] = useState(null);
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [durasi, setDurasi] = useState(1);
  const [recommendedGears, setRecommendedGears] = useState([]);

  // CART STATE
  const [cartItems, setCartItems] = useState([]);

  // Filter destinasi berdasarkan pencarian
  const filteredDestinations = useMemo(() => {
    if (!destinasiSearch) return [];
    return DESTINATIONS.filter(dest =>
      dest.name.toLowerCase().includes(destinasiSearch.toLowerCase()) ||
      dest.location.toLowerCase().includes(destinasiSearch.toLowerCase())
    );
  }, [destinasiSearch]);

  // Hitung tanggal kembali
  const tanggalKembali = useMemo(() => {
    if (!tanggalMulai) return '';
    const date = new Date(tanggalMulai);
    date.setDate(date.getDate() + durasi);
    return date.toISOString().split('T')[0];
  }, [tanggalMulai, durasi]);

  // FETCH BARANG
  const fetchBarang = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/rental/barang`);
      if (response.data && Array.isArray(response.data)) {
        setBarangList(response.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // FETCH KATEGORI
  const fetchKategori = async () => {
    try {
      const response = await axios.get(`${API_URL}/kategori`);
      if (response.data && Array.isArray(response.data)) {
        setKategoriList(response.data);
      }
    } catch (err) {
      console.error(err);
      setKategoriList([
        { id_kategori: 1, nama_kategori: 'Alat Camping' },
        { id_kategori: 2, nama_kategori: 'Perlengkapan Outdoor' },
        { id_kategori: 3, nama_kategori: 'Elektronik' },
      ]);
    }
  };

  // LOAD CART dari localStorage
  const loadCart = useCallback(async () => {
    try {
      const response = await cartService.getCart();
      setCartItems(response.data || []);
    } catch (err) {
      console.error('Gagal load cart:', err);
    }
  }, []);

  // LOAD DATA
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchBarang(), fetchKategori()]);
      loadCart();
    };
    loadData();
  }, [loadCart]);

  // Pilih destinasi
  const handleSelectDestinasi = (destinasi) => {
    setSelectedDestinasi(destinasi);
    setDestinasiSearch(destinasi.name);
    setShowDestinasiDropdown(false);

    // Rekomendasi alat berdasarkan destinasi
    const gearMapping = {
      'Gunung Ijen': ['Tenda', 'Sleeping Bag', 'Headlamp', 'Jaket Gunung', 'Trekking Pole'],
      'Gunung Bromo': ['Jaket Tebal', 'Masker', 'Sarung Tangan', 'Tenda'],
      'Pantai Kuta': ['Matras', 'Payung Pantai', 'Cooler Box', 'Kursi Lipat'],
      'Ranu Kumbolo': ['Tenda', 'Sleeping Bag', 'Kompor Portable', 'Matras'],
      'Hutan Pinus Pengger': ['Matras', 'Kursi Lipat', 'Power Bank', 'Tenda'],
      'Kawah Putih': ['Jaket', 'Masker', 'Kamera', 'Trekking Pole'],
    };

    const keywords = gearMapping[destinasi.name] || [];
    const filtered = barangList.filter(barang =>
      keywords.some(keyword => barang.nama_barang.includes(keyword))
    );
    setRecommendedGears(filtered);
  };

  // Filter barang (dari search + kategori + rekomendasi destinasi)
  const filteredBarang = useMemo(() => {
    let filtered = [...barangList];

    // Filter by rekomendasi destinasi (jika ada)
    if (recommendedGears.length > 0) {
      filtered = recommendedGears;
    }

    // Filter by search term
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter((barang) =>
        barang.nama_barang.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by kategori
    if (selectedKategori !== '') {
      filtered = filtered.filter(
        (barang) => barang.id_kategori === parseInt(selectedKategori)
      );
    }

    return filtered;
  }, [barangList, searchTerm, selectedKategori, recommendedGears]);

  // Cari rekomendasi alat berdasarkan destinasi + filter
  const handleSearchDestinasi = () => {
    if (!selectedDestinasi) {
      alert('Pilih destinasi terlebih dahulu');
      return;
    }
    if (!tanggalMulai) {
      alert('Pilih tanggal ambil');
      return;
    }

    // Sudah otomatis filter via useEffect, tinggal scroll ke katalog
    document.getElementById('katalog-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const getImageUrl = (barang) => {
    if (barang.foto_barang) {
      if (barang.foto_barang.startsWith('http')) return barang.foto_barang;
      return `${BASE_URL}/storage/${barang.foto_barang}`;
    }
    return 'https://via.placeholder.com/400x300';
  };

  // CART HANDLERS
  const handleAddToCart = async (barang) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const nextDay = new Date();
      nextDay.setDate(nextDay.getDate() + 1);
      const tomorrow = nextDay.toISOString().split('T')[0];

      const startDate = tanggalMulai || today;
      const endDate = tanggalMulai 
        ? (new Date(new Date(tanggalMulai).getTime() + durasi * 86400000)).toISOString().split('T')[0] 
        : tomorrow;

      // Hitung total hari dari selisih tanggal (inklusif)
      const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;

      const cartItem = {
        id_cart: Date.now(),
        id_barang: barang.id_barang,
        nama_barang: barang.nama_barang,
        harga_sewa: barang.harga_sewa,
        nominal_deposit: barang.nominal_deposit || 0,
        jumlah: 1,
        tanggal_mulai: startDate,
        tanggal_selesai: endDate,
        total_hari: daysDiff,
        total_harga: Number(barang.harga_sewa) * 1 * daysDiff,
        foto_barang: barang.foto_barang,
        pemilik: barang.pemilik,
        id_pemilik: barang.id_pemilik,
      };

      const result = await cartService.addToCart(cartItem);

      if (result.alreadyExists) {
        // Barang sudah ada di keranjang, tidak ditambahkan lagi
        return;
      }

      await loadCart();
    } catch (err) {
      console.error('Gagal menambahkan ke keranjang:', err);
    }
  };

  const handleRemoveFromCart = async (cartId) => {
    try {
      await cartService.removeFromCart(cartId);
      await loadCart();
    } catch (err) {
      console.error('Gagal menghapus dari keranjang:', err);
    }
  };

  const handleUpdateQuantity = async (cartId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await cartService.updateCartItem(cartId, { jumlah: newQuantity });
      await loadCart();
    } catch (err) {
      console.error('Gagal update jumlah:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="landing-scrollbar bg-white min-h-screen font-sans antialiased">
      <Navbar />

      {/* HERO SECTION */}
      <section
        id="hero-sewa"
        className="relative w-full bg-white"
        style={{ padding: '16px 16px 0 16px' }}
      >
        <div className="relative w-full">
          {/* Image container */}
          <div className="relative w-full h-[300px] md:h-[600px] rounded-[16px] md:rounded-[24px] overflow-hidden">
            <img
              src={bannerBg}
              alt="Shop Banner Background"
              className="w-full h-full object-cover object-center block"
            />
            <div className="absolute inset-0 bg-black/10 pointer-events-none" />
            <div className="absolute inset-0 z-[1] flex items-center justify-center">
              <h1 className="text-[40px] md:text-[60px] font-extrabold text-white leading-none tracking-tight select-none text-center" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
                Our Shop
              </h1>
            </div>
          </div>
          {/* Breadcrumb — outside overflow-hidden so curves aren't clipped */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10 flex items-end">
            {/* Left inverted curve */}
            <div className="w-[20px] h-[20px] bg-transparent" style={{ boxShadow: '8px 8px 0 8px white', borderRadius: '0 0 16px 0' }} />
            <div className="bg-white px-12 py-3 rounded-t-[18px]">
              <div className="flex items-center gap-2 text-[13px] font-medium text-gray-400 whitespace-nowrap">
                <Link to="/" className="hover:text-emerald-500 transition-colors no-underline text-gray-400">
                  Home
                </Link>
                <span className="text-gray-300 font-light">&gt;</span>
                <span className="text-gray-700 font-semibold">Sewa Alat</span>
              </div>
            </div>
            {/* Right inverted curve */}
            <div className="w-[20px] h-[20px] bg-transparent" style={{ boxShadow: '-8px 8px 0 8px white', borderRadius: '0 0 0 16px' }} />
          </div>
        </div>
      </section>

      {/* FILTER PANEL - DENGAN DESTINASI REAL-TIME */}
      <section className="w-full max-w-[1200px] mx-auto px-6 mt-8 relative z-20">
        <div className="bg-white rounded-[24px] p-4 shadow-[0_15px_40px_rgba(0,0,0,0.04)] border border-gray-100">
          <div className="border border-gray-200/80 rounded-[20px] p-5 md:py-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">

              {/* DESTINASI - DROPDOWN SEARCH */}
              <div className="md:col-span-3 flex flex-col gap-1.5 border-r border-gray-200 pr-4 relative">
                <label className="text-[11px] font-bold text-gray-500 tracking-wide">
                  Destinasi
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari destinasi ...."
                    value={destinasiSearch}
                    onChange={(e) => {
                      setDestinasiSearch(e.target.value);
                      setShowDestinasiDropdown(true);
                      setSelectedDestinasi(null);
                    }}
                    onFocus={() => setShowDestinasiDropdown(true)}
                    className="w-full bg-transparent border-0 p-0 text-xs font-bold text-gray-800 placeholder-gray-400 focus:ring-0 focus:outline-none"
                  />
                  {showDestinasiDropdown && destinasiSearch && filteredDestinations.length > 0 && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-60 overflow-y-auto">
                      {filteredDestinations.map(dest => (
                        <div
                          key={dest.id}
                          onClick={() => handleSelectDestinasi(dest)}
                          className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-2 border-b last:border-0"
                        >
                          <MapPin className="w-4 h-4 text-emerald-500" />
                          <div>
                            <p className="font-semibold text-sm">{dest.name}</p>
                            <p className="text-xs text-gray-500">{dest.location}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedDestinasi && (
                  <p className="text-[10px] text-emerald-600 mt-1">
                    ✓ {selectedDestinasi.name}, {selectedDestinasi.location}
                  </p>
                )}
              </div>

              {/* TGL AMBIL */}
              <div className="md:col-span-3 flex flex-col gap-1.5 border-r border-gray-200 px-4">
                <label className="text-[11px] font-bold text-gray-500 tracking-wide">
                  Tgl Ambil
                </label>
                <input
                  type="date"
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="text-xs font-bold text-gray-800 border-0 p-0 focus:ring-0"
                />
              </div>

              {/* DURASI */}
              <div className="md:col-span-2 flex flex-col gap-1.5 border-r border-gray-200 px-4">
                <label className="text-[11px] font-bold text-gray-500 tracking-wide">
                  Durasi
                </label>
                <select
                  value={durasi}
                  onChange={(e) => setDurasi(parseInt(e.target.value))}
                  className="text-xs font-bold text-gray-800 border-0 p-0 bg-transparent focus:ring-0"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(d => (
                    <option key={d} value={d}>{d} hari</option>
                  ))}
                </select>
              </div>

              {/* PENGEMBALIAN */}
              <div className="md:col-span-2 flex flex-col gap-1.5 px-4">
                <label className="text-[11px] font-bold text-gray-500 tracking-wide">
                  Maks. Pengembalian
                </label>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{tanggalKembali || 'Pilih tanggal'}</span>
                </div>
              </div>

              {/* BUTTON CARI */}
              <div className="md:col-span-2 flex justify-end pl-2">
                <button
                  onClick={handleSearchDestinasi}
                  className="w-full bg-[#00A779] hover:bg-[#008f68] text-white font-bold text-xs py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] shadow-sm"
                >
                  <Search className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Cari Alat</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* REKOMENDASI DESTINASI (jika ada) */}
      {selectedDestinasi && recommendedGears.length > 0 && (
        <div className="max-w-[1200px] mx-auto px-6 mt-6">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
            <p className="text-sm font-semibold text-emerald-700">
              🏕️ Rekomendasi untuk {selectedDestinasi.name}:
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Berdasarkan destinasi yang dipilih, kami rekomendasikan {recommendedGears.length} perlengkapan berikut
            </p>
          </div>
        </div>
      )}

      {/* KATALOG PRODUK */}
      <div id="katalog-section">
        <KatalogProduk
          filteredBarang={filteredBarang}
          kategoriList={kategoriList}
          selectedKategori={selectedKategori}
          setSelectedKategori={setSelectedKategori}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          getImageUrl={getImageUrl}
          cartItems={cartItems}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
          onUpdateQuantity={handleUpdateQuantity}
          isAuthenticated={isAuthenticated}
        />
      </div>

      <Footer />
    </div>
  );
}