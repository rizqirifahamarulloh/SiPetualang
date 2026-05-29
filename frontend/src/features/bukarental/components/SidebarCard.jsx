import iconDocument from '@/assets/bukarental/Icon-Document.svg'
import iconHeart from '@/assets/bukarental/Icon-Heart.svg'
import iconLike from '@/assets/bukarental/Icon-Like.svg'

export default function SidebarCard() {
  return (
    <div className="br-sidebar-card">
      <h3>Mulai Bisnis Sewa Outdoor Kamu.</h3>
      <p>
        Bergabunglah dengan ribuan pemilik perlengkapan outdoor dan bantu petualang menemukan gear berkualitas untuk perjalanan mereka.
      </p>

      <div className="br-sidebar-feature">
        <img src={iconDocument} alt="Kelola Inventaris" className="br-sidebar-feature-icon" />
        <div>
          <h4>Kelola Inventaris</h4>
          <p>Pantau ketersediaan tenda, carrier, dan gear lainnya dengan sistem manajemen teknis kami.</p>
        </div>
      </div>

      <div className="br-sidebar-feature">
        <img src={iconHeart} alt="Pembayaran Terjamin" className="br-sidebar-feature-icon" />
        <div>
          <h4>Pembayaran Terjamin</h4>
          <p>Terima pembayaran secara aman dan otomatis langsung ke rekening bank mitra Kamu.</p>
        </div>
      </div>

      <div className="br-sidebar-feature">
        <img src={iconLike} alt="Proteksi Peralatan" className="br-sidebar-feature-icon" />
        <div>
          <h4>Proteksi Peralatan</h4>
          <p>Sistem verifikasi penyewa yang ketat untuk menjamin keamanan barang-barang berharga Kamu.</p>
        </div>
      </div>
    </div>
  )
}
