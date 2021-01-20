import Graph from "graphology";
import { circular } from "graphology-layout";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { largestConnectedComponent } from "graphology-components";
import { subgraph } from "graphology-operators";

//TODO: move this to conf file
//TODO : adpat to initial window width ?
const maxNodeSizes = {
  references: 30,
  metadata: 50,
};

export async function prepareGraph(graph: Graph): Promise<Graph> {
  const largest = largestConnectedComponent(graph as never);
  const mainGraph = subgraph(graph as never, largest);

  // Copy graph attributes
  const graphAttributes = graph.getAttributes();
  for (const key in graphAttributes) {
    mainGraph.setAttribute(key, graphAttributes[key]);
  }

  // calculate max occs
  const maxNbArticles: { [key: string]: number } = {};
  graph.forEachNode((node, attributes) => {
    if (attributes.dataType === "references") {
      if (attributes.nbArticles > (maxNbArticles.references || 0))
        maxNbArticles.references = attributes.nbArticles;
    } else {
      if (attributes.nbArticles > (maxNbArticles[attributes.dataType] || 0))
        maxNbArticles[attributes.dataType] = attributes.nbArticles;
    }
  });

  // 1. Spatialize "ref" nodes:
  const refsNodes: string[] = [];
  const noneRefsNodes: string[] = [];
  mainGraph.forEachNode((node, attributes) => {
    if (attributes.dataType === "references") {
      refsNodes.push(node);
      // scale size, if 0 articles use size of 1
      mainGraph.setNodeAttribute(
        node,
        "size",
        Math.sqrt(
          (maxNodeSizes.references * (attributes.nbArticles || 1)) /
            maxNbArticles.references
        )
      );
    } else {
      noneRefsNodes.push(node);
      // scale size, if 0 articles use size of 1
      mainGraph.setNodeAttribute(
        node,
        "size",
        Math.sqrt(
          (maxNodeSizes.metadata * (attributes.nbArticles || 1)) /
            maxNbArticles[attributes.dataType]
        )
      );
    }
  });

  const refsGraph = (subgraph(mainGraph, refsNodes) as unknown) as Graph;
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
  noneRefsNodes.forEach((noneRefNode, i) => {
    const neighborsCount = mainGraph.neighbors(noneRefNode).length;
    let x = 0;
    let y = 0;

    mainGraph.forEachNeighbor(noneRefNode, (neighbor: string) => {
      x += positions[neighbor].x;
      y += positions[neighbor].y;
    });

    // Add some very tiny and unique vector, to prevent nodes to have exactly the same coordinates.
    // Also, the tiny vector must not be random, so that the layout remains reproducible:
    mainGraph.mergeNodeAttributes(noneRefNode, {
      x:
        x / neighborsCount +
        Math.cos((Math.PI * 2 * i) / noneRefsNodes.length) / 100,
      y:
        y / neighborsCount +
        Math.sin((Math.PI * 2 * i) / noneRefsNodes.length) / 100,
    });
  });

  // 3. Run some FA2 to get a proper layout for none-ref nodes:
  forceAtlas2.assign((mainGraph as unknown) as Graph, {
    iterations: 200,
    settings: forceAtlas2.inferSettings((mainGraph as unknown) as Graph),
  });

  return Promise.resolve((mainGraph as unknown) as Graph);
}
