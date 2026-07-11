import type {
  FaultSimulationMode,
  SimulateFaults,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";

export type EmailMessage = {
  to: string;
  subject: string;
  body: string;
  idempotencyKey: string;
};

export interface EmailGateway {
  send(message: EmailMessage): Promise<void>;
}

export class InMemoryEmailGateway implements EmailGateway, SimulateFaults {
  private simulation?: FaultSimulationMode;
  readonly sent: EmailMessage[];

  constructor(sent: EmailMessage[] = []) {
    this.sent = sent;
  }

  simulate(mode: "offline"): void {
    this.simulation = mode;
  }

  restore(): void {
    this.simulation = undefined;
  }

  get isSimulating(): boolean {
    return this.simulation !== undefined;
  }

  get activeFault(): FaultSimulationMode | undefined {
    return this.simulation;
  }

  async send(message: EmailMessage): Promise<void> {
    if (this.activeFault === "offline") {
      throw new Error("EmailGateway is offline");
    }
    this.sent.push(message);
  }
}
