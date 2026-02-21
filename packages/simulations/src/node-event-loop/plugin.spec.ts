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
    const next = nodeEventLoopPlugin.step(initial, { type: 'request.received' }, testContext);

    expect(next.tick).toBe(1);
    expect(next.incomingRequests).toBe(1);
  });
});
