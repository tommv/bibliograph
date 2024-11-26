import Graph from "graphology";
import { sortBy, zipObject } from "lodash";
import { combinations } from "obliterator";

import { FIELDS_META, cleanFieldValues } from "./consts";
import {
  Aggregations,
  BiblioGraph,
  EdgeAttributes,
  FIELD_IDS,
  FieldID,
  FieldIndices,
  FiltersType,
  NodeAttributes,
  Work,
} from "./types";

export function getDefaultFilters(aggregations: Aggregations): FiltersType {
  return zipObject(
    FIELD_IDS,
    FIELD_IDS.map((field) => {
      const { threshold = Infinity, minRecords = -Infinity } = FIELDS_META[field];
      const agg = aggregations[field];
      return agg.values.length
        ? (
            sortBy(agg.values, "lowerBound").find(
              ({ count, lowerBound }) => count <= threshold && lowerBound >= minRecords,
            ) || agg.values[0]
          ).lowerBound
        : 0;
    }),
  ) as FiltersType;
}

export function isValueOK(field: FieldID, value: string, indices: FieldIndices, filters: FiltersType): boolean {
  return (indices[field][value]?.count || 0) >= filters[field];
}

export async function getFilteredGraph(
  works: Work[],
  indices: FieldIndices,
  filters: FiltersType,
): Promise<BiblioGraph> {
  const graph = new Graph<NodeAttributes, EdgeAttributes>();

  for (let workIndex = 0; workIndex < works.length; workIndex++) {
    // Index nodes:
    const referenceNodes: string[] = [];
    const metadataNodes: string[] = [];

    const work = works[workIndex];
    if ((work.cited_by_count || 0) >= filters.records) {
      const [workNode] = graph.mergeNode(`records::${work.id}`, {
        label: work.display_name,
        dataType: "records",
        color: FIELDS_META.records.color,
      });
      metadataNodes.push(workNode);
    }

    for (let fieldIndex = 0; fieldIndex < FIELD_IDS.length; fieldIndex++) {
      const field = FIELD_IDS[fieldIndex];
      const { getValues, color } = FIELDS_META[field];
      const values = await cleanFieldValues(getValues(work));

      values
        .filter((v) => isValueOK(field, v.id, indices, filters))
        .forEach(({ id, label }) => {
          const [n] = graph.mergeNode(`${field}::${id}`, {
            entityId: id,
            label,
            dataType: field,
            color,
          });
          const nbArticles = (graph.getNodeAttribute(n, "nbArticles") || 0) + 1;
          graph.mergeNodeAttributes(n, {
            nbArticles,
            size: Math.sqrt(nbArticles),
          });

          if (field === "refs") referenceNodes.push(n);
          else metadataNodes.push(n);
        });
    }

    // Add edges refs click
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

    // Add edges between refs and metadata
    referenceNodes.forEach((ref) => {
      metadataNodes.forEach((m) => {
        graph.mergeEdge(ref, m);
        graph.mergeEdgeAttributes(ref, m, {
          weight: (graph.getEdgeAttribute(ref, m, "weight") || 0) + 1,
        });
      });
    });
  }

  // Remove orphans
  // To map degree information to node attributes
  const nodesToDelete: string[] = graph.nodes().filter((n) => graph.degree(n) === 0);
  nodesToDelete.forEach((n) => graph.dropNode(n));

  // Store some useful metadata:
  graph.setAttribute("entriescount", works.length);

  return graph;
}
