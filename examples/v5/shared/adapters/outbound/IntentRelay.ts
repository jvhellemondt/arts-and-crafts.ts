import type {
  HandleIntent,
  RelayPendingIntents,
} from "@arts-and-crafts/v5/useCases/policy/capabilities";
import type {
  LoadPendingIntents,
  MarkIntentDispatched,
  MarkIntentFailed,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { Intent } from "@arts-and-crafts/v5/core/shapes";
import { isFailure } from "../../utils/isFailure.ts";

type IntentOutbox<TIntent extends Intent> = LoadPendingIntents<TIntent> &
  MarkIntentDispatched &
  MarkIntentFailed;

export class IntentRelay<TIntent extends Intent> implements RelayPendingIntents {
  private readonly outbox: IntentOutbox<TIntent>;
  private readonly handlers: Map<string, HandleIntent<TIntent>>;
  private readonly batchSize: number;

  constructor(
    outbox: IntentOutbox<TIntent>,
    handlers: Map<string, HandleIntent<TIntent>>,
    batchSize: number = 100,
  ) {
    this.outbox = outbox;
    this.handlers = handlers;
    this.batchSize = batchSize;
  }

  async relay(): Promise<void> {
    const pending = await this.outbox.loadPending(this.batchSize);
    if (isFailure(pending)) return;

    for (const envelope of pending) {
      const handler = this.handlers.get(envelope.entry.type);
      if (!handler) {
        await this.outbox.markFailed(
          envelope.entry.id,
          `No handler registered for intent type "${envelope.entry.type}"`,
        );
        continue;
      }

      try {
        await handler.handle(envelope.entry);
        await this.outbox.markDispatched(envelope.entry.id);
      } catch (cause) {
        const reason = cause instanceof Error ? cause.message : String(cause);
        await this.outbox.markFailed(envelope.entry.id, reason);
      }
    }
  }
}
