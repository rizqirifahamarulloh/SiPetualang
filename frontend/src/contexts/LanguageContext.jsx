import { createContext, useContext, useState, useCallback } from 'react'
import id from '@/i18n/id.json'
import en from '@/i18n/en.json'

const translations = { id, en }
const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    return localStorage.getItem('locale') || 'id'
  })

  const setLocale = useCallback((newLocale) => {
    localStorage.setItem('locale', newLocale)
    setLocaleState(newLocale)
  }, [])

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'id' ? 'en' : 'id')
  }, [locale, setLocale])

  /**
   * Get translation by dot-notation key: t('auth.loginTitle')
   */
  const t = useCallback(
    (key, fallback) => {
      const keys = key.split('.')
      let value = translations[locale]

      for (const k of keys) {
        value = value?.[k]
        if (value === undefined) break
      }

      return value ?? fallback ?? key
    },
    [locale]
  )

  return (
    <LanguageContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
