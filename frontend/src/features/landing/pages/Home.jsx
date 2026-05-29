import { useState, useEffect } from 'react'
import '@/features/landing/landing.css'
import Navbar from '@/features/landing/components/Navbar'
import Hero from '@/features/landing/components/Hero'
import Information from '@/features/landing/components/Information'
import HowItWorks from '@/features/landing/components/HowItWorks'
import Category from '@/features/landing/components/Category'
import Brand from '@/features/landing/components/Brand'
import Testimonial from '@/features/landing/components/Testimonial'
import Footer from '@/features/landing/components/Footer'
import LoadingScreen from '@/features/landing/components/LoadingScreen'

export default function Home() {
  // Only show loading on the very first visit per session
  const [isLoading, setIsLoading] = useState(() => {
    return !sessionStorage.getItem('sipetualang_visited')
  })

  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
      window.scrollTo(0, 0)
      // Mark as visited so loading won't show again in this session
      sessionStorage.setItem('sipetualang_visited', 'true')
    }
  }, [isLoading])

  return (
    <div className="landing-scrollbar">
      {isLoading ? (
        <LoadingScreen onComplete={() => setIsLoading(false)} />
      ) : (
        <main className="w-full max-w-full overflow-x-hidden text-[#333] bg-white">
          <Navbar />
          <Hero />
          <Information />
          <HowItWorks />
          <Category />
          <Brand />
          <Testimonial />
          <Footer />
        </main>
      )}
    </div>
  )
}
