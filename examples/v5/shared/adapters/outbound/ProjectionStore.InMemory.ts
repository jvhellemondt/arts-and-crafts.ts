import type {
  AdvanceCheckpoint,
  LoadCheckpoint,
  LoadProjection,
  SaveProjection,
  FaultSimulationMode,
  SimulateFaults,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import { ResultAsync, errAsync, okAsync } from "neverthrow";

export class InMemoryProjectionStore<TState>
  implements
    LoadProjection<TState, ResultAsync<TState, GatewayFailure>>,
    SaveProjection<TState, ResultAsync<void, GatewayFailure>>,
    LoadCheckpoint<ResultAsync<number, GatewayFailure>>,
    AdvanceCheckpoint<ResultAsync<void, GatewayFailure>>,
    SimulateFaults
{
  private state: TState;
  private checkpoint: number = 0;
  private simulation?: FaultSimulationMode;

  constructor(initialState: TState) {
    this.state = initialState;
  }

  get isSimulating(): boolean {
    return this.simulation !== undefined;
  }

  get activeFault(): FaultSimulationMode | undefined {
    return this.simulation;
  }

  simulate(mode: FaultSimulationMode): void {
    this.simulation = mode;
  }

  restore(): void {
    this.simulation = undefined;
  }

  private offlineFailure(): GatewayFailure {
    return {
      kind: "failure",
      code: "GATEWAY_FAILURE",
      gateway: "InMemoryProjectionStore",
      reason: "The ProjectionStore has been set to offline mode",
    };
  }

  load(): ResultAsync<TState, GatewayFailure> {
    if (this.activeFault === "offline") return errAsync(this.offlineFailure());
    return okAsync(this.state);
  }

  save(state: TState): ResultAsync<void, GatewayFailure> {
    if (this.activeFault === "offline") return errAsync(this.offlineFailure());
    this.state = state;
    return okAsync(undefined);
  }

  loadCheckpoint(): ResultAsync<number, GatewayFailure> {
    if (this.activeFault === "offline") return errAsync(this.offlineFailure());
    return okAsync(this.checkpoint);
  }

  advanceCheckpoint(position: number): ResultAsync<void, GatewayFailure> {
    if (this.activeFault === "offline") return errAsync(this.offlineFailure());
    this.checkpoint = position;
    return okAsync(undefined);
  }
}
