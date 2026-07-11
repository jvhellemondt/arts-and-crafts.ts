import type { EmailMessage } from "./EmailGateway.ts";
import { InMemoryEmailGateway } from "./EmailGateway.ts";

const makeMessage = (overrides: Partial<EmailMessage> = {}): EmailMessage => ({
  to: "jane@example.com",
  subject: "Verify your email",
  body: "Hi Jane, click to verify.",
  idempotencyKey: "01HXX-IDEMP-KEY",
  ...overrides,
});

describe("InMemoryEmailGateway", () => {
  let gateway: InMemoryEmailGateway;

  beforeEach(() => {
    gateway = new InMemoryEmailGateway();
  });

  it("should be defined", () => {
    expect(InMemoryEmailGateway).toBeDefined();
  });

  it("should construct with an empty sent buffer", () => {
    expect(gateway.sent).toEqual([]);
  });

  it("should append the message to the sent buffer on send", async () => {
    const message = makeMessage();
    await gateway.send(message);
    expect(gateway.sent).toEqual([message]);
  });

  describe("simulating offline fault", () => {
    beforeEach(() => {
      gateway.simulate("offline");
    });

    it("should expose isSimulating as true", () => {
      expect(gateway.isSimulating).toBe(true);
    });

    it("should expose the active fault", () => {
      expect(gateway.activeFault).toBe("offline");
    });

    it("should throw when send is called", async () => {
      await expect(gateway.send(makeMessage())).rejects.toThrow("EmailGateway is offline");
    });

    it("should not record any message when offline", async () => {
      await expect(gateway.send(makeMessage())).rejects.toThrow();
      expect(gateway.sent).toEqual([]);
    });

    it("should restore to online state", async () => {
      gateway.restore();
      expect(gateway.isSimulating).toBe(false);
      expect(gateway.activeFault).toBeUndefined();
      await gateway.send(makeMessage());
      expect(gateway.sent).toHaveLength(1);
    });
  });
});
