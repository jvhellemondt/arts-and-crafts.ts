import type { RejectionHook, FailureHook } from "@arts-and-crafts/v5-utils/adapters/inbound";

export const openMembershipHooks: { onRejection: RejectionHook; onFailure: FailureHook } = {
  onRejection: () => [404],
  onFailure: () => [500],
};
