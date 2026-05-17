import type { HandleIntent } from "@useCases/policy/capabilities/HandleIntent.ts";
import type { Intent } from "@core/shapes/Intent.ts";

export interface RegisterIntentSubscriber<TIntent extends Intent = Intent, TResult = void> {
  subscribe<T extends TIntent>(intentType: T["type"], handler: HandleIntent<T>): TResult;
}
