import type { DcbQuery } from "@adapters/outbound/shapes/DcbQuery.ts";
import { InMemoryEventStore } from "@examples/shared/adapters/outbound/EventStore.InMemory.ts";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { MembershipOpenedV1 } from "@examples/modules/membership/core/events/v1/MembershipOpenedV1.ts";
import { membershipTag } from "@examples/modules/membership/core/tags.ts";
import { randomUUID } from "node:crypto";
import { OpenMembershipRepository } from "./repository.ts";
import { OPEN_MEMBERSHIP } from "./command.ts";

const makeEvent = (id: string): MembershipOpenedV1 => ({
  type: "MembershipOpened.v1",
  kind: "domain",
  tags: [membershipTag(id)],
  commandId: randomUUID(),
  commandType: OPEN_MEMBERSHIP,
  timestamp: Date.now(),
  id: randomUUID(),
  metadata: { correlationId: randomUUID(), causationId: randomUUID() },
  payload: { name: "Jane Doe", email: "jane@example.com" },
});

const queryFor = (id: string): DcbQuery => ({
  criteria: [{ types: ["MembershipOpened.v1"], tags: [membershipTag(id)] }],
});

describe("OpenMembershipRepository", () => {
  let eventStore: InMemoryEventStore<MembershipEventV1>;
  let repository: OpenMembershipRepository;

  beforeEach(() => {
    eventStore = new InMemoryEventStore<MembershipEventV1>();
    repository = new OpenMembershipRepository(eventStore);
  });

  describe("load", () => {
    it("returns a non-existent state and position 0 for an empty boundary", async () => {
      const result = await repository.load(queryFor(randomUUID()));
      expect(result).toEqual({ state: { exists: false }, position: 0 });
    });

    it("returns an existing state and the read position after an event exists", async () => {
      const id = randomUUID();
      await repository.store([makeEvent(id)], { query: queryFor(id), after: 0 });

      const result = await repository.load(queryFor(id));

      expect(result).toEqual({ state: { exists: true }, position: 1 });
    });

    it("scopes the boundary to the queried membership", async () => {
      await repository.store([makeEvent(randomUUID())], {
        query: queryFor(randomUUID()),
        after: 0,
      });

      const result = await repository.load(queryFor(randomUUID()));

      expect(result).toMatchObject({ state: { exists: false } });
    });

    it("returns a GatewayFailure when the event store is offline", async () => {
      eventStore.simulate("offline");
      const result = await repository.load(queryFor(randomUUID()));
      expect(result).toMatchObject({ code: "GATEWAY_FAILURE" });
    });
  });

  describe("store", () => {
    it("appends events under the supplied append condition", async () => {
      const id = randomUUID();
      const result = await repository.store([makeEvent(id)], { query: queryFor(id), after: 0 });

      expect(result).toBeUndefined();
      expect(await repository.load(queryFor(id))).toMatchObject({ state: { exists: true } });
    });

    it("returns an AppendConflict when the boundary changed since the read position", async () => {
      const id = randomUUID();
      const query = queryFor(id);
      await repository.store([makeEvent(id)], { query, after: 0 });

      const result = await repository.store([makeEvent(id)], { query, after: 0 });

      expect(result).toMatchObject({ code: "APPEND_CONDITION_FAILED" });
    });
  });
});
