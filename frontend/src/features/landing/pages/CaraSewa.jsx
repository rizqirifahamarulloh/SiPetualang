import Navbar from '@/features/landing/components/Navbar'
import Footer from '@/features/landing/components/Footer'
import CaraSewaHeroBanner from '@/features/carasewa/components/HeroBanner'
import BlogSection from '@/features/carasewa/components/BlogSection'
import '@/features/landing/landing.css'
import '@/features/carasewa/carasewa.css'

export default function CaraSewa() {
  return (
    <div className="landing-scrollbar">
      <main className="w-full max-w-full overflow-x-hidden text-[#333] bg-white min-h-screen">
        <Navbar />

        {/* Hero Banner — Navbar overlays on top */}
        <CaraSewaHeroBanner />

        {/* Blog Section — Step-by-step guide */}
        <BlogSection />

        {/* Footer */}
        <Footer />
      </main>
    </div>
  )
}
