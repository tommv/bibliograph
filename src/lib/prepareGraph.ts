import Graph from "graphology";
import { largestConnectedComponent } from "graphology-components";
import { circular } from "graphology-layout";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { subgraph } from "graphology-operators";
import { zipObject } from "lodash";
import { Coordinates } from "sigma/types";

import { fetchRefsLabels } from "./api";
import { sampleKPoints } from "./kMeans";
import { wait } from "./utils";

const maxNodeSizes = {
  references: 30,
  metadata: 50,
};

export async function prepareGraph(graph: Graph): Promise<Graph> {
  const largest = largestConnectedComponent(graph);
  const mainGraph = subgraph(graph, largest);

  // Copy graph attributes
  const graphAttributes = graph.getAttributes();
  for (const key in graphAttributes) {
    mainGraph.setAttribute(key, graphAttributes[key]);
  }

  await wait();

  // Calculate max occurrences
  const maxNbArticles: { [key: string]: number } = {};
  graph.forEachNode((_node, attributes) => {
    if (attributes.dataType === "refs") {
      if (attributes.nbArticles > (maxNbArticles.references || 0)) maxNbArticles.references = attributes.nbArticles;
    } else {
      if (attributes.nbArticles > (maxNbArticles[attributes.dataType] || 0))
        maxNbArticles[attributes.dataType] = attributes.nbArticles;
    }
  });

  await wait();

  // 1. Spatialize "ref" nodes:
  const refsNodes: string[] = [];
  const noneRefsNodes: string[] = [];
  mainGraph.forEachNode((node, attributes) => {
    if (attributes.dataType === "refs") {
      refsNodes.push(node);
      // scale size, if 0 articles use size of 1
      mainGraph.setNodeAttribute(
        node,
        "size",
        Math.sqrt((maxNodeSizes.references * (attributes.nbArticles || 1)) / maxNbArticles.references),
      );
    } else {
      noneRefsNodes.push(node);
      // scale size, if 0 articles use size of 1
      mainGraph.setNodeAttribute(
        node,
        "size",
        Math.sqrt((maxNodeSizes.metadata * (attributes.nbArticles || 1)) / maxNbArticles[attributes.dataType]),
      );
    }
  });

  await wait();

  const refsGraph = subgraph(mainGraph, refsNodes);
  circular.assign(refsGraph);
  const positions = forceAtlas2(refsGraph, {
    iterations: 1000,
    settings: forceAtlas2.inferSettings(refsGraph),
  });

  await wait();

  // Apply newly found positions into the *input* graph (and fix those nodes):
  refsGraph.forEachNode((refNode: string) =>
    mainGraph.mergeNodeAttributes(refNode, {
      ...positions[refNode],
      fixed: true,
    }),
  );

  await wait();

  // 2. Put each none-ref node to the barycenter of its neighbors:
  noneRefsNodes.forEach((noneRefNode, i) => {
    const neighborsCount = mainGraph.neighbors(noneRefNode).length;
    let x = 0;
    let y = 0;

    mainGraph.forEachNeighbor(noneRefNode, (neighbor: string) => {
      if (!positions[neighbor]) return;
      x += positions[neighbor].x;
      y += positions[neighbor].y;
    });

    // Add some very tiny and unique vector, to prevent nodes to have exactly the same coordinates.
    // Also, the tiny vector must not be random, so that the layout remains reproducible:
    mainGraph.mergeNodeAttributes(noneRefNode, {
      x: x / neighborsCount + Math.cos((Math.PI * 2 * i) / noneRefsNodes.length) / 100,
      y: y / neighborsCount + Math.sin((Math.PI * 2 * i) / noneRefsNodes.length) / 100,
    });
  });

  await wait();

  // 3. Run some FA2 to get a proper layout for none-ref nodes:
  forceAtlas2.assign(mainGraph, {
    iterations: 200,
    settings: forceAtlas2.inferSettings(mainGraph),
  });

  await wait();

  // 4. Sample refs labels:
  const allRefs = mainGraph
    .filterNodes((_, attributes) => attributes.dataType === "refs")
    .map((node) => {
      const { x, y } = mainGraph.getNodeAttributes(node) as Coordinates;
      return { id: node, coordinates: { x, y } };
    });
  const refsWithLabels = sampleKPoints(allRefs, 15, 5).map((p) => p.id);

  const labels = await fetchRefsLabels(refsWithLabels);
  mainGraph.forEachNode((node, attributes) => {
    if (attributes.dataType === "refs") mainGraph.setNodeAttribute(node, "label", labels[node] || null);
  });

  return Promise.resolve(mainGraph);
}
