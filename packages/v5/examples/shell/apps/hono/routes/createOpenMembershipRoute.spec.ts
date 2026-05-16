import { createOpenMembershipRoute } from "./createOpenMembershipRoute.ts";
import { OpenMembershipHonoAdapter } from "@examples/modules/membership/useCases/commands/openMembership/adapters/inbound/hono.ts";
import type { OpenMembershipCommand } from "@examples/modules/membership/useCases/commands/openMembership/command.ts";
import type { HandleCommand } from "@useCases/command/capabilities/HandleCommand.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { Rejection } from "@core/shapes/Rejection.ts";
import type {
  FaultSimulationMode,
  SimulateFaults,
} from "@adapters/outbound/capabilities/SimulateFaults.ts";

const UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VALID_BODY = { name: "Jane Doe", email: "jane@example.com" };
const INVALID_BODY = { name: "Jane Doe" };

function makeRequest(body: unknown = VALID_BODY) {
  return new Request("http://localhost/membership/open", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("createOpenMembershipRoute", () => {
  let simulation: FaultSimulationMode | undefined;
  let handler: HandleCommand<OpenMembershipCommand, Promise<GatewayFailure[] | Rejection>> &
    SimulateFaults;
  let adapter: OpenMembershipHonoAdapter;
  let handledCommands: OpenMembershipCommand[];
  let route: ReturnType<typeof createOpenMembershipRoute>;

  beforeEach(() => {
    simulation = undefined;
    handledCommands = [];
    handler = {
      simulate(fault: FaultSimulationMode) {
        simulation = fault;
      },
      restore() {
        simulation = undefined;
      },
      get isSimulating() {
        return simulation !== undefined;
      },
      get activeFault() {
        return simulation;
      },
      async handle(command: OpenMembershipCommand): Promise<GatewayFailure[] | Rejection> {
        handledCommands.push(command);
        return [];
      },
    };
    adapter = new OpenMembershipHonoAdapter(handler);
    route = createOpenMembershipRoute(adapter);
  });

  it("returns 202 for a valid body", async () => {
    const res = await route.request(makeRequest());
    expect(res.status).toBe(202);
  });

  it("returns accepted: true in the response body", async () => {
    const res = await route.request(makeRequest());
    const body = await res.json();
    expect(body.accepted).toBe(true);
  });

  it("returns a UUIDv7 id in the response body", async () => {
    const res = await route.request(makeRequest());
    const body = await res.json();
    expect(body.id).toMatch(UUID_V7_PATTERN);
  });

  it("calls adapter.handle with the id returned in the response", async () => {
    const res = await route.request(makeRequest());
    const { id } = await res.json();
    expect(handledCommands).toHaveLength(1);
    expect(handledCommands[0].aggregateId).toBe(id);
  });

  it("returns 400 for an invalid body", async () => {
    const res = await route.request(makeRequest(INVALID_BODY));
    expect(res.status).toBe(400);
  });

  it("returns 202 when adapter.handle rejects", async () => {
    simulation = "reject";
    const res = await route.request(makeRequest());
    expect(res.status).toBe(202);
  });
});
