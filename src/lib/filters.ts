import Graph from "graphology";
import { keys, mapValues, sortBy, zipObject } from "lodash";
import { combinations } from "obliterator";

import { DEFAULT_METADATA_COLOR, FIELDS_META, FieldValue, GetValue, cleanFieldValues } from "./consts";
import {
  Aggregations,
  BiblioGraph,
  CustomFieldTypes,
  EdgeAttributes,
  FIELD_IDS,
  FieldID,
  FieldIndices,
  FiltersType,
  NodeAttributes,
  RichWork,
} from "./types";

export function getDefaultFilters(aggregations: Aggregations): FiltersType {
  return {
    openAlex: zipObject(
      FIELD_IDS,
      FIELD_IDS.map((field) => {
        const { threshold = Infinity, minRecords = -Infinity } = FIELDS_META[field];
        const agg = aggregations.openAlex[field];
        return agg.values.length
          ? (
              sortBy(agg.values, "lowerBound").find(
                ({ count, lowerBound }) => count <= threshold && lowerBound >= minRecords,
              ) || { lowerBound: agg.values.at(-1)!.lowerBound + 1 }
            ).lowerBound
          : 0;
      }),
    ),
    custom: mapValues(aggregations.custom, ({ values }) => {
      const minRecords = 2;
      const threshold = 50;
      return values.length
        ? (
            sortBy(values, "lowerBound").find(
              ({ count, lowerBound }) => count <= threshold && lowerBound >= minRecords,
            ) || { lowerBound: values.at(-1)!.lowerBound + 1 }
          ).lowerBound
        : 0;
    }),
  };
}

export function isOpenAlexValueOK(field: FieldID, value: string, indices: FieldIndices, filters: FiltersType): boolean {
  return (indices.openAlex[field][value]?.count || 0) >= filters.openAlex[field];
}

export function isCustomValueOK(field: string, value: string, indices: FieldIndices, filters: FiltersType): boolean {
  return ((indices.custom[field] || {})[value]?.count || 0) >= filters.custom[field];
}

export async function getFilteredGraph(
  works: RichWork[],
  indices: FieldIndices,
  filters: FiltersType,
  customFields: CustomFieldTypes,
): Promise<BiblioGraph> {
  const graph = new Graph<NodeAttributes, EdgeAttributes>();
  const allFields: { type: "openAlex" | "custom"; field: string; color: string; getValues: GetValue }[] = [
    ...FIELD_IDS.map((field) => ({
      type: "openAlex" as const,
      field,
      ...FIELDS_META[field],
    })),
  ];

  let customFieldIndex = 0;
  sortBy(keys(customFields)).forEach((field) => {
    allFields.push({
      type: "custom",
      field,
      color: customFieldIndex < DEFAULT_METADATA_COLOR.length ? DEFAULT_METADATA_COLOR[customFieldIndex] : "pink",
      getValues: (work) => work.metadata[field],
    });
    customFieldIndex += 1;
  });

  // prepare a graph attribute to indicate which fields were filtered out to remove them from caption
  const allVisibleFields = new Set<string>();

  for (let workIndex = 0; workIndex < works.length; workIndex++) {
    // Index nodes:
    const referenceNodes: string[] = [];
    const metadataNodes: string[] = [];

    const work = works[workIndex];
    if ((work.cited_by_count || 0) >= filters.openAlex.records) {
      const [workNode] = graph.mergeNode(`records::${work.id}`, {
        label: work.display_name,
        dataType: "records",
        color: FIELDS_META.records.color,
        nbArticles: work.cited_by_count,
      });
      metadataNodes.push(workNode);
    }

    for (let fieldIndex = 0; fieldIndex < allFields.length; fieldIndex++) {
      const { field, getValues, color, type } = allFields[fieldIndex];
      const values = await cleanFieldValues(getValues(work));
      const isValueOK =
        type === "openAlex"
          ? (v: FieldValue) => isOpenAlexValueOK(field as FieldID, v.id, indices, filters)
          : (v: FieldValue) => isCustomValueOK(field, v.id, indices, filters);

      values.filter(isValueOK).forEach(({ id, label }) => {
        allVisibleFields.add(`${type}::${field}`);
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
        else if (n) metadataNodes.push(n);
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
  graph.setAttribute("allVisibleFields", allVisibleFields);

  // Store all labels in the allLabel attribute:
  graph.forEachNode((node, { label }) => graph.setNodeAttribute(node, "allLabel", label));

  return graph;
}
