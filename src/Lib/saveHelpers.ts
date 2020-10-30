import Graph from "graphology";
import { saveAs } from "file-saver";

// @ts-ignore
import { write } from "graphology-gexf/browser";
// @ts-ignore
import renderSVG from "graphology-svg/renderer";
// @ts-ignore
import { DEFAULTS } from "graphology-svg/defaults";

export function saveGEXF(graph: Graph, fileName: string): void {
  const gexfString = write(graph);
  saveAs(new Blob([gexfString]), fileName);
}

export function saveSVG(graph: Graph, fileName: string): void {
  const svgString = renderSVG(graph, DEFAULTS);
  saveAs(new Blob([svgString]), fileName);
}
