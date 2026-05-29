import ScrollReveal from '@/components/ui/ScrollReveal'
import { useLanguage } from '@/contexts/LanguageContext'
import footerBg from '@/assets/beranda/BG-Footer-Section.png'
import logo from '@/assets/beranda/Logo.png'
import facebookIcon from '@/assets/beranda/Facebook Icon.svg'
import linkedinIcon from '@/assets/beranda/LinkedIn.svg'

export default function Footer() {
  const { t } = useLanguage()
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer id="footer" className="relative py-20 px-[60px] max-md:py-[60px] max-md:px-6 pb-0 overflow-hidden w-full box-border">
      <div className="absolute inset-0 z-0">
        <img src={footerBg} alt="" className="w-full h-full object-center max-md:object-cover" />
      </div>

      <div className="relative z-[1] max-w-[1200px] mx-auto w-full box-border">
        <ScrollReveal>
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] max-lg:grid-cols-2 max-md:grid-cols-1 gap-12 max-md:gap-10 pb-12 max-md:pb-8 border-b border-white/[0.08]">
            <div>
              <img src={logo} alt="SiPetualang" className="h-8 w-auto mb-5" />
              <p className="text-sm text-white/70 leading-relaxed mb-6 max-w-[380px] max-md:max-w-full">
                {t('footer.description')}
              </p>

              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 max-w-[420px]">
                <input type="email" placeholder={t('footer.emailPlaceholder')} className="flex-1 bg-transparent outline-none text-white placeholder:text-white/60 px-3 py-2" />
                <button aria-label="Subscribe" className="w-10 h-10 rounded-full bg-sp-primary flex items-center justify-center ml-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                </button>
              </div>

              <p className="text-xs text-white/50 mt-3">{t('footer.privacyNotice')}</p>
            </div>

            <div>
              <h4 className="text-base font-semibold text-white mb-6 tracking-[0.5px] max-md:px-5">{t('footer.aboutTitle')}</h4>
              <ul className="flex flex-col gap-4 list-none p-0 m-0 max-md:px-5">
                <li className="text-sm text-white/60"><a href="#tentang-kami" className="no-underline hover:text-sp-primary">→ {t('footer.aboutUs')}</a></li>
                <li className="text-sm text-white/60"><a href="#cara-sewa" className="no-underline hover:text-sp-primary">{t('footer.howToRent')}</a></li>
                <li className="text-sm text-white/60"><a href="#buka-rental" className="no-underline hover:text-sp-primary">{t('footer.howToMember')}</a></li>
                <li className="text-sm text-white/60"><a href="#sewa-alat" className="no-underline hover:text-sp-primary">{t('footer.howToReturn')}</a></li>
                <li className="text-sm text-white/60"><a href="#syarat-ketentuan" className="no-underline hover:text-sp-primary">{t('footer.terms')}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-base font-semibold text-white mb-6 tracking-[0.5px] max-md:px-5">{t('footer.categoryTitle')}</h4>
              <ul className="flex flex-col gap-4 list-none p-0 m-0 max-md:px-5">
                <li className="text-sm text-white"><a href="#popular" className="font-semibold no-underline hover:text-sp-primary">{t('footer.popularGear')}</a></li>
                <li className="text-sm text-white/60"><a href="#tenda-matras" className="no-underline hover:text-sp-primary">{t('footer.tentMattress')}</a></li>
                <li className="text-sm text-white/60"><a href="#alat-masak" className="no-underline hover:text-sp-primary">{t('footer.cookingGear')}</a></li>
                <li className="text-sm text-white/60"><a href="#pakaian-gunung" className="no-underline hover:text-sp-primary">{t('footer.mountainClothing')}</a></li>
                <li className="text-sm text-white/60"><a href="#tas-sepatu" className="no-underline hover:text-sp-primary">{t('footer.bagsShoes')}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-base font-semibold text-white mb-6 tracking-[0.5px] max-md:px-5">{t('footer.helpTitle')}</h4>
              <ul className="flex flex-col gap-4 list-none p-0 m-0 max-md:px-5">
                <li className="text-sm text-white/60">2307 Indonesia, Jawa Barat, Depok.</li>
                <li className="text-sm"><a href="mailto:Spetualang@7oroof.com" className="text-sp-primary no-underline">Spetualang@7oroof.com</a></li>
                <li className="text-lg font-bold text-white">+62 011 6114 5741</li>
              </ul>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="flex items-center justify-between py-8 max-md:flex-col-reverse max-md:gap-8 max-md:text-center max-md:py-6 max-md:pb-10">
            <p className="text-sm text-white/50">
              ©2026 SiPetualang, {t('footer.rights')}. With Love by{' '}
              <a href="#" className="text-sp-primary no-underline">Spetualang.com</a>
            </p>

            <div className="flex gap-4 text-xs text-white/30">
              <a href="#terms" className="text-inherit no-underline">{t('footer.termsConditions')}</a>
              <a href="#privacy" className="text-inherit no-underline">{t('footer.privacyPolicy')}</a>
              <a href="#sitemap" className="text-inherit no-underline">Sitemap</a>
            </div>

            <button
              className="w-12 h-12 rounded-full bg-sp-primary text-white flex items-center justify-center transition-all duration-300 ease-in-out shadow-[0_6px_24px_rgba(42,181,115,0.35)] border-none cursor-pointer hover:bg-sp-primary-dark hover:shadow-[0_10px_30px_rgba(42,181,115,0.5)] hover:-translate-y-1"
              onClick={scrollToTop}
              aria-label="Scroll to top"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 15l-6-6-6 6" />
              </svg>
            </button>
          </div>
        </ScrollReveal>
      </div>
    </footer>
  )
}
