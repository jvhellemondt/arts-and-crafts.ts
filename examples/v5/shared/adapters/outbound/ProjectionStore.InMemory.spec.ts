import { InMemoryProjectionStore } from "./ProjectionStore.InMemory.ts";

interface TestProjection {
  byId: Record<string, { id: string; value: number }>;
}

const emptyProjection: TestProjection = { byId: {} };

describe("InMemoryProjectionStore", () => {
  let store: InMemoryProjectionStore<TestProjection>;

  beforeEach(() => {
    store = new InMemoryProjectionStore<TestProjection>(emptyProjection);
  });

  it("returns the initial state on load", async () => {
    const result = (await store.load())._unsafeUnwrap();
    expect(result).toEqual(emptyProjection);
  });

  it("returns the saved state on the next load", async () => {
    const next: TestProjection = { byId: { a: { id: "a", value: 1 } } };
    await store.save(next);
    const result = (await store.load())._unsafeUnwrap();
    expect(result).toEqual(next);
  });

  it("overwrites previous state on successive saves", async () => {
    await store.save({ byId: { a: { id: "a", value: 1 } } });
    const final: TestProjection = { byId: { b: { id: "b", value: 2 } } };
    await store.save(final);
    expect((await store.load())._unsafeUnwrap()).toEqual(final);
  });

  describe("checkpoint", () => {
    it("defaults to 0 before any advance", async () => {
      expect((await store.loadCheckpoint())._unsafeUnwrap()).toBe(0);
    });

    it("returns the most recently advanced position", async () => {
      await store.advanceCheckpoint(7);
      expect((await store.loadCheckpoint())._unsafeUnwrap()).toBe(7);
      await store.advanceCheckpoint(42);
      expect((await store.loadCheckpoint())._unsafeUnwrap()).toBe(42);
    });
  });

  describe("simulating offline fault", () => {
    beforeEach(() => {
      store.simulate("offline");
    });

    it("exposes isSimulating as true", () => {
      expect(store.isSimulating).toBe(true);
    });

    it("exposes activeFault as 'offline'", () => {
      expect(store.activeFault).toBe("offline");
    });

    it("returns a GatewayFailure on load", async () => {
      const result = (await store.load())._unsafeUnwrapErr();
      expect(result).toMatchObject({
        code: "GATEWAY_FAILURE",
        gateway: "InMemoryProjectionStore",
      });
    });

    it("returns a GatewayFailure on save", async () => {
      const result = (await store.save({ byId: { a: { id: "a", value: 1 } } }))._unsafeUnwrapErr();
      expect(result).toMatchObject({
        code: "GATEWAY_FAILURE",
        gateway: "InMemoryProjectionStore",
      });
    });

    it("returns a GatewayFailure on loadCheckpoint", async () => {
      const result = (await store.loadCheckpoint())._unsafeUnwrapErr();
      expect(result).toMatchObject({
        code: "GATEWAY_FAILURE",
        gateway: "InMemoryProjectionStore",
      });
    });

    it("returns a GatewayFailure on advanceCheckpoint", async () => {
      const result = (await store.advanceCheckpoint(1))._unsafeUnwrapErr();
      expect(result).toMatchObject({
        code: "GATEWAY_FAILURE",
        gateway: "InMemoryProjectionStore",
      });
    });

    it("does not mutate the checkpoint when advance is rejected", async () => {
      await store.advanceCheckpoint(99);
      store.restore();
      expect((await store.loadCheckpoint())._unsafeUnwrap()).toBe(0);
    });

    it("does not mutate the state when save is rejected", async () => {
      await store.save({ byId: { a: { id: "a", value: 1 } } });
      store.restore();
      expect((await store.load())._unsafeUnwrap()).toEqual(emptyProjection);
    });

    it("restores back to online state", async () => {
      store.restore();
      expect(store.isSimulating).toBe(false);
      expect(store.activeFault).toBeUndefined();
      const next: TestProjection = { byId: { a: { id: "a", value: 1 } } };
      await store.save(next);
      expect((await store.load())._unsafeUnwrap()).toEqual(next);
    });
  });
});
