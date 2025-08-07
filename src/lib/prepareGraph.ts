import { wait } from "@ouestware/async";
import { largestConnectedComponent } from "graphology-components";
import { circular } from "graphology-layout";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { subgraph } from "graphology-operators";
import { Coordinates } from "sigma/types";

import { fetchRefsLabels } from "./api";
import { sampleKPoints } from "./kMeans";
import { BiblioGraph } from "./types";
import { compactOpenAlexId } from "./utils";

const maxNodeSizes = {
  references: 30,
  metadata: 50,
};

export async function handleLayout(graph: BiblioGraph): Promise<BiblioGraph> {
  const refsNodes: string[] = [];
  const noneRefsNodes: string[] = [];
  graph.forEachNode((node, attributes) => (attributes.dataType === "refs" ? refsNodes : noneRefsNodes).push(node));

  const refsGraph = subgraph(graph, refsNodes);
  circular.assign(refsGraph);
  const positions = forceAtlas2(refsGraph, {
    iterations: 1000,
    settings: forceAtlas2.inferSettings(refsGraph),
  });

  await wait();

  // Apply newly found positions into the *input* graph (and fix those nodes):
  refsGraph.forEachNode((refNode: string) =>
    graph.mergeNodeAttributes(refNode, {
      ...positions[refNode],
      fixed: true,
    }),
  );

  await wait();

  // 2. Put each none-ref node to the barycenter of its neighbors:
  noneRefsNodes.forEach((noneRefNode, i) => {
    const neighborsCount = graph.neighbors(noneRefNode).length;
    let x = 0;
    let y = 0;

    graph.forEachNeighbor(noneRefNode, (neighbor: string) => {
      if (!positions[neighbor]) return;
      x += positions[neighbor].x;
      y += positions[neighbor].y;
    });

    // Add some very tiny and unique vector, to prevent nodes to have exactly the same coordinates.
    // Also, the tiny vector must not be random, so that the layout remains reproducible:
    graph.mergeNodeAttributes(noneRefNode, {
      x: x / neighborsCount + Math.cos((Math.PI * 2 * i) / noneRefsNodes.length) / 100,
      y: y / neighborsCount + Math.sin((Math.PI * 2 * i) / noneRefsNodes.length) / 100,
    });
  });

  await wait();

  // 3. Run some FA2 to get a proper layout for none-ref nodes:
  forceAtlas2.assign(graph, {
    iterations: 200,
    settings: forceAtlas2.inferSettings(graph),
  });

  await wait();

  return graph;
}

export async function prepareGraph(graph: BiblioGraph): Promise<BiblioGraph> {
  const largest = largestConnectedComponent(graph);
  let mainGraph = subgraph(graph, largest);

  // 1. Prepare graph:

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

  // Handle node sizes:
  mainGraph.forEachNode((node, attributes) => {
    if (attributes.dataType === "refs") {
      // scale size, if 0 articles use size of 1
      mainGraph.setNodeAttribute(
        node,
        "size",
        Math.sqrt((maxNodeSizes.references * (attributes.nbArticles || 1)) / maxNbArticles.references),
      );
    } else {
      // scale size, if 0 articles use size of 1
      mainGraph.setNodeAttribute(
        node,
        "size",
        Math.sqrt((maxNodeSizes.metadata * (attributes.nbArticles || 1)) / maxNbArticles[attributes.dataType]),
      );
    }
  });

  await wait();

  // 2. Handle layout:
  mainGraph = await handleLayout(mainGraph);

  await wait();

  // 3. Sample refs labels:
  const allRefs = mainGraph
    .filterNodes((_, attributes) => attributes.dataType === "refs")
    .map((node) => {
      const { x, y } = mainGraph.getNodeAttributes(node) as Coordinates;
      return { id: node, coordinates: { x, y } };
    });
  const refsWithLabels = new Set((allRefs.length > 20 ? sampleKPoints(allRefs, 15, 5) : allRefs).map((p) => p.id));

  // use compactOpenAlexId utils to make sure we can use 100-size batches for download by reducing URL size
  const labels = await fetchRefsLabels(allRefs.map((p) => compactOpenAlexId(p.id)));
  mainGraph.forEachNode((node, attributes) => {
    if (attributes.dataType === "refs") {
      const label = labels[attributes.entityId] || null;
      mainGraph.mergeNodeAttributes(node, {
        allLabel: label,
        label: refsWithLabels.has(node) ? label : null,
      });
    }
  });

  return mainGraph;
}
