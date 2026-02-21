import { describe, expect, it } from 'vitest';
import { expectDeterministicInit, expectMonotonicTick } from '../testing/plugin-contract';
import { nodeEventLoopPlugin } from './plugin';

const testContext = {
  seed: 101,
  now: () => 1700000000000,
};

describe('nodeEventLoopPlugin contract', () => {
  it('has deterministic initialization for same context', () => {
    expectDeterministicInit(nodeEventLoopPlugin, testContext);
  });

  it('always advances tick monotonically', () => {
    expectMonotonicTick(nodeEventLoopPlugin, testContext, 5);
  });

  it('increments incoming request counter for request.received action', () => {
    const initial = nodeEventLoopPlugin.init(testContext);
    const next = nodeEventLoopPlugin.step(
      initial,
      { type: 'request.received', payload: { label: 'req-1' } },
      testContext,
    );

    expect(next.tick).toBe(1);
    expect(next.incomingRequests).toBe(1);
    expect(next.taskQueue).toEqual(['req-1']);
  });

  it('enqueues microtasks when io is completed', () => {
    const initial = nodeEventLoopPlugin.init(testContext);
    const next = nodeEventLoopPlugin.step(
      initial,
      { type: 'io.completed', payload: { label: 'promise-1' } },
      testContext,
    );

    expect(next.microtaskQueue).toEqual(['promise-1']);
  });

  it('moves tasks to call stack only when stack is empty', () => {
    const initial = nodeEventLoopPlugin.init(testContext);
    const queued = nodeEventLoopPlugin.step(
      initial,
      { type: 'request.received', payload: { label: 'req-2' } },
      testContext,
    );
    const running = nodeEventLoopPlugin.step(queued, { type: 'task.dequeue' }, testContext);

    expect(running.callStack).toEqual(['req-2']);
    expect(running.taskQueue).toEqual([]);

    const blocked = nodeEventLoopPlugin.step(
      { ...running, taskQueue: ['req-3'] },
      { type: 'task.dequeue' },
      testContext,
    );
    expect(blocked.callStack).toEqual(['req-2']);
    expect(blocked.taskQueue).toEqual(['req-3']);
  });

  it('pops call stack entries when callstack.pop is dispatched', () => {
    const state = {
      ...nodeEventLoopPlugin.init(testContext),
      callStack: ['req-4'],
    };
    const next = nodeEventLoopPlugin.step(state, { type: 'callstack.pop' }, testContext);

    expect(next.callStack).toEqual([]);
  });
});
