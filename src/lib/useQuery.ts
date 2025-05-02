import { fromPairs } from "lodash";
import { useEffect, useMemo, useState } from "react";

function readHash() {
  return window.location.hash.substring(1);
}

function useHash(): string {
  const [hash, setHash] = useState(readHash);

  useEffect(() => {
    const handleHashChange = () => {
      setHash(readHash());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return hash;
}

export function useQuery() {
  const hash = useHash();
  const urlSearchParams = useMemo(() => new URLSearchParams(hash.replace(/^\?/, "")), [hash]);

  return { query: fromPairs([...urlSearchParams]) };
}
