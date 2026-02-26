import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Static imports are required for bundling — each language has 6 namespace files.
import commonEn from "./locales/en/common.json";
import toolsEn from "./locales/en/tools.json";
import dialogsEn from "./locales/en/dialogs.json";
import managementEn from "./locales/en/management.json";
import editorEn from "./locales/en/editor.json";
import tourEn from "./locales/en/tour.json";

import commonZh from "./locales/zh/common.json";
import toolsZh from "./locales/zh/tools.json";
import dialogsZh from "./locales/zh/dialogs.json";
import managementZh from "./locales/zh/management.json";
import editorZh from "./locales/zh/editor.json";
import tourZh from "./locales/zh/tour.json";

import commonEs from "./locales/es/common.json";
import toolsEs from "./locales/es/tools.json";
import dialogsEs from "./locales/es/dialogs.json";
import managementEs from "./locales/es/management.json";
import editorEs from "./locales/es/editor.json";
import tourEs from "./locales/es/tour.json";

import commonHi from "./locales/hi/common.json";
import toolsHi from "./locales/hi/tools.json";
import dialogsHi from "./locales/hi/dialogs.json";
import managementHi from "./locales/hi/management.json";
import editorHi from "./locales/hi/editor.json";
import tourHi from "./locales/hi/tour.json";

import commonAr from "./locales/ar/common.json";
import toolsAr from "./locales/ar/tools.json";
import dialogsAr from "./locales/ar/dialogs.json";
import managementAr from "./locales/ar/management.json";
import editorAr from "./locales/ar/editor.json";
import tourAr from "./locales/ar/tour.json";

import commonFr from "./locales/fr/common.json";
import toolsFr from "./locales/fr/tools.json";
import dialogsFr from "./locales/fr/dialogs.json";
import managementFr from "./locales/fr/management.json";
import editorFr from "./locales/fr/editor.json";
import tourFr from "./locales/fr/tour.json";

import commonBn from "./locales/bn/common.json";
import toolsBn from "./locales/bn/tools.json";
import dialogsBn from "./locales/bn/dialogs.json";
import managementBn from "./locales/bn/management.json";
import editorBn from "./locales/bn/editor.json";
import tourBn from "./locales/bn/tour.json";

import commonPt from "./locales/pt/common.json";
import toolsPt from "./locales/pt/tools.json";
import dialogsPt from "./locales/pt/dialogs.json";
import managementPt from "./locales/pt/management.json";
import editorPt from "./locales/pt/editor.json";
import tourPt from "./locales/pt/tour.json";

import commonRu from "./locales/ru/common.json";
import toolsRu from "./locales/ru/tools.json";
import dialogsRu from "./locales/ru/dialogs.json";
import managementRu from "./locales/ru/management.json";
import editorRu from "./locales/ru/editor.json";
import tourRu from "./locales/ru/tour.json";

import commonJa from "./locales/ja/common.json";
import toolsJa from "./locales/ja/tools.json";
import dialogsJa from "./locales/ja/dialogs.json";
import managementJa from "./locales/ja/management.json";
import editorJa from "./locales/ja/editor.json";
import tourJa from "./locales/ja/tour.json";

import commonKo from "./locales/ko/common.json";
import toolsKo from "./locales/ko/tools.json";
import dialogsKo from "./locales/ko/dialogs.json";
import managementKo from "./locales/ko/management.json";
import editorKo from "./locales/ko/editor.json";
import tourKo from "./locales/ko/tour.json";

import commonDe from "./locales/de/common.json";
import toolsDe from "./locales/de/tools.json";
import dialogsDe from "./locales/de/dialogs.json";
import managementDe from "./locales/de/management.json";
import editorDe from "./locales/de/editor.json";
import tourDe from "./locales/de/tour.json";

import commonIt from "./locales/it/common.json";
import toolsIt from "./locales/it/tools.json";
import dialogsIt from "./locales/it/dialogs.json";
import managementIt from "./locales/it/management.json";
import editorIt from "./locales/it/editor.json";
import tourIt from "./locales/it/tour.json";

import commonTr from "./locales/tr/common.json";
import toolsTr from "./locales/tr/tools.json";
import dialogsTr from "./locales/tr/dialogs.json";
import managementTr from "./locales/tr/management.json";
import editorTr from "./locales/tr/editor.json";
import tourTr from "./locales/tr/tour.json";

