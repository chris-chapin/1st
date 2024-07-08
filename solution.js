/*
Algorithm:

1. Build an adjacency list for each feature
2. Build global adjacency list for intersections
   a. if there is an intersection with a different feature, found an intersection node
3. if there are any points with only a single neighbor, found an endpoint node
*/

const fs = require("fs");
data = JSON.parse(fs.readFileSync("example.json", "utf8"));

const featureAdj = []; // features[i] = Map<string, Set<string>> - key = `${long},${lat}`, val = Set of neighbors (`${long},${lat}`)
const globalAdj = new Map(); // Map<string, Set<string>> - key = `${long},${lat}`, val = Set of feature ids containing this vertex
const nodes = new Set(); // Set<string> - `${long},${lat}` - feature endpoints and intersections

iterateFeatures();
captureFeatureNodes();
outputResults();

// --- helpers

function stringifyPoint(long, lat) {
  return `${long},${lat}`;
}

function buildFeatureAdjacency(feature, start, end) {
  // edge case; if the line segment is the same 2 points
  if (start == end) {
    return;
  }

  if (!feature.has(start)) {
    feature.set(start, new Set());
  }

  feature.get(start).add(end);
}

function buildGlobalAdjacency(vertex, id) {
  if (!globalAdj.has(vertex)) {
    globalAdj.set(vertex, new Set());
    globalAdj.get(vertex).add(id);
  } else {
    const set = globalAdj.get(vertex);

    // found an intersection - point exists but belongs to a different feature
    if (!set.has(id)) {
      set.add(id);
      nodes.add(vertex);
    }
  }
}

function iterateFeatures() {
  for (let i = 0; i < data.features.length; i++) {
    const id = data.features[i].id;
    featureAdj[i] = new Map();

    for (let j = 0; j < data.features[i].geometry.coordinates.length - 1; j++) {
      const [startLong, startLat] = data.features[i].geometry.coordinates[j];
      const [endLong, endLat] = data.features[i].geometry.coordinates[j + 1];

      const start = stringifyPoint(startLong, startLat);
      const end = stringifyPoint(endLong, endLat);

      // step 1: build feature adjacency list
      buildFeatureAdjacency(featureAdj[i], start, end);
      buildFeatureAdjacency(featureAdj[i], end, start);

      // step 2: build global adjacency list for intersections
      buildGlobalAdjacency(start, id);
      buildGlobalAdjacency(end, id);
    }
  }
}

function captureFeatureNodes() {
  // add points that only belongs to itself with a single neighbor
  for (let i = 0; i < featureAdj.length; i++) {
    featureAdj[i].forEach((neighbors, key) => {
      if (neighbors.size == 1) {
        nodes.add(key);
      }
    });
  }
}

function outputResults() {
  const result = [];

  nodes.forEach((val) => {
    const index = val.indexOf(",");
    result.push([
      Number.parseFloat(val.slice(0, index)),
      Number.parseFloat(val.slice(index + 1, val.length)),
    ]);
  });

  result.sort();
  result.forEach((val) => console.log(`(${val[0]}, ${val[1]})`));
}
