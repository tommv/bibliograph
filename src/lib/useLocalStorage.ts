import { isNil } from "lodash";
import { useEffect, useState } from "react";

export function useLocalStorage(key: string): ReturnType<typeof useState<string | null>> {
  const [state, setState] = useState<string | null | undefined>(localStorage.getItem(key));

  useEffect(() => {
    if (isNil(state)) localStorage.removeItem(key);
    else localStorage.setItem(key, state);
  }, [state]);

  useEffect(() => {
    setState(localStorage.getItem(key));
  }, [key]);

  return [state, setState];
}
