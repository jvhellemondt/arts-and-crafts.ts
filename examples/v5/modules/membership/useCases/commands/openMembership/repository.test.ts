import { InMemoryEventStore } from "@examples/shared/adapters/outbound/EventStore.InMemory.ts";
import { randomUUID } from "node:crypto";
import { OpenMembershipRepository } from "./repository.ts";
import { ANCHOR_MEMBERSHIP } from "@examples/modules/membership/core/anchors.ts";
import type { MembershipOpenedV1 } from "@examples/modules/membership/core/events/v1/MembershipOpenedV1.ts";
import { createStreamKey } from "@examples/shared/utils/createStreamKey.ts";
import { OPEN_MEMBERSHIP } from "./command.ts";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";

const validEmail = "jane@example.com";

const makeEvent = (aggregateId: string): MembershipOpenedV1 => ({
  type: "MembershipOpened.v1",
  kind: "domain",
  concerns: [createStreamKey(ANCHOR_MEMBERSHIP, aggregateId)],
  commandId: randomUUID(),
  commandType: OPEN_MEMBERSHIP,
  timestamp: Date.now(),
  id: randomUUID(),
  metadata: { correlationId: randomUUID(), causationId: randomUUID() },
  payload: { membershipId: aggregateId, name: "Jane Doe", email: validEmail },
});

describe("OpenMembershipRepository", () => {
  let eventStore: InMemoryEventStore<MembershipEventV1>;
  let repository: OpenMembershipRepository;

  beforeEach(() => {
    eventStore = new InMemoryEventStore<MembershipEventV1>();
    repository = new OpenMembershipRepository(eventStore);
  });

  describe("load", () => {
    it("returns initial state when no events exist for the aggregate", async () => {
      const aggregateId = randomUUID();

      const state = (await repository.load(aggregateId, validEmail)).match(
        (state) => state,
        (failure) => {
          throw new Error(`Expected Ok, got Err: ${JSON.stringify(failure)}`);
        },
      );

      expect(state).toEqual({ status: "initial", id: aggregateId });
    });

    it("returns the evolved state after events exist for the aggregate", async () => {
      const aggregateId = randomUUID();
      await eventStore.append([makeEvent(aggregateId)]);

      const state = (await repository.load(aggregateId, validEmail)).match(
        (state) => state,
        (failure) => {
          throw new Error(`Expected Ok, got Err: ${JSON.stringify(failure)}`);
        },
      );

      expect(state).toMatchObject({
        status: "open",
        id: aggregateId,
        name: "Jane Doe",
        email: "jane@example.com",
      });
    });

    it("returns initial state for a different aggregate", async () => {
      const aggregateId = randomUUID();
      await eventStore.append([makeEvent(aggregateId)]);

      const otherId = randomUUID();
      const state = (await repository.load(otherId, validEmail)).match(
        (state) => state,
        (failure) => {
          throw new Error(`Expected Ok, got Err: ${JSON.stringify(failure)}`);
        },
      );

      expect(state).toEqual({ status: "initial", id: otherId });
    });

    it("returns a GatewayFailure when the event store is offline", async () => {
      eventStore.simulate("offline");

      const state = (await repository.load(randomUUID(), validEmail)).match(
        (state) => {
          throw new Error(`Expected Err, got Ok: ${JSON.stringify(state)}`);
        },
        (failure) => failure,
      );

      expect(state).toMatchObject({ code: "GATEWAY_FAILURE" });
    });
  });
});
