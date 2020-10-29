import Graph, { UndirectedGraph } from "graphology";
import Papa from "papaparse";

const csvToGraph = (pathsToParse:string[],graph:UndirectedGraph) => {
  if (pathsToParse.length === 0)
    return graph;
  else {
    Papa.parse(pathsToParse[0], {
      worker: true,
      step: function(row) {
        // transform row into graph nodes and edges
        console.log("Row:", row.data);        
      },
      complete: function() {
        console.log("All done!");
        return csvToGraph(pathsToParse.slice(1), graph)
      }
    });
}

}

import { CSVFormat } from "./types";

export function loadFullGraph(
  paths: string[],
  format: CSVFormat
): Promise<Graph> {
  // will return a promise
  const fullGraph = new UndirectedGraph();
  csvToGraph(paths, fullGraph);

  return Promise.resolve(fullGraph);
}
