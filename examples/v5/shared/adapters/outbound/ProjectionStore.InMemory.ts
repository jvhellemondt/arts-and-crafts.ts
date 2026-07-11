import type {
  AdvanceCheckpoint,
  LoadCheckpoint,
  LoadProjection,
  SaveProjection,
  FaultSimulationMode,
  SimulateFaults,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";

export class InMemoryProjectionStore<TState>
  implements
    LoadProjection<TState>,
    SaveProjection<TState>,
    LoadCheckpoint,
    AdvanceCheckpoint,
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

  async load(): Promise<TState | GatewayFailure> {
    if (this.activeFault === "offline") return this.offlineFailure();
    return this.state;
  }

  async save(state: TState): Promise<void | GatewayFailure> {
    if (this.activeFault === "offline") return this.offlineFailure();
    this.state = state;
  }

  async loadCheckpoint(): Promise<number | GatewayFailure> {
    if (this.activeFault === "offline") return this.offlineFailure();
    return this.checkpoint;
  }

  async advanceCheckpoint(position: number): Promise<void | GatewayFailure> {
    if (this.activeFault === "offline") return this.offlineFailure();
    this.checkpoint = position;
  }
}
