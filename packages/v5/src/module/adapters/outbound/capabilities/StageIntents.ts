export interface StageIntents<TIntent> {
  stage(intents: TIntent[]): Promise<void>;
}
