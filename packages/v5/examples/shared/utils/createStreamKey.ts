import type { StreamKey } from "@adapters/outbound/shapes/StreamKey.ts";

export function createStreamKey(type: string, id: string): StreamKey {
  return `${type}#${id}`;
}
