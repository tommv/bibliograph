import {
  forEach,
  groupBy,
  map,
  mapValues,
  max,
  min,
  keys as objectKeys,
  values as objectValues,
  sortBy,
  toPairs,
  zipObject,
} from "lodash";

import { Aggregation, Aggregations, CustomFieldTypes, FIELD_IDS, FieldIndices, RichWork } from "./types";

function aggregateCumulativeNumbers(values: number[]): Aggregation {
  // count cumulative number of occurrences
  const groupedValues = mapValues(groupBy(values), (v) => v.length);
  const occValues = sortBy(objectKeys(groupedValues).map((o) => +o));
  const totalNbItems = values.length;

  const occCumulIndex: { [key: number]: number } = {};
  const occValuesMin = occValues[0];
  const occValuesMax = occValues.at(-1) || occValues[0];
  for (let occVal = occValuesMin; occVal <= occValuesMax; occVal++) {
    const previous = occCumulIndex[occVal - 1];
    occCumulIndex[occVal] = (previous !== undefined ? previous : totalNbItems) - (groupedValues[occVal - 1] || 0);
  }

  return {
    min: min(objectValues(occCumulIndex)) as number,
    max: max(objectValues(occCumulIndex)) as number,
    values: toPairs(occCumulIndex).map(([lowerBound, value]) => ({
      lowerBound: +lowerBound,
      count: value,
    })),
  };
}

export function aggregateFieldIndices(
  fieldIndices: FieldIndices,
  works: RichWork[],
  customFields: CustomFieldTypes,
): Aggregations {
  const aggregations = {
    openAlex: zipObject(
      FIELD_IDS,
      FIELD_IDS.map(() => ({})),
    ),
    custom: {},
  } as Aggregations;

  FIELD_IDS.forEach((field) => {
    // Calculate cumulative buckets
    if (field === "records") {
      aggregations.openAlex[field] = aggregateCumulativeNumbers(works.map((work) => work.cited_by_count || 0));
    } else {
      aggregations.openAlex[field] = aggregateCumulativeNumbers(
        map(fieldIndices.openAlex[field], ({ count }) => count),
      );
    }
  });

  forEach(customFields, (fieldDef, field) => {
    switch (fieldDef.type) {
      case "boolean":
      case "number":
        // TODO
        break;
      case "terms":
        aggregations.custom[field] = aggregateCumulativeNumbers(map(fieldDef.values, ({ count }) => count));
        break;
    }
  });

  return aggregations;
}