import commonVi from "./locales/vi/common.json";
import toolsVi from "./locales/vi/tools.json";
import dialogsVi from "./locales/vi/dialogs.json";
import managementVi from "./locales/vi/management.json";
import editorVi from "./locales/vi/editor.json";
import tourVi from "./locales/vi/tour.json";

import commonTh from "./locales/th/common.json";
import toolsTh from "./locales/th/tools.json";
import dialogsTh from "./locales/th/dialogs.json";
import managementTh from "./locales/th/management.json";
import editorTh from "./locales/th/editor.json";
import tourTh from "./locales/th/tour.json";

import commonId from "./locales/id/common.json";
import toolsId from "./locales/id/tools.json";
import dialogsId from "./locales/id/dialogs.json";
import managementId from "./locales/id/management.json";
import editorId from "./locales/id/editor.json";
import tourId from "./locales/id/tour.json";

import commonPl from "./locales/pl/common.json";
import toolsPl from "./locales/pl/tools.json";
import dialogsPl from "./locales/pl/dialogs.json";
import managementPl from "./locales/pl/management.json";
import editorPl from "./locales/pl/editor.json";
import tourPl from "./locales/pl/tour.json";

import commonUk from "./locales/uk/common.json";
import toolsUk from "./locales/uk/tools.json";
import dialogsUk from "./locales/uk/dialogs.json";
import managementUk from "./locales/uk/management.json";
import editorUk from "./locales/uk/editor.json";
import tourUk from "./locales/uk/tour.json";

import commonNl from "./locales/nl/common.json";
import toolsNl from "./locales/nl/tools.json";
import dialogsNl from "./locales/nl/dialogs.json";
import managementNl from "./locales/nl/management.json";
import editorNl from "./locales/nl/editor.json";
import tourNl from "./locales/nl/tour.json";

import commonSw from "./locales/sw/common.json";
import toolsSw from "./locales/sw/tools.json";
import dialogsSw from "./locales/sw/dialogs.json";
import managementSw from "./locales/sw/management.json";
import editorSw from "./locales/sw/editor.json";
import tourSw from "./locales/sw/tour.json";

import commonMs from "./locales/ms/common.json";
import toolsMs from "./locales/ms/tools.json";
import dialogsMs from "./locales/ms/dialogs.json";
import managementMs from "./locales/ms/management.json";
import editorMs from "./locales/ms/editor.json";
import tourMs from "./locales/ms/tour.json";

import commonTl from "./locales/tl/common.json";
import toolsTl from "./locales/tl/tools.json";
import dialogsTl from "./locales/tl/dialogs.json";
import managementTl from "./locales/tl/management.json";
import editorTl from "./locales/tl/editor.json";
import tourTl from "./locales/tl/tour.json";

import commonAm from "./locales/am/common.json";
import toolsAm from "./locales/am/tools.json";
import dialogsAm from "./locales/am/dialogs.json";
import managementAm from "./locales/am/management.json";
import editorAm from "./locales/am/editor.json";
import tourAm from "./locales/am/tour.json";

import commonRo from "./locales/ro/common.json";
import toolsRo from "./locales/ro/tools.json";
import dialogsRo from "./locales/ro/dialogs.json";
import managementRo from "./locales/ro/management.json";
import editorRo from "./locales/ro/editor.json";
import tourRo from "./locales/ro/tour.json";

import commonYo from "./locales/yo/common.json";
import toolsYo from "./locales/yo/tools.json";
import dialogsYo from "./locales/yo/dialogs.json";
import managementYo from "./locales/yo/management.json";
import editorYo from "./locales/yo/editor.json";
import tourYo from "./locales/yo/tour.json";

import commonEl from "./locales/el/common.json";
import toolsEl from "./locales/el/tools.json";
import dialogsEl from "./locales/el/dialogs.json";
import managementEl from "./locales/el/management.json";
import editorEl from "./locales/el/editor.json";
import tourEl from "./locales/el/tour.json";

import commonHe from "./locales/he/common.json";
import toolsHe from "./locales/he/tools.json";
import dialogsHe from "./locales/he/dialogs.json";
import managementHe from "./locales/he/management.json";
import editorHe from "./locales/he/editor.json";
import tourHe from "./locales/he/tour.json";

