import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import { categories } from '@/features/landing/constants'
import ScrollReveal from '@/components/ui/ScrollReveal'

export default function Category() {
  const [currentIndex, setCurrentIndex] = useState(2)
  const { t } = useLanguage()

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === categories.length - 1 ? 0 : prevIndex + 1
    )
  }, [])

  const handlePrev = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? categories.length - 1 : prevIndex - 1
    )
  }, [])

  useEffect(() => {
    const autoPlay = setInterval(() => {
      handleNext()
    }, 3000)

    return () => clearInterval(autoPlay)
  }, [handleNext])

  return (
    <section id="category" className="py-[100px] px-[5%] bg-white text-center overflow-hidden">
      <div className="max-w-[1200px] mx-auto">
        <ScrollReveal>
          <div>
            <span className="text-sp-primary text-sm font-semibold uppercase tracking-[1px] inline-block mb-4">
              {t('category.badge')}
            </span>
            <h2 className="text-[40px] max-md:text-2xl font-bold text-black leading-[1.2] whitespace-pre-line mb-4">
              {t('category.title')}
            </h2>
            <p className="text-base text-[rgb(100,100,100)] leading-[1.7] max-w-[800px] mx-auto mb-[60px]">
              {t('category.subtitle')}
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="relative w-full flex flex-col items-center">
            <div className="relative w-full max-w-[800px] h-[450px] max-md:h-[350px] flex justify-center items-center mb-10">
              {categories.map((cat, index) => {
                let position = index - currentIndex
                let isActive = position === 0
                let zIndex = 10 - Math.abs(position)
                let scale = 1 - Math.abs(position) * 0.15
                let translateX = position * 65

                return (
                  <motion.div
                    key={index}
                    className={`absolute w-[320px] max-md:w-[250px] h-[400px] max-md:h-[320px] rounded-3xl p-3 box-border overflow-hidden cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition-[transform,opacity,filter] duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]
                      ${isActive ? 'border-none bg-sp-emerald-300' : 'bg-sp-emerald-50'}
                    `}
                    animate={{
                      x: `${translateX}%`,
                      scale: scale,
                      zIndex: zIndex,
                      opacity: Math.abs(position) > 2 ? 0 : 1,
                      filter: isActive ? 'brightness(1)' : 'brightness(0.4)',
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    onClick={() => setCurrentIndex(index)}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, { offset }) => {
                      if (offset.x < -50) {
                        handleNext()
                      } else if (offset.x > 50) {
                        handlePrev()
                      }
                    }}
                  >
                    {cat.tag && (
                      <span className="absolute top-6 left-6 bg-sp-primary text-white py-1.5 px-4 rounded-full text-xs font-semibold z-[3] border-none">
                        {cat.tag}
                      </span>
                    )}
                    <img
                      src={cat.image}
                      alt={cat.title}
                      className={`w-full h-full ${isActive ? 'bg-sp-emerald-300' : 'bg-sp-emerald-50'}`}
                    />
                    <div className="absolute bottom-0 left-0 w-full pt-10 pr-5 pb-5 pl-5 max-md:pt-5 max-md:pr-3 max-md:pb-4 max-md:pl-3 bg-gradient-to-t from-black/90 to-transparent text-left">
                      <h3 className="text-white text-xl font-bold mb-3 max-md:pl-1.5">
                        {cat.title}
                      </h3>
                      <div className="flex justify-between items-center">
                        <span className="bg-[rgba(52,211,153,0.2)] text-sp-emerald-300 border border-sp-emerald-400 py-2 px-5 max-md:py-1.5 max-md:px-2.5 max-md:text-[10px] max-md:ml-1.5 rounded-full text-sm font-medium">
                          {cat.available}
                        </span>
                        <button className="w-9 max-md:w-8 h-9 max-md:h-8 max-md:mr-2.5 rounded-full bg-sp-primary text-white flex justify-center items-center border-none cursor-pointer transition-transform duration-300 hover:scale-110">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <div className="flex items-center gap-6">
              <button
                className="w-10 h-10 rounded-full bg-sp-emerald-50 border border-green-600 flex justify-center items-center cursor-pointer text-green-600 transition-all duration-300 hover:bg-sp-primary hover:text-white hover:border-sp-primary"
                onClick={handlePrev}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <div className="flex gap-2">
                {categories.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${
                      idx === currentIndex
                        ? 'bg-sp-primary w-6 rounded'
                        : 'bg-[rgb(220,220,220)] w-2'
                    }`}
                    onClick={() => setCurrentIndex(idx)}
                  />
                ))}
              </div>
              <button
                className="w-10 h-10 rounded-full bg-sp-emerald-50 border border-green-600 flex justify-center items-center cursor-pointer text-green-600 transition-all duration-300 hover:bg-sp-primary hover:text-white hover:border-sp-primary"
                onClick={handleNext}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
