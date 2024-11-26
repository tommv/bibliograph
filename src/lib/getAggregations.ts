import {
  groupBy,
  map,
  mapValues,
  keys as objectKeys,
  values as objectValues,
  range,
  sortBy,
  toPairs,
  zipObject,
} from "lodash";

import { Aggregation, Aggregations, FIELD_IDS, FieldIndices, Work } from "./types";

function aggregateCumulativeNumbers(values: number[]): Aggregation {
  // count cumulative number of occurrences
  const groupedValues = mapValues(groupBy(values), (v) => v.length);
  const occValues = sortBy(objectKeys(groupedValues).map((o) => +o));
  const maxOcc = occValues.length - 1;
  const totalNbItems = values.length;

  // Iterate on number of occurrences
  const occCumulIndex: { [key: number]: number } = range(occValues[0], maxOcc + 1).reduce(
    (index: { [key: number]: number }, occVal) => {
      // For each occurrence, sum number of occurrences greater than current
      return {
        [occVal]:
        // start with the total number of items and then subtract the nb of occ of last step
        // we therefor calculate the factorial series in reverse
          (index[occVal - 1] !== undefined ? index[occVal - 1] : totalNbItems) - (groupedValues[occVal - 1] || 0),
        ...index,
      };
    },
    {},
  );
  return {
    min: Math.min(...objectValues(occCumulIndex)),
    max: Math.max(...objectValues(occCumulIndex)),
    values: toPairs(occCumulIndex).map(([lowerBound, value]) => ({
      lowerBound: +lowerBound,
      count: value,
    })),
  };
}

export function aggregateFieldIndices(fieldIndices: FieldIndices, works: Work[]): Aggregations {
  const aggregations = zipObject(
    FIELD_IDS,
    FIELD_IDS.map(() => ({})),
  ) as Aggregations;

  // Aggregate the indices:
  FIELD_IDS.forEach((field) => {
    // Calculate cumulative buckets
    if (field === "records") {
      aggregations[field] = aggregateCumulativeNumbers(works.map((work) => work.cited_by_count || 0));
    } else {
      aggregations[field] = aggregateCumulativeNumbers(map(fieldIndices[field], ({ count }) => count));
    }
  });

  return aggregations;
}
