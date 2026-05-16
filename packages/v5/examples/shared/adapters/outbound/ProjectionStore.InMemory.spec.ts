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
    const result = await store.load();
    expect(result).toEqual(emptyProjection);
  });

  it("returns the saved state on the next load", async () => {
    const next: TestProjection = { byId: { a: { id: "a", value: 1 } } };
    await store.save(next);
    const result = await store.load();
    expect(result).toEqual(next);
  });

  it("overwrites previous state on successive saves", async () => {
    await store.save({ byId: { a: { id: "a", value: 1 } } });
    const final: TestProjection = { byId: { b: { id: "b", value: 2 } } };
    await store.save(final);
    expect(await store.load()).toEqual(final);
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
      const result = await store.load();
      expect(result).toMatchObject({
        kind: "GatewayFailure",
        gateway: "InMemoryProjectionStore",
      });
    });

    it("returns a GatewayFailure on save", async () => {
      const result = await store.save({ byId: { a: { id: "a", value: 1 } } });
      expect(result).toMatchObject({
        kind: "GatewayFailure",
        gateway: "InMemoryProjectionStore",
      });
    });

    it("does not mutate the state when save is rejected", async () => {
      await store.save({ byId: { a: { id: "a", value: 1 } } });
      store.restore();
      expect(await store.load()).toEqual(emptyProjection);
    });

    it("restores back to online state", async () => {
      store.restore();
      expect(store.isSimulating).toBe(false);
      expect(store.activeFault).toBeUndefined();
      const next: TestProjection = { byId: { a: { id: "a", value: 1 } } };
      await store.save(next);
      expect(await store.load()).toEqual(next);
    });
  });
});
