import Graph, { UndirectedGraph } from "graphology";
import { circular } from "graphology-layout";
import forceAtlas2 from "graphology-layout-forceatlas2";

import { FiltersType } from "./types";

const MAX_TIME = 5 * 1000;
const MAX_STEPS = 500;

export async function prepareGraph(
  graph: Graph,
  filters: FiltersType
): Promise<Graph> {
  // 1. Filter graph
  const filteredGraph = new UndirectedGraph();
  // copy nodes wich respect filter
  for (const [node, attributes] of graph.nodeEntries()) {
    const minOcc = filters[attributes.type];
    if (minOcc && attributes.nbArticles >= minOcc)
      filteredGraph.addNode(node, attributes);
  }
  // copy edges for kept nodes
  graph.forEachEdge((_, attributes, source, target) => {
    if (filteredGraph.hasNode(source) && filteredGraph.hasNode(target))
      filteredGraph.addEdge(source, target, attributes);
  });
  // 2. Apply FA2
  circular.assign(filteredGraph);

  let stepsPerBatch = 1;
  if (filteredGraph.order < 10000) stepsPerBatch = 10;
  if (filteredGraph.order < 1000) stepsPerBatch = 20;

  let steps = 0;
  const startTime = Date.now();
  while (steps < MAX_STEPS && Date.now() - startTime < MAX_TIME) {
    forceAtlas2.assign(filteredGraph, {
      iterations: stepsPerBatch,
    });

    await new Promise(requestAnimationFrame);
  }

  // 3. Apply some more changes to prepare for sigma (colors, sizes?)
  // TODO:

  return Promise.resolve(filteredGraph);
}
