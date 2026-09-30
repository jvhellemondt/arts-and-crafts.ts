import { MetadataSchema } from "./Metadata.schema.ts";

describe("MetadataSchema", () => {
  const metadata = { correlationId: "correlation-1", causationId: "causation-1" };

  it.each(["correlationId", "causationId"] as const)("requires %s", (key) => {
    const { [key]: _omitted, ...rest } = metadata;

    expect(MetadataSchema.safeParse(rest).success).toBe(false);
  });

  it.each([undefined, null])("accepts %s for the optional fields", (value) => {
    const parsed = MetadataSchema.parse({ ...metadata, tenantId: value, actorId: value });

    expect(parsed).toEqual({ ...metadata, tenantId: value, actorId: value });
  });

  it("strips keys it does not declare, so domain provenance stays off the wire", () => {
    const parsed = MetadataSchema.parse({ ...metadata, commandId: "command-1" });

    expect(parsed).toEqual(metadata);
  });
});
