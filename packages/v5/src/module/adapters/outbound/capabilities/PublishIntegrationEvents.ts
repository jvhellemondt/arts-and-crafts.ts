import type { GatewayFailure } from '../shapes/GatewayFailure.ts';
import type { IntegrationEvent } from '../shapes/IntegrationEvent.ts';

export interface PublishIntegrationEvents<
  TEvent extends IntegrationEvent,
  TResult = Promise<void | GatewayFailure>,
> {
  publish(event: TEvent): TResult;
}
