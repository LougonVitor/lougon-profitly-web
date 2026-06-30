import { createContext, useContext, useState, type ReactNode } from 'react'
import { translations, type Lang, type Translations } from './translations'

interface I18nContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: Translations
}

const I18nContext = createContext<I18nContextValue>(null!)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem('profitly_lang') as Lang) ?? 'pt'
  )

  function setLang(l: Lang) {
    localStorage.setItem('profitly_lang', l)
    setLangState(l)
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translations[lang] as Translations }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
