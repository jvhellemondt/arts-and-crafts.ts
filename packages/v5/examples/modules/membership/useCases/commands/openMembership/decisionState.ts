export type DecisionState =
  | {
      status: "initial";
      id: string;
    }
  | {
      status: "open";
      id: string;
      name: string;
      email: string;
    };
