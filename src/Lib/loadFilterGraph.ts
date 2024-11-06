import { UndirectedGraph } from "graphology";
import { flattenDeep } from "lodash";
import { combinations } from "obliterator";
import papa, { ParseResult } from "papaparse";

import { CSVFormat, Field, FieldIndices, GeneratedField } from "./types";

const csvRowToGraph = (
  csvRow: { [key: string]: string },
  format: CSVFormat,
  graph: UndirectedGraph,
  filteredTypes: FieldIndices,
  yearRange: { min?: number; max?: number },
): boolean => {
  // year filter
  if (yearRange && (yearRange.min || yearRange.max) && format.year) {
    if (yearRange.min && csvRow[format.year.key] < "" + yearRange.min)
      // don't load this row cause out of range
      return false;
    if (yearRange.max && csvRow[format.year.key] > "" + yearRange.max)
      // don't load this row cause out of range
      return false;
  }

  // duplication filter
  const hash = format.hash(csvRow);
  if (filteredTypes.hash && filteredTypes.hash[hash]) {
    if (filteredTypes.hash[hash] > 1) {
      //first article of duplicated set, keep it and edit dup flag
      filteredTypes.hash[hash] = 1;
    }
    // other duplicated to filter out
    else {
      return false;
    }
  }

  // references
  const refsField = format.references;
  if (refsField && csvRow[refsField.key] && csvRow[refsField.key] !== "") {
    const references: string[] = (csvRow[refsField.key].split(refsField.separator || ",") as string[])
      .map((ref) => ref.trim())
      // apply filter
      .filter((ref) => ref !== "" && filteredTypes.references && filteredTypes.references[ref] !== undefined)
      .map((ref) => {
        const [n] = graph.mergeNode(ref, {
          label: ref,
          dataType: "references",
          color: refsField.variableColor,
        });
        const nbArticles = (graph.getNodeAttribute(ref, "nbArticles") || 0) + 1;
        graph.mergeNodeAttributes(n, {
          nbArticles,
          size: Math.sqrt(nbArticles),
        });
        return n;
      });

    // metadata factory
    const metadataNodes: string[] = [];
    const metadata = format.metadataFields.reduce((meta: Record<string, string[]>, f: Field) => {
      // get value
      let values = [];
      // parse multiple values
      if (csvRow[f.key]) {
        if (f.separator) values = csvRow[f.key].split(f.separator);
        else values.push(csvRow[f.key]);
        // apply filters
        if (filteredTypes[f.variableName]) values = values.filter((v) => !!filteredTypes[f.variableName][v]);
        // generate node if not hidden field
        // no filter => no nodes
        if (!f.hidden && filteredTypes[f.variableName])
          values
            .map((v) => v.trim())
            .forEach((value: string) => {
              // meta node
              const [n] = graph.mergeNode(`${value}_${f.variableName}`, {
                label: value,
                dataType: f.variableName,
                color: f.variableColor,
              });
              const nbArticles = (graph.getNodeAttribute(`${value}_${f.variableName}`, "nbArticles") || 0) + 1;
              graph.mergeNodeAttributes(n, {
                nbArticles,
                size: Math.sqrt(nbArticles),
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
        const nodes = f.maker(metadata);
        // apply filters
        if (nodes && nodes.length > 0 && filteredTypes[f.variableName])
          nodes
            .filter((node) => node && node.key && !!filteredTypes[f.variableName][node.key])
            .forEach((node) => {
              const [n] = graph.mergeNode(`${node.key}_${f.variableName}`, {
                ...node,
                dataType: f.variableName,
                color: f.variableColor,
              });
              const nbArticles = (graph.getNodeAttribute(`${node.key}_${f.variableName}`, "nbArticles") || 0) + 1;
              graph.mergeNodeAttributes(n, {
                nbArticles,
                size: nbArticles,
              });
              metadataNodes.push(n);
            });
      });

    // add edges refs click
    if (references.length > 1) {
      const refEdges = combinations(references, 2);
      for (const [source, target] of refEdges) {
        // discard self loop
        if (source !== target) {
          graph.mergeEdge(source, target);
          graph.mergeEdgeAttributes(source, target, {
            weight: (graph.getEdgeAttribute(source, target, "weight") || 0) + 1,
          });
        }
      }
    }
    // add edges between refs and metadata
    references.forEach((ref) =>
      metadataNodes.forEach((m) => {
        graph.mergeEdge(ref, m);
        graph.mergeEdgeAttributes(ref, m, {
          weight: (graph.getEdgeAttribute(ref, m, "weight") || 0) + 1,
        });
      }),
    );

    return true;
  }

  return false;
};

export async function loadFilterGraph(
  files: File[],
  format: CSVFormat,
  filteredTypes: FieldIndices,
  range: { min?: number; max?: number },
  setLoaderMessage: (message: string) => void,
): Promise<UndirectedGraph> {
  const fullGraph = new UndirectedGraph({ allowSelfLoops: false });
  let parsedRows = 0;

  await Promise.all(
    files.map(
      (file: File) =>
        new Promise((resolve) => {
          papa.parse(file, {
            // add separator
            delimiter: format.separator,
            header: true,
            step: function (row: ParseResult<{ [key: string]: string }>) {
              const preparedRow = flattenDeep<{ [key: string]: string }>([row.data])[0];

              // transform row into graph nodes and edges
              const isRowIn = csvRowToGraph(preparedRow, format, fullGraph, filteredTypes, range);

              if (isRowIn) {
                parsedRows++;
              }
            },
            complete: () => {
              setLoaderMessage(`File "${file.name}" parsed and filtered.`);
              resolve(null);
            },
          });
        }),
    ),
  );

  // Remove orphans
  // To map degree information to node attributes
  setLoaderMessage("Filtering disconnected nodes...");
  const nodesToDelete: string[] = fullGraph.nodes().filter((n) => fullGraph.degree(n) === 0);
  nodesToDelete.forEach((n) => fullGraph.dropNode(n));

  // Store some useful metadata:
  fullGraph.setAttribute("datasource", format.label);
  fullGraph.setAttribute("entriescount", parsedRows);

  return fullGraph;
}
