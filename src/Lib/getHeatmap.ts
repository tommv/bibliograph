import Graph from "graphology";

interface Settings {
  width: number;
  height: number;
  offset: number; // Margin

  spreading: number; // Pixel diameter of each nodes' "heat" area
  quantize?: boolean; // Disable for a continuous scale
  quantizationColors?: number;

  min255Color?: number;
  max255Color?: number;

  zoomEnabled?: boolean;
  zoomPoint?: { x: number; y: number };
  zoomWindowSize?: number;

  saveAtTheEnd?: boolean;
}

/**
 * Returns true if the given number or string is or can be a proper number, ie.
 * not Infinity, -Infinity or NaN.
 */
function isNumeric(n: number | string): boolean {
  return !isNaN(parseFloat("" + n)) && isFinite(+n);
}

/**
 * This function returns random coordinates for a node in a graph, in a circle
 * around the graph center, and which sizes depends on the order of the graph.
 */
function getRandomCoordinates(graph: Graph): number[] {
  let candidates: number[] = [];
  let d2 = Infinity;

  while (d2 > 1) {
    candidates = [2 * Math.random() - 1, 2 * Math.random() - 1];
    d2 = candidates[0] * candidates[0] + candidates[1] * candidates[1];
  }

  const heuristicRatio = 5 * Math.sqrt(graph.order);
  return candidates.map(function (d) {
    return d * heuristicRatio;
  });
}

/**
 * This function goes over each node and gives it proper coordinates, size and
 * color when required.
 */
function addMissingVisualizationData(graph: Graph): void {
  let coordinateIssues = 0;

  graph.forEachNode((nodeId: string) => {
    const { x, y, size, color } = graph.getNodeAttributes(nodeId);

    if (!isNumeric(x) || !isNumeric(y)) {
      const c = getRandomCoordinates(graph);
      graph.mergeNodeAttributes(nodeId, { x: c[0], y: c[1] });
      coordinateIssues++;
    }

    if (!isNumeric(size)) {
      graph.setNodeAttribute(nodeId, "size", 1);
    }

    if (color === undefined) {
      graph.setNodeAttribute(nodeId, "color", "#665");
    }
  });

  if (coordinateIssues > 0) {
    alert(
      "Note: " +
        coordinateIssues +
        " nodes had coordinate issues. We carelessly fixed them."
    );
  }
}

/**
 * This function rescales the graph to fit the graphic space of the heatmap. It
 * also reverses the Y positions, to make it easier to work with.
 */
function rescaleGraphToGraphicSpace(graph: Graph, settings: Settings): void {
  // General barycenter resize
  let xBarycenter = 0;
  let yBarycenter = 0;
  let totalWeight = 0;
  let ratio: number;

  graph.forEachNode((nodeId: string) => {
    const attributes = graph.getNodeAttributes(nodeId);
    const { x } = attributes;
    let { size, y } = attributes;

    // "Flip" the node:
    graph.setNodeAttribute(nodeId, "y", (y = -y));

    // We use node size as weight (default to 1)
    if (!size) {
      graph.setNodeAttribute(nodeId, "size", (size = 1));
    }
    xBarycenter += size * x;
    yBarycenter += size * y;
    totalWeight += size;
  });
  xBarycenter /= totalWeight;
  yBarycenter /= totalWeight;

  let distMax = 0; // Maximal distance from barycenter
  graph.forEachNode((nodeId: string) => {
    const { x, y } = graph.getNodeAttributes(nodeId);
    const dist = Math.sqrt(
      Math.pow(x - xBarycenter, 2) + Math.pow(y - xBarycenter, 2)
    );
    distMax = Math.max(distMax, dist);
  });

  ratio =
    (Math.min(settings.width, settings.height) - 2 * settings.offset) /
    (2 * distMax);

  // Initial resize
  const resize = () =>
    graph.forEachNode((nodeId: string) => {
      const { x, y, size } = graph.getNodeAttributes(nodeId);
      graph.mergeNodeAttributes(nodeId, {
        x: settings.width / 2 + (x - xBarycenter) * ratio,
        y: settings.height / 2 + (y - yBarycenter) * ratio,
        size: size * ratio,
      });
    });

  resize();

  // Additional zoom resize
  if (settings.zoomEnabled) {
    const zoomPoint = settings.zoomPoint as { x: number; y: number };
    xBarycenter = zoomPoint.x * settings.width;
    yBarycenter = zoomPoint.y * settings.height;
    ratio = 1 / (settings.zoomWindowSize as number);

    resize();
  }
}

/**
 * This function generates a black and white heatmap of a given graph.
 *
 * @param {Graph} inputGraph
 * @param {Settings} settings
 * @return {string} The data URL of the generated image.
 */
export function getHeatmap(inputGraph: Graph, settings: Settings): string {
  // Duplicate graph to avoid mutating the input graph:
  const graph = inputGraph.copy();

  graph.forEachNode((nodeId: string) => {
    // Set to zero to weight the heatmap by node size:
    graph.setNodeAttribute(nodeId, "heatmapScore", 1);
  });

  // Create the canvas
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.width = settings.width;
  canvas.height = settings.height;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

  // Fix missing coordinates and/or colors:
  addMissingVisualizationData(graph);

  // Change the coordinates of the network to fit the canvas space:
  rescaleGraphToGraphicSpace(graph, settings);

  // Compute heatmap values:
  const pixelValues = new Float32Array(settings.width * settings.height);

  // Init pixels:
  for (const i in pixelValues) {
    pixelValues[i] = 0;
  }

  // Values from nodes:
  graph.forEachNode((nodeId: string) => {
    const n = graph.getNodeAttributes(nodeId);
    for (
      let x = Math.max(0, Math.floor(n.x - settings.spreading / 2));
      x <= Math.min(settings.width, Math.floor(n.x + settings.spreading / 2));
      x++
    ) {
      for (
        let y = Math.max(0, Math.floor(n.y - settings.spreading / 2));
        y <=
        Math.min(settings.height, Math.floor(n.y + settings.spreading / 2));
        y++
      ) {
        const d = Math.sqrt(Math.pow(n.x - x, 2) + Math.pow(n.y - y, 2));
        if (d < settings.spreading / 2) {
          // Compute value: d=0 -> 1, d=spreading/2 ->
          const value = n.heatmapScore * (1 - (2 * d) / settings.spreading);
          // Add value to the pixel
          const i = x + settings.width * y;
          pixelValues[i] = pixelValues[i] + value;
        }
      }
    }
  });

  let maxValue = -Infinity;
  for (const i in pixelValues) {
    maxValue = Math.max(pixelValues[i], maxValue);
  }

  // Paint heatmap:
  const imageData = ctx.getImageData(0, 0, settings.width, settings.height);
  const minColor = settings.min255Color || 0;
  const maxColor = settings.max255Color || 255;
  const pixels = imageData.data;
  for (let i = 0, pixelsCount = pixels.length; i < pixelsCount; i += 4) {
    let value = pixelValues[i / 4] / maxValue;
    if (settings.quantize) {
      const colorsSteps = settings.quantizationColors as number;
      value = Math.round((colorsSteps - 1) * value) / (colorsSteps - 1);
    }
    const singleChannelValue = Math.round(
      (maxColor - minColor) * value + minColor
    );
    pixels[i] = singleChannelValue; // Red channel
    pixels[i + 1] = singleChannelValue; // Green channel
    pixels[i + 2] = singleChannelValue; // Blue channel
    pixels[i + 3] = 255; // Alpha channel
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL();
}
