import { create } from "zustand";

// Small LRU cache with a time-to-live, and a token-bucket rate limiter. Used in front of the free routing and
// place-search services so repeated lookups are instant and bursts don't hit the servers.
export const useCacheStats = create<{ hits: number; misses: number; throttled: number }>(() => ({ hits: 0, misses: 0, throttled: 0 }));
const bump = (k: "hits" | "misses" | "throttled") => useCacheStats.setState((s) => ({ [k]: s[k] + 1 }));

export class LruCache<V> {
  private map = new Map<string, { value: V; at: number }>();
  constructor(private max = 20, private ttlMs = 5 * 60 * 1000) {}

  get(key: string, allowStale = false): V | undefined {
    const e = this.map.get(key);
    if (!e) return undefined;
    if (!allowStale && Date.now() - e.at > this.ttlMs) {
      this.map.delete(key);
      return undefined;
    }
    this.map.delete(key); // move to most-recent position
    this.map.set(key, e);
    return e.value;
  }

  set(key: string, value: V) {
    this.map.delete(key);
    this.map.set(key, { value, at: Date.now() });
    if (this.map.size > this.max) this.map.delete(this.map.keys().next().value as string);
  }
}

export class TokenBucket {
  private tokens: number;
  private last = Date.now();
  constructor(private capacity: number, private refillPerSec: number) {
    this.tokens = capacity;
  }
  take(): boolean {
    const now = Date.now();
    this.tokens = Math.min(this.capacity, this.tokens + ((now - this.last) / 1000) * this.refillPerSec);
    this.last = now;
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    bump("throttled");
    return false;
  }
}

export const cacheHit = () => bump("hits");
export const cacheMiss = () => bump("misses");
