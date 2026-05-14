import type {
  FaultSimulationMode,
  SimulateFaults,
} from "@adapters/outbound/capabilities/SimulateFaults.ts";
import type { StageIntents } from "@core/capabilities/StageIntents.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { OutboxEnvelope } from "@adapters/outbound/shapes/OutboxEnvelope.ts";
import type { Intent } from "@core/shapes/Intent.ts";
import type { StageNotifications } from "@adapters/outbound/capabilities/StageNotifications.ts";
import type { Notification } from "@adapters/outbound/shapes/Notification.ts";

export class InMemoryOutbox<
  TIntent extends Intent = never,
  TNotification extends Notification = never,
>
  implements
    StageIntents<TIntent, Promise<void | GatewayFailure>>,
    StageNotifications<TNotification, Promise<void | GatewayFailure>>,
    SimulateFaults
{
  private readonly tableName: string = "intent_outbox";
  private simulation?: FaultSimulationMode;

  constructor(
    private readonly datasource: Map<string, OutboxEnvelope<TIntent | TNotification>[]> = new Map(),
  ) {}

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

  private get rows(): OutboxEnvelope<TIntent | TNotification>[] {
    if (!this.datasource.has(this.tableName)) {
      this.datasource.set(this.tableName, []);
    }
    return this.datasource.get(this.tableName)!;
  }

  async stage(items: TIntent[] | TNotification[]): Promise<void | GatewayFailure> {
    if (this.activeFault === "offline") {
      return {
        type: "failure",
        kind: "GatewayFailure",
        gateway: "InMemoryIntentOutbox",
        reason: "The Outbox has been set to offline mode",
      };
    }

    for (const item of items) {
      this.rows.push({
        status: "pending",
        stagedAt: Date.now(),
        entry: item,
      });
    }
  }
}
