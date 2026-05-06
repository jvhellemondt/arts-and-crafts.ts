import type { DomainEvent } from "@core/shapes/DomainEvent.ts";
import type { Intent } from "@core/shapes/Intent.ts";

export type Accepted<TEvent extends DomainEvent, TIntent extends Intent = never> = {
  readonly accepted: true;
  readonly events: [TEvent, ...TEvent[]];
  readonly intents: TIntent[];
};

export type Rejected<TCode extends string = string> = {
  readonly accepted: false;
  readonly rejection: { code: TCode; reason: string };
};

export type Decision<
  TEvent extends DomainEvent,
  TIntent extends Intent = never,
  TCode extends string = string,
> = Accepted<TEvent, TIntent> | Rejected<TCode>;
