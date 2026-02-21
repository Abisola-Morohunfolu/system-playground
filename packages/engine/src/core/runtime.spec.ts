import { describe, expect, it } from 'vitest';
import { SimulationPlugin, SimulationState } from '../types/simulation';
import { SimulationRuntime } from './runtime';

interface CounterState extends SimulationState {
  count: number;
  initializedAt: number;
}

const createPlugin = (): SimulationPlugin<CounterState> => ({
  id: 'counter',
  init: (context) => ({
    tick: 0,
    count: 0,
    initializedAt: context?.now() ?? 0,
  }),
  step: (state, action) => ({
    ...state,
    tick: state.tick + 1,
    count: action?.type === 'inc' ? state.count + 1 : state.count,
  }),
});

describe('SimulationRuntime', () => {
  it('initializes and steps deterministically', () => {
    const runtime = new SimulationRuntime(createPlugin(), { now: () => 1700000000000, seed: 7 });

    expect(runtime.getState()).toEqual({ tick: 0, count: 0, initializedAt: 1700000000000 });
    expect(runtime.getTick()).toBe(0);

    runtime.step();
    expect(runtime.getState()).toEqual({ tick: 1, count: 0, initializedAt: 1700000000000 });

    runtime.dispatch({ type: 'inc' });
    expect(runtime.getState()).toEqual({ tick: 2, count: 1, initializedAt: 1700000000000 });
  });

  it('resets to the plugin initial state using the same runtime context', () => {
    const runtime = new SimulationRuntime(createPlugin(), { now: () => 42 });
    runtime.dispatch({ type: 'inc' });

    expect(runtime.getState().count).toBe(1);
    expect(runtime.reset()).toEqual({ tick: 0, count: 0, initializedAt: 42 });
  });

  it('records step history with timestamps and actions', () => {
    let now = 100;
    const runtime = new SimulationRuntime(createPlugin(), { now: () => now });

    runtime.step();
    now = 200;
    runtime.dispatch({ type: 'inc' });

    expect(runtime.getHistory()).toEqual([
      { tick: 1, action: undefined, timestamp: 100 },
      { tick: 2, action: { type: 'inc' }, timestamp: 200 },
    ]);

    runtime.clearHistory();
    expect(runtime.getHistory()).toEqual([]);
  });

  it('notifies subscribers on each step and supports unsubscribe', () => {
    const runtime = new SimulationRuntime(createPlugin(), { now: () => 1 });
    const seen: number[] = [];

    const unsubscribe = runtime.subscribe((state) => {
      seen.push(state.tick);
    });

    runtime.step();
    runtime.step();
    unsubscribe();
    runtime.step();

    expect(seen).toEqual([1, 2]);
  });
});
