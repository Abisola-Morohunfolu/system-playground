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
});
