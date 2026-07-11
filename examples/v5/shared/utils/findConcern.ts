import type { StreamKey } from "@arts-and-crafts/v5/adapters/outbound/shapes";

export function findConcern(concerns: readonly StreamKey[], type: string): StreamKey | undefined {
  return concerns.find((key) => key.startsWith(`${type}#`));
}
