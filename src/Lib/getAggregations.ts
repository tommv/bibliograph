import Graph from "graphology";
import {
  toPairs,
  values as objectValues,
  range,
  groupBy,
  keys as objectKeys,
  min,
  max,
  mapValues,
} from "lodash";

import {
  Aggregation,
  CSVFormat,
  Field,
  FieldDefinition,
  GeneratedField,
} from "./types";
import { CSVFormats } from "../Lib/CSVFormats";

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

function aggregateCumulativeNumbers(values: number[]): Aggregation {
  // count cumulative number of occurrences
  const groupedValues = mapValues(groupBy(values), (v) => v.length);
  const occValues = objectKeys(groupedValues)
    .map((o) => +o)
    .sort();
  const maxOcc = occValues[occValues.length - 1];
  // iterate on number of occurrences
  const occCumulIndex: { [key: number]: number } = range(
    occValues[0],
    maxOcc + 1
  ).reduce((index, occVal) => {
    // for each occ sum number of occurences greater than current
    return {
      [occVal]: range(occVal, maxOcc + 1).reduce(
        (sum, o) => sum + groupedValues[o],
        0
      ),
      ...index,
    };
  }, {});

  return {
    min: Math.min(...objectValues(occCumulIndex)),
    max: Math.max(...objectValues(occCumulIndex)),
    values: toPairs(occCumulIndex).map(([lowerBound, value]) => ({
      label: `> ${+lowerBound - 1} records`,
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
  format: CSVFormat
): {
  aggregations: { [field: string]: Aggregation };
  fields: FieldDefinition[];
} {
  const aggregations: { [field: string]: Aggregation } = {};
  const numberIndices: { [field: string]: number[] } = {};
  const stringIndices: { [field: string]: { [str: string]: number } } = {};

  const fields: FieldDefinition[] = [];
  // Index data
  for (const iter of graph.nodeEntries()) {
    const attributes = iter[1];

    if (!numberIndices[attributes.type]) {
      numberIndices[attributes.type] = [];
      let fieldDef: Field | GeneratedField | undefined;
      if (attributes.type === "references") fieldDef = format.references;
      else {
        fieldDef = format.metadataFields.find(
          (f) => f.variableName === attributes.type
        );
        if (!fieldDef && format.generatedFields)
          fieldDef = format.generatedFields.find(
            (f) => f.variableName === attributes.type
          );
      }
      if (fieldDef)
        fields.push({
          label: fieldDef.variableLabel,
          key: fieldDef.variableName,
          type: "number",
        });
    }
    numberIndices[attributes.type].push(+attributes.nbArticles);
  }

  // Aggregate the indices:
  fields.forEach((field) => {
    if (field.type === "number") {
      aggregations[field.key] = aggregateCumulativeNumbers(
        numberIndices[field.key]
      );
    } else if (field.type === "string") {
      aggregations[field.key] = aggregateStrings(stringIndices[field.key]);
    }
  });

  return { aggregations, fields };
}
