import type { IntegrationEvent } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import * as z from "zod";
import { createIntegrationEventSchema } from "./IntegrationEvent.schema.ts";
import { MetadataSchema } from "./Metadata.schema.ts";

describe("createIntegrationEventSchema", () => {
  const payload = z.object({ accountId: z.string() });
  const schema = createIntegrationEventSchema({ payload });

  const event: IntegrationEvent<string, z.infer<typeof payload>> = {
    id: "event-1",
    type: "AccountOpened.v1",
    kind: "integration",
    timestamp: Date.UTC(2026, 8, 11),
    payload: { accountId: "account-1" },
    metadata: { correlationId: "correlation-1", causationId: "causation-1" },
  };
  // Typed against the schema's input: every IntegrationEvent must fit it once
  // its timestamp is put in wire format.
  const envelope: z.input<typeof schema> = {
    ...event,
    timestamp: new Date(event.timestamp).toISOString(),
  };

  it("lays out the envelope fields in IntegrationEvent order", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "id",
      "type",
      "kind",
      "timestamp",
      "payload",
      "metadata",
    ]);
  });

  it("parses an integration event in wire format", () => {
    expect(schema.parse(envelope)).toEqual(envelope);
  });

  it("rejects a kind other than integration", () => {
    expect(schema.safeParse({ ...envelope, kind: "domain" }).success).toBe(false);
  });

  it("rejects the in-memory epoch-millisecond timestamp", () => {
    expect(schema.safeParse({ ...envelope, timestamp: event.timestamp }).success).toBe(false);
  });

  it("validates the payload against the given schema", () => {
    expect(schema.safeParse({ ...envelope, payload: {} }).success).toBe(false);
  });

  it("defaults metadata to MetadataSchema", () => {
    expect(schema.shape.metadata).toBe(MetadataSchema);
  });

  it("takes an extension of MetadataSchema", () => {
    const extended = createIntegrationEventSchema({
      payload,
      metadata: MetadataSchema.extend({ brand: z.string() }),
    });
    const metadata = { ...envelope.metadata, brand: "acme" };

    expect(extended.parse({ ...envelope, metadata }).metadata).toEqual(metadata);
  });

  it("takes a schema for the event type", () => {
    const typed = createIntegrationEventSchema({ payload, type: z.enum(["AccountOpened.v1"]) });

    expect(typed.safeParse({ ...envelope, type: "AccountClosed.v1" }).success).toBe(false);
  });

  // Each case is rejected twice: by the compiler (the @ts-expect-error) and,
  // for callers it cannot see, when the schema is built.
  describe("keeps correlationId and causationId required", () => {
    it("rejects an optional correlationId", () => {
      expect(() =>
        createIntegrationEventSchema({
          payload,
          // @ts-expect-error correlationId must stay required
          metadata: MetadataSchema.extend({ correlationId: z.string().optional() }),
        }),
      ).toThrow("Integration event metadata must require correlationId");
    });

    it("rejects a nullable causationId", () => {
      expect(() =>
        createIntegrationEventSchema({
          payload,
          // @ts-expect-error causationId must stay required
          metadata: MetadataSchema.extend({ causationId: z.string().nullable() }),
        }),
      ).toThrow("Integration event metadata must require causationId");
    });

    it("rejects a defaulted correlationId", () => {
      expect(() =>
        createIntegrationEventSchema({
          payload,
          // @ts-expect-error a default makes correlationId optional on the way in
          metadata: MetadataSchema.extend({ correlationId: z.string().default("unknown") }),
        }),
      ).toThrow("Integration event metadata must require correlationId");
    });

    it("rejects metadata without causationId", () => {
      expect(() =>
        createIntegrationEventSchema({
          payload,
          // @ts-expect-error causationId must be declared
          metadata: z.object({ correlationId: z.string() }),
        }),
      ).toThrow("Integration event metadata must require causationId");
    });
  });
});
