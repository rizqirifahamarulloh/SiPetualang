import heroBg from '@/assets/carasewa/banner-BG.png'
import { Link } from 'react-router-dom'

export default function CaraSewaHeroBanner() {
  return (
    <div className="cs-hero-wrapper">
      <div className="cs-hero">
        <img src={heroBg} alt="Camping in the forest" className="cs-hero-bg" />

        {/* Text overlay */}
        <div className="cs-hero-content">
          <h1 className="cs-hero-title">
            Awali Petualangan{'\n'}Bersama{'\n'}SiPetualang
          </h1>
          <p className="cs-hero-subtitle">
            Sewa perlengkapan mendaki dan kemah dengan aman. Kami menyediakan alat dengan kualitas terjamin. Cek ketersediaan stok, pesan langsung dan pasti tanpa repot.
          </p>
          <Link to="/sewa-alat" className="cs-hero-btn">
            Bantuan
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Breadcrumb tab */}
        <div className="cs-breadcrumb">
          <Link to="/">Home</Link>
          <span className="cs-breadcrumb-sep">&gt;</span>
          <Link to="/">Pages</Link>
          <span className="cs-breadcrumb-sep">&gt;</span>
          <span className="cs-breadcrumb-active">Cara Sewa</span>
        </div>
      </div>
    </div>
  )
}
