import { describe, expect, it } from 'vitest';
import { NodeEventLoopController } from './node-event-loop-controller';

describe('NodeEventLoopController', () => {
  it('runs queued actions on step through scheduler', () => {
    const controller = new NodeEventLoopController();

    controller.injectRequest('req-a');
    controller.step();

    const snapshot = controller.getSnapshot();
    expect(snapshot.runtimeTick).toBeGreaterThanOrEqual(2);
    expect(snapshot.state.incomingRequests).toBe(1);
    expect(snapshot.state.callStack).toHaveLength(1);
    expect(snapshot.metrics.running).toBe(1);
  });

  it('notifies subscribers on state changes', () => {
    const controller = new NodeEventLoopController();
    const seenTicks: number[] = [];

    const unsubscribe = controller.subscribe((snapshot) => {
      seenTicks.push(snapshot.runtimeTick);
    });

    controller.injectRequest('req-b');
    controller.step();
    const countBeforeUnsubscribe = seenTicks.length;
    unsubscribe();
    controller.step();

    expect(seenTicks).toContain(0);
    expect(Math.max(...seenTicks)).toBeGreaterThan(0);
    expect(seenTicks.length).toBe(countBeforeUnsubscribe);
  });

  it('loads and executes the single-request preset flow', () => {
    const controller = new NodeEventLoopController();

    controller.loadSingleRequestPreset();
    controller.step();
    controller.step();

    const snapshot = controller.getSnapshot();
    expect(snapshot.state.incomingRequests).toBe(1);
    expect(snapshot.state.callStack).toEqual([]);
    expect(snapshot.history.length).toBeGreaterThan(0);
  });

  it('clears timeline history without resetting state', () => {
    const controller = new NodeEventLoopController();

    controller.injectRequest('req-c');
    controller.step();
    expect(controller.getSnapshot().history.length).toBeGreaterThan(0);

    controller.clearHistory();
    expect(controller.getSnapshot().history).toEqual([]);
    expect(controller.getSnapshot().state.incomingRequests).toBe(1);
  });

  it('tracks io requests as waiting on db/io lane', () => {
    const controller = new NodeEventLoopController();
    controller.injectIoRequest('io-a');
    let sawWaitingIo = false;
    for (let step = 0; step < 8; step += 1) {
      controller.step();
      if (controller.getSnapshot().metrics.waitingIo > 0) {
        sawWaitingIo = true;
        break;
      }
    }

    expect(sawWaitingIo).toBe(true);
  });

  it('completes io requests after callback returns to call stack', () => {
    const controller = new NodeEventLoopController();
    controller.injectIoRequest('io-b');

    for (let step = 0; step < 8; step += 1) {
      controller.step();
    }

    const snapshot = controller.getSnapshot();
    expect(snapshot.metrics.completed).toBe(1);
    expect(snapshot.metrics.waitingIo).toBe(0);
  });
});
