import { forEach, fromPairs, isNil, mapValues, sortBy, take, uniq, zipObject } from "lodash";

import { FIELDS_META, cleanFieldValues } from "./consts";
import { CustomFieldType, CustomFieldTypes, FIELD_IDS, FieldIndices, MetadataValue, RichWork, Work } from "./types";

export async function indexWorks(works: RichWork[]): Promise<FieldIndices> {
  const indices: FieldIndices = {
    custom: {},
    openAlex: zipObject(
      FIELD_IDS,
      FIELD_IDS.map(() => ({})),
    ),
  };

  for (let workIndex = 0; workIndex < works.length; workIndex++) {
    const work = works[workIndex];

    for (let fieldIndex = 0; fieldIndex < FIELD_IDS.length; fieldIndex++) {
      const field = FIELD_IDS[fieldIndex];
      const { getValues } = FIELDS_META[field];
      try {
        const values = await cleanFieldValues(getValues(work));
        values.forEach(({ id, label }) => {
          indices.openAlex[field][id] = indices.openAlex[field][id] || { count: 0, label };
          indices.openAlex[field][id].count++;
        });
      } catch (e) {
        console.error(`Could not index work`, work);
        console.error(e);
      }
    }

    for (const field in work.metadata) {
      const values = await cleanFieldValues(work.metadata[field]);
      values.forEach(({ id, label }) => {
        indices.custom[field] = indices.custom[field] || {};
        indices.custom[field][id] = indices.custom[field][id] || { count: 0, label };
        indices.custom[field][id].count++;
      });
    }
  }

  return indices;
}

/**
 * This function takes an array of string values, and tries various separators
 * to see if one does match enough values.
 */
const SEPARATORS = [";", ",", "|"] as const;
type Separator = (typeof SEPARATORS)[number];
export function guessSeparator(values: string[]): string | null {
  const separatorsFrequencies = SEPARATORS.reduce(
    (iter, sep) => ({
      ...iter,
      [sep]: 0,
    }),
    {},
  ) as Record<Separator, number>;

  values.forEach((value) =>
    SEPARATORS.forEach((sep) => {
      const split = value.split(sep);
      if (split.length > 1 && split.every((s) => !!s && !s.match(/(^ | $)/))) separatorsFrequencies[sep]++;
    }),
  );

  const bestSeparator = sortBy(
    SEPARATORS.filter((sep) => !!separatorsFrequencies[sep]),
    (sep) => -separatorsFrequencies[sep],
  )[0];
  return bestSeparator || null;
}

/**
 * This function takes a list of string values, and guesses whether that field should be considered qualitative and/or
 * quantitative:
 */
export function inferFieldType(values: string[], itemsCount: number): CustomFieldType {
  if (values.every((v) => !isNaN(+v))) {
    return { type: "number" };
  }

  const separator = guessSeparator(
    take(
      values.map((v) => "" + v),
      100,
    ),
  );

  const uniqValues = uniq(separator ? values.flatMap((v) => (v + "").split(separator)) : values);
  const uniqValuesCount = uniqValues.length;
  const valuesCount: Record<string, number> = {};
  const useSeparator =
    !!separator &&
    uniqValuesCount > 1 &&
    uniqValuesCount < 50 &&
    uniqValuesCount < Math.max(separator ? itemsCount : Math.pow(itemsCount, 0.75), 5);

  values.forEach((str) => {
    const list = useSeparator ? str.split(separator) : str ? [str] : [];
    list.forEach((s) => {
      valuesCount[s] = (valuesCount[s] || 0) + 1;
    });
  });

  return {
    type: "terms",
    separator: useSeparator ? separator : undefined,
    values: mapValues(valuesCount, (count, label) => ({ count, label })),
  };
}

export function enrichWorks(
  works: Work[],
  customMetadata: Record<string, Record<string, string>>,
): { works: RichWork[]; customFields: CustomFieldTypes } {
  const fields: Record<string, string[]> = {};

  // Identify all values:
  works.forEach(({ id }) => {
    const workCustomMetadata = customMetadata[id] || {};

    forEach(workCustomMetadata, (value, field) => {
      if (value) {
        fields[field] = fields[field] || [];
        fields[field].push(value);
      }
    });
  });

  // Infer field types:
  const fieldTypes: CustomFieldTypes = mapValues(fields, (values) => inferFieldType(values, works.length));

  // Enrich the works, with the proper custom field types:
  return {
    works: works.map((work) => ({
      ...work,
      metadata: fromPairs(
        Object.keys(fieldTypes).map((field) => {
          const rawValue = (customMetadata[work.id] || {})[field];
          const fieldType = fieldTypes[field];
          let value: MetadataValue | null = null;

          switch (fieldType.type) {
            case "boolean":
            case "number":
              // value = +rawValue;
              value = rawValue ? [rawValue] : [];
              break;
            case "terms":
              if (fieldType.separator) value = rawValue.split(fieldType.separator);
              else value = rawValue ? [rawValue] : [];
              break;
          }

          return [field, isNil(value) ? undefined : value];
        }),
      ),
    })),
    customFields: fieldTypes,
  };
}
