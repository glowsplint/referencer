import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

import commonEn from "./locales/en/common.json"
import toolsEn from "./locales/en/tools.json"
import dialogsEn from "./locales/en/dialogs.json"
import managementEn from "./locales/en/management.json"
import editorEn from "./locales/en/editor.json"

import commonZh from "./locales/zh/common.json"
import toolsZh from "./locales/zh/tools.json"
import dialogsZh from "./locales/zh/dialogs.json"
import managementZh from "./locales/zh/management.json"
import editorZh from "./locales/zh/editor.json"

import commonEs from "./locales/es/common.json"
import toolsEs from "./locales/es/tools.json"
import dialogsEs from "./locales/es/dialogs.json"
import managementEs from "./locales/es/management.json"
import editorEs from "./locales/es/editor.json"

import commonHi from "./locales/hi/common.json"
import toolsHi from "./locales/hi/tools.json"
import dialogsHi from "./locales/hi/dialogs.json"
import managementHi from "./locales/hi/management.json"
import editorHi from "./locales/hi/editor.json"

import commonAr from "./locales/ar/common.json"
import toolsAr from "./locales/ar/tools.json"
import dialogsAr from "./locales/ar/dialogs.json"
import managementAr from "./locales/ar/management.json"
import editorAr from "./locales/ar/editor.json"

import commonFr from "./locales/fr/common.json"
import toolsFr from "./locales/fr/tools.json"
import dialogsFr from "./locales/fr/dialogs.json"
import managementFr from "./locales/fr/management.json"
import editorFr from "./locales/fr/editor.json"

import commonBn from "./locales/bn/common.json"
import toolsBn from "./locales/bn/tools.json"
import dialogsBn from "./locales/bn/dialogs.json"
import managementBn from "./locales/bn/management.json"
import editorBn from "./locales/bn/editor.json"

import commonPt from "./locales/pt/common.json"
import toolsPt from "./locales/pt/tools.json"
import dialogsPt from "./locales/pt/dialogs.json"
import managementPt from "./locales/pt/management.json"
import editorPt from "./locales/pt/editor.json"

import commonRu from "./locales/ru/common.json"
import toolsRu from "./locales/ru/tools.json"
import dialogsRu from "./locales/ru/dialogs.json"
import managementRu from "./locales/ru/management.json"
import editorRu from "./locales/ru/editor.json"

import commonJa from "./locales/ja/common.json"
import toolsJa from "./locales/ja/tools.json"
import dialogsJa from "./locales/ja/dialogs.json"
import managementJa from "./locales/ja/management.json"
import editorJa from "./locales/ja/editor.json"

import commonKo from "./locales/ko/common.json"
import toolsKo from "./locales/ko/tools.json"
import dialogsKo from "./locales/ko/dialogs.json"
import managementKo from "./locales/ko/management.json"
import editorKo from "./locales/ko/editor.json"

export const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "es", label: "Español" },
  { code: "hi", label: "हिन्दी" },
  { code: "ar", label: "العربية" },
  { code: "fr", label: "Français" },
  { code: "bn", label: "বাংলা" },
  { code: "pt", label: "Português" },
  { code: "ru", label: "Русский" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
] as const

const resources = {
  en: {
    common: commonEn,
    tools: toolsEn,
    dialogs: dialogsEn,
    management: managementEn,
    editor: editorEn,
  },
  zh: {
    common: commonZh,
    tools: toolsZh,
    dialogs: dialogsZh,
    management: managementZh,
    editor: editorZh,
  },
  es: {
    common: commonEs,
    tools: toolsEs,
    dialogs: dialogsEs,
    management: managementEs,
    editor: editorEs,
  },
  hi: {
    common: commonHi,
    tools: toolsHi,
    dialogs: dialogsHi,
    management: managementHi,
    editor: editorHi,
  },
  ar: {
    common: commonAr,
    tools: toolsAr,
    dialogs: dialogsAr,
    management: managementAr,
    editor: editorAr,
  },
  fr: {
    common: commonFr,
    tools: toolsFr,
    dialogs: dialogsFr,
    management: managementFr,
    editor: editorFr,
  },
  bn: {
    common: commonBn,
    tools: toolsBn,
    dialogs: dialogsBn,
    management: managementBn,
    editor: editorBn,
  },
  pt: {
    common: commonPt,
    tools: toolsPt,
    dialogs: dialogsPt,
    management: managementPt,
    editor: editorPt,
  },
  ru: {
    common: commonRu,
    tools: toolsRu,
    dialogs: dialogsRu,
    management: managementRu,
    editor: editorRu,
  },
  ja: {
    common: commonJa,
    tools: toolsJa,
    dialogs: dialogsJa,
    management: managementJa,
    editor: editorJa,
  },
  ko: {
    common: commonKo,
    tools: toolsKo,
    dialogs: dialogsKo,
    management: managementKo,
    editor: editorKo,
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    defaultNS: "common",
    ns: ["common", "tools", "dialogs", "management", "editor"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "referencer-language",
      caches: ["localStorage"],
    },
  })

export default i18n
