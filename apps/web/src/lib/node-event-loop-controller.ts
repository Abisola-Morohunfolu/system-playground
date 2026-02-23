import {
  NodeEventLoopSimulation,
  NodeEventLoopSnapshot as CoreNodeEventLoopSnapshot,
} from '@system-playground/simulations';

export type { RequestFlowItem, RequestProfile } from '@system-playground/simulations';

export interface NodeEventLoopSnapshot extends CoreNodeEventLoopSnapshot {
  isRunning: boolean;
  speedMs: number;
}

export type NodeEventLoopListener = (snapshot: NodeEventLoopSnapshot) => void;

export class NodeEventLoopController {
  private readonly simulation = new NodeEventLoopSimulation();
  private readonly listeners = new Set<NodeEventLoopListener>();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private speedMs = 900;

  getSnapshot(): NodeEventLoopSnapshot {
    return {
      ...this.simulation.getSnapshot(),
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
    this.speedMs = Math.max(200, Math.floor(speedMs));

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
    this.simulation.step();
    this.emit();
  }

  injectRequest(label?: string): void {
    this.simulation.injectRequest(label);
    this.emit();
  }

  injectIoRequest(label?: string): void {
    this.simulation.injectIoRequest(label);
    this.emit();
  }

  injectMixedBurst(count = 4): void {
    this.simulation.injectMixedBurst(count);
    this.emit();
  }

  injectCompositeRequest(label?: string): void {
    this.simulation.injectProfile('composite-flow', label);
    this.emit();
  }

  clearHistory(): void {
    this.simulation.clearHistory();
    this.emit();
  }

  loadSingleRequestPreset(): void {
    this.simulation.loadSingleRequestPreset();
    this.emit();
  }

  loadIoBurstPreset(): void {
    this.simulation.loadIoBurstPreset();
    this.emit();
  }

  reset(): void {
    this.pause();
    this.simulation.reset();
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
