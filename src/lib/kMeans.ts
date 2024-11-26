type Position<Key extends string> = Record<Key, number>;

type Point<Key extends string> = {
  id: string;
  coordinates: Position<Key>;
};

function distance<Key extends string>(a: Position<Key>, b: Position<Key>): number {
  let sum = 0;
  for (const key in a) {
    const diff = a[key] - b[key];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

function mean<Key extends string>(positions: Position<Key>[]): Position<Key> {
  const result: Partial<Position<Key>> = {};
  const count = positions.length;

  if (count === 0) {
    throw new Error("Cannot compute mean of an empty array");
  }

  // Initialize result keys to zero
  for (const key in positions[0]) {
    result[key] = 0;
  }

  // Sum up all the positions
  for (const pos of positions) {
    for (const key in pos) {
      result[key]! += pos[key];
    }
  }

  // Divide by count to get the mean
  for (const key in result) {
    result[key]! /= count;
  }

  return result as Position<Key>;
}

export function kMeans<Key extends string>(points: Point<Key>[], k: number, steps: number): Position<Key>[] {
  if (k <= 0) {
    throw new Error("k must be a positive integer");
  }
  if (points.length === 0) {
    throw new Error("Points array cannot be empty");
  }
  if (k > points.length) {
    throw new Error("k cannot be greater than the number of points");
  }

  // Initialize cluster centers randomly
  const centers: Position<Key>[] = [];
  const usedIndices = new Set<number>();
  while (centers.length < k) {
    const index = Math.floor(Math.random() * points.length);
    if (!usedIndices.has(index)) {
      centers.push({ ...points[index].coordinates }); // Clone the coordinates
      usedIndices.add(index);
    }
  }

  for (let step = 0; step < steps; step++) {
    // Assign points to clusters
    const clusters: Point<Key>[][] = Array.from({ length: k }, () => []);
    for (const point of points) {
      // Find the nearest center
      let minDistance = Infinity;
      let minIndex = -1;
      for (let i = 0; i < k; i++) {
        const dist = distance(point.coordinates, centers[i]);
        if (dist < minDistance) {
          minDistance = dist;
          minIndex = i;
        }
      }
      // Assign point to the nearest cluster
      clusters[minIndex].push(point);
    }

    // Recompute centers
    for (let i = 0; i < k; i++) {
      if (clusters[i].length > 0) {
        const positions = clusters[i].map((point) => point.coordinates);
        centers[i] = mean(positions);
      } else {
        // If a cluster has no points, reinitialize its center randomly
        const index = Math.floor(Math.random() * points.length);
        centers[i] = { ...points[index].coordinates }; // Clone the coordinates
      }
    }
  }

  return centers;
}

export function sampleKPoints<Key extends string>(points: Point<Key>[], k: number, steps: number): Point<Key>[] {
  if (k > points.length) {
    throw new Error("k cannot be greater than the number of points");
  }

  // Compute k cluster centers using kMeans
  const centers = kMeans(points, k, steps);

  // For each center, find the closest point in the original array
  const sampledPoints: Point<Key>[] = [];
  const usedPointIds = new Set<string>();

  for (const center of centers) {
    let minDistance = Infinity;
    let closestPoint: Point<Key> | null = null;

    for (const point of points) {
      if (usedPointIds.has(point.id)) {
        continue; // Skip if the point is already selected
      }

      const dist = distance(point.coordinates, center);
      if (dist < minDistance) {
        minDistance = dist;
        closestPoint = point;
      }
    }

    if (closestPoint) {
      sampledPoints.push(closestPoint);
      usedPointIds.add(closestPoint.id); // Ensure uniqueness
    }
  }

  return sampledPoints;
}
