import type { DcbQuery } from "@adapters/outbound/shapes/DcbQuery.ts";
import { InMemoryEventStore } from "@examples/shared/adapters/outbound/EventStore.InMemory.ts";
import { randomUUID } from "node:crypto";
import { MembershipDecisionModel } from "./decisionModel.ts";
import type { MembershipEventV1 } from "./events/index.ts";
import type { MembershipOpenedV1 } from "./events/v1/MembershipOpenedV1.ts";
import { membershipTag } from "./state.ts";
import { OPEN_MEMBERSHIP } from "../useCases/commands/openMembership/command.ts";

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

describe("MembershipDecisionModel", () => {
  let eventStore: InMemoryEventStore<MembershipEventV1>;
  let decisionModel: MembershipDecisionModel;

  beforeEach(() => {
    eventStore = new InMemoryEventStore<MembershipEventV1>();
    decisionModel = new MembershipDecisionModel(eventStore);
  });

  describe("build", () => {
    it("returns the initial state and position 0 for an empty boundary", async () => {
      const id = randomUUID();

      const result = await decisionModel.build(queryFor(id));

      expect(result).toEqual({ state: { status: "initial", id }, position: 0 });
    });

    it("returns the evolved state and read position after events exist", async () => {
      const id = randomUUID();
      await decisionModel.store([makeEvent(id)]);

      const result = await decisionModel.build(queryFor(id));

      expect(result).toMatchObject({
        state: { status: "open", id, name: "Jane Doe", email: "jane@example.com" },
        position: 1,
      });
    });

    it("scopes the boundary to the queried membership", async () => {
      await decisionModel.store([makeEvent(randomUUID())]);
      const other = randomUUID();

      const result = await decisionModel.build(queryFor(other));

      expect(result).toMatchObject({ state: { status: "initial", id: other } });
    });

    it("falls back to an empty id when the query carries no membership tag", async () => {
      const result = await decisionModel.build({ criteria: [{ tags: [] }] });

      expect(result).toEqual({ state: { status: "initial", id: "" }, position: 0 });
    });

    it("returns a GatewayFailure when the event store is offline", async () => {
      eventStore.simulate("offline");

      const result = await decisionModel.build(queryFor(randomUUID()));

      expect(result).toMatchObject({ code: "GATEWAY_FAILURE" });
    });
  });

  describe("store", () => {
    it("appends events under the supplied append condition", async () => {
      const id = randomUUID();
      const query = queryFor(id);

      const result = await decisionModel.store([makeEvent(id)], { query, after: 0 });

      expect(result).toBeUndefined();
      const read = await decisionModel.build(query);
      expect(read).toMatchObject({ state: { status: "open", id } });
    });

    it("returns an AppendConflict when the boundary changed since the read position", async () => {
      const id = randomUUID();
      const query = queryFor(id);
      await decisionModel.store([makeEvent(id)]);

      const result = await decisionModel.store([makeEvent(id)], { query, after: 0 });

      expect(result).toMatchObject({ code: "APPEND_CONDITION_FAILED" });
    });
  });
});
