import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import { testimonials } from '@/features/landing/constants'
import ScrollReveal from '@/components/ui/ScrollReveal'

const THEME_CLASSES = {
  green: 'bg-emerald-200 text-emerald-900',
  dark: 'bg-[rgb(38,38,38)] text-white',
  light: 'bg-white text-[rgb(38,38,38)]',
}

/* ── Desktop fan-spread positions ─────────────────────────── */
const DESKTOP = [
  { x: '-160%', y: 20, rotate: -6, scale: 0.9, z: 1 },
  { x: '-80%', y: 5, rotate: 4, scale: 0.95, z: 2 },
  { x: '0%', y: -10, rotate: -3, scale: 1.05, z: 3 },
  { x: '80%', y: 5, rotate: 5, scale: 0.95, z: 2 },
  { x: '160%', y: 20, rotate: -5, scale: 0.9, z: 1 },
]

/* ── Mobile stacked-rack positions (documents in a file rack) */
const MOBILE_STACK = [
  { y: 60, scale: 1, z: 5 },
  { y: 10, scale: 0.95, z: 4 },
  { y: -40, scale: 0.9, z: 3 },
  { y: -85, scale: 0.85, z: 2 },
  { y: -125, scale: 0.8, z: 1 },
]

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

export default function Testimonial() {
  const [activeCard, setActiveCard] = useState(null)
  const isMobile = useIsMobile()
  const { t } = useLanguage()

  const handleClick = (index) => {
    setActiveCard(activeCard === index ? null : index)
  }

  return (
    <section id="testimonial" className="py-[100px] max-md:py-[60px] px-[5%] bg-white overflow-hidden">
      <div className="max-w-[1200px] mx-auto text-center">
        <ScrollReveal>
          <div className="mb-20">
            <span className="text-sp-primary text-sm font-semibold uppercase tracking-[1px] block mb-4">
              {t('testimonial.badge')}
            </span>
            <h2 className="text-[40px] max-md:text-[28px] font-bold text-[rgb(33,37,41)] leading-[1.3] whitespace-pre-line">
              {t('testimonial.title')}
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="flex justify-center items-center relative h-[450px] max-md:h-[480px] w-full">
            {testimonials.map((item, index) => {
              const isActive = activeCard === index
              const desktop = DESKTOP[index]
              const mobile = MOBILE_STACK[index]

              // Compute animation target based on viewport
              const target = isMobile
                ? {
                    x: 0,
                    y: isActive ? 100 : mobile.y,
                    rotate: 0,
                    scale: isActive ? 1.03 : mobile.scale,
                    zIndex: isActive ? 20 : mobile.z,
                  }
                : {
                    x: desktop.x,
                    y: isActive ? desktop.y - 30 : desktop.y,
                    rotate: isActive ? 0 : desktop.rotate,
                    scale: isActive ? 1.15 : desktop.scale,
                    zIndex: isActive ? 20 : desktop.z,
                  }

              return (
                <motion.div
                  key={index}
                  className={`w-[300px] max-md:w-[90%] max-md:max-w-[320px] min-h-[280px] absolute rounded-[20px] py-8 px-6 flex flex-col justify-between text-left cursor-pointer
                    ${THEME_CLASSES[item.theme]}
                  `}
                  initial={false}
                  animate={target}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 28,
                    mass: 0.9,
                  }}
                  onClick={() => handleClick(index)}
                  style={{
                    boxShadow: isActive
                      ? '0 20px 50px rgba(0,0,0,0.2)'
                      : '0 8px 24px rgba(0,0,0,0.08)',
                  }}
                >
                  <p className="text-[15px] leading-relaxed font-medium mb-6">
                    {item.quote}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[rgb(200,200,200)]">
                      <img src={item.avatar} alt={item.name} className="size-full rounded-full object-cover" />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-sm font-bold mb-0.5">{item.name}</h4>
                      <span className="text-xs opacity-80">{item.role}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
