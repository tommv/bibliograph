import Graph from "graphology";
import { range, sortBy, toPairs } from "lodash";
import { CSVFormat, FieldIndices, FiltersType } from "./types";

/**
 * This function generates a text report of the graph data, based on the
 * template given in https://github.com/tommv/bibliograph/issues/16.
 *
 * @param {Graph} inputGraph
 * @param {FieldIndices} indices
 * @param {FiltersType} filters
 * @param {CSVFormat} format
 * @return {string} The text content of the report
 */
export function getTextReport(
  inputGraph: Graph,
  indices: FieldIndices,
  filters: FiltersType,
  format: CSVFormat
): string {
  const graphAttributes = inputGraph.getAttributes();

  const rowsTotal = graphAttributes["Total raw entries count"];
  const dataSource = graphAttributes["Data source"];
  const yearsIndex = indices[format.year.variableName] || {};
  const typesIndex = indices[format.type.variableName] || {};
  const referencesIndex = indices[format.references.variableName] || {};
  const years = Object.keys(yearsIndex).map((s) => +s);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const indicesValuesCount: Record<string, number> = [
    ...format.metadataFields,
    format.references,
  ].reduce(
    (iter, field) => ({
      ...iter,
      [field.variableName]: filters[field.variableName]
        ? toPairs(indices[field.variableName] || {}).filter(
            ([, count]) => count >= filters[field.variableName]
          ).length
        : Object.keys(indices[field.variableName] || {}).length,
    }),
    {}
  );

  const report = `CORPUS

  We have analysed ${rowsTotal} bibliographic records extracted from ${dataSource} and published ${
    minYear < maxYear ? `from ${minYear} and ${maxYear}` : `in ${minYear}`
  }.
  
  Specifically, or corpus contained:
  ${range(minYear, maxYear + 1)
    .map((year: number) => {
      const count = yearsIndex[year] || 0;
      return `- ${count} record${count > 1 ? "s" : ""} published in ${year}`;
    })
    .join("\n")}
  Our corpus consisted of:
  ${sortBy(toPairs(typesIndex), ([, count]) => -count)
    .map(
      ([type, count]) =>
        `- ${count} entr${count > 1 ? "ies" : "y"} flagged as "${type}"`
    )
    .join("\n")}
 
 
  BASE MAP
 
  We extracted the ${
    Object.keys(referencesIndex).length
  } references present in this corpus and kept the ${
    indicesValuesCount.references
  } references cited by at least ${filters.references || 1} record${
    (filters.references || 1) > 1 ? "s" : ""
  }.
  We built the co-citation network of these references weighted by the frequency of their co-occurrence (aka bibliographic coupling).
  We remove the nodes with no connection at all.
  We spatialized the network with the ForceAtlas2 layout and fixed the position of the reference-nodes at equilibrium.
 
 
  METADATA LAYER
 
  From the same corpus we extracted and added to the network:
  ${format.metadataFields
    .filter((field) => typeof filters[field.variableName] === "number")
    .map(
      (field) =>
        `- ${indicesValuesCount[field.variableName] || 0} value${
          (indicesValuesCount[field.variableName] || 0) > 1 ? "s" : ""
        } for "${field.variableLabel}" occuring in at least ${
          filters[field.variableName]
        } record${filters[field.variableName] > 1 ? "s" : ""}`
    )
    .join("\n")}
  
  We connected these new nodes to the references co-appearing with them in the bibliographic records.
  We only kept the largest connected component from the graph.
  We positioned new nodes using with the same layout algorithm while keeping fixed the position of the reference-nodes.
  We sized the nodes the nodes according to the number of records in which they occurred and coloured them according to their type.`;

  return report
    .split("\n")
    .map((s) => s.trim())
    .join("\n");
}
