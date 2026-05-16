import type { Intent } from "@core/shapes/Intent.ts";

export interface HandleIntent<TIntent extends Intent, TResult = Promise<void>> {
  handle(input: TIntent): TResult;
}
