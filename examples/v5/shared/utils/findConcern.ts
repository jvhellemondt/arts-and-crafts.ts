import type { StreamKey } from "@adapters/outbound/shapes/StreamKey.ts";

export function findConcern(concerns: readonly StreamKey[], type: string): StreamKey | undefined {
  return concerns.find((key) => key.startsWith(`${type}#`));
}
