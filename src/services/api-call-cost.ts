// Note: These are estimates and may not reflect actual costs incurred by Onshape

const ENDPOINT_COSTS = {
  "/documents": 1,
  "/documents/*/elements": 2,
  "/documents/*/parts": 3,
  "/assemblies/*/bom": 5,
  // ... etc
};

export function estimateCost(endpoint: string): number {
  for (const [pattern, cost] of Object.entries(ENDPOINT_COSTS)) {
    if (endpoint.includes(pattern.replace("*", ""))) {
      return cost;
    }
  }
  return 1; // default cost
}
