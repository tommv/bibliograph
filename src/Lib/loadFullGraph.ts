import { UndirectedGraph } from "graphology";
import papa, { ParseResult } from "papaparse";
import { Field, GeneratedField, CSVFormat } from "./types";

const csvRowToGraph = (
  csvRow: { [key: string]: string },
  format: CSVFormat,
  graph: UndirectedGraph
) => {
  console.log(csvRow);
  // references
  const refsField = format.references;
  if (refsField && csvRow[refsField.key]) {
    const references: string[] = (csvRow[refsField.key].split(
      refsField.separator || ","
    ) as string[]).map((ref) => {
      return graph.addNode(ref, { label: ref, type: "reference" });
    });
    // metadata factory
    const metadataNodes: string[] = [];
    const metadata = format.metadataFields.reduce((meta: {}, f: Field) => {
      // get value
      let values = [];
      // parse multiple values
      if (f.separator) values = csvRow[f.key].split(f.separator);
      else values.push(csvRow[f.key]);
      // generate node if not hidden field
      if (!f.hidden)
        values.forEach((value: string) =>
          metadataNodes.push(
            graph.addNode(value, { label: value, type: f.variableName })
          )
        );
      // craft a parsed line for generated fields
      return { ...meta, [f.variableName]: values };
    }, {});
    // generated fields
    if (format.generatedFields)
      format.generatedFields?.forEach((f: GeneratedField) => {
        const node = f.maker(metadata);
        metadataNodes.push(
          graph.addNode(node.key, { ...node, type: f.variableName })
        );
      });

    // add edges between refs and metadata
    references.forEach((ref) =>
      metadataNodes.forEach((m) => {
        const e = graph.addEdge(ref, m);
        graph.mergeEdgeAttributes(e, {
          weight: (graph.getEdgeAttribute(e, "weight") || 0) + 1,
        });
      })
    );

    return graph;
  } else throw "references field is mandatory";
  // TODO: add index on not nodes
};

export function loadFullGraph(
  files: File[],
  format: CSVFormat
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
              csvRowToGraph(row.data[0], format, fullGraph);
            },
            complete: () => {
              resolve();
            },
          });
        })
    )
  ).then(() => fullGraph);
}
