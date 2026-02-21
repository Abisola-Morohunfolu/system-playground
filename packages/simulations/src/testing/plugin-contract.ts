import { SimulationContext, SimulationPlugin, SimulationState } from '@system-playground/engine';
import { expect } from 'vitest';

export const expectDeterministicInit = <TState extends SimulationState>(
  plugin: SimulationPlugin<TState>,
  context: SimulationContext,
): void => {
  const first = plugin.init(context);
  const second = plugin.init(context);
  expect(second).toEqual(first);
};

export const expectMonotonicTick = <TState extends SimulationState>(
  plugin: SimulationPlugin<TState>,
  context: SimulationContext,
  steps: number,
): void => {
  let state = plugin.init(context);

  for (let i = 0; i < steps; i += 1) {
    const next = plugin.step(state, undefined, context);
    expect(next.tick).toBeGreaterThan(state.tick);
    state = next;
  }
};
