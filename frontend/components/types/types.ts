import { SpanID } from "../../contexts/Tracking";

// Types and interfaces
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

export type { StateMachineKeyboard, StateMachineMouse };
