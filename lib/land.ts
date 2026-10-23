// A rough land mask for Mumbai so simulated vehicles never appear in the sea, a lake or a creek.
// Coast: west-coast longitude for each latitude, south to north. A point west of it (plus a small margin) is sea.
const COAST: [number, number][] = [
  [18.9, 72.81], [18.93, 72.815], [18.955, 72.795], [19.0, 72.805], [19.03, 72.81], [19.05, 72.815], [19.07, 72.82],
  [19.1, 72.822], [19.125, 72.815], [19.14, 72.81], [19.17, 72.8], [19.2, 72.795], [19.25, 72.78],
];
// [south, north, west, east] boxes of water inside the city: Powai Lake and Mahim Bay / creek.
const WATER: [number, number, number, number][] = [
  [19.117, 19.133, 72.897, 72.919],
  [19.033, 19.057, 72.818, 72.846],
];

const coastLon = (lat: number) => {
  if (lat <= COAST[0][0]) return COAST[0][1];
  for (let i = 1; i < COAST.length; i++) {
    if (lat <= COAST[i][0]) {
      const [a, b] = [COAST[i - 1], COAST[i]];
      return a[1] + ((lat - a[0]) / (b[0] - a[0])) * (b[1] - a[1]);
    }
  }
  return COAST[COAST.length - 1][1];
};

export const isLand = (lat: number, lon: number) => lon > coastLon(lat) + 0.004 && !WATER.some(([s, n, w, e]) => lat >= s && lat <= n && lon >= w && lon <= e);
