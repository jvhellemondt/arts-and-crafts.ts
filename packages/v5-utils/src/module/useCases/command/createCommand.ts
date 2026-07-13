import { v7 as uuidv7 } from "uuid";
import type { Command } from "@arts-and-crafts/v5/useCases/command/shapes";
import type { Metadata } from "@arts-and-crafts/v5/core/shapes";

export function createCommand<TType extends string, TPayload>(
  type: TType,
  payload: TPayload,
  metadata: Metadata,
): Command<TType, TPayload> {
  return {
    type,
    kind: "command",
    timestamp: new Date().getTime(),
    id: uuidv7(),
    payload,
    metadata,
  };
}
