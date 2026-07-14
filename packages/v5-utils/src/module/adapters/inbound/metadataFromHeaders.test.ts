import { metadataFromHeaders } from "./metadataFromHeaders.ts";

describe("metadataFromHeaders", () => {
  it("reads correlation/causation ids from their default headers", () => {
    const metadata = metadataFromHeaders({
      "x-correlation-id": "corr-1",
      "x-request-id": "cause-1",
    });
    expect(metadata).toEqual({ correlationId: "corr-1", causationId: "cause-1" });
  });

  it("generates ids when the headers are absent", () => {
    const metadata = metadataFromHeaders({});
    expect(metadata.correlationId).toEqual(expect.any(String));
    expect(metadata.causationId).toEqual(expect.any(String));
  });

  it("honours per-id options", () => {
    const metadata = metadataFromHeaders(
      {},
      {
        correlation: { idFactory: () => "fixed-corr" },
        causation: { idFactory: () => "fixed-cause" },
      },
    );
    expect(metadata).toEqual({ correlationId: "fixed-corr", causationId: "fixed-cause" });
  });
});
