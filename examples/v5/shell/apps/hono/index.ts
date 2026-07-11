import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { logger } from "hono/logger";
import { timeout } from "hono/timeout";
import { timing } from "hono/timing";
import { trimTrailingSlash } from "hono/trailing-slash";
import { ListMembershipsHandler } from "../../../modules/membership/useCases/queries/listMemberships/handler.ts";
import type { StageIntents } from "@arts-and-crafts/v5/core/capabilities";
import type {
  StageNotifications,
  LoadDomainEvents,
  AppendToEventStore,
  LoadProjection,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { MembershipIntents } from "../../../modules/membership/core/intents/index.ts";
import type { OpenMembershipRejected } from "../../../modules/membership/useCases/commands/openMembership/rejections/MembershipAlreadyExists.ts";
import { OpenMembershipHandler } from "../../../modules/membership/useCases/commands/openMembership/handler.ts";
import type { MembershipEventV1 } from "../../../modules/membership/core/events/index.ts";
import type { ListMembershipsProjection } from "../../../modules/membership/useCases/queries/listMemberships/projection.ts";
import { OpenMembershipRepository } from "../../../modules/membership/useCases/commands/openMembership/repository.ts";
import { createOpenMembershipInboundHonoAdapter } from "../../../modules/membership/useCases/commands/openMembership/adapters/inbound/hono.ts";
import { createListMembershipsInboundHonoAdapter } from "../../../modules/membership/useCases/queries/listMemberships/adapters/inbound/hono.ts";

export function createHonoApp(
  eventStore: LoadDomainEvents<MembershipEventV1, Promise<MembershipEventV1[] | GatewayFailure>> &
    AppendToEventStore<MembershipEventV1, Promise<void | GatewayFailure>>,
  outbox: StageIntents<MembershipIntents, Promise<void | GatewayFailure>> &
    StageNotifications<OpenMembershipRejected, Promise<void | GatewayFailure>>,
  listMembershipsProjectionLoader: LoadProjection<ListMembershipsProjection>,
) {
  const membershipRepository = new OpenMembershipRepository(eventStore);

  const app = new Hono();
  app.use(
    compress(),
    cors(),
    csrf(),
    logger(),
    requestId(),
    secureHeaders(),
    timeout(5000),
    timing(),
    trimTrailingSlash(),
  );

  const openMembershipHandler = new OpenMembershipHandler(membershipRepository, outbox);
  app.route("/", createOpenMembershipInboundHonoAdapter(openMembershipHandler));

  const listMembershipsHandler = new ListMembershipsHandler(listMembershipsProjectionLoader);
  app.route("/", createListMembershipsInboundHonoAdapter(listMembershipsHandler));

  app.notFound((c) => {
    return c.text("Not found", 404);
  });

  app.onError((err, c) => {
    console.error(`${err}`);
    return c.text("Unexpected error", 500);
  });

  return app;
}
