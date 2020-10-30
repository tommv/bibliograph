import Graph from "graphology";
import { circular } from "graphology-layout";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { largestConnectedComponent } from "graphology-components";
import { subGraph } from "graphology-utils";

export async function prepareGraph(graph: Graph): Promise<Graph> {
  const largest = largestConnectedComponent(graph as any);
  const mainGraph = subGraph(graph as any, largest);

  // 1. Spatialize "ref" nodes:
  const refsNodes: string[] = [];
  const noneRefsNodes: string[] = [];
  mainGraph.forEachNode((node) => {
    if (mainGraph.getNodeAttribute(node, "dataType") === "references")
      refsNodes.push(node);
    else noneRefsNodes.push(node);
  });

  const refsGraph = subGraph(mainGraph, refsNodes) as any;
  circular.assign(refsGraph);
  const positions = forceAtlas2(refsGraph, {
    iterations: 1000,
    settings: forceAtlas2.inferSettings(refsGraph),
  });

  // Apply newly found positions into the *input* graph (and fix those nodes):
  refsGraph.forEachNode((refNode: string) =>
    mainGraph.mergeNodeAttributes(refNode, {
      ...positions[refNode],
      fixed: true,
    })
  );

  // 2. Put each none-ref node to the barycenter of its neighbors:
  noneRefsNodes.forEach((noneRefNode) => {
    const neighborsCount = mainGraph.neighbors(noneRefNode).length;
    let x = 0;
    let y = 0;

    mainGraph.forEachNeighbor(noneRefNode, (neighbor) => {
      x += positions[neighbor].x;
      y += positions[neighbor].y;
    });

    mainGraph.mergeNodeAttributes(noneRefNode, {
      x: x / neighborsCount,
      y: y / neighborsCount,
    });
  });

  return Promise.resolve((mainGraph as unknown) as Graph);
}
