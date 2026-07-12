import type { Rejection } from "@arts-and-crafts/v5/core/shapes";
import type { HookResult } from "./HookResult.ts";

export type RejectionHook = (rejection: Rejection) => HookResult;
