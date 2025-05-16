import { isNil } from "lodash";
import { useCallback, useEffect, useState } from "react";

type ValueType = string | null | undefined;

export function useLocalStorage(key: string): [ValueType, (newValue: ValueType) => void] {
  const [state, setState] = useState<ValueType>(localStorage.getItem(key));
  const writeValue = useCallback(
    (newValue: ValueType) => {
      if (isNil(newValue)) localStorage.removeItem(key);
      else localStorage.setItem(key, newValue);
      setState(newValue);
    },
    [key],
  );

  useEffect(() => {
    setState(localStorage.getItem(key));
  }, [key]);

  return [state, writeValue];
}
