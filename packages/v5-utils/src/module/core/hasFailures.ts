import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import { isFailure } from "./isFailure.ts";

export function hasFailures(value: unknown): value is GatewayFailure[] {
  return Array.isArray(value) && value.length > 0 && value.every(isFailure);
}
