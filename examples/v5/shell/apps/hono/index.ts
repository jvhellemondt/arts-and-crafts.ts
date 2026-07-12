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
import { v7 as uuidv7 } from "uuid";
import type { PipelineEnv } from "@arts-and-crafts/v5-hono";
import {
  parseJsonBodyMiddleware,
  parseQueryMiddleware,
  correlationIdMiddleware,
  causationIdMiddleware,
} from "@arts-and-crafts/v5-hono";
import { runCommand } from "@arts-and-crafts/v5-utils/useCases/command";
import { runQuery } from "@arts-and-crafts/v5-utils/useCases/query";
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
import { createOpenMembershipCommand } from "@examples/modules/membership/useCases/commands/openMembership/command.ts";
import {
  openMembershipSchema,
  type OpenMembershipSchemaPayload,
} from "@examples/modules/membership/useCases/commands/openMembership/adapters/inbound/schema.ts";
import { aggregateId } from "@examples/modules/membership/core/domain/AggregateId.ts";
import {
  createListMembershipsQuery,
  listMembershipsQueryPayload,
  type ListMembershipsQueryPayload,
} from "@examples/modules/membership/useCases/queries/listMemberships/query.ts";

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
  app.use("membership/open", parseJsonBodyMiddleware(openMembershipSchema));
  app.use("membership/open", correlationIdMiddleware());
  app.use("membership/open", causationIdMiddleware());
  app.post("membership/open", async (c) => {
    const command = await runCommand(
      (payload: OpenMembershipSchemaPayload, metadata) =>
        createOpenMembershipCommand(
          { ...payload, membershipId: aggregateId.parse(uuidv7()) },
          metadata,
        ),
      openMembershipHandler,
    )(c.get("payload") as OpenMembershipSchemaPayload, {
      correlationId: c.get("correlationId"),
      causationId: c.get("causationId"),
    });
    return c.json({ accepted: true, id: command.payload.membershipId }, { status: 202 });
  });

  const listMembershipsHandler = new ListMembershipsHandler(listMembershipsProjectionLoader);
  app.use("memberships", parseQueryMiddleware(listMembershipsQueryPayload));
  app.use("memberships", correlationIdMiddleware());
  app.use("memberships", causationIdMiddleware());
  app.get("memberships", async (c) => {
    const data = await runQuery(createListMembershipsQuery, listMembershipsHandler)(
      c.get("payload") as ListMembershipsQueryPayload,
      { correlationId: c.get("correlationId"), causationId: c.get("causationId") },
    );
    return c.json(data, { status: 200 });
  });

  app.notFound((c) => {
    return c.text("Not found", 404);
  });

  app.onError((err, c) => {
    try {
      const hooks =
        c.req.path === "/membership/open"
          ? { onRejection: () => [404] as const, onFailure: () => [500] as const }
          : { onFailure: () => [503] as const };
      const outcome = resolveError(err, hooks);
      return c.json(outcome.body, { status: outcome.status as ContentfulStatusCode });
    } catch {
      console.error(`${err}`);
      return c.text("Unexpected error", 500);
    }
  });

  return app;
}
