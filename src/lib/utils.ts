import JSON5 from "json5";
import { forEach, isPlainObject } from "lodash";

export async function wait(delay: number = 0) {
  return new Promise((resolve) => (delay ? setTimeout(resolve, delay) : requestIdleCallback(resolve)));
}

export function unflattenObject<T = Record<string, unknown>>(
  o: Record<string, string>,
  {
    arrayKeys = [],
    jsonKeys = [],
    numberKeys = [],
    booleanKeys = [],
    casts = {},
  }: {
    arrayKeys?: string[];
    jsonKeys?: string[];
    numberKeys?: string[];
    booleanKeys?: string[];
    casts?: Record<string, (v?: string) => unknown>;
  } = {},
) {
  const typeCasts: Record<string, (v?: string) => unknown> = {};
  jsonKeys.forEach((key) => (typeCasts[key] = (v) => (typeof v === "string" && !!v ? JSON5.parse(v) : undefined)));
  numberKeys.forEach((key) => (typeCasts[key] = (v) => (typeof v === "string" && !!v ? +v : undefined)));
  booleanKeys.forEach((key) => (typeCasts[key] = (v) => (typeof v === "string" && !!v ? v === "True" : undefined)));

  const fullCasts = {
    ...typeCasts,
    ...casts,
  };

  const arrayKeysSet = new Set(arrayKeys);
  const res: Record<string, unknown> = {};
  forEach(o, (value, fullKey) => {
    const path = fullKey.split(".");
    let arrayValue = [value];

    path.reduce(
      (iter, key, step, a) => {
        const isLastStep = step === a.length - 1;
        const partialPath = a.slice(0, step + 1).join(".");

        if (arrayKeysSet.has(partialPath)) {
          arrayValue = value ? value.split("|") : [];
          iter[0][key] = arrayValue.map(() => ({}));
          return iter[0][key] as unknown as Record<string, unknown>[];
        }

        return iter.map((o, i) => {
          const v = arrayValue[i];
          if (!isLastStep) {
            if (!isPlainObject(o[key])) o[key] = {};
          } else {
            o[key] = fullCasts[fullKey] ? fullCasts[fullKey](v) : v;
          }
          return o[key] as Record<string, unknown>;
        });
      },
      [res],
    );
  });
  return res as unknown as T;
}
