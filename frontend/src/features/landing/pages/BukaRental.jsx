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
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [isInstantlyActivated, setIsInstantlyActivated] = useState(false)
  const isVerified = user?.is_verified
  const verificationStatus = user?.verification_status
  const verificationNote = user?.verification_note

  const [formData, setFormData] = useState({
    namaLengkap: user?.nama || '',
    email: user?.email || '',
    telepon: user?.no_telp || '',
    tanggalLahir: user?.tanggal_lahir || '',
    equipment: [],
  })
  const [ktpFile, setKtpFile] = useState(null)
  const [selfieFile, setSelfieFile] = useState(null)

  // Jika user sudah perental dan rental aktif, redirect ke dashboard
  useEffect(() => {
    if (user?.peran_pengguna === 'perental' && user?.rental === 'true') {
      navigate('/rental-dashboard', { replace: true })
    }
  }, [user?.peran_pengguna, user?.rental])

  // Jika verifikasi ditolak, mulai dari step yang sesuai
  useEffect(() => {
    if (verificationStatus === 'ditolak') {
      if (user?.nama && user?.no_telp && user?.tanggal_lahir) {
        setCurrentStep(3)
      } else {
        setCurrentStep(2)
      }
    }
    // Jika pending (menunggu verifikasi admin), tampilkan step 4 dengan status pending
    if (verificationStatus === 'pending') {
      setCurrentStep(4)
    }
  }, [verificationStatus, user])

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

      let activated = false;

      // 2. Jika ada file KTP baru, berarti user belum terverifikasi, kirim ke admin
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
        // Jika KTP sudah diverifikasi sebelumnya, langsung aktifkan fitur rental
        await api.post('/profile/rental')
        activated = true;
      }

      // Refresh profile data
      const profileRes = await api.get('/profile')
      const updatedUser = { ...user, ...profileRes.data.data }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))

      setIsInstantlyActivated(activated)
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
    // Step 2 → selalu lanjut ke Step 3 (tidak skip lagi)
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
    setCurrentStep(prev => prev - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFinish = async () => {
    const success = await activateRental()
    if (success) {
      if (isVerified) {
        toast.success('Pendaftaran rental berhasil!')
      } else {
        toast.success('Pengajuan verifikasi berhasil dikirim!')
      }
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
            isAlreadyVerified={isVerified}
          />
        )
      case 4:
        return (
          <StepPendaftaranBerhasil
            status={verificationStatus}
            isInstantlyActivated={isInstantlyActivated}
          />
        )
      default:
        return null
    }
  }

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
