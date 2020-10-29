import Graph, { UndirectedGraph } from "graphology";
import * as faker from "faker";

// No types for this one.
// @ts-ignore
import clusters from "graphology-generators/random/clusters";

export function getRandomGraph(): Graph {
  const graph = clusters(UndirectedGraph, {
    order: 1000,
    size: 3000,
    clusters: 5,
  });

  graph.forEachNode((node: string) => {
    graph.replaceNodeAttributes(node, {
      label: faker.name.firstName() + " " + faker.name.lastName(),
      jobTitle: faker.name.jobTitle(),
      age: Math.floor(Math.random() * 70 + 20),

      color: faker.commerce.color(),
      product: faker.commerce.product(),
    });
  });

  return graph;
}
