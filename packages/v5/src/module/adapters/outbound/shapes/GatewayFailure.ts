export type GatewayFailure = {
  readonly kind: "GatewayFailure";
  readonly gateway: string;
  readonly reason: string;
  readonly cause?: unknown;
};
