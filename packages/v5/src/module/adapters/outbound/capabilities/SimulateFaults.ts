/**
 * Describes the fault to simulate on an adapter that implements `SimulatesFaults`.
 *
 * Built-in modes:
 * - `offline` — the gateway is unreachable, operations fail immediately
 * - `timeout` — the gateway is reachable but operations hang or take too long
 *
 * Custom modes must be explicitly branded as `CustomFaultMode`, preventing
 * misspelled built-in modes from being accepted as arbitrary strings.
 */
declare const customFaultModeBrand: unique symbol;

export type CustomFaultMode = string & {
  readonly [customFaultModeBrand]: true;
};

export type FaultSimulationMode = 'offline' | 'timeout' | CustomFaultMode;

/**
 * Capability for adapters that support fault simulation.
 *
 * Has a way to simulate faults for testing purposes, such as
 * an offline gateway or a timeout. Useful for testing resilience
 * and failure handling in use cases without real infrastructure.
 */
export interface SimulateFaults {
  simulate(fault: FaultSimulationMode): void;
  restore(): void;
  get isSimulating(): boolean;
  get activeFault(): FaultSimulationMode | undefined;
}
