export type SimulationId = string;

export interface SimulationState {
  tick: number;
}

export interface SimulationAction {
  type: string;
  payload?: unknown;
}

export interface SimulationContext {
  seed?: number;
  now: () => number;
}

export interface SimulationPlugin<TState extends SimulationState = SimulationState> {
  id: SimulationId;
  init(context?: SimulationContext): TState;
  step(state: TState, action?: SimulationAction, context?: SimulationContext): TState;
}
