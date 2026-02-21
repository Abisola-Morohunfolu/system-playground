import { SimulationAction } from '../types/simulation';

interface ScheduledAction {
  id: number;
  runAtTick: number;
  action: SimulationAction;
}

// Simple tick-based scheduler for immediate and delayed simulation actions.
export class ActionScheduler {
  private tick = 0;
  private sequence = 0;
  private queue: ScheduledAction[] = [];

  getCurrentTick(): number {
    return this.tick;
  }

  enqueue(action: SimulationAction): void {
    // Convenience for "run on current tick".
    this.scheduleIn(0, action);
  }

  scheduleIn(delayTicks: number, action: SimulationAction): void {
    // Negative/decimal delays are normalized to a safe integer tick offset.
    const normalizedDelay = Math.max(0, Math.floor(delayTicks));

    this.queue.push({
      id: this.sequence++,
      runAtTick: this.tick + normalizedDelay,
      action,
    });
  }

  advanceTick(steps = 1): number {
    const normalizedSteps = Math.max(0, Math.floor(steps));
    this.tick += normalizedSteps;
    return this.tick;
  }

  drainReadyActions(): SimulationAction[] {
    // Ready actions are ordered by tick first, then insertion order for determinism.
    const ready = this.queue
      .filter((item) => item.runAtTick <= this.tick)
      .sort((a, b) => {
        if (a.runAtTick !== b.runAtTick) {
          return a.runAtTick - b.runAtTick;
        }
        return a.id - b.id;
      });

    // Keep only future actions in the queue after draining.
    this.queue = this.queue.filter((item) => item.runAtTick > this.tick);

    return ready.map((item) => item.action);
  }

  hasPendingActions(): boolean {
    return this.queue.length > 0;
  }

  getPendingCount(): number {
    return this.queue.length;
  }
}
