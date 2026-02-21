import { describe, expect, it } from 'vitest';
import { NodeEventLoopController } from './node-event-loop-controller';

describe('NodeEventLoopController', () => {
  it('runs queued actions on step through scheduler', () => {
    const controller = new NodeEventLoopController();

    controller.injectRequest('req-a');
    controller.enqueueTaskDequeue();
    controller.step();

    const snapshot = controller.getSnapshot();
    expect(snapshot.runtimeTick).toBe(2);
    expect(snapshot.state.incomingRequests).toBe(1);
    expect(snapshot.state.callStack).toEqual(['req-a']);
  });

  it('notifies subscribers on state changes', () => {
    const controller = new NodeEventLoopController();
    const seenTicks: number[] = [];

    const unsubscribe = controller.subscribe((snapshot) => {
      seenTicks.push(snapshot.runtimeTick);
    });

    controller.injectRequest('req-b');
    controller.step();
    unsubscribe();
    controller.step();

    expect(seenTicks).toContain(0);
    expect(seenTicks).toContain(1);
    expect(seenTicks).not.toContain(2);
  });
});
