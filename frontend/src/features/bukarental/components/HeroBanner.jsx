import { useState, useEffect } from 'react'
import heroBg from '@/assets/bukarental/image-bg.png'
import heroBg2k from '@/assets/bukarental/Image-bg-2k.png'
import { Link } from 'react-router-dom'

const breadcrumbLabels = {
  1: 'Syarat & Ketentuan Kemitraan',
  2: 'Form Pendaftaran Rental',
  3: 'Unggah Foto KTP',
  4: 'Pendaftaran Berhasil',
}

export default function HeroBanner({ currentStep }) {
  const [is2K, setIs2K] = useState(window.innerWidth > 1920)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1921px)')
    const handler = (e) => setIs2K(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <div className="br-hero-wrapper">
      <div className="br-hero">
        <img src={is2K ? heroBg2k : heroBg} alt="Mountain landscape banner" />
        <div className="br-breadcrumb">
          <Link to="/">Home</Link>
          <span className="br-breadcrumb-sep">&gt;</span>
          <Link to="/buka-rental">Buka Rental</Link>
          <span className="br-breadcrumb-sep">&gt;</span>
          <span className="br-breadcrumb-active">{breadcrumbLabels[currentStep]}</span>
        </div>
      </div>
    </div>
  )
}
