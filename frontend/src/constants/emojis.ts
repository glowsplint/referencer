/** Quick-pick emojis shown in the inline reaction picker. */
export const QUICK_EMOJIS = [
  "\u{1F44D}", // thumbs up
  "\u2764\uFE0F", // red heart
  "\u2705", // check mark
  "\u{1F525}", // fire
  "\u{1F602}", // face with tears of joy
  "\u{1F914}", // thinking face
  "\u{1F64F}", // folded hands
  "\u{1F440}", // eyes
] as const;

export interface EmojiCategory {
  label: string;
  emojis: string[];
}

/** Full emoji categories for the expanded picker popover. */
export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    label: "Smileys",
    emojis: [
      "\u{1F600}",
      "\u{1F603}",
      "\u{1F604}",
      "\u{1F601}",
      "\u{1F606}",
      "\u{1F605}",
      "\u{1F602}",
      "\u{1F923}",
      "\u{1F60A}",
      "\u{1F607}",
      "\u{1F642}",
      "\u{1F643}",
      "\u{1F609}",
      "\u{1F60C}",
      "\u{1F60D}",
      "\u{1F970}",
      "\u{1F618}",
      "\u{1F617}",
      "\u{1F619}",
      "\u{1F61A}",
      "\u{1F60B}",
      "\u{1F61B}",
      "\u{1F61C}",
      "\u{1F92A}",
      "\u{1F61D}",
      "\u{1F914}",
      "\u{1F928}",
      "\u{1F610}",
      "\u{1F611}",
      "\u{1F636}",
      "\u{1F60F}",
      "\u{1F612}",
      "\u{1F644}",
      "\u{1F62C}",
      "\u{1F62E}",
      "\u{1F631}",
      "\u{1F622}",
      "\u{1F62D}",
      "\u{1F624}",
      "\u{1F621}",
    ],
  },
  {
    label: "Gestures",
    emojis: [
      "\u{1F44D}",
      "\u{1F44E}",
      "\u{1F44A}",
      "\u270A",
      "\u{1F91B}",
      "\u{1F91C}",
      "\u{1F44F}",
      "\u{1F64C}",
      "\u{1F450}",
      "\u{1F932}",
      "\u{1F91D}",
      "\u{1F64F}",
      "\u270D\uFE0F",
      "\u{1F485}",
      "\u{1F933}",
      "\u{1F4AA}",
      "\u{1F9B6}",
      "\u{1F9B5}",
      "\u{1F442}",
      "\u{1F443}",
      "\u{1F440}",
      "\u{1F441}\uFE0F",
      "\u{1F445}",
      "\u{1F444}",
      "\u{1F9E0}",
    ],
  },
  {
    label: "Hearts",
    emojis: [
      "\u2764\uFE0F",
      "\u{1F9E1}",
      "\u{1F49B}",
      "\u{1F49A}",
      "\u{1F499}",
      "\u{1F49C}",
      "\u{1F5A4}",
      "\u{1F90D}",
      "\u{1F90E}",
      "\u{1F498}",
      "\u{1F49D}",
      "\u{1F496}",
      "\u{1F497}",
      "\u{1F493}",
      "\u{1F49E}",
      "\u{1F495}",
      "\u{1F48C}",
    ],
  },
  {
    label: "Symbols",
    emojis: [
      "\u2705",
      "\u274C",
      "\u2753",
      "\u2757",
      "\u{1F4AF}",
      "\u{1F525}",
      "\u2B50",
      "\u{1F31F}",
      "\u{1F4A5}",
      "\u{1F4A2}",
      "\u{1F4A6}",
      "\u{1F4A8}",
      "\u{1F4AC}",
      "\u{1F4AD}",
      "\u{1F6D1}",
      "\u{1F389}",
      "\u{1F38A}",
      "\u{1F388}",
      "\u{1F381}",
      "\u{1F3AF}",
    ],
  },
];
