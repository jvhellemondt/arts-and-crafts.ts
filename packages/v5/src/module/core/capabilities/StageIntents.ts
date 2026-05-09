import type { Intent } from "@core/shapes/Intent.ts";

export interface StageIntents<TIntent extends Intent, TResult = Promise<void>> {
  stage(intents: TIntent[]): TResult;
}
