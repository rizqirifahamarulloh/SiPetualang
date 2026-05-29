import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'

export default function LanguageToggle({ variant = 'default' }) {
  const { locale, toggleLocale } = useLanguage()

  const isNavbar = variant === 'navbar'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLocale}
      title={locale === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
      className={isNavbar ? 'text-white hover:text-white hover:bg-white/10' : ''}
    >
      <span className={`text-xs font-bold ${isNavbar ? 'text-white' : ''}`}>
        {locale === 'id' ? 'EN' : 'ID'}
      </span>
      <span className="sr-only">
        {locale === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
      </span>
    </Button>
  )
}
