import Graph from "graphology";
import { saveAs } from "file-saver";

// @ts-ignore
import { write } from "graphology-gexf/browser";
// @ts-ignore
import renderSVG from "graphology-svg/renderer";
// @ts-ignore
import { DEFAULTS } from "graphology-svg/defaults";
import { getHeatmap } from "./getHeatmap";

const SETTINGS = {
  margin: 20,
  width: 2048,
  height: 2048,
};

export function saveGEXF(graph: Graph, fileName: string): void {
  const gexfString = write(graph);
  saveAs(new Blob([gexfString]), fileName);
}

export function saveSVG(graph: Graph, fileName: string): void {
  const svgString = renderSVG(graph, { ...DEFAULTS, ...SETTINGS });
  saveAs(new Blob([svgString]), fileName);
}

export function saveHeatmap(graph: Graph, fileName: string): void {
  const graphWithNoEdge = graph.copy();
  graphWithNoEdge.clearEdges();

  const dataURL = getHeatmap(graphWithNoEdge, {
    width: SETTINGS.width,
    height: SETTINGS.height,
    offset: SETTINGS.margin,
    quantize: true,
    quantizationColors: 9,
    min255Color: 255,
    max255Color: 170,
    spreading: (SETTINGS.width + SETTINGS.height) / 2 / 20, // arbitrary
  });

  let svgString = renderSVG(graphWithNoEdge, { ...DEFAULTS, ...SETTINGS });

  // Ugly trick to put the generated heatmap image into the SVG file:
  svgString = svgString.replace(
    'xmlns="http://www.w3.org/2000/svg">',
    `xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink">
     <g>
        <image width="${SETTINGS.width}" height="${SETTINGS.height}" preserveAspectRatio="none" xlink:href="${dataURL}" />
     </g>`
  );

  saveAs(new Blob([svgString]), fileName);
}
