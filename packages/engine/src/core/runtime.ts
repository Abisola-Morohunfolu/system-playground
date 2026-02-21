import { SimulationAction, SimulationPlugin, SimulationState } from '../types/simulation';

export class SimulationRuntime<TState extends SimulationState = SimulationState> {
  private state: TState;

  constructor(private readonly plugin: SimulationPlugin<TState>) {
    this.state = this.plugin.init();
  }

  getState(): TState {
    return this.state;
  }

  step(action?: SimulationAction): TState {
    this.state = this.plugin.step(this.state, action);
    return this.state;
  }

  reset(): TState {
    this.state = this.plugin.init();
    return this.state;
  }
}
