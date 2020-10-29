import Graph from "graphology";
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
  // TODO:

  // 2. Apply FA2
  circular.assign(graph);

  let stepsPerBatch = 1;
  if (graph.order < 10000) stepsPerBatch = 10;
  if (graph.order < 1000) stepsPerBatch = 20;

  let steps = 0;
  const startTime = Date.now();
  while (steps < MAX_STEPS && Date.now() - startTime < MAX_TIME) {
    forceAtlas2.assign(graph, {
      iterations: stepsPerBatch,
    });

    await new Promise(requestAnimationFrame);
  }

  // 3. Apply some more changes to prepare for sigma (colors, sizes?)
  // TODO:

  return Promise.resolve(graph);
}
