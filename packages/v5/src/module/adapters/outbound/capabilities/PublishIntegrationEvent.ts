import type { IntegrationEvent } from "../shapes/IntegrationEvent.ts";

export interface PublishIntegrationEvents<
  TEvent extends IntegrationEvent,
  TResult = Promise<void>,
> {
  publish(event: TEvent): TResult;
}
