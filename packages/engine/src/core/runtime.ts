import { SimulationAction, SimulationContext, SimulationPlugin, SimulationState } from '../types/simulation';
import { ActionScheduler } from '../scheduler/action-scheduler';

export interface RuntimeOptions {
  seed?: number;
  now?: () => number;
  scheduler?: ActionScheduler;
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
  private readonly scheduler?: ActionScheduler;

  constructor(
    private readonly plugin: SimulationPlugin<TState>,
    options: RuntimeOptions = {},
  ) {
    this.context = {
      seed: options.seed,
      now: options.now ?? (() => Date.now()),
    };
    this.scheduler = options.scheduler;
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

  hasScheduler(): boolean {
    // Allows UI/adapters to feature-detect scheduler support safely.
    return Boolean(this.scheduler);
  }

  getSchedulerTick(): number | null {
    // Returns null when runtime is running in direct-dispatch mode.
    return this.scheduler ? this.scheduler.getCurrentTick() : null;
  }

  enqueue(action: SimulationAction): void {
    // Queue an action for execution on the scheduler's current tick.
    const scheduler = this.getSchedulerOrThrow();
    scheduler.enqueue(action);
  }

  scheduleIn(delayTicks: number, action: SimulationAction): void {
    // Queue an action for a future scheduler tick.
    const scheduler = this.getSchedulerOrThrow();
    scheduler.scheduleIn(delayTicks, action);
  }

  advanceScheduler(steps = 1): number {
    // Moves scheduler time forward without mutating simulation state directly.
    const scheduler = this.getSchedulerOrThrow();
    return scheduler.advanceTick(steps);
  }

  runReadyActions(): number {
    // Drain ready scheduler actions and apply them through normal step() flow.
    const scheduler = this.getSchedulerOrThrow();
    const readyActions = scheduler.drainReadyActions();
    for (const action of readyActions) {
      this.step(action);
    }
    return readyActions.length;
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

  private getSchedulerOrThrow(): ActionScheduler {
    // Central guard to keep scheduler-only APIs explicit.
    if (!this.scheduler) {
      throw new Error('Scheduler is not configured for this runtime');
    }
    return this.scheduler;
  }
}
