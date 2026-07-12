import type { FailureHook } from "@arts-and-crafts/v5-utils/adapters/inbound";

export const listMembershipsHooks: { onFailure: FailureHook } = {
  onFailure: () => [503],
};
