import { ActionScheduler, SimulationRuntime } from '@system-playground/engine';
import { NodeEventLoopState, nodeEventLoopPlugin } from '@system-playground/simulations';

export interface NodeEventLoopSnapshot {
  state: NodeEventLoopState;
  runtimeTick: number;
  schedulerTick: number | null;
  isRunning: boolean;
  speedMs: number;
}

export type NodeEventLoopListener = (snapshot: NodeEventLoopSnapshot) => void;

export class NodeEventLoopController {
  private readonly scheduler = new ActionScheduler();
  private readonly runtime = new SimulationRuntime(nodeEventLoopPlugin, {
    scheduler: this.scheduler,
    now: () => Date.now(),
  });
  private readonly listeners = new Set<NodeEventLoopListener>();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private speedMs = 400;

  getSnapshot(): NodeEventLoopSnapshot {
    return {
      state: this.runtime.getState(),
      runtimeTick: this.runtime.getTick(),
      schedulerTick: this.runtime.getSchedulerTick(),
      isRunning: this.intervalId !== null,
      speedMs: this.speedMs,
    };
  }

  subscribe(listener: NodeEventLoopListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());

    return () => {
      this.listeners.delete(listener);
    };
  }

  setSpeed(speedMs: number): void {
    this.speedMs = Math.max(50, Math.floor(speedMs));

    if (this.intervalId) {
      this.pause();
      this.start();
    }

    this.emit();
  }

  start(): void {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(() => {
      this.step();
    }, this.speedMs);

    this.emit();
  }

  pause(): void {
    if (!this.intervalId) {
      return;
    }

    clearInterval(this.intervalId);
    this.intervalId = null;
    this.emit();
  }

  step(): void {
    this.runtime.advanceScheduler(1);
    this.runtime.runReadyActions();
    this.emit();
  }

  injectRequest(label?: string): void {
    this.runtime.enqueue({ type: 'request.received', payload: { label } });
    this.emit();
  }

  enqueueIoCompletion(label?: string): void {
    this.runtime.enqueue({ type: 'io.completed', payload: { label } });
    this.emit();
  }

  enqueueTaskDequeue(): void {
    this.runtime.enqueue({ type: 'task.dequeue' });
    this.emit();
  }

  enqueueMicrotaskDequeue(): void {
    this.runtime.enqueue({ type: 'microtask.dequeue' });
    this.emit();
  }

  enqueueCallstackPop(): void {
    this.runtime.enqueue({ type: 'callstack.pop' });
    this.emit();
  }

  reset(): void {
    this.pause();
    this.runtime.reset();
    this.runtime.clearHistory();
    this.emit();
  }

  destroy(): void {
    this.pause();
    this.listeners.clear();
  }

  private emit(): void {
    const snapshot = this.getSnapshot();

    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}
