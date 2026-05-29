import searchIcon from '@/assets/beranda/Icon-Search-Services.svg'
import tagIcon from '@/assets/beranda/Icon-Tag-Service.svg'
import documentIcon from '@/assets/beranda/Icon-Document-Service.svg'
import sendIcon from '@/assets/beranda/Icon-Send-Service.svg'

import cat1 from '@/assets/beranda/Card-Category-1.png'
import cat2 from '@/assets/beranda/Card-Category-2.png'
import cat3 from '@/assets/beranda/Card-Category-3.png'
import cat4 from '@/assets/beranda/Card-Category-4.png'
import cat5 from '@/assets/beranda/Card-Category-5.png'
import cat6 from '@/assets/beranda/Card-Category-6.png'
import cat7 from '@/assets/beranda/Card-Category-7.png'

import brand1 from '@/assets/beranda/Logo-Brand-1.png'
import brand2 from '@/assets/beranda/Logo-Brand-2.png'
import brand3 from '@/assets/beranda/Logo-Brand-3.png'
import brand4 from '@/assets/beranda/Logo-Brand-4.png'
import brand5 from '@/assets/beranda/Logo-Brand-5.png'

import avatar1 from '@/assets/beranda/Avatar1.png'
import avatar2 from '@/assets/beranda/Avatar2.png'
import avatar3 from '@/assets/beranda/Avatar3.png'
import avatar4 from '@/assets/beranda/Avatar4.png'
import avatar5 from '@/assets/beranda/Avatar5.png'

export const navLinks = [
  { label: 'Beranda', href: '#hero' },
  { label: 'Sewa Alat', href: '#category' },
  { label: 'Buka Rental', href: '#buka-rental' },
  { label: 'Cara Sewa', href: '#cara-sewa' },
]

export const steps = [
  {
    icon: searchIcon,
    title: 'Pencarian',
    desc: 'Cari alat favorit Anda dari berbagai kategori dan merek terpercaya.',
  },
  {
    icon: tagIcon,
    title: 'Pemesanan',
    desc: 'Tentukan tanggal mulai dan durasi sewa yang sesuai dengan jadwal Anda.',
  },
  {
    icon: documentIcon,
    title: 'Pengambilan',
    desc: null, // Uses JSX in component (has <span> with red text)
    descText: 'Ambil di toko mitra terdekat.',
    descWarning: 'Wajib menyerahkan KTP fisik sebagai jaminan.',
  },
  {
    icon: sendIcon,
    title: 'Pengembalian',
    desc: 'Kembalikan alat dalam kondisi baik dan ambil kembali KTP Kamu.',
  },
]

export const categories = [
  { image: cat1, title: 'JaketGore tex Waterprof', available: '23 items available', tag: 'Popular' },
  { image: cat2, title: 'Sleeping Bag', available: '42 items available', tag: 'Best Seller' },
  { image: cat3, title: 'Carrier Eiger Escapade 25', available: '15 items available', tag: null },
  { image: cat4, title: 'Tenda Borneo Pro', available: '15 items available', tag: 'New' },
  { image: cat5, title: 'Forester Sepatu Mendaki', available: '10 items available', tag: null },
  { image: cat6, title: 'Trekking Pole', available: '24 items available', tag: null },
  { image: cat7, title: 'Emergency Blanket', available: '50 items available', tag: null },
]

export const brands = [brand1, brand2, brand3, brand4, brand5]

export const testimonials = [
  {
    quote: '"Carrier dan tenda yang saya sewa sangat nyaman digunakan selama 3 hari di Gunung Semeru Harga terjangkau dengan kualitas premium"',
    name: 'Budi Setiawan',
    role: 'Fotografer Alam',
    theme: 'green',
    avatar: avatar1,
  },
  {
    quote: '"Pengalaman pertama sewa di SiPetualang langsung memuaskan Barang diantar tepat waktu dan kondisinya sangat baik Pasti sewa lagi"',
    name: 'Maya Putri',
    role: 'Adventure Enthusiast',
    theme: 'dark',
    avatar: avatar2,
  },
  {
    quote: '"Cooking set dan sleeping bag yang disewakan sangat lengkap Membuat camping jadi lebih nyaman dan menyenangkan Terima kasih SiPetualang"',
    name: 'Riko Firmansyah',
    role: 'Camper',
    theme: 'light',
    avatar: avatar3,
  },
  {
    quote: '"Pelayanan sangat ramah dan proses pengambilan barang super cepat Kondisi carrier masih terlihat baru dan terawat dengan sangat baik"',
    name: 'Dinda Shafira',
    role: 'Pendaki Pemula',
    theme: 'green',
    avatar: avatar4,
  },
  {
    quote: '"Sangat membantu untuk pendakian rombongan Peralatan masak dan tenda kapasitas besar tersedia lengkap Sangat direkomendasikan"',
    name: 'Andi Pratama',
    role: 'Ketua Komunitas',
    theme: 'dark',
    avatar: avatar5,
  },
]
