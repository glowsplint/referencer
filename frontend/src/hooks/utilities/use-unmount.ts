// Runs a cleanup callback on component unmount. Uses a ref to always call
// the latest callback version without re-registering the effect.
import { useRef, useEffect } from "react";

/**
 * Hook that executes a callback when the component unmounts.
 *
 * @param callback Function to be called on component unmount
 */
export const useUnmount = (callback: () => void) => {
  const ref = useRef(callback);

  useEffect(() => {
    ref.current = callback;
  });

  useEffect(
    () => () => {
      ref.current();
    },
    [],
  );
};

export default useUnmount;
