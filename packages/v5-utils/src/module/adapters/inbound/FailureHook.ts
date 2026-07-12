import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { HookResult } from "./HookResult.ts";

export type FailureHook = (failures: readonly GatewayFailure[]) => HookResult;
