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

import commonDe from "./locales/de/common.json"
import toolsDe from "./locales/de/tools.json"
import dialogsDe from "./locales/de/dialogs.json"
import managementDe from "./locales/de/management.json"
import editorDe from "./locales/de/editor.json"

import commonIt from "./locales/it/common.json"
import toolsIt from "./locales/it/tools.json"
import dialogsIt from "./locales/it/dialogs.json"
import managementIt from "./locales/it/management.json"
import editorIt from "./locales/it/editor.json"

import commonTr from "./locales/tr/common.json"
import toolsTr from "./locales/tr/tools.json"
import dialogsTr from "./locales/tr/dialogs.json"
import managementTr from "./locales/tr/management.json"
import editorTr from "./locales/tr/editor.json"

import commonVi from "./locales/vi/common.json"
import toolsVi from "./locales/vi/tools.json"
import dialogsVi from "./locales/vi/dialogs.json"
import managementVi from "./locales/vi/management.json"
import editorVi from "./locales/vi/editor.json"

import commonTh from "./locales/th/common.json"
import toolsTh from "./locales/th/tools.json"
import dialogsTh from "./locales/th/dialogs.json"
import managementTh from "./locales/th/management.json"
import editorTh from "./locales/th/editor.json"

import commonId from "./locales/id/common.json"
import toolsId from "./locales/id/tools.json"
import dialogsId from "./locales/id/dialogs.json"
import managementId from "./locales/id/management.json"
import editorId from "./locales/id/editor.json"

import commonPl from "./locales/pl/common.json"
import toolsPl from "./locales/pl/tools.json"
import dialogsPl from "./locales/pl/dialogs.json"
import managementPl from "./locales/pl/management.json"
import editorPl from "./locales/pl/editor.json"

import commonUk from "./locales/uk/common.json"
import toolsUk from "./locales/uk/tools.json"
import dialogsUk from "./locales/uk/dialogs.json"
import managementUk from "./locales/uk/management.json"
import editorUk from "./locales/uk/editor.json"

import commonNl from "./locales/nl/common.json"
import toolsNl from "./locales/nl/tools.json"
import dialogsNl from "./locales/nl/dialogs.json"
import managementNl from "./locales/nl/management.json"
import editorNl from "./locales/nl/editor.json"

import commonSw from "./locales/sw/common.json"
import toolsSw from "./locales/sw/tools.json"
import dialogsSw from "./locales/sw/dialogs.json"
import managementSw from "./locales/sw/management.json"
import editorSw from "./locales/sw/editor.json"

import commonMs from "./locales/ms/common.json"
import toolsMs from "./locales/ms/tools.json"
import dialogsMs from "./locales/ms/dialogs.json"
import managementMs from "./locales/ms/management.json"
import editorMs from "./locales/ms/editor.json"

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
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "tr", label: "Türkçe" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "th", label: "ไทย" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "pl", label: "Polski" },
  { code: "uk", label: "Українська" },
  { code: "nl", label: "Nederlands" },
  { code: "sw", label: "Kiswahili" },
  { code: "ms", label: "Bahasa Melayu" },
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
  de: {
    common: commonDe,
    tools: toolsDe,
    dialogs: dialogsDe,
    management: managementDe,
    editor: editorDe,
  },
  it: {
    common: commonIt,
    tools: toolsIt,
    dialogs: dialogsIt,
    management: managementIt,
    editor: editorIt,
  },
  tr: {
    common: commonTr,
    tools: toolsTr,
    dialogs: dialogsTr,
    management: managementTr,
    editor: editorTr,
  },
  vi: {
    common: commonVi,
    tools: toolsVi,
    dialogs: dialogsVi,
    management: managementVi,
    editor: editorVi,
  },
  th: {
    common: commonTh,
    tools: toolsTh,
    dialogs: dialogsTh,
    management: managementTh,
    editor: editorTh,
  },
  id: {
    common: commonId,
    tools: toolsId,
    dialogs: dialogsId,
    management: managementId,
    editor: editorId,
  },
  pl: {
    common: commonPl,
    tools: toolsPl,
    dialogs: dialogsPl,
    management: managementPl,
    editor: editorPl,
  },
  uk: {
    common: commonUk,
    tools: toolsUk,
    dialogs: dialogsUk,
    management: managementUk,
    editor: editorUk,
  },
  nl: {
    common: commonNl,
    tools: toolsNl,
    dialogs: dialogsNl,
    management: managementNl,
    editor: editorNl,
  },
  sw: {
    common: commonSw,
    tools: toolsSw,
    dialogs: dialogsSw,
    management: managementSw,
    editor: editorSw,
  },
  ms: {
    common: commonMs,
    tools: toolsMs,
    dialogs: dialogsMs,
    management: managementMs,
    editor: editorMs,
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