import commonTa from "./locales/ta/common.json";
import toolsTa from "./locales/ta/tools.json";
import dialogsTa from "./locales/ta/dialogs.json";
import managementTa from "./locales/ta/management.json";
import editorTa from "./locales/ta/editor.json";
import tourTa from "./locales/ta/tour.json";

import commonSv from "./locales/sv/common.json";
import toolsSv from "./locales/sv/tools.json";
import dialogsSv from "./locales/sv/dialogs.json";
import managementSv from "./locales/sv/management.json";
import editorSv from "./locales/sv/editor.json";
import tourSv from "./locales/sv/tour.json";

import commonAf from "./locales/af/common.json";
import toolsAf from "./locales/af/tools.json";
import dialogsAf from "./locales/af/dialogs.json";
import managementAf from "./locales/af/management.json";
import editorAf from "./locales/af/editor.json";
import tourAf from "./locales/af/tour.json";

import { STORAGE_KEYS } from "@/constants/storage-keys";

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
  { code: "tl", label: "Filipino" },
  { code: "am", label: "አማርኛ" },
  { code: "ro", label: "Română" },
  { code: "yo", label: "Yorùbá" },
  { code: "el", label: "Ελληνικά" },
  { code: "he", label: "עברית" },
  { code: "ta", label: "தமிழ்" },
  { code: "sv", label: "Svenska" },
  { code: "af", label: "Afrikaans" },
] as const;

type Namespaces = {
  common: object;
  tools: object;
  dialogs: object;
  management: object;
  editor: object;
  tour: object;
};

