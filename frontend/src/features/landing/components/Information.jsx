import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import infoImage from '@/assets/beranda/Images-informasi-section.png'
import arrowRight from '@/assets/beranda/icon-arrow-right.svg'

export default function Information() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { t } = useLanguage()

  return (
    <section id="information" className="py-[100px] px-[5%] bg-white max-md:py-[60px]" ref={ref}>
      <div className="max-w-[1200px] mx-auto grid grid-cols-2 max-md:grid-cols-1 gap-[150px] max-md:gap-10 items-center">
        <motion.div
          className="relative w-[120%] max-md:w-full"
          initial={{ opacity: 0, x: -60 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <img src={infoImage} alt="SiPetualang gear rental information" className="w-full rounded-3xl object-cover" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          <span className="inline-block text-sm font-semibold tracking-[1px] text-sp-primary uppercase mb-3">
            {t('information.taglineBadge')}
          </span>
          <h2 className="text-[40px] max-md:text-[28px] font-bold text-black leading-[1.2] mb-5 whitespace-pre-line">
            {t('information.infoTitle')}
          </h2>
          <p className="text-base text-[rgb(100,100,100)] leading-relaxed mb-8">
            {t('information.infoDesc')}
          </p>

          <div className="flex gap-4 items-center flex-wrap">
            <motion.a
              href="#category"
              className="inline-flex items-center gap-2.5 bg-sp-primary text-white py-3.5 px-7 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out shadow-[0_6px_24px_rgba(42,181,115,0.3)] border-none cursor-pointer no-underline hover:bg-[rgb(20,80,45)] hover:shadow-[0_10px_30px_rgba(42,181,115,0.45)]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t('information.readMore')}
              <img src={arrowRight} alt="" className="w-3.5 h-3.5" />
            </motion.a>

            <motion.button
              className="inline-flex items-center gap-2 bg-transparent text-black py-3.5 px-6 rounded-full text-sm font-semibold border border-[rgb(220,220,220)] transition-all duration-300 ease-in-out cursor-pointer hover:border-sp-primary hover:text-sp-primary hover:bg-[rgb(239,255,244)]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t('information.safetyInfo')}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
