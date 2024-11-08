import { flattenDeep } from "lodash";
import papa, { ParseResult } from "papaparse";

import { CSVFormat, Field, FieldIndices, GeneratedField } from "./types";

const incrementTypeIndex = (
  indices: { [field: string]: { [field: string]: number } },
  field: string,
  value: string,
): void => {
  const typeIndex = indices[field] || {};
  typeIndex[value] = (+typeIndex[value] || 0) + 1;
  indices[field] = typeIndex;
};

const indexRow = (
  csvRow: { [key: string]: string },
  format: CSVFormat,
  indices: FieldIndices,
  yearRange: { min?: number; max?: number },
) => {
  // references
  const refsField = format.references;
  // year filter
  if (yearRange && (yearRange.min || yearRange.max) && format.year) {
    if (yearRange.min && csvRow[format.year.key] < "" + yearRange.min)
      // don't load this row cause out of range
      return;
    if (yearRange.max && csvRow[format.year.key] > "" + yearRange.max)
      // don't load this row cause out of range
      return;
  }
  if (refsField && csvRow[refsField.key]) {
    // test duplication
    const hash = format.hash(csvRow);
    indices.hash = { ...indices.hash, [hash]: (indices.hash[hash] || 0) + 1 };
    if (indices.hash[hash] > 1) {
      return;
    }

    (csvRow[refsField.key].split(refsField.separator || ",") as string[])
      .filter((ref) => ref !== "")
      .forEach((ref) => {
        incrementTypeIndex(indices, "references", ref.trim());
      });
    // metadata factory
    const metadata = [...format.metadataFields, format.type, format.year].reduce(
      (meta: Record<string, string[]>, f: Field) => {
        // get value
        let values = [];
        // parse multiple values
        if (csvRow[f.key]) {
          if (f.separator) values = csvRow[f.key].split(f.separator).filter((v) => v !== "");
          else values.push(csvRow[f.key]);

          // index
          values.forEach((value: string) => {
            incrementTypeIndex(indices, f.variableName, value.trim());
          });

          // craft a parsed line for generated fields
          return { ...meta, [f.variableName]: values };
        } else {
          return meta;
        }
      },
      {},
    );
    // generated fields
    if (format.generatedFields)
      format.generatedFields?.forEach((f: GeneratedField) => {
        const nodes = f.maker(metadata);
        if (nodes && nodes.length > 0) {
          nodes
            .filter((node) => node && node.key && node.key !== "")
            .forEach((node) => incrementTypeIndex(indices, f.variableName, node.key));
        }
      });
    return indices;
  }
};

export async function indexCSVs(
  files: File[],
  format: CSVFormat,
  range: { min?: number; max?: number },
  setLoaderMessage: (message: string) => void,
): Promise<FieldIndices> {
  const indices: FieldIndices = { hash: {} };

  await Promise.all(
    files.map(
      (file: File) =>
        new Promise((resolve) => {
          papa.parse(file, {
            // add separator
            delimiter: format.separator,
            header: true,
            step: function (row: ParseResult<{ [key: string]: string }>) {
              // transform row into graph nodes and edges
              indexRow(flattenDeep<{ [key: string]: string }>([row.data])[0], format, indices, range);
            },
            complete: () => {
              setLoaderMessage(`file "${file.name}" parsed`);
              resolve(null);
            },
          });
        }),
    ),
  );

  return indices;
}
