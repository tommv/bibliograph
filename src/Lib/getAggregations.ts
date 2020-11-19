import Graph from "graphology";
import {
  toPairs,
  values as objectValues,
  range,
  groupBy,
  keys as objectKeys,
  mapValues,
  keys,
  values,
  sortBy,
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
  const occValues = sortBy(objectKeys(groupedValues).map((o) => +o));
  const maxOcc = occValues.length - 1;
  const totalNbItems = values.length;
  // iterate on number of occurrences
  const occCumulIndex: { [key: number]: number } = range(
    occValues[0],
    maxOcc + 1
  ).reduce((index: { [key: number]: number }, occVal) => {
    // for each occ sum number of occurrences greater than current
    return {
      [occVal]:
      // start with the total number of items and then substract the nb of occ of last step
      // we therefro calculate the factorial series in reverse
        (index[occVal - 1] !== undefined ? index[occVal - 1] : totalNbItems) -
        (groupedValues[occVal - 1] || 0),
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
    if (fieldDef && !(fieldDef as Field).hidden)
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
