export function invariant(condition: boolean, onInvalid: () => never): asserts condition {
  if (!condition) onInvalid();
}
