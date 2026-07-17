import type { Failure } from "../shapes/Failure.ts";
import type { Intent } from "../shapes/Intent.ts";

export interface StageIntents<TIntent extends Intent, TResult = Promise<void | Failure>> {
  stage(intents: TIntent[]): TResult;
}
