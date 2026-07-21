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
import type { StageIntents } from "@arts-and-crafts/v5/core/capabilities";
import type {
  StageNotifications,
  LoadDomainEvents,
  AppendToEventStore,
  PersistEventsAndIntents,
  LoadProjection,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { MembershipIntents } from "@examples/modules/membership/core/intents/index.ts";
import type { OpenMembershipRejected } from "@examples/modules/membership/useCases/commands/openMembership/rejections/MembershipAlreadyExists.ts";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { MembershipOpenedV1 } from "@examples/modules/membership/core/events/v1/MembershipOpenedV1.ts";
import type { NotifyUserToVerifyEmailV1 } from "@examples/modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";
import type { ListMembershipsProjection } from "@examples/modules/membership/useCases/queries/listMemberships/projection.ts";
import type { ResultAsync } from "neverthrow";
import { createOpenMembershipHonoHandler } from "@examples/modules/membership/useCases/commands/openMembership/adapters/inbound/hono.ts";
import { createListMembershipsHonoHandler } from "@examples/modules/membership/useCases/queries/listMemberships/adapters/inbound/hono.ts";

export function createHonoApp(
  eventStore: LoadDomainEvents<
    MembershipEventV1,
    ResultAsync<MembershipEventV1[], GatewayFailure>
  > &
    AppendToEventStore<MembershipEventV1, ResultAsync<void, GatewayFailure>>,
  outbox: StageIntents<MembershipIntents, ResultAsync<void, GatewayFailure>> &
    StageNotifications<OpenMembershipRejected, ResultAsync<void, GatewayFailure>>,
  openMembershipWriter: PersistEventsAndIntents<
    MembershipOpenedV1,
    NotifyUserToVerifyEmailV1,
    ResultAsync<void, GatewayFailure>
  >,
  listMembershipsProjectionLoader: LoadProjection<
    ListMembershipsProjection,
    ResultAsync<ListMembershipsProjection, GatewayFailure>
  >,
) {
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

  // Each route resolves its own expected errors (validation/rejection/failure)
  // inside its neverthrow pipeline. This boundary only catches genuinely
  // unexpected throws — a handler that rejected, or a global middleware fault.
  app
    .post(
      "membership/open",
      createOpenMembershipHonoHandler(eventStore, openMembershipWriter, outbox),
    )
    .get("memberships", createListMembershipsHonoHandler(listMembershipsProjectionLoader));

  app.notFound((c) => {
    return c.text("Not found", 404);
  });

  app.onError((_err, c) => {
    return c.json({ code: "INTERNAL_ERROR", reason: "Internal server error" }, 500);
  });

  return app;
}
