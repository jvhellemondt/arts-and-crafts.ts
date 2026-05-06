export type AuditEntry = {
  timestamp: number;
  correlationId: string;
  commandType: string;
  aggregateType?: string;
  aggregateId?: string;
  rejection: { code: string; reason: string };
};
