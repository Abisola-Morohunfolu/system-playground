import { SimulationAction, SimulationContext, SimulationPlugin, SimulationState } from '../types/simulation';

export interface RuntimeOptions {
  seed?: number;
  now?: () => number;
}

export class SimulationRuntime<TState extends SimulationState = SimulationState> {
  private state: TState;
  private readonly context: SimulationContext;

  constructor(
    private readonly plugin: SimulationPlugin<TState>,
    options: RuntimeOptions = {},
  ) {
    this.context = {
      seed: options.seed,
      now: options.now ?? (() => Date.now()),
    };
    // Initialize once from the plugin's starting state.
    this.state = this.plugin.init(this.context);
  }

  getState(): TState {
    return this.state;
  }

  getTick(): number {
    return this.state.tick;
  }

  step(action?: SimulationAction): TState {
    // Advance exactly one simulation tick.
    this.state = this.plugin.step(this.state, action, this.context);
    return this.state;
  }

  dispatch(action: SimulationAction): TState {
    // Alias for step(action) to keep UI call sites readable.
    return this.step(action);
  }

  reset(): TState {
    // Recreate initial state using the same runtime context/options.
    this.state = this.plugin.init(this.context);
    return this.state;
  }
}
