import { haversineKm, Place } from "@/lib/mock";

// A* search on a small road graph (known places as junctions, each linked to its nearest neighbours).
// Used as the offline fallback when the routing service can't be reached, and shown against Dijkstra in the
// Data screen to compare how many nodes each algorithm has to expand.
type Graph = Map<string, { place: Place; edges: { to: string; km: number }[] }>;

export const buildGraph = (nodes: Place[], k = 3): Graph => {
  const g: Graph = new Map(nodes.map((p) => [p.id, { place: p, edges: [] }]));
  for (const a of nodes) {
    const nearest = nodes
      .filter((b) => b.id !== a.id)
      .map((b) => ({ b, km: haversineKm(a, b) }))
      .sort((x, y) => x.km - y.km)
      .slice(0, k);
    for (const { b, km } of nearest) {
      if (!g.get(a.id)!.edges.some((e) => e.to === b.id)) g.get(a.id)!.edges.push({ to: b.id, km });
      if (!g.get(b.id)!.edges.some((e) => e.to === a.id)) g.get(b.id)!.edges.push({ to: a.id, km });
    }
  }
  return g;
};

export type SearchResult = { path: Place[]; km: number; expanded: number };

/** heuristic = straight-line distance to the goal (never overestimates, so A* stays optimal). Dijkstra = h of 0. */
const search = (g: Graph, startId: string, goalId: string, useHeuristic: boolean): SearchResult | null => {
  const goal = g.get(goalId)!.place;
  const h = (id: string) => (useHeuristic ? haversineKm(g.get(id)!.place, goal) : 0);
  const best = new Map<string, number>([[startId, 0]]);
  const prev = new Map<string, string>();
  const open = [{ id: startId, f: h(startId) }];
  const closed = new Set<string>();
  let expanded = 0;
  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const cur = open.shift()!;
    if (closed.has(cur.id)) continue;
    closed.add(cur.id);
    expanded += 1;
    if (cur.id === goalId) {
      const ids = [goalId];
      while (prev.has(ids[0])) ids.unshift(prev.get(ids[0])!);
      return { path: ids.map((i) => g.get(i)!.place), km: best.get(goalId)!, expanded };
    }
    for (const e of g.get(cur.id)!.edges) {
      const cost = best.get(cur.id)! + e.km;
      if (cost < (best.get(e.to) ?? Infinity)) {
        best.set(e.to, cost);
        prev.set(e.to, cur.id);
        open.push({ id: e.to, f: cost + h(e.to) });
      }
    }
  }
  return null;
};

export const aStar = (g: Graph, a: string, b: string) => search(g, a, b, true);
export const dijkstra = (g: Graph, a: string, b: string) => search(g, a, b, false);
