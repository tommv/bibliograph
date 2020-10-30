import { UndirectedGraph } from "graphology";
import papa, { ParseResult } from "papaparse";
import { Field, GeneratedField, CSVFormat, FieldIndices } from "./types";
import { flattenDeep } from "lodash";
import { combinations } from "obliterator";

const incrementTypeIndex = (
  indices: { [field: string]: { [field: string]: number } },
  field: string,
  value: string
): void => {
  const typeIndex = indices[field] || {};
  typeIndex[value] = (+typeIndex[value] || 0) + 1;
  indices[field] = typeIndex;
};

const indexRow = (
  csvRow: { [key: string]: string },
  format: CSVFormat,
  indices: FieldIndices
) => {
  // references
  const refsField = format.references;
  if (refsField && csvRow[refsField.key]) {
    (csvRow[refsField.key].split(
      refsField.separator || ","
    ) as string[]).forEach((ref) => {
      incrementTypeIndex(indices, "references", ref);
    });
    // metadata factory
    const metadata = format.metadataFields.reduce((meta: {}, f: Field) => {
      // get value
      let values = [];
      // parse multiple values
      if (csvRow[f.key]) {
        if (f.separator) values = csvRow[f.key].split(f.separator);
        else values.push(csvRow[f.key]);
        // index if not hidden field
        if (!f.hidden)
          values.forEach((value: string) => {
            incrementTypeIndex(indices, f.variableName, value);
          });
        // craft a parsed line for generated fields
        return { ...meta, [f.variableName]: values };
      } else {
        return meta;
      }
    }, {});
    // generated fields
    if (format.generatedFields)
      format.generatedFields?.forEach((f: GeneratedField) => {
        const nodes = f.maker(metadata);
        if (nodes && nodes.length > 0) {
          nodes.forEach((node) =>
            incrementTypeIndex(indices, f.variableName, node.key)
          );
        }
      });
    return indices;
  }
};

export function indexCSVs(
  files: File[],
  format: CSVFormat,
  range: { min?: number; max?: number }
): Promise<FieldIndices> {
  const indices: FieldIndices = {};
  return Promise.all(
    files.map(
      (file: File) =>
        new Promise((resolve) => {
          papa.parse(file, {
            // add separator
            delimiter: format.separator,
            header: true,
            step: function (row: ParseResult<{ [key: string]: string }>) {
              // transform row into graph nodes and edges
              indexRow(
                flattenDeep([row.data])[0],
                format,
                indices
                //range
              );
            },
            complete: () => {
              resolve();
            },
          });
        })
    )
  ).then(() => indices);
}
