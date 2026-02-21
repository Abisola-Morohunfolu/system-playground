import { SimulationAction, SimulationContext, SimulationPlugin, SimulationState } from '../types/simulation';

export interface RuntimeOptions {
  seed?: number;
  now?: () => number;
}

export interface RuntimeStepRecord {
  tick: number;
  action?: SimulationAction;
  timestamp: number;
}

export type RuntimeStepListener<TState extends SimulationState = SimulationState> = (
  state: TState,
  record: RuntimeStepRecord,
) => void;

export class SimulationRuntime<TState extends SimulationState = SimulationState> {
  private state: TState;
  private readonly context: SimulationContext;
  private readonly history: RuntimeStepRecord[] = [];
  private readonly listeners = new Set<RuntimeStepListener<TState>>();

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

  getHistory(): RuntimeStepRecord[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history.length = 0;
  }

  subscribe(listener: RuntimeStepListener<TState>): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  step(action?: SimulationAction): TState {
    // Advance exactly one simulation tick.
    this.state = this.plugin.step(this.state, action, this.context);
    const record: RuntimeStepRecord = {
      tick: this.state.tick,
      action,
      timestamp: this.context.now(),
    };
    this.history.push(record);
    this.emitStep(record);
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

  private emitStep(record: RuntimeStepRecord): void {
    for (const listener of this.listeners) {
      listener(this.state, record);
    }
  }
}
