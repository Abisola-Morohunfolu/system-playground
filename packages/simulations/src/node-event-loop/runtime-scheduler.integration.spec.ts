import { ActionScheduler, SimulationRuntime } from '@system-playground/engine';
import { describe, expect, it } from 'vitest';
import { NodeEventLoopState, nodeEventLoopPlugin } from './plugin';

const createRuntime = (): SimulationRuntime<NodeEventLoopState> => {
  const scheduler = new ActionScheduler();
  return new SimulationRuntime(nodeEventLoopPlugin, {
    now: () => 1700000000000,
    scheduler,
  });
};

describe('nodeEventLoopPlugin + runtime scheduler integration', () => {
  it('runs delayed actions only when scheduler reaches target tick', () => {
    const runtime = createRuntime();

    runtime.enqueue({ type: 'request.received', payload: { label: 'req-1' } });
    runtime.scheduleIn(2, { type: 'task.dequeue' });

    expect(runtime.runReadyActions()).toBe(1);
    expect(runtime.getState().taskQueue).toEqual(['req-1']);
    expect(runtime.getState().callStack).toEqual([]);

    runtime.advanceScheduler(1);
    expect(runtime.runReadyActions()).toBe(0);

    runtime.advanceScheduler(1);
    expect(runtime.runReadyActions()).toBe(1);
    expect(runtime.getState().callStack).toEqual(['req-1']);
  });

  it('preserves deterministic same-tick ordering from scheduler', () => {
    const runtime = createRuntime();

    runtime.enqueue({ type: 'request.received', payload: { label: 'req-2' } });
    runtime.enqueue({ type: 'io.completed', payload: { label: 'micro-2' } });
    runtime.runReadyActions();

    runtime.enqueue({ type: 'microtask.dequeue' });
    runtime.enqueue({ type: 'task.dequeue' });
    expect(runtime.runReadyActions()).toBe(2);

    // First dequeue fills stack with microtask, second is blocked by non-empty call stack.
    expect(runtime.getState().callStack).toEqual(['micro-2']);
    expect(runtime.getState().microtaskQueue).toEqual([]);
    expect(runtime.getState().taskQueue).toEqual(['req-2']);
  });

  it('records scenario history in runtime for replay/inspection', () => {
    const runtime = createRuntime();

    runtime.enqueue({ type: 'request.received', payload: { label: 'req-3' } });
    runtime.enqueue({ type: 'task.dequeue' });
    runtime.runReadyActions();

    const history = runtime.getHistory();
    expect(history).toHaveLength(2);
    expect(history[0]?.action?.type).toBe('request.received');
    expect(history[1]?.action?.type).toBe('task.dequeue');
    expect(history[1]?.tick).toBe(2);
  });
});
