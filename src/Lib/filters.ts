import Graph from "graphology";
import { sortBy, zipObject } from "lodash";
import { combinations } from "obliterator";

import { FIELDS_META, cleanFieldValues } from "./consts";
import { Aggregations, FIELD_IDS, FieldID, FieldIndices, FiltersType, Work } from "./types";

export function getDefaultFilters(aggregations: Aggregations): FiltersType {
  return zipObject(
    FIELD_IDS,
    FIELD_IDS.map((field) => {
      const { threshold } = FIELDS_META[field];
      const agg = aggregations[field];
      return (sortBy(agg.values, "lowerBound").find(({ count }) => count <= threshold) || agg.values[0]).lowerBound;
    }),
  ) as FiltersType;
}

export function isValueOK(field: FieldID, value: string, indices: FieldIndices, filters: FiltersType): boolean {
  return (indices[field][value]?.count || 0) >= filters[field];
}

export async function getFilteredGraph(works: Work[], indices: FieldIndices, filters: FiltersType): Promise<Graph> {
  const graph = new Graph();

  for (let workIndex = 0; workIndex < works.length; workIndex++) {
    const work = works[workIndex];

    const referenceNodes: string[] = [];
    const metadataNodes: string[] = [];
    for (let fieldIndex = 0; fieldIndex < FIELD_IDS.length; fieldIndex++) {
      const field = FIELD_IDS[fieldIndex];
      const { getValues, color } = FIELDS_META[field];
      const values = await cleanFieldValues(getValues(work));

      values
        .filter((v) => isValueOK(field, v.id, indices, filters))
        .forEach(({ id, label }) => {
          const [n] = graph.mergeNode(id, {
            label: label,
            dataType: field,
            color,
          });
          const nbArticles = (graph.getNodeAttribute(id, "nbArticles") || 0) + 1;
          graph.mergeNodeAttributes(n, {
            nbArticles,
            size: Math.sqrt(nbArticles),
          });

          if (field === "refs") referenceNodes.push(n);
          else metadataNodes.push(n);
        });
    }

    // add edges refs click
    if (referenceNodes.length > 1) {
      const refEdges = combinations(referenceNodes, 2);
      for (const [source, target] of refEdges) {
        // Discard self loop
        if (source !== target) {
          graph.mergeEdge(source, target);
          graph.mergeEdgeAttributes(source, target, {
            weight: (graph.getEdgeAttribute(source, target, "weight") || 0) + 1,
          });
        }
      }
    }
    // add edges between refs and metadata
    referenceNodes.forEach((ref) =>
      metadataNodes.forEach((m) => {
        graph.mergeEdge(ref, m);
        graph.mergeEdgeAttributes(ref, m, {
          weight: (graph.getEdgeAttribute(ref, m, "weight") || 0) + 1,
        });
      }),
    );
  }

  // Remove orphans
  // To map degree information to node attributes
  const nodesToDelete: string[] = graph.nodes().filter((n) => graph.degree(n) === 0);
  nodesToDelete.forEach((n) => graph.dropNode(n));

  // Store some useful metadata:
  graph.setAttribute("entriescount", works.length);

  return graph;
}
