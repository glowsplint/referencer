import { Format, SelectionMode } from '../../common/constants';
import { SetStateAction } from 'react';

// Canvas
type StateMachinePattern<T> = (
  event: T,
  target: SpanID
) => {
  condition: boolean;
  handler: () => void;
};

interface StateMachineMouse {
  onMouseDown: StateMachinePattern<MouseEvent>[];
  onMouseMove: StateMachinePattern<MouseEvent>[];
  onMouseUp: StateMachinePattern<MouseEvent>[];
}

interface StateMachineKeyboard {
  onKeyUp: StateMachinePattern<React.KeyboardEvent>[];
  onKeyDown: StateMachinePattern<React.KeyboardEvent>[];
}

type BoundingBox = {
  width: number;
  height: number;
  x: number;
  y: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
};

/* Annotations */

// SpanID is [textAreaID, data-text-index, data-phrase-index, data-pure-text-index]
type SpanID = [number, number, number, number];

interface Interval {
  start: SpanID;
  end: SpanID;
}

interface ArrowIndices {
  anchor: Interval;
  target: Interval;
}

interface AnnotationInfo {
  colour: string;
  text: string;
}

type IArrow = Map<ArrowIndices, AnnotationInfo>;

// While the arrow is in creation, its target can change but its anchor is fixed.
type Storage<T> = {
  inCreation: {
    anchor: Interval;
    target: Interval;
    colour: string;
  };
  finished: T;
};

type Arrows = Storage<IArrow>;

interface Selection extends Interval {
  anchor?: SpanID;
  text?: string;
}

type Highlights = Map<Interval, AnnotationInfo>;

interface Annotations {
  isPainterMode: boolean;
  activeColour: string;
  arrows: Arrows;
  highlights: Highlights;
  selection: Selection;
}

type SetAnnotations = React.Dispatch<SetStateAction<Annotations>>;

/* Login */
interface Login {
  displayName: string;
  spaceID: string;
}

type SetLogin = React.Dispatch<SetStateAction<Login>>;

/* Settings */
interface Settings {
  isDarkMode: boolean;
  isZenMode: boolean;
  isJustified: boolean;
  isLayersOn: boolean;
  isMultipleRowsLayout: boolean;
  isSettingsOpen: boolean;
}

type SetSettings = React.Dispatch<SetStateAction<Settings>>;

/* Texts */
interface Texts {
  headers: string[];
  bodies: ParsedText[];
  isDisplayed: boolean[];
}

type SetTexts = React.Dispatch<SetStateAction<Texts>>;

type TextType =
  | Format
  | "IndentedVerseNumber"
  | "InlineFootnote"
  | "InlineVerseNumber"
  | "Italics"
  | "ItalicsBlock"
  | "ParagraphSpacer"
  | "SectionHeader";

interface TextInfo {
  id: number;
  format: TextType;
  text: string;
}

interface ParsedText {
  mainText: TextInfo[];
  footnotes: TextInfo[];
}

/* Tracking */
interface ITracking {
  current: SelectionMode;
  previous: SelectionMode;
}

interface Tracking {
  mode: ITracking;
  mouse: {
    x: number;
    y: number;
  };
}

type SetTracking = React.Dispatch<SetStateAction<Tracking>>;

export type {
  AnnotationInfo,
  Annotations,
  ArrowIndices,
  Arrows,
  BoundingBox,
  Highlights,
  IArrow,
  ITracking,
  Interval,
  Login,
  ParsedText,
  Selection,
  SetAnnotations,
  SetLogin,
  SetSettings,
  SetTexts,
  SetTracking,
  Settings,
  SpanID,
  StateMachineKeyboard,
  StateMachineMouse,
  TextInfo,
  TextType,
  Texts,
  Tracking,
};
