export function parseAsError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === "string") return new Error(value);
  try {
    const json = JSON.stringify(value);
    return new Error(json ?? String(value));
  } catch {
    return new Error("Unknown error");
  }
}
