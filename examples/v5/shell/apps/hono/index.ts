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
import { ListMembershipsHandler } from "@examples/modules/membership/useCases/queries/listMemberships/handler.ts";
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
import { OpenMembershipHandler } from "@examples/modules/membership/useCases/commands/openMembership/handler.ts";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { ListMembershipsProjection } from "@examples/modules/membership/useCases/queries/listMemberships/projection.ts";
import { OpenMembershipRepository } from "@examples/modules/membership/useCases/commands/openMembership/repository.ts";
import {
  openMembershipHonoMiddleware,
  createOpenMembershipHonoHandler,
} from "@examples/modules/membership/useCases/commands/openMembership/adapters/inbound/hono.ts";
import { openMembershipHooks } from "@examples/modules/membership/useCases/commands/openMembership/adapters/inbound/hooks.ts";
import {
  listMembershipsHonoMiddleware,
  createListMembershipsHonoHandler,
} from "@examples/modules/membership/useCases/queries/listMemberships/adapters/inbound/hono.ts";
import { listMembershipsHooks } from "@examples/modules/membership/useCases/queries/listMemberships/adapters/inbound/hooks.ts";

export function createHonoApp(
  eventStore: LoadDomainEvents<MembershipEventV1, Promise<MembershipEventV1[] | GatewayFailure>> &
    AppendToEventStore<MembershipEventV1, Promise<void | GatewayFailure>>,
  outbox: StageIntents<MembershipIntents, Promise<void | GatewayFailure>> &
    StageNotifications<OpenMembershipRejected, Promise<void | GatewayFailure>>,
  listMembershipsProjectionLoader: LoadProjection<ListMembershipsProjection>,
) {
  const membershipRepository = new OpenMembershipRepository(eventStore);

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

  // Routes are registered directly on this single app instance — mounting
  // separate per-use-case Hono sub-apps via app.route("/", ...) more than
  // once at the same base path corrupts c.req.query() for later mounts (a
  // Hono quirk, confirmed independently of this codebase). onError is
  // therefore also app-wide; it dispatches per-use-case hooks by path.
  const openMembershipHandler = new OpenMembershipHandler(membershipRepository, outbox);
  app.use("membership/open", ...openMembershipHonoMiddleware);
  app.post("membership/open", createOpenMembershipHonoHandler(openMembershipHandler));

  const listMembershipsHandler = new ListMembershipsHandler(listMembershipsProjectionLoader);
  app.use("memberships", ...listMembershipsHonoMiddleware);
  app.get("memberships", createListMembershipsHonoHandler(listMembershipsHandler));

  app.notFound((c) => {
    return c.text("Not found", 404);
  });

  app.onError((err, c) => {
    try {
      const hooks = c.req.path === "/membership/open" ? openMembershipHooks : listMembershipsHooks;
      const outcome = resolveError(err, hooks);
      return c.json(outcome.body, { status: outcome.status as ContentfulStatusCode });
    } catch {
      console.error(`${err}`);
      return c.text("Unexpected error", 500);
    }
  });

  return app;
}
