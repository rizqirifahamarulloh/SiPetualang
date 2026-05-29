import { motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import ScrollReveal from '@/components/ui/ScrollReveal'

import searchIcon from '@/assets/beranda/Icon-Search-Services.svg'
import tagIcon from '@/assets/beranda/Icon-Tag-Service.svg'
import documentIcon from '@/assets/beranda/Icon-Document-Service.svg'
import sendIcon from '@/assets/beranda/Icon-Send-Service.svg'

export default function HowItWorks() {
  const { t } = useLanguage()

  const steps = [
    {
      icon: searchIcon,
      titleKey: 'howItWorks.step1Title',
      descKey: 'howItWorks.step1Desc',
    },
    {
      icon: tagIcon,
      titleKey: 'howItWorks.step2Title',
      descKey: 'howItWorks.step2Desc',
    },
    {
      icon: documentIcon,
      titleKey: 'howItWorks.step3Title',
      descKey: 'howItWorks.step3Desc',
    },
    {
      icon: sendIcon,
      titleKey: 'howItWorks.step4Title',
      descKey: 'howItWorks.step4Desc',
    },
  ]

  return (
    <section id="how-it-works" className="py-[100px] px-[5%] bg-white max-md:py-[60px] max-md:px-6">
      <div className="max-w-[1200px] mx-auto">
        <ScrollReveal>
          <div className="flex justify-between items-center mb-[60px] gap-[60px] text-left max-md:flex-col max-md:items-start max-md:gap-5">
            <div className="flex-1 text-left">
              <span className="text-sp-primary text-sm font-medium uppercase tracking-[0.5px] block mb-4">
                {t('howItWorks.badge')}
              </span>
              <h2 className="text-[40px] max-md:text-[28px] font-bold text-[rgb(33,37,41)] leading-[1.2] whitespace-pre-line">
                {t('howItWorks.title')}
              </h2>
            </div>
            <div className="flex-1 max-w-[550px] text-left">
              <p className="text-[rgb(100,100,100)] text-base leading-relaxed font-normal">
                {t('howItWorks.subtitle')}
              </p>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-4 max-md:grid-cols-1 gap-6 max-md:gap-4">
          {steps.map((step, index) => (
            <ScrollReveal key={index}>
              <motion.div
                className="card-mask-shape relative bg-sp-emerald-50 py-10 pr-8 pb-10 pl-6 text-left transition-all duration-300 ease-in-out min-h-[300px] rounded-none border-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.06)] hover:bg-sp-emerald-100"
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
              >
                <img
                  src={step.icon}
                  alt={t(step.titleKey)}
                  className="w-[70px] h-[70px] ml-[60px] max-md:block max-md:mx-auto max-md:mb-6 object-contain mb-6"
                />
                <h3 className="text-xl font-semibold pl-2.5 text-black mb-3 max-md:text-center">
                  {t(step.titleKey)}
                </h3>
                <p className="text-sm pl-2.5 text-[rgb(80,80,80)] leading-relaxed max-md:text-center">
                  {t(step.descKey)}
                </p>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
