import type {
  FaultSimulationMode,
  SimulateFaults,
} from "@adapters/outbound/capabilities/SimulateFaults.ts";
import type { LoadPendingIntents } from "@adapters/outbound/capabilities/LoadPendingIntents.ts";
import type { MarkIntentDispatched } from "@adapters/outbound/capabilities/MarkIntentDispatched.ts";
import type { MarkIntentFailed } from "@adapters/outbound/capabilities/MarkIntentFailed.ts";
import type { StageIntents } from "@core/capabilities/StageIntents.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { OutboxEnvelope } from "@adapters/outbound/shapes/OutboxEnvelope.ts";
import type { Intent } from "@core/shapes/Intent.ts";
import type { StageNotifications } from "@adapters/outbound/capabilities/StageNotifications.ts";
import type { Notification } from "@adapters/outbound/shapes/Notification.ts";

export class InMemoryOutbox<TIntent extends Intent, TNotification extends Notification>
  implements
    StageIntents<TIntent, Promise<void | GatewayFailure>>,
    StageNotifications<TNotification, Promise<void | GatewayFailure>>,
    LoadPendingIntents<TIntent>,
    MarkIntentDispatched,
    MarkIntentFailed,
    SimulateFaults
{
  private readonly tableName: string = "outbox";
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

  private offlineFailure(): GatewayFailure {
    return {
      type: "failure",
      code: "GATEWAY_FAILURE",
      gateway: "InMemoryIntentOutbox",
      reason: "The Outbox has been set to offline mode",
    };
  }

  async stage(items: TIntent[] | TNotification[]): Promise<void | GatewayFailure> {
    if (this.activeFault === "offline") return this.offlineFailure();

    for (const item of items) {
      this.rows.push({
        status: "pending",
        stagedAt: Date.now(),
        attemptCount: 0,
        entry: item,
      });
    }
  }

  async loadPending(limit?: number): Promise<OutboxEnvelope<TIntent>[] | GatewayFailure> {
    if (this.activeFault === "offline") return this.offlineFailure();

    const pending = this.rows.filter(
      (row): row is OutboxEnvelope<TIntent> =>
        row.status === "pending" && row.entry.kind === "intent",
    );
    return pending.slice(0, limit ?? pending.length);
  }

  async markDispatched(intentId: string): Promise<void | GatewayFailure> {
    if (this.activeFault === "offline") return this.offlineFailure();

    const row = this.rows.find((r) => r.entry.id === intentId);
    if (!row) {
      return {
        type: "failure",
        code: "GATEWAY_FAILURE",
        gateway: "InMemoryIntentOutbox",
        reason: `Intent ${intentId} not found in outbox`,
      };
    }
    row.status = "dispatched";
    row.dispatchedAt = Date.now();
  }

  async markFailed(intentId: string, reason: string): Promise<void | GatewayFailure> {
    if (this.activeFault === "offline") return this.offlineFailure();

    const row = this.rows.find((r) => r.entry.id === intentId);
    if (!row) {
      return {
        type: "failure",
        code: "GATEWAY_FAILURE",
        gateway: "InMemoryIntentOutbox",
        reason: `Intent ${intentId} not found in outbox`,
      };
    }
    row.status = "failed";
    row.failedAt = Date.now();
    row.lastError = reason;
    row.attemptCount += 1;
  }
}
