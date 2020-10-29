import Graph from "graphology";
import { toPairs, values as objectValues } from "lodash";

import { Aggregation, FieldDefinition } from "./types";

function aggregateNumbers(values: number[]): Aggregation {
  // Sort values:
  const sortedValues = values.sort();
  let min = Infinity,
    max = -Infinity;
  for (let i = 0, l = sortedValues.length; i < l; i++) {
    const v = sortedValues[i];
    min = Math.min(min, v);
    max = Math.max(max, v);
  }

  // Early exit on weird cases:
  if (!sortedValues.length) return { min: NaN, max: NaN, values: [] };
  if (max === min)
    return {
      min,
      max,
      values: [{ label: min + "", count: sortedValues.length }],
    };

  // Select step:
  const scale = Math.floor(Math.log10(max - min));
  const pow = Math.pow(10, scale);
  const width = 800; // (arbitrary choice)
  const step =
    ([1, 2, 5].find((n) => {
      const barWidth = (width / (max + 1 - min)) * n * pow;
      return barWidth >= 8;
    }) || 10) * pow;

  // Aggregate by step:
  const index: { [key: number]: number } = {};
  for (let i = 0, l = sortedValues.length; i < l; i++) {
    const v = sortedValues[i];
    const lowerBound = v - (((v % step) + step) % step);
    index[lowerBound] = (index[lowerBound] || 0) + 1;
  }
  const vals = objectValues(index);

  return {
    min: Math.min(...vals),
    max: Math.max(...vals),
    values: toPairs(index).map(([lowerBound, value]) => ({
      label: `${lowerBound} - ${+lowerBound + step}`,
      count: value,
    })),
  };
}

function aggregateStrings(index: { [val: string]: number }): Aggregation {
  const values = objectValues(index);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    values: toPairs(index).map(([label, value]) => ({ label, count: value })),
  };
}

export function getAggregations(
  graph: Graph,
  fields: FieldDefinition[]
): { [field: string]: Aggregation } {
  const aggregations: { [field: string]: Aggregation } = {};
  const numberIndices: { [field: string]: number[] } = {};
  const stringIndices: { [field: string]: { [str: string]: number } } = {};

  // Init indices:
  fields.forEach((field) => {
    if (field.type === "number") {
      numberIndices[field.key] = [];
    } else if (field.type === "string") {
      stringIndices[field.key] = {};
    }
  });

  // Index data
  for (const iter of graph.nodeEntries()) {
    const attributes = iter[1];
    fields.forEach((field) => {
      const val = attributes[field.key];
      if (field.type === "number") {
        numberIndices[field.key].push(+val);
      } else if (field.type === "string") {
        stringIndices[field.key][val] =
          (stringIndices[field.key][val] || 0) + 1;
      }
    });
  }

  // Aggregate the indices:
  fields.forEach((field) => {
    if (field.type === "number") {
      aggregations[field.key] = aggregateNumbers(numberIndices[field.key]);
    } else if (field.type === "string") {
      aggregations[field.key] = aggregateStrings(stringIndices[field.key]);
    }
  });

  return aggregations;
}
