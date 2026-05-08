import type {
  FaultSimulationMode,
  SimulateFaults,
} from "@adapters/outbound/capabilities/SimulateFaults.ts";
import type { StageIntents } from "@adapters/outbound/capabilities/StageIntents.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { OutboxEnvelope } from "@adapters/outbound/shapes/OutboxEnvelope.ts";
import type { Intent } from "@core/shapes/Intent.ts";

export class InMemoryIntentOutbox<TIntent extends Intent>
  implements StageIntents<TIntent, AsyncIterable<void | GatewayFailure>>, SimulateFaults
{
  private readonly tableName: string = "intent_outbox";
  private simulation?: FaultSimulationMode;

  constructor(private readonly datasource: Map<string, OutboxEnvelope<TIntent>[]> = new Map()) {}

  simulate(mode: "offline"): void {
    this.simulation = mode;
  }

  restore(): void {
    this.simulation = undefined;
  }

  get isSimulating(): boolean {
    return this.simulation !== undefined;
  }

  get activeFault(): FaultSimulationMode | undefined {
    return this.simulation;
  }

  private get rows(): OutboxEnvelope<TIntent>[] {
    if (!this.datasource.has(this.tableName)) {
      this.datasource.set(this.tableName, []);
    }
    return this.datasource.get(this.tableName)!;
  }

  async *stage(intents: TIntent[]): AsyncIterable<void | GatewayFailure> {
    for (const intent of intents) {
      if (this.activeFault === "offline") {
        yield {
          type: "failure",
          kind: "GatewayFailure",
          gateway: "InMemoryIntentOutbox",
          reason: "The Outbox has been set to offline mode",
        };
      }

      this.rows.push({
        status: "pending",
        stagedAt: Date.now(),
        intent,
      });
    }
  }
}
