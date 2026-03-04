export const STUDY_SCHEMES = [
  {
    id: "inductive",
    nameKey: "schemes.inductive.name",
    descriptionKey: "schemes.inductive.description",
    layers: [
      { nameKey: "schemes.inductive.layers.keyTerms", color: "#fcd34d" },
      { nameKey: "schemes.inductive.layers.commands", color: "#fca5a5" },
      { nameKey: "schemes.inductive.layers.promises", color: "#86efac" },
      { nameKey: "schemes.inductive.layers.attributes", color: "#93c5fd" },
      { nameKey: "schemes.inductive.layers.structure", color: "#c4b5fd" },
      { nameKey: "schemes.inductive.layers.questions", color: "#f9a8d4" },
    ],
  },
  {
    id: "character",
    nameKey: "schemes.character.name",
    descriptionKey: "schemes.character.description",
    layers: [
      { nameKey: "schemes.character.layers.godChrist", color: "#93c5fd" },
      { nameKey: "schemes.character.layers.protagonist", color: "#86efac" },
      { nameKey: "schemes.character.layers.antagonist", color: "#fca5a5" },
      { nameKey: "schemes.character.layers.speech", color: "#fcd34d" },
    ],
  },
  {
    id: "oia",
    nameKey: "schemes.oia.name",
    descriptionKey: "schemes.oia.description",
    layers: [
      { nameKey: "schemes.oia.layers.observation", color: "#fcd34d" },
      { nameKey: "schemes.oia.layers.interpretation", color: "#93c5fd" },
      { nameKey: "schemes.oia.layers.application", color: "#86efac" },
    ],
  },
] as const;

export type StudyScheme = (typeof STUDY_SCHEMES)[number];
