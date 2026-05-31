import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, ShieldCheck, PartyPopper, Home } from 'lucide-react'

export default function StepPendaftaranBerhasil({ status, isInstantlyActivated }) {
  const [countdown, setCountdown] = useState(10)
  const navigate = useNavigate()

  // Jika status pending, kita tampilkan pesan menunggu. 
  // Jika status disetujui ATAU isInstantlyActivated, tampilkan pesan sukses.
  const isPending = status === 'pending' && !isInstantlyActivated
  const showSuccess = isInstantlyActivated || status === 'disetujui'

  useEffect(() => {
    // Hanya countdown jika sukses (langsung aktif)
    if (!showSuccess) return

    if (countdown <= 0) {
      navigate('/rental-dashboard', { replace: true })
      return
    }
    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, navigate, showSuccess])

  return (
    <div className="py-16 px-6 max-w-[520px] mx-auto text-center">
      {/* Icon Status */}
      <div className={`br-success-icon ${isPending ? 'bg-amber-50' : 'bg-green-50'}`}>
        {isPending ? (
          <Clock size={40} className="text-amber-500" />
        ) : (
          <ShieldCheck size={40} className="text-green-500" />
        )}
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-3">
        {isPending ? 'Pendaftaran Sedang Diproses' : 'Selamat Datang di Buka Sewa!'}
      </h2>
      
      <p className="text-sm text-gray-500 leading-relaxed mb-10 max-w-[400px] mx-auto">
        {isPending ? (
          'Data Kamu sudah terkirim, mohon tunggu untuk diverifikasi oleh tim admin kami. Proses ini biasanya memakan waktu maksimal 1x24 jam.'
        ) : (
          'Pendaftaran Kamu telah berhasil diselesaikan. Akun Kamu telah siap untuk mulai mengelola penyewaan peralatan outdoor dengan efisiensi profesional.'
        )}
      </p>

      {showSuccess ? (
        <>
          <p className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-4">
            Mengarahkan ke Dashboard
          </p>
          <div className="br-countdown-box">
            {String(countdown).padStart(2, '0')}
          </div>
          <p className="text-xs text-gray-400 mb-8">Detik...</p>

          <div className="flex flex-col gap-3 max-w-[340px] mx-auto">
            <button
              className="br-btn-primary w-full justify-center"
              onClick={() => navigate('/rental-dashboard', { replace: true })}
            >
              <PartyPopper size={16} className="mr-2" />
              Buka Dashboard Sekarang
            </button>
            <button
              className="w-full py-3 px-6 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors border-none cursor-pointer flex items-center justify-center gap-2"
              onClick={() => navigate('/', { replace: true })}
            >
              <Home size={14} />
              Nanti Saja
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3 max-w-[340px] mx-auto">
          <button
            className="br-btn-primary w-full justify-center"
            onClick={() => navigate('/')}
          >
            Kembali ke Beranda
          </button>
        </div>
      )}
    </div>
  )
}
