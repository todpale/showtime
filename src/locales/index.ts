import { en } from './en'
import { useI18n, createI18n } from 'vue-i18n'
import type { ComposerTranslation } from 'vue-i18n'

const i18n = createI18n({
  locale: 'en',
  legacy: false,
  messages: { en },
  fallbackLocale: 'en',
  silentFallbackWarn: true
})

const t: ComposerTranslation<any, 'en', any> = i18n.global.t

const useLocale = useI18n

export { t, i18n, useLocale }
