/**
 * Lightweight i18n init for tests — English only, no LanguageDetector.
 * Replaces the full `@/i18n` import which loads all 31 locales (155 JSON files).
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import commonEn from "@/i18n/locales/en/common.json";
import toolsEn from "@/i18n/locales/en/tools.json";
import dialogsEn from "@/i18n/locales/en/dialogs.json";
import managementEn from "@/i18n/locales/en/management.json";
import editorEn from "@/i18n/locales/en/editor.json";
import tourEn from "@/i18n/locales/en/tour.json";

i18n.use(initReactI18next).init({
  lng: "en",
  resources: {
    en: {
      common: commonEn,
      tools: toolsEn,
      dialogs: dialogsEn,
      management: managementEn,
      editor: editorEn,
      tour: tourEn,
    },
  },
  fallbackLng: "en",
  defaultNS: "common",
  ns: ["common", "tools", "dialogs", "management", "editor", "tour"],
  interpolation: {
    escapeValue: false,
  },
  initImmediate: false,
});

export default i18n;
