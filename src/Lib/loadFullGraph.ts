import Graph from "graphology";

export function loadFullGraph(paths: string[]): Promise<Graph> {
  return Promise.resolve(new Graph());
}
