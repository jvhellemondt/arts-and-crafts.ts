import type { StagesIntents } from "@adapters/outbound/capabilities/StagesIntents.ts";
import type { Intent } from "@core/shapes/Intent.ts";

export class InMemoryIntentOutbox<TIntent extends Intent> implements StagesIntents<TIntent> {
  private readonly tableName: string = "intent_outbox";

  constructor(private readonly datasource: Map<string, TIntent[]> = new Map<string, TIntent[]>()) {}

  async stage(intents: TIntent[]): Promise<void> {
    if (!this.datasource.has(this.tableName)) this.datasource.set(this.tableName, []);
    const rows = this.datasource.get(this.tableName);
    rows?.push(...intents);
    return;
  }
}
