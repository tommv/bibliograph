import { UndirectedGraph } from "graphology";
import papa, { ParseResult } from "papaparse";
import { Field, GeneratedField, CSVFormat } from "./types";
import { flattenDeep } from "lodash";
import { combinations } from "obliterator";

const csvRowToGraph = (
  csvRow: { [key: string]: string },
  format: CSVFormat,
  graph: UndirectedGraph,
  yearRange: { min?: Number; max?: Number }
) => {
  // year filter
  if (yearRange && (yearRange.min || yearRange.max) && format.year) {
    if (yearRange.min && csvRow[format.year.key] < "" + yearRange.min)
      // don't load this row cause out of range
      return;
    if (yearRange.max && csvRow[format.year.key] > "" + yearRange.max)
      // don't load this row cause out of range
      return;
  }

  // references
  const refsField = format.references;
  if (refsField && csvRow[refsField.key]) {
    const references: string[] = (csvRow[refsField.key].split(
      refsField.separator || ","
    ) as string[]).map((ref) => {
      const n = graph.mergeNode(ref, {
        label: ref,
        type: "references",
      });
      graph.mergeNodeAttributes(n, {
        nbArticles: (graph.getNodeAttribute(ref, "nbArticles") || 0) + 1,
      });
      return n;
    });
    // metadata factory
    const metadataNodes: string[] = [];
    const metadata = format.metadataFields.reduce((meta: {}, f: Field) => {
      // get value
      let values = [];
      // parse multiple values
      if (csvRow[f.key]) {
        if (f.separator) values = csvRow[f.key].split(f.separator);
        else values.push(csvRow[f.key]);
        // generate node if not hidden field
        if (!f.hidden)
          values.forEach((value: string) => {
            const n = graph.mergeNode(`${value}_${f.variableName}`, {
              label: value,
              type: f.variableName,
            });
            graph.mergeNodeAttributes(n, {
              nbArticles:
                (graph.getNodeAttribute(
                  `${value}_${f.variableName}`,
                  "nbArticles"
                ) || 0) + 1,
            });
            metadataNodes.push(n);
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
        const node = f.maker(metadata);
        if (node) {
          const n = graph.mergeNode(`${node.key}_${f.variableName}`, {
            ...node,
            type: f.variableName,
          });
          graph.mergeNodeAttributes(n, {
            nbArticles:
              (graph.getNodeAttribute(
                `${node.key}_${f.variableName}`,
                "nbArticles"
              ) || 0) + 1,
          });
          metadataNodes.push(n);
        }
      });
    // add edges refs click
    if (references.length > 1) {
      const refEdges = combinations(references, 2);
      for (let [source, target] of refEdges) {
        graph.mergeEdge(source, target);
        graph.mergeEdgeAttributes(source, target, {
          weight: (graph.getEdgeAttribute(source, target, "weight") || 0) + 1,
        });
      }
    }
    // add edges between refs and metadata
    references.forEach((ref) =>
      metadataNodes.forEach((m) => {
        const e = graph.mergeEdge(ref, m);
        graph.mergeEdgeAttributes(ref, m, {
          weight: (graph.getEdgeAttribute(ref, m, "weight") || 0) + 1,
        });
      })
    );

    return graph;
  }
  // TODO: add index on not nodes
};

export function loadFullGraph(
  files: File[],
  format: CSVFormat,
  range: { min?: Number; max?: Number }
): Promise<UndirectedGraph> {
  const fullGraph = new UndirectedGraph();
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
              csvRowToGraph(
                flattenDeep([row.data])[0],
                format,
                fullGraph,
                range
              );
            },
            complete: () => {
              resolve();
            },
          });
        })
    )
  ).then(() => fullGraph);
}
