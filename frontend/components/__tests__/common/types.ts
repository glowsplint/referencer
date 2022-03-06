interface JointState<T> {
  initial: T;
  toggled: T;
}

type JSSObject = { [key: string]: string };

type Checker<T> = ({
  subject,
  state,
  stateProperty,
}: {
  subject: HTMLElement;
  state: JointState<T>;
  stateProperty: keyof JointState<T>;
}) => void;

type ClassChecker = Checker<string>;
type StyleChecker = Checker<JSSObject>;

export type { JSSObject, JointState, Checker, ClassChecker, StyleChecker };
