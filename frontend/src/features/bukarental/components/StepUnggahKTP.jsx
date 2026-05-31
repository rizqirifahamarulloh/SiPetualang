import { useState, useRef, useEffect } from 'react'
import { Sparkles, Camera, Upload, X, CheckCircle2, ShieldCheck } from 'lucide-react'

function UploadBox({ title, subtitle, file, setFile, icon: Icon }) {
  const [preview, setPreview] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result)
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }, [file])

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return
    const validTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif']
    if (!validTypes.includes(selectedFile.type)) {
      alert('Format file tidak didukung. Gunakan JPG, PNG, atau HEIC.')
      return
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB.')
      return
    }
    setFile(selectedFile)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    handleFileSelect(droppedFile)
  }

  return (
    <div className="flex-1 min-w-[280px]">
      <p className="text-sm font-semibold mb-3 text-gray-700">{title}</p>
      <div
        className={`br-upload-zone ${preview ? 'has-file' : ''} ${dragOver ? 'has-file' : ''} min-h-[220px]`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !preview && fileInputRef.current?.click()}
      >
        {preview ? (
          <div className="relative w-full h-full">
            <img src={preview} alt="Preview" className="br-upload-preview object-cover w-full h-[180px] rounded-lg" />
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
              className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center border-none cursor-pointer hover:bg-red-600 transition-colors shadow-md"
            >
              <X size={14} />
            </button>
            <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-green-600 font-medium">
              <CheckCircle2 size={14} />
              Berhasil diunggah
            </div>
          </div>
        ) : (
          <div className="py-4">
            <div className="br-upload-icon mx-auto mb-3">
              <Icon size={20} className="text-gray-400" />
            </div>
            <h5 className="text-sm font-medium mb-1">Klik atau tarik foto</h5>
            <p className="text-[11px] text-gray-400 px-4">{subtitle}</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/heic,image/heif"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files[0])}
        />
      </div>
    </div>
  )
}

export default function StepUnggahKTP({ onNext, onBack, ktpFile, setKtpFile, selfieFile, setSelfieFile, rejectionNote, isAlreadyVerified }) {
  // Jika KTP sudah terverifikasi, tombol langsung aktif tanpa perlu upload
  const canProceed = isAlreadyVerified || (ktpFile && selfieFile)

  return (
    <div className="py-10 px-6 max-w-[850px] mx-auto">
      <div className="br-step-badge">
        <Sparkles size={16} />
        LANGKAH KETIGA
      </div>

      <h2 className="br-section-title">Verifikasi Identitas KTP</h2>
      <p className="br-section-desc">
        KTP diperlukan untuk prosedur keamanan penyewaan alat dan memastikan ekosistem persewaan gear tetap aman bagi semua mitra.
      </p>

      {/* Banner: KTP sudah terverifikasi */}
      {isAlreadyVerified && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 className="text-emerald-800 font-bold text-sm mb-1">KTP Sudah Terverifikasi ✓</h4>
            <p className="text-emerald-700 text-xs leading-relaxed">
              Data KTP Kamu sudah terverifikasi sebelumnya. Kamu tidak perlu mengunggah ulang foto KTP. 
              Langsung klik <strong>"Selesaikan Pendaftaran"</strong> untuk mengaktifkan fitur rental.
            </p>
          </div>
        </div>
      )}

      {rejectionNote && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 shrink-0">
            <X size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-red-800 font-bold text-sm mb-1">Verifikasi KTP Ditolak</h4>
            <p className="text-red-700 text-xs leading-relaxed mb-3">
              Maaf, pengajuan verifikasi Kamu ditolak karena: <strong className="bg-red-100 px-1 rounded">{rejectionNote}</strong>. Silakan unggah ulang foto KTP dan selfie yang lebih jelas sesuai panduan di bawah.
            </p>
          </div>
        </div>
      )}

      {/* Upload Areas — hanya tampil jika belum terverifikasi */}
      {!isAlreadyVerified && (
        <>
          {/* Upload Areas Grid */}
          <div className="flex flex-wrap gap-6 mb-10">
            <UploadBox
              title="Foto KTP Asli"
              subtitle="Pastikan seluruh bagian KTP terbaca jelas dan tidak terpotong."
              file={ktpFile}
              setFile={setKtpFile}
              icon={Camera}
            />
            <UploadBox
              title="Selfie + KTP"
              subtitle="Pegang KTP di bawah dagu. Pastikan wajah dan KTP terlihat jelas."
              file={selfieFile}
              setFile={setSelfieFile}
              icon={Upload}
            />
          </div>

          {/* Panduan Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-[#f0fdf4] rounded-2xl p-6 border border-emerald-50">
              <div className="flex items-center gap-2 mb-4 text-emerald-700">
                <CheckCircle2 size={18} />
                <h4 className="font-bold text-sm uppercase tracking-wider">Panduan Foto KTP</h4>
              </div>
              <ul className="space-y-3">
                <li className="flex gap-3 text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0"></span>
                  <span>KTP harus asli, bukan fotokopi atau scan.</span>
                </li>
                <li className="flex gap-3 text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0"></span>
                  <span>Tulisan dan angka terbaca jelas dan tidak terpotong.</span>
                </li>
                <li className="flex gap-3 text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0"></span>
                  <span>Tidak tertutup bayangan atau pantulan cahaya.</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#f0fdf4] rounded-2xl p-6 border border-emerald-50">
              <div className="flex items-center gap-2 mb-4 text-emerald-700">
                <CheckCircle2 size={18} />
                <h4 className="font-bold text-sm uppercase tracking-wider">Panduan Selfie</h4>
              </div>
              <ul className="space-y-3">
                <li className="flex gap-3 text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0"></span>
                  <span>Wajah terlihat jelas tanpa masker/kacamata hitam.</span>
                </li>
                <li className="flex gap-3 text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0"></span>
                  <span>Pegang KTP di bawah dagu, jangan tutupi wajah.</span>
                </li>
                <li className="flex gap-3 text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0"></span>
                  <span>Pastikan kamera fokus pada wajah dan kartu KTP.</span>
                </li>
              </ul>
            </div>
          </div>
        </>
      )}

      {/* Encrypted Data Info */}
      <div className="bg-emerald-50 rounded-xl p-5 flex items-center gap-4 border border-emerald-100">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div>
          <h5 className="text-sm font-bold text-emerald-900 mb-0.5">Data Kamu Terenkripsi</h5>
          <p className="text-xs text-emerald-700 leading-relaxed">
            Kami menjamin kerahasiaan dokumen Kamu hanya untuk keperluan verifikasi internal ekosistem SiPetualang.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="br-upload-nav mt-10 pt-6 border-t border-gray-100">
        <button className="br-btn-back" onClick={onBack}>
          ← Kembali
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            className={`br-btn-next ${!canProceed ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            onClick={onNext}
            disabled={!canProceed}
          >
            Selesaikan Pendaftaran
          </button>
        </div>
      </div>
    </div>
  )
}
