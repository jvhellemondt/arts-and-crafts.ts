import { randomUUID } from "node:crypto";
import { v7 as uuidv7 } from "uuid";
import { aggregateId as aggregateIdSchema } from "@examples/modules/membership/core/domain/AggregateId.ts";
import { createOpenMembershipCommand, openMembershipCommandPayload } from "./command.ts";
import { buildOpenMembershipQuery } from "./query.ts";

const makeCommand = (id: ReturnType<typeof aggregateIdSchema.parse>) =>
  createOpenMembershipCommand(
    id,
    openMembershipCommandPayload.parse({ name: "Jane Doe", email: "jane@example.com" }),
    { correlationId: randomUUID(), causationId: randomUUID() },
  );

describe("buildOpenMembershipQuery", () => {
  it("selects MembershipOpened.v1 events carrying the command's membership tag", () => {
    const id = aggregateIdSchema.parse(uuidv7());
    const query = buildOpenMembershipQuery(makeCommand(id));

    expect(query).toEqual({
      criteria: [{ types: ["MembershipOpened.v1"], tags: [{ key: "membership", value: id }] }],
    });
  });
});
