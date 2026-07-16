import type {
  FaultSimulationMode,
  SimulateFaults,
  LoadPendingIntents,
  MarkIntentDispatched,
  MarkIntentFailed,
  StageNotifications,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { StageIntents } from "@arts-and-crafts/v5/core/capabilities";
import type {
  GatewayFailure,
  OutboxEnvelope,
  Notification,
} from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { Intent } from "@arts-and-crafts/v5/core/shapes";
import { ResultAsync, errAsync, okAsync } from "neverthrow";

export class InMemoryOutbox<TIntent extends Intent, TNotification extends Notification>
  implements
    StageIntents<TIntent, ResultAsync<void, GatewayFailure>>,
    StageNotifications<TNotification, ResultAsync<void, GatewayFailure>>,
    LoadPendingIntents<TIntent, ResultAsync<OutboxEnvelope<TIntent>[], GatewayFailure>>,
    MarkIntentDispatched<ResultAsync<void, GatewayFailure>>,
    MarkIntentFailed<ResultAsync<void, GatewayFailure>>,
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
      kind: "failure",
      code: "GATEWAY_FAILURE",
      gateway: "InMemoryIntentOutbox",
      reason: "The Outbox has been set to offline mode",
    };
  }

  stage(items: TIntent[] | TNotification[]): ResultAsync<void, GatewayFailure> {
    if (this.activeFault === "offline") return errAsync(this.offlineFailure());

    for (const item of items) {
      this.rows.push({
        status: "pending",
        stagedAt: Date.now(),
        attemptCount: 0,
        entry: item,
      });
    }
    return okAsync(undefined);
  }

  loadPending(limit?: number): ResultAsync<OutboxEnvelope<TIntent>[], GatewayFailure> {
    if (this.activeFault === "offline") return errAsync(this.offlineFailure());

    const pending = this.rows.filter(
      (row): row is OutboxEnvelope<TIntent> =>
        row.status === "pending" && row.entry.kind === "intent",
    );
    return okAsync(pending.slice(0, limit ?? pending.length));
  }

  markDispatched(intentId: string): ResultAsync<void, GatewayFailure> {
    if (this.activeFault === "offline") return errAsync(this.offlineFailure());

    const row = this.rows.find((r) => r.entry.id === intentId);
    if (!row) {
      return errAsync({
        kind: "failure",
        code: "GATEWAY_FAILURE",
        gateway: "InMemoryIntentOutbox",
        reason: `Intent ${intentId} not found in outbox`,
      });
    }
    row.status = "dispatched";
    row.dispatchedAt = Date.now();
    return okAsync(undefined);
  }

  markFailed(intentId: string, reason: string): ResultAsync<void, GatewayFailure> {
    if (this.activeFault === "offline") return errAsync(this.offlineFailure());

    const row = this.rows.find((r) => r.entry.id === intentId);
    if (!row) {
      return errAsync({
        kind: "failure",
        code: "GATEWAY_FAILURE",
        gateway: "InMemoryIntentOutbox",
        reason: `Intent ${intentId} not found in outbox`,
      });
    }
    row.status = "failed";
    row.failedAt = Date.now();
    row.lastError = reason;
    row.attemptCount += 1;
    return okAsync(undefined);
  }
}
