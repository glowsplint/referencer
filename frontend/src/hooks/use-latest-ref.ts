import { useRef } from "react";

/** Keeps a ref always pointing at the latest value. Use in stable callbacks
 *  that need current props/state without re-creating the callback. */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
