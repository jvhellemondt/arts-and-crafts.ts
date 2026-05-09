export interface StageIntents<TIntent, TResult = Promise<void>> {
  stage(intents: TIntent[]): TResult;
}
