import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { brands } from '@/features/landing/constants'
import brandBg from '@/assets/beranda/BG-Brand-Section.png'

export default function Brand() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const marqueeItems = [...brands, ...brands, ...brands, ...brands]

  return (
    <section id="brand" className="relative py-[150px] max-md:py-10 overflow-hidden" ref={ref}>
      <div className="absolute inset-0 z-0">
        <img src={brandBg} alt="" className="w-full h-full" />
      </div>

      <motion.div
        className="relative z-[1] max-w-full overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
      >
        <div className="marquee-mask w-full overflow-hidden">
          <div className="flex items-center gap-[60px] max-md:gap-10 animate-marquee w-max">
            {marqueeItems.map((brand, index) => (
              <div key={index} className="shrink-0 flex items-center justify-center py-2.5 px-5">
                <img
                  src={brand}
                  alt={`Brand partner ${(index % brands.length) + 1}`}
                  className="h-[72px] max-md:h-8 w-auto translate-y-3 brightness-0 invert opacity-70 transition-opacity duration-[0.4s] ease-in-out hover:opacity-100"
                />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
