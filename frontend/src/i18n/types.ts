import type commonEn from "./locales/en/common.json";
import type toolsEn from "./locales/en/tools.json";
import type dialogsEn from "./locales/en/dialogs.json";
import type managementEn from "./locales/en/management.json";
import type editorEn from "./locales/en/editor.json";
import type tourEn from "./locales/en/tour.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof commonEn;
      tools: typeof toolsEn;
      dialogs: typeof dialogsEn;
      management: typeof managementEn;
      editor: typeof editorEn;
      tour: typeof tourEn;
    };
  }
}
