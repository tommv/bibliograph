import Graph from "graphology";
import { saveAs } from "file-saver";

// @ts-ignore
import { write } from "graphology-gexf/browser";

export function saveGEXF(graph: Graph, fileName: string): void {
  const gexfString = write(graph);
  saveAs(new Blob([gexfString]), fileName);
}
