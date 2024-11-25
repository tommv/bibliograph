import { saveAs } from "file-saver";
import Graph from "graphology";
// [jacomyal] Note:
// The three following imports are not typed, and I dealt with that by disabling
// quality control locally:
import { write } from "graphology-gexf/browser";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { DEFAULTS } from "graphology-svg/defaults";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import renderSVG from "graphology-svg/renderer";

import { getHeatmap } from "./getHeatmap";

const SETTINGS = {
  margin: 20,
  width: 2048,
  height: 2048,
};

export function renderFixedSVG(graph: Graph): string {
  return renderSVG(graph, {
    ...DEFAULTS,
    ...SETTINGS,
    nodes: {
      ...DEFAULTS.nodes,
      reducer: (settings: unknown, node: string, attr: { [k: string]: unknown }): { [k: string]: unknown } => ({
        ...attr,
        y: -(attr.y as number),
      }),
    },
  });
}

export function saveGEXF(graph: Graph, fileName: string): void {
  const gexfString = write(graph);
  saveAs(new Blob([gexfString]), fileName);
}

export function saveSVG(graph: Graph, fileName: string): void {
  const svgString = renderFixedSVG(graph);
  saveAs(new Blob([svgString]), fileName);
}

export function saveHeatmap(graph: Graph, fileName: string): void {
  const graphWithNoEdge = graph.emptyCopy();

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

  // Temporarily rotate the graph:
  let svgString = renderFixedSVG(graphWithNoEdge);

  // Ugly trick to put the generated heatmap image into the SVG file:
  svgString = svgString.replace(
    'xmlns="http://www.w3.org/2000/svg">',
    `xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink">
     <g>
        <image width="${SETTINGS.width}" height="${SETTINGS.height}" preserveAspectRatio="none" xlink:href="${dataURL}" />
     </g>`,
  );

  saveAs(new Blob([svgString]), fileName);
}