const localeData: [string, Namespaces][] = [
  [
    "en",
    {
      common: commonEn,
      tools: toolsEn,
      dialogs: dialogsEn,
      management: managementEn,
      editor: editorEn,
      tour: tourEn,
    },
  ],
  [
    "zh",
    {
      common: commonZh,
      tools: toolsZh,
      dialogs: dialogsZh,
      management: managementZh,
      editor: editorZh,
      tour: tourZh,
    },
  ],
  [
    "es",
    {
      common: commonEs,
      tools: toolsEs,
      dialogs: dialogsEs,
      management: managementEs,
      editor: editorEs,
      tour: tourEs,
    },
  ],
  [
    "hi",
    {
      common: commonHi,
      tools: toolsHi,
      dialogs: dialogsHi,
      management: managementHi,
      editor: editorHi,
      tour: tourHi,
    },
  ],
  [
    "ar",
    {
      common: commonAr,
      tools: toolsAr,
      dialogs: dialogsAr,
      management: managementAr,
      editor: editorAr,
      tour: tourAr,
    },
  ],
  [
    "fr",
    {
      common: commonFr,
      tools: toolsFr,
      dialogs: dialogsFr,
      management: managementFr,
      editor: editorFr,
      tour: tourFr,
    },
  ],
  [
    "bn",
    {
      common: commonBn,
      tools: toolsBn,
      dialogs: dialogsBn,
      management: managementBn,
      editor: editorBn,
      tour: tourBn,
    },
  ],
  [
    "pt",
    {
      common: commonPt,
      tools: toolsPt,
      dialogs: dialogsPt,
      management: managementPt,
      editor: editorPt,
      tour: tourPt,
    },
  ],
  [
    "ru",
    {
      common: commonRu,
      tools: toolsRu,
      dialogs: dialogsRu,
      management: managementRu,
      editor: editorRu,
      tour: tourRu,
    },
  ],
  [
    "ja",
    {
      common: commonJa,
      tools: toolsJa,
      dialogs: dialogsJa,
      management: managementJa,
      editor: editorJa,
      tour: tourJa,
    },
  ],
  [
    "ko",
    {
      common: commonKo,
      tools: toolsKo,
      dialogs: dialogsKo,
      management: managementKo,
      editor: editorKo,
      tour: tourKo,
    },
  ],
  [
    "de",
    {
      common: commonDe,
      tools: toolsDe,
      dialogs: dialogsDe,
      management: managementDe,
      editor: editorDe,
      tour: tourDe,
    },
  ],
  [
    "it",
    {
      common: commonIt,
      tools: toolsIt,
      dialogs: dialogsIt,
      management: managementIt,
      editor: editorIt,
      tour: tourIt,
    },
  ],
  [
    "tr",
    {
      common: commonTr,
      tools: toolsTr,
      dialogs: dialogsTr,
      management: managementTr,
      editor: editorTr,
      tour: tourTr,
    },
  ],
  [
    "vi",
    {
      common: commonVi,
      tools: toolsVi,
      dialogs: dialogsVi,
      management: managementVi,
      editor: editorVi,
      tour: tourVi,
    },
  ],
  [
    "th",
    {
      common: commonTh,
      tools: toolsTh,
      dialogs: dialogsTh,
      management: managementTh,
      editor: editorTh,
      tour: tourTh,
    },
  ],
  [
    "id",
    {
      common: commonId,
      tools: toolsId,
      dialogs: dialogsId,
      management: managementId,
      editor: editorId,
      tour: tourId,
    },
  ],
  [
    "pl",
    {
      common: commonPl,
      tools: toolsPl,
      dialogs: dialogsPl,
      management: managementPl,
      editor: editorPl,
      tour: tourPl,
    },
  ],
  [
    "uk",
    {
      common: commonUk,
      tools: toolsUk,
      dialogs: dialogsUk,
      management: managementUk,
      editor: editorUk,
      tour: tourUk,
    },
  ],
  [
    "nl",
    {
      common: commonNl,
      tools: toolsNl,
      dialogs: dialogsNl,
      management: managementNl,
      editor: editorNl,
      tour: tourNl,
    },
  ],
  [
    "sw",
    {
      common: commonSw,
      tools: toolsSw,
      dialogs: dialogsSw,
      management: managementSw,
      editor: editorSw,
      tour: tourSw,
    },
  ],
  [
    "ms",
    {
      common: commonMs,
      tools: toolsMs,
      dialogs: dialogsMs,
      management: managementMs,
      editor: editorMs,
      tour: tourMs,
    },
  ],
  [
    "tl",
    {
      common: commonTl,
      tools: toolsTl,
      dialogs: dialogsTl,
      management: managementTl,
      editor: editorTl,
      tour: tourTl,
    },
  ],
  [
    "am",
    {
      common: commonAm,
      tools: toolsAm,
      dialogs: dialogsAm,
      management: managementAm,
      editor: editorAm,
      tour: tourAm,
    },
  ],
  [
    "ro",
    {
      common: commonRo,
      tools: toolsRo,
      dialogs: dialogsRo,
      management: managementRo,
      editor: editorRo,
      tour: tourRo,
    },
  ],
  [
    "yo",
    {
      common: commonYo,
      tools: toolsYo,
      dialogs: dialogsYo,
      management: managementYo,
      editor: editorYo,
      tour: tourYo,
    },
  ],
  [
    "el",
    {
      common: commonEl,
      tools: toolsEl,
      dialogs: dialogsEl,
      management: managementEl,
      editor: editorEl,
      tour: tourEl,
    },
  ],
  [
    "he",
    {
      common: commonHe,
      tools: toolsHe,
      dialogs: dialogsHe,
      management: managementHe,
      editor: editorHe,
      tour: tourHe,
    },
  ],
  [
    "ta",
    {
      common: commonTa,
      tools: toolsTa,
      dialogs: dialogsTa,
      management: managementTa,
      editor: editorTa,
      tour: tourTa,
    },
  ],
  [
    "sv",
    {
      common: commonSv,
      tools: toolsSv,
      dialogs: dialogsSv,
      management: managementSv,
      editor: editorSv,
      tour: tourSv,
    },
  ],
  [
    "af",
    {
      common: commonAf,
      tools: toolsAf,
      dialogs: dialogsAf,
      management: managementAf,
      editor: editorAf,
      tour: tourAf,
    },
  ],
];

const resources = Object.fromEntries(localeData);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    defaultNS: "common",
    ns: ["common", "tools", "dialogs", "management", "editor", "tour"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: STORAGE_KEYS.LANGUAGE,
      caches: ["localStorage"],
    },
  });

i18n.on("languageChanged", (lng) => {
  const rtlLanguages = ["ar", "he", "fa", "ur"];
  document.documentElement.dir = rtlLanguages.includes(lng) ? "rtl" : "ltr";
});

export default i18n;
