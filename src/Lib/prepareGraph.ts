import Graph, { UndirectedGraph } from "graphology";
import { circular } from "graphology-layout";
import forceAtlas2 from "graphology-layout-forceatlas2";

import { FiltersType } from "./types";

const MAX_TIME = 5 * 1000;
const MAX_STEPS = 500;

export async function prepareGraph(graph: Graph): Promise<Graph> {
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

  return Promise.resolve(graph);
}
