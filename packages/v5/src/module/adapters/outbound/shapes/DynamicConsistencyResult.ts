import type { DomainEvent } from "../../../core/shapes/DomainEvent.ts";
import type { StreamKey } from "./StreamKey.ts";

export type DynamicConsistencyResult<TEvent extends DomainEvent = DomainEvent> = {
  readonly events: TEvent[];
  readonly versions: Record<StreamKey, number>;
};
