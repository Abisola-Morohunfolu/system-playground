import { describe, expect, it } from 'vitest';
import { NodeEventLoopSimulation } from './simulation';

describe('NodeEventLoopSimulation', () => {
  it('injects a cpu profile request and eventually completes it', () => {
    const simulation = new NodeEventLoopSimulation();

    simulation.injectRequest('cpu-1');

    for (let step = 0; step < 10; step += 1) {
      simulation.step();
    }

    const snapshot = simulation.getSnapshot();
    expect(snapshot.state.incomingRequests).toBe(1);
    expect(snapshot.metrics.completed).toBe(1);
  });

  it('keeps io request waiting, then resumes and completes', () => {
    const simulation = new NodeEventLoopSimulation();

    simulation.injectIoRequest('io-1');
    let sawWaitingIo = false;
    for (let step = 0; step < 8; step += 1) {
      simulation.step();
      if (simulation.getSnapshot().metrics.waitingIo > 0) {
        sawWaitingIo = true;
        break;
      }
    }
    expect(sawWaitingIo).toBe(true);

    for (let step = 0; step < 12; step += 1) {
      simulation.step();
    }

    const snapshot = simulation.getSnapshot();
    expect(snapshot.metrics.completed).toBe(1);
    expect(snapshot.metrics.waitingIo).toBe(0);
  });

  it('updates active loop phase while running steps', () => {
    const simulation = new NodeEventLoopSimulation();

    simulation.injectIoRequest('io-phase');
    simulation.step();
    simulation.step();

    const phase = simulation.getSnapshot().state.activePhase;
    expect(['timers', 'pending', 'poll', 'check', 'close', 'idle']).toContain(phase);
  });
});
