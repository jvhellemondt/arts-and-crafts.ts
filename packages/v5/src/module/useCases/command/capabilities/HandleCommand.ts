import type { Command } from "../shapes/Command.ts";

export interface HandleCommand<TCommand extends Command, TResult = Promise<void>> {
  handle(input: TCommand): TResult;
}
