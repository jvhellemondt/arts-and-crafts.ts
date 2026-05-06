import type { StagesIntents } from "@adapters/outbound/capabilities/StagesIntents.ts";
import type { OutboxEnvelope } from "@adapters/outbound/shapes/OutboxEnvelope.ts";
import type { Intent } from "@core/shapes/Intent.ts";

export class InMemoryIntentOutbox<TIntent extends Intent> implements StagesIntents<TIntent> {
  private readonly tableName: string = "intent_outbox";

  constructor(private readonly datasource: Map<string, OutboxEnvelope<TIntent>[]> = new Map()) {}

  private get rows(): OutboxEnvelope<TIntent>[] {
    if (!this.datasource.has(this.tableName)) {
      this.datasource.set(this.tableName, []);
    }
    return this.datasource.get(this.tableName)!;
  }

  async stage(intents: TIntent[]): Promise<void> {
    for (const intent of intents) {
      this.rows.push({
        status: "pending",
        stagedAt: Date.now(),
        intent,
      });
    }
  }
}
