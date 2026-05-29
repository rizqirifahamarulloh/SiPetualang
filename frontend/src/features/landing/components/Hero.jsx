import { motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import heroBg from '@/assets/beranda/Image-bg.png'
import heroBgMobile from '@/assets/beranda/Image-bg-android.png'
import arrowRight from '@/assets/beranda/icon-arrow-right.svg'
import ScrollReveal from '@/components/ui/ScrollReveal'

export default function Hero() {
  const { t } = useLanguage()

  return (
    <section id="hero" className="relative w-full min-h-screen max-md:min-h-[100svh] flex items-end justify-start py-0 px-[60px] pb-[100px] max-md:p-0 overflow-hidden">
      <div className="absolute top-6 left-6 right-6 bottom-6 max-md:top-0 max-md:left-0 max-md:right-0 max-md:bottom-0 z-0 rounded-[32px] max-md:rounded-none overflow-hidden">
        <img
          src={heroBg}
          alt="Mountain adventure background"
          className="w-full h-full object-cover object-center block max-md:hidden"
        />
        <img
          src={heroBgMobile}
          alt="Mountain adventure background"
          className="w-full h-full object-cover object-center hidden max-md:block max-md:p-4 max-md:rounded-[32px]"
        />
        <div className="absolute inset-0" />
      </div>

      <div className="absolute top-1/2 left-[60px] right-[60px] -translate-y-1/2 max-w-[1400px] mx-auto z-[1] max-md:flex max-md:flex-col max-md:items-center max-md:text-center max-md:left-6 max-md:right-6">
        <ScrollReveal>
          <h1 className="text-[52px] max-md:text-[32px] max-md:text-center font-bold text-white leading-[1.15] mb-4 whitespace-pre-line [text-shadow:0_2px_20px_rgba(0,0,0,0.3)]">
            {t('hero.title')}
          </h1>
        </ScrollReveal>

        <ScrollReveal>
          <p className="text-base max-md:text-[13px] font-light max-w-[600px] text-white/85 mb-8 leading-relaxed max-md:text-center max-md:mx-auto">
            {t('hero.subtitle')}
          </p>
        </ScrollReveal>

        <ScrollReveal>
          <div className="flex items-center gap-5 max-md:flex-col max-md:w-full max-md:gap-4">
            <motion.a
              href="#category"
              className="inline-flex items-center justify-center gap-2.5 py-3.5 px-8 rounded-full min-w-[180px] text-sm font-semibold no-underline cursor-pointer transition-all duration-300 ease-in-out bg-sp-primary text-white tracking-[0.5px] shadow-[0_8px_30px_rgba(42,181,115,0.35)] hover:bg-sp-primary-dark hover:shadow-[0_12px_40px_rgba(42,181,115,0.5)] max-md:w-full max-md:max-w-[300px] max-md:mx-auto group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t('hero.cta')}
              <img src={arrowRight} alt="" className="w-3.5 h-3.5 transition-transform duration-[0.4s] ease-in-out group-hover:translate-x-1" />
            </motion.a>

            <motion.a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-full min-w-[180px] text-sm font-semibold no-underline cursor-pointer transition-all duration-300 ease-in-out bg-transparent text-white border border-[rgb(220,220,220)] max-md:w-full max-md:max-w-[300px] max-md:mx-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t('hero.explore')}
            </motion.a>
          </div>
        </ScrollReveal>
      </div>

      <ScrollReveal>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-[2]">
          <div className="scroll-indicator-line w-0.5 h-10 bg-white/30 rounded-sm relative overflow-hidden" />
        </div>
      </ScrollReveal>

      <div className="absolute bottom-6 max-md:bottom-0 left-1/2 -translate-x-1/2 bg-white py-3.5 px-8 max-md:py-2.5 max-md:px-6 max-md:pb-7 rounded-t-2xl max-md:rounded-t-xl flex items-center justify-center z-[99]">
        <span className="relative text-black text-sm max-md:text-xs font-medium z-[100] flex items-center gap-0.5 whitespace-nowrap">
          <span className="text-sp-primary font-semibold">{t('nav.home')}</span>
          <span className="text-[rgb(150,150,150)] font-normal">{" > "}</span>
          <span className="text-[rgb(100,100,100)] font-medium">Pages</span>
        </span>
      </div>
    </section>
  )
}
