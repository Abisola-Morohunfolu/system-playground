export type SimulationId = string;

export interface SimulationState {
  tick: number;
}

export interface SimulationAction {
  type: string;
  payload?: unknown;
}

export interface SimulationPlugin<TState extends SimulationState = SimulationState> {
  id: SimulationId;
  init(): TState;
  step(state: TState, action?: SimulationAction): TState;
}
