import { gridDisk } from "@/lib/h3";

// Dynamic pricing: when requests in a zone outnumber available drivers, fares rise temporarily
// and fall again as supply catches up. Demand is simulated per H3 cell and time bucket.
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export const BUCKET_MS = 120000;
export const demandFor = (cell: string, now = Date.now()) => 4 + (hash(`${cell}:${Math.floor(now / BUCKET_MS)}`) % 10);

/** 1.0 = normal. Capped at 2.0, rounded to 0.1. */
export const surgeFromDemand = (demand: number, supply: number) => {
  const ratio = demand / Math.max(2, supply);
  if (ratio <= 1.2) return 1;
  return Math.min(2, Math.round((1 + (ratio - 1) * 0.6) * 10) / 10);
};

// Demand and supply are counted per hexagon. Uber's H3 post notes every neighbour is the same distance away,
// so the rider's hexagon plus its 6 neighbours gives a smooth local reading instead of a jump at a cell border.
export const demandAround = (cell: string, now = Date.now()) =>
  gridDisk(cell, 1).reduce((sum, c) => sum + demandFor(c, now), 0) / 22;

export const surgeFor = (cell: string, supply: number, now = Date.now()) => surgeFromDemand(demandAround(cell, now), supply);

/**
 * Demand forecast: exponential smoothing over the last few time buckets, plus the recent trend, projected one
 * bucket ahead. alpha = how much weight the newest bucket gets.
 */
export const forecastDemand = (cell: string, now = Date.now(), buckets = 6, alpha = 0.5) => {
  const series = Array.from({ length: buckets }, (_, i) => demandAround(cell, now - (buckets - 1 - i) * BUCKET_MS));
  let level = series[0];
  for (const d of series.slice(1)) level = alpha * d + (1 - alpha) * level;
  const trend = (series[series.length - 1] - series[0]) / (buckets - 1);
  return Math.max(0, level + trend);
};

export const forecastSurge = (cell: string, supply: number, now = Date.now()) => surgeFromDemand(forecastDemand(cell, now), supply);
