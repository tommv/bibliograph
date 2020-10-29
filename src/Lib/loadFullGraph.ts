import Graph from "graphology";

import { CSVFormat } from "./types";

export function loadFullGraph(
  paths: string[],
  format: CSVFormat
): Promise<Graph> {
  return Promise.resolve(new Graph());
}
