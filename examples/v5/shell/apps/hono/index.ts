import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { logger } from "hono/logger";
import { timeout } from "hono/timeout";
import { timing } from "hono/timing";
import { trimTrailingSlash } from "hono/trailing-slash";
import type { PipelineEnv } from "@arts-and-crafts/v5-hono";
import { resolveError } from "@arts-and-crafts/v5-utils/adapters/inbound";
import type { FailureHook, RejectionHook } from "@arts-and-crafts/v5-utils/adapters/inbound";
import type { StageIntents } from "@arts-and-crafts/v5/core/capabilities";
import type {
  StageNotifications,
  LoadDomainEvents,
  AppendToEventStore,
  LoadProjection,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { MembershipIntents } from "@examples/modules/membership/core/intents/index.ts";
import type { OpenMembershipRejected } from "@examples/modules/membership/useCases/commands/openMembership/rejections/MembershipAlreadyExists.ts";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { ListMembershipsProjection } from "@examples/modules/membership/useCases/queries/listMemberships/projection.ts";
import { createOpenMembershipHonoHandler } from "@examples/modules/membership/useCases/commands/openMembership/adapters/inbound/hono.ts";
import { openMembershipHooks } from "@examples/modules/membership/useCases/commands/openMembership/adapters/inbound/hooks.ts";
import { createListMembershipsHonoHandler } from "@examples/modules/membership/useCases/queries/listMemberships/adapters/inbound/hono.ts";
import { listMembershipsHooks } from "@examples/modules/membership/useCases/queries/listMemberships/adapters/inbound/hooks.ts";

const routeHooks: Record<string, { onRejection?: RejectionHook; onFailure: FailureHook }> = {
  "/membership/open": openMembershipHooks,
  "/memberships": listMembershipsHooks,
};

export function createHonoApp(
  eventStore: LoadDomainEvents<MembershipEventV1, Promise<MembershipEventV1[] | GatewayFailure>> &
    AppendToEventStore<MembershipEventV1, Promise<void | GatewayFailure>>,
  outbox: StageIntents<MembershipIntents, Promise<void | GatewayFailure>> &
    StageNotifications<OpenMembershipRejected, Promise<void | GatewayFailure>>,
  listMembershipsProjectionLoader: LoadProjection<ListMembershipsProjection>,
) {
  const app = new Hono<PipelineEnv>();
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

  app
    .post("membership/open", ...createOpenMembershipHonoHandler(eventStore, outbox))
    .get("memberships", ...createListMembershipsHonoHandler(listMembershipsProjectionLoader));

  app.notFound((c) => {
    return c.text("Not found", 404);
  });

  app.onError((err, c) => {
    const outcome = resolveError(err, routeHooks[c.req.path] ?? {});
    return c.json(outcome.body, { status: outcome.status as ContentfulStatusCode });
  });

  return app;
}
