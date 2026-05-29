import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/features/landing/components/Navbar'
import Footer from '@/features/landing/components/Footer'
import HeroBanner from '@/features/bukarental/components/HeroBanner'
import Stepper from '@/features/bukarental/components/Stepper'
import StepSyaratKetentuan from '@/features/bukarental/components/StepSyaratKetentuan'
import StepFormPendaftaran from '@/features/bukarental/components/StepFormPendaftaran'
import StepUnggahKTP from '@/features/bukarental/components/StepUnggahKTP'
import StepPendaftaranBerhasil from '@/features/bukarental/components/StepPendaftaranBerhasil'
import api from '@/services/api'
import '@/features/landing/landing.css'
import '@/features/bukarental/bukarental.css'

const stepVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.2 } },
}

export default function BukaRental() {
  const { user, setUser, isAuthenticated } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const isVerified = user?.is_verified
  const verificationStatus = user?.verification_status
  const verificationNote = user?.verification_note

  useEffect(() => {
    // Determine initial step based on verification status
    if (verificationStatus === 'pending' || verificationStatus === 'disetujui') {
      setCurrentStep(4)
    } else if (verificationStatus === 'ditolak') {
      // Pastikan data profil sudah lengkap sebelum melompat ke step 3
      if (user?.nama && user?.no_telp && user?.tanggal_lahir) {
        setCurrentStep(3)
      } else {
        setCurrentStep(2)
      }
    }
  }, [verificationStatus, user])

  const [formData, setFormData] = useState({
    namaLengkap: user?.nama || '',
    email: user?.email || '',
    telepon: user?.no_telp || '',
    tanggalLahir: user?.tanggal_lahir || '',
    equipment: [],
  })
  const [ktpFile, setKtpFile] = useState(null)
  const [selfieFile, setSelfieFile] = useState(null)
  const navigate = useNavigate()

  const activateRental = async () => {
    try {
      // 1. Update Profile first - hanya kirim data yang tidak kosong
      const profileData = {}
      if (formData.namaLengkap) profileData.name = formData.namaLengkap
      if (formData.telepon) profileData.phone = formData.telepon
      if (formData.tanggalLahir) profileData.birth_date = formData.tanggalLahir
      
      if (Object.keys(profileData).length > 0) {
        await api.put('/profile', profileData)
      }

      let isInstantlyActivated = false;

      // 2. Jika ada file KTP, berarti user belum terverifikasi, kirim ke admin untuk di-approve
      if (ktpFile && selfieFile) {
        const uploadData = new FormData()
        uploadData.append('foto_ktp', ktpFile)
        uploadData.append('foto_selfie_ktp', selfieFile)
        uploadData.append('catatan_admin', '[PENDAFTARAN_RENTAL]')
        
        await api.post('/customer/verifikasi', uploadData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      } else if (isVerified) {
        // Jika KTP sudah diverifikasi sebelumnya, langsung aktifkan fitur rental tanpa nunggu admin lagi
        await api.post('/profile/rental')
        isInstantlyActivated = true;
      }

      // Refresh profile data to get latest verification_status and rental status
      const profileRes = await api.get('/profile')
      const updatedUser = { ...user, ...profileRes.data.data }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))

      if (isInstantlyActivated) {
        navigate('/rental-dashboard', { replace: true })
      }

      return true
    } catch (err) {
      console.error(err)
      const message = err.response?.data?.message || 'Gagal memproses pendaftaran. Coba lagi.'
      toast.error(message)
      return false
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!isAuthenticated) {
        toast.info('Silakan login terlebih dahulu untuk melanjutkan pendaftaran rental.')
        navigate('/login', { state: { from: '/buka-rental' } })
        return
      }
    }
    if (currentStep === 2) {
      if (isVerified) {
        // Skip verification step if already verified
        const success = await activateRental()
        if (success) {
          toast.success('Pendaftaran rental berhasil!')
          setCurrentStep(4)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
        return
      }
    }
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    if (currentStep === 1) {
      navigate('/')
      return
    }
    if (currentStep === 4 && isVerified) {
      // If going back from step 4 and skipped step 3, go to step 2
      setCurrentStep(2)
    } else {
      setCurrentStep(prev => prev - 1)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFinish = async () => {
    const success = await activateRental()
    if (success) {
      toast.success('Pengajuan verifikasi berhasil dikirim!')
      setCurrentStep(4)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepSyaratKetentuan
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 2:
        return (
          <StepFormPendaftaran
            onNext={handleNext}
            onBack={handleBack}
            formData={formData}
            setFormData={setFormData}
          />
        )
      case 3:
        return (
          <StepUnggahKTP
            onNext={handleFinish}
            onBack={handleBack}
            ktpFile={ktpFile}
            setKtpFile={setKtpFile}
            selfieFile={selfieFile}
            setSelfieFile={setSelfieFile}
            rejectionNote={verificationStatus === 'ditolak' ? (verificationNote || 'Foto KTP buram, terpotong, atau identitas tidak sesuai dengan panduan.') : null}
          />
        )
      case 4:
        return <StepPendaftaranBerhasil status={verificationStatus} />
      default:
        return null
    }
  }

  useEffect(() => {
    // Jika sudah punya akses rental, langsung arahkan ke Dashboard Rental
    if (user?.rental === 'true') {
      navigate('/rental-dashboard', { replace: true })
    }
  }, [user?.rental, navigate])

  return (
    <div className="landing-scrollbar">
      <main className="w-full max-w-full overflow-x-hidden text-[#333] bg-white min-h-screen">
        <Navbar />

        {/* Hero Banner — Navbar overlays on top */}
        <HeroBanner currentStep={currentStep} />

        {/* Stepper */}
        <div className="max-w-[800px] mx-auto px-6">
          <Stepper currentStep={currentStep} />
        </div>

        {/* Step Content with Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* Footer spacing */}
        <div className="mt-10" />
        <Footer />
      </main>
    </div>
  )
}
