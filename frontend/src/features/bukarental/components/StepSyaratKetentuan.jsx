import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import SidebarCard from './SidebarCard'

export default function StepSyaratKetentuan({ onNext, onBack }) {
  const [agree1, setAgree1] = useState(false)
  const [agree2, setAgree2] = useState(false)

  const canProceed = agree1 && agree2

  return (
    <div className="flex gap-10 max-lg:flex-col max-lg:gap-8 py-10 px-6 max-w-[1100px] mx-auto">
      {/* Sidebar */}
      <div className="w-[300px] max-lg:w-full flex-shrink-0">
        <SidebarCard />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="br-step-badge">
          <Sparkles size={16} />
          LANGKAH PERTAMA
        </div>

        <h2 className="br-section-title">Syarat & Ketentuan Kemitraan</h2>
        <p className="br-section-desc">
          Bacalah dengan teliti dokumen di bawah ini sebagai dasar kesepakatan kerjasama antara Kamu dan SiPetualang.
        </p>

        {/* S&K Content */}
        <div className="br-sk-content">
          <h4>1. Pendahuluan</h4>
          <p>
            Perjanjian ini mengatur syarat dan ketentuan kemitraan antara pemilik alat outdoor ("Mitra") dan platform SiPetualang. Dengan mendaftar, Kamu menyetujui untuk mematuhi seluruh kebijakan operasional yang ditetapkan.
          </p>

          <h4>2. Kelayakan Inventaris</h4>
          <p>
            Setiap perlengkapan yang didaftarkan wajib dalam kondisi layak pakai, bersih, dan aman. SiPetualang berhak melakukan inspeksi mendadak atau meminta bukti sertifikasi pada alat-alat teknis tertentu (seperti harness atau tali pendakian).
          </p>

          <h4>3. Sistem Bagi Hasil</h4>
          <p>
            SiPetualang menerapkan sistem bagi hasil yang transparan. Mitra akan menerima persentase tertentu dari setiap transaksi penyewaan yang berhasil dilakukan melalui platform. Detail persentase akan diinformasikan setelah proses verifikasi selesai.
          </p>

          <h4>4. Tanggung Jawab Mitra</h4>
          <p>
            Mitra bertanggung jawab untuk memastikan peralatan yang disewakan dalam kondisi aman dan layak pakai. Mitra juga wajib merespons permintaan penyewaan dalam waktu yang wajar dan menjaga komunikasi yang baik dengan penyewa.
          </p>

          <h4>5. Penyelesaian Sengketa</h4>
          <p>
            Apabila terjadi perselisihan, kedua belah pihak sepakat untuk menyelesaikan secara musyawarah terlebih dahulu. Jika tidak tercapai kesepakatan, akan diselesaikan melalui mekanisme yang berlaku sesuai hukum Indonesia.
          </p>
        </div>

        {/* Checkbox Agreements */}
        <label className={`br-checkbox-card ${agree1 ? 'checked' : ''}`}>
          <input
            type="checkbox"
            checked={agree1}
            onChange={(e) => setAgree1(e.target.checked)}
          />
          <div className="br-checkbox-label">
            <strong>Saya telah membaca dan menyetujui seluruh isi Perjanjian Kemitraan.</strong>
            <span>Menandai ini berarti Kamu terikat secara hukum dengan syarat yang berlaku.</span>
          </div>
        </label>

        <label className={`br-checkbox-card ${agree2 ? 'checked' : ''}`}>
          <input
            type="checkbox"
            checked={agree2}
            onChange={(e) => setAgree2(e.target.checked)}
          />
          <div className="br-checkbox-label">
            <strong>Saya menjamin keaslian dan kelayakan alat yang akan disewakan.</strong>
            <span>Kesalahan informasi alat dapat berakibat pada penangguhan akun mitra secara permanen.</span>
          </div>
        </label>

        {/* Navigation */}
        <div className="br-nav-buttons">
          <button className="br-btn-back" onClick={onBack}>
            ← Kembali
          </button>
          <button
            className="br-btn-next"
            disabled={!canProceed}
            onClick={onNext}
          >
            Simpan & Lanjutkan →
          </button>
        </div>
      </div>
    </div>
  )
}
