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
  keys,
  values,
} from "lodash";

import {
  Aggregation,
  CSVFormat,
  Field,
  FieldDefinition,
  FieldIndices,
  GeneratedField,
} from "./types";

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
      lowerBound: +lowerBound,
      count: value,
    })),
  };
}

export function aggregateGraphNbArticles(
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
    }
  });

  return { aggregations, fields };
}

export function aggregateFieldIndices(
  fieldIndices: FieldIndices,
  format: CSVFormat
): {
  aggregations: { [field: string]: Aggregation };
  fields: FieldDefinition[];
} {
  const aggregations: { [field: string]: Aggregation } = {};

  const fields: FieldDefinition[] = [];

  // Aggregate the indices:
  keys(fieldIndices).forEach((fieldType) => {
    // populate fields
    let fieldDef: Field | GeneratedField | undefined;
    if (fieldType === "references") fieldDef = format.references;
    else {
      fieldDef = format.metadataFields.find(
        (f) => f.variableName === fieldType
      );
      if (!fieldDef && format.generatedFields)
        fieldDef = format.generatedFields.find(
          (f) => f.variableName === fieldType
        );
    }
    if (fieldDef)
      fields.push({
        label: fieldDef.variableLabel,
        key: fieldDef.variableName,
        type: "number",
      });
    // calculate cumulative buckets
    aggregations[fieldType] = aggregateCumulativeNumbers(
      values(fieldIndices[fieldType])
    );
  });

  return { aggregations, fields };
}
