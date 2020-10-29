import Graph from "graphology";

import { FiltersType } from "./types";

export function prepareGraph(
  graph: Graph,
  filters: FiltersType
): Promise<Graph> {
  // TODO:
  // 1. Filter graph
  // 2. Apply FA2
  // 3. Apply some more changes to prepare for sigma (colors, sizes?)
  return Promise.resolve(graph);
}
