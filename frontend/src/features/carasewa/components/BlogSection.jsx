import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const accordionItems = [
  {
    title: 'Periksa Ketersediaan Peralatan',
    content: (
      <>
        <p>
          Sebelum melakukan pemesanan, pastikan peralatan yang Kamu butuhkan tersedia pada tanggal yang diinginkan.
        </p>
        <ul>
          <li>Kunjungi halaman katalog dan gunakan fitur pencarian atau filter untuk menemukan alat yang Kamu cari.</li>
          <li>Periksa status ketersediaan dan detail spesifikasi peralatan sebelum menambahkannya ke keranjang.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Pastikan Kamu Telah Terdaftar sebagai Anggota',
    content: (
      <>
        <p>
          Layanan penyewaan hanya tersedia bagi pengguna yang telah menjadi anggota resmi SiPetualang.
        </p>
        <ul>
          <li>Jika Kamu belum memiliki akun, silakan lakukan pendaftaran terlebih dahulu melalui website kami.</li>
          <li>Panduan lengkap mengenai proses registrasi tersedia di laman keanggotaan.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Pilih Barang dan Lakukan Transaksi melalui Website',
    content: (
      <>
        <p>
          Setelah menemukan peralatan yang sesuai, tambahkan ke keranjang dan lanjutkan ke proses checkout.
        </p>
        <ul>
          <li>Tentukan tanggal mulai sewa dan durasi penyewaan sesuai kebutuhan Kamu.</li>
          <li>Selesaikan pembayaran melalui metode yang tersedia untuk mengonfirmasi pesanan.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Pengambilan Peralatan di Lokasi Store',
    content: (
      <>
        <p>
          Setelah pembayaran dikonfirmasi, datangi toko mitra rental sesuai jadwal yang telah ditentukan.
        </p>
        <ul>
          <li>Wajib menyerahkan KTP fisik sebagai jaminan saat pengambilan barang.</li>
          <li>Pastikan Kamu memeriksa kondisi peralatan sebelum membawanya pulang.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Gunakan Peralatan dengan Tanggung Jawab',
    content: (
      <>
        <p>
          Selama masa penyewaan, gunakan peralatan sesuai fungsinya dan rawat dengan baik.
        </p>
        <ul>
          <li>Kerusakan akibat kelalaian akan dikenakan biaya penggantian atau perbaikan.</li>
          <li>Hubungi customer service jika terjadi kendala selama penggunaan.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Pengembalian Peralatan',
    content: (
      <>
        <p>
          Kembalikan peralatan dalam kondisi baik dan bersih ke toko mitra rental sesuai tanggal yang disepakati.
        </p>
        <ul>
          <li>Keterlambatan pengembalian akan dikenakan denda sesuai kebijakan toko mitra.</li>
          <li>Setelah peralatan diperiksa dan dinyatakan baik, KTP jaminan Kamu akan dikembalikan.</li>
        </ul>
      </>
    ),
  },
]

export default function BlogSection() {
  const [activeIndex, setActiveIndex] = useState(1) // Index 1 open by default

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? -1 : index)
  }

  return (
    <div className="cs-blog-section">
      {/* Left Column */}
      <motion.div
        className="cs-blog-left"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <span className="cs-blog-badge">CARA SEWA</span>
        <h2 className="cs-blog-title">
          Panduan Penyewaan Peralatan di SiPetualang
        </h2>
        <p className="cs-blog-desc">
          Sebagai penyedia layanan penyewaan peralatan pendakian dan kegiatan outdoor, SiPetualang berkomitmen memberikan kemudahan dan kenyamanan dalam setiap proses pemesanan. Berikut langkah-langkah yang perlu Kamu ikuti.
        </p>
        <Link to="/sewa-alat" className="cs-blog-cta">
          Mulai Sewa
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
          </svg>
        </Link>
      </motion.div>

      {/* Right Column — Accordion */}
      <motion.div
        className="cs-accordion"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {accordionItems.map((item, index) => (
          <div
            key={index}
            className={`cs-accordion-item ${activeIndex === index ? 'active' : ''}`}
          >
            <button
              className="cs-accordion-header"
              onClick={() => toggleAccordion(index)}
              aria-expanded={activeIndex === index}
            >
              <h3>{item.title}</h3>
              <span className="cs-accordion-icon">
                {activeIndex === index ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                  </svg>
                )}
              </span>
            </button>
            <div className="cs-accordion-body">
              <div className="cs-accordion-content">
                {item.content}
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  )
}
