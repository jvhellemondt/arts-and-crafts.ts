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
import { createOpenMembershipRoute } from "./routes/createOpenMembershipRoute.ts";
import { createListMembershipsRoute } from "./routes/createListMembershipsRoute.ts";
import { OpenMembershipHonoAdapter } from "@examples/modules/membership/useCases/commands/openMembership/adapters/inbound/hono.ts";
import { ListMembershipsHonoAdapter } from "@examples/modules/membership/useCases/queries/listMemberships/adapters/inbound/http.ts";
import { ListMembershipsHandler } from "@examples/modules/membership/useCases/queries/listMemberships/handler.ts";
import { MembershipRepository } from "@examples/modules/membership/core/repository.ts";
import type { StageIntents } from "@core/capabilities/StageIntents.ts";
import type { StageNotifications } from "@adapters/outbound/capabilities/StageNotifications.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { MembershipIntents } from "@examples/modules/membership/core/intents/index.ts";
import type { MembershipAlreadyExists } from "@examples/modules/membership/useCases/commands/openMembership/rejections/MembershipAlreadyExists.ts";
import type { Notification } from "@adapters/outbound/shapes/Notification.ts";
import { OpenMembershipHandler } from "@examples/modules/membership/useCases/commands/openMembership/handler.ts";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { LoadDomainEvents } from "@adapters/outbound/capabilities/LoadDomainEvents.ts";
import type { AppendToEventStream } from "@adapters/outbound/capabilities/AppendToEventStream.ts";
import type { LoadProjection } from "@adapters/outbound/capabilities/LoadProjection.ts";
import type { ListMembershipsProjection } from "@examples/modules/membership/useCases/queries/listMemberships/projection.ts";

export function createHonoApp(
  eventStore: LoadDomainEvents<MembershipEventV1, Promise<MembershipEventV1[] | GatewayFailure>> &
    AppendToEventStream<MembershipEventV1, Promise<void | GatewayFailure>>,
  outbox: StageIntents<MembershipIntents, Promise<void | GatewayFailure>> &
    StageNotifications<
      Notification<"OpenMembershipRejected", MembershipAlreadyExists>,
      Promise<void | GatewayFailure>
    >,
  listMembershipsProjectionLoader: LoadProjection<ListMembershipsProjection>,
) {
  const membershipRepository = new MembershipRepository(eventStore);

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
  const openMembershipAdapter = new OpenMembershipHonoAdapter(openMembershipHandler);
  app.route("/", createOpenMembershipRoute(openMembershipAdapter));

  const listMembershipsHandler = new ListMembershipsHandler(listMembershipsProjectionLoader);
  const listMembershipsAdapter = new ListMembershipsHonoAdapter(listMembershipsHandler);
  app.route("/", createListMembershipsRoute(listMembershipsAdapter));

  app.notFound((c) => {
    return c.text("Not found", 404);
  });

  app.onError((err, c) => {
    console.error(`${err}`);
    return c.text("Unexpected error", 500);
  });

  return app;
}
