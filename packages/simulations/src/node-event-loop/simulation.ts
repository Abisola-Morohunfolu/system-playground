import { ActionScheduler, SimulationRuntime } from '@system-playground/engine';
import { NodeEventLoopState, nodeEventLoopPlugin } from './plugin';

export type RequestStatus = 'queued' | 'running' | 'waiting-io' | 'completed';
export type RequestKind = 'cpu' | 'io';

export type RequestOperationKind = 'cpu' | 'io-db' | 'io-network' | 'io-fs';

export interface RequestOperation {
  kind: RequestOperationKind;
  label: string;
  ticks: number;
}

export interface RequestProfile {
  id: string;
  label: string;
  kind: RequestKind;
  operations: RequestOperation[];
}

export interface RequestFlowItem {
  id: string;
  label: string;
  profileId: string;
  kind: RequestKind;
  status: RequestStatus;
  createdTick: number;
  startedTick?: number;
  completedTick?: number;
  currentOperationLabel?: string;
}

export interface NodeEventLoopHistoryItem {
  tick: number;
  actionType: string;
  timestamp: number;
}

export interface NodeEventLoopSnapshot {
  state: NodeEventLoopState;
  runtimeTick: number;
  schedulerTick: number | null;
  history: NodeEventLoopHistoryItem[];
  requests: RequestFlowItem[];
  metrics: {
    completed: number;
    queued: number;
    waitingIo: number;
    running: number;
  };
}

interface RequestRuntimeState {
  id: string;
  label: string;
  profile: RequestProfile;
  status: RequestStatus;
  operationIndex: number;
  cpuRemaining: number;
  createdTick: number;
  startedTick?: number;
  completedTick?: number;
}

const REQUEST_PROFILES: RequestProfile[] = [
  {
    id: 'cpu-hash',
    label: 'CPU hash + sync transform',
    kind: 'cpu',
    operations: [
      { kind: 'cpu', label: 'Validate headers', ticks: 1 },
      { kind: 'cpu', label: 'Hash payload', ticks: 2 },
      { kind: 'cpu', label: 'Serialize response', ticks: 1 },
    ],
  },
  {
    id: 'db-lookup',
    label: 'DB lookup request',
    kind: 'io',
    operations: [
      { kind: 'cpu', label: 'Parse route params', ticks: 1 },
      { kind: 'io-db', label: 'DB query', ticks: 3 },
      { kind: 'cpu', label: 'Hydrate response JSON', ticks: 1 },
    ],
  },
  {
    id: 'composite-flow',
    label: 'API + DB + upstream network',
    kind: 'io',
    operations: [
      { kind: 'cpu', label: 'Auth guard', ticks: 1 },
      { kind: 'io-db', label: 'Load user row', ticks: 2 },
      { kind: 'cpu', label: 'Compute derived flags', ticks: 1 },
      { kind: 'io-network', label: 'Fetch external entitlement', ticks: 2 },
      { kind: 'cpu', label: 'Finalize response', ticks: 1 },
    ],
  },
];

const IDLE_PHASE_ROTATION: NodeEventLoopState['activePhase'][] = [
  'timers',
  'pending',
  'poll',
  'check',
  'close',
];

const profileById = (profileId: string): RequestProfile => {
  const profile = REQUEST_PROFILES.find((item) => item.id === profileId);
  if (!profile) {
    throw new Error(`Unknown request profile: ${profileId}`);
  }

  return profile;
};

const isIoOperation = (kind: RequestOperationKind): boolean => {
  return kind === 'io-db' || kind === 'io-network' || kind === 'io-fs';
};

export class NodeEventLoopSimulation {
  private readonly scheduler = new ActionScheduler();
  private readonly runtime = new SimulationRuntime(nodeEventLoopPlugin, {
    scheduler: this.scheduler,
    now: () => Date.now(),
  });
  private readonly requests = new Map<string, RequestRuntimeState>();
  private readonly requestOrder: string[] = [];
  private requestCounter = 0;
  private idlePhasePointer = 0;

  getProfiles(): RequestProfile[] {
    return REQUEST_PROFILES.map((profile) => ({
      ...profile,
      operations: profile.operations.map((operation) => ({ ...operation })),
    }));
  }

  getSnapshot(): NodeEventLoopSnapshot {
    const history = this.runtime.getHistory().slice(-24).map((item) => ({
      tick: item.tick,
      actionType: item.action?.type ?? 'tick',
      timestamp: item.timestamp,
    }));

    const requests = this.requestOrder
      .map((id) => this.toFlowItem(this.requests.get(id)))
      .filter((item): item is RequestFlowItem => Boolean(item));

    return {
      state: this.runtime.getState(),
      runtimeTick: this.runtime.getTick(),
      schedulerTick: this.runtime.getSchedulerTick(),
      history,
      requests,
      metrics: {
        completed: requests.filter((item) => item.status === 'completed').length,
        queued: requests.filter((item) => item.status === 'queued').length,
        waitingIo: requests.filter((item) => item.status === 'waiting-io').length,
        running: requests.filter((item) => item.status === 'running').length,
      },
    };
  }

  step(): void {
    this.runtime.advanceScheduler(1);
    this.runtime.runReadyActions();
    this.driveLoopTick();
    this.reconcileDetachedRequests();
  }

  injectRequest(label?: string): void {
    this.injectProfile('cpu-hash', label);
  }

  injectIoRequest(label?: string): void {
    this.injectProfile('db-lookup', label);
  }

  injectMixedBurst(count = 4): void {
    const total = Math.max(1, Math.floor(count));

    for (let index = 0; index < total; index += 1) {
      const profileId = index % 2 === 0 ? 'cpu-hash' : 'db-lookup';
      this.injectProfile(profileId);
    }
  }

  injectProfile(profileId: string, label?: string): void {
    const profile = profileById(profileId);
    const id = `request-${++this.requestCounter}`;

    this.requests.set(id, {
      id,
      label: label ?? id,
      profile,
      status: 'queued',
      operationIndex: 0,
      cpuRemaining: 0,
      createdTick: this.runtime.getTick(),
    });
    this.requestOrder.push(id);

    this.runtime.enqueue({ type: 'request.received', payload: { label: id } });
  }

  loadSingleRequestPreset(): void {
    this.injectProfile('db-lookup', 'preset-db-1');
  }

  loadIoBurstPreset(): void {
    this.injectProfile('db-lookup', 'preset-db-1');
    this.injectProfile('composite-flow', 'preset-composite-2');
    this.injectProfile('cpu-hash', 'preset-cpu-3');
  }

  clearHistory(): void {
    this.runtime.clearHistory();
  }

  reset(): void {
    this.runtime.reset();
    this.runtime.clearHistory();
    this.requests.clear();
    this.requestOrder.length = 0;
    this.requestCounter = 0;
    this.idlePhasePointer = 0;
  }

  private toFlowItem(request: RequestRuntimeState | undefined): RequestFlowItem | null {
    if (!request) {
      return null;
    }

    const operation = request.profile.operations[request.operationIndex];

    return {
      id: request.id,
      label: request.label,
      profileId: request.profile.id,
      kind: request.profile.kind,
      status: request.status,
      createdTick: request.createdTick,
      startedTick: request.startedTick,
      completedTick: request.completedTick,
      currentOperationLabel: operation?.label,
    };
  }

  private driveLoopTick(): void {
    const state = this.runtime.getState();

    if (state.callStack.length > 0) {
      this.runtime.dispatch({ type: 'phase.set', payload: { phase: 'poll' } });
      const activeId = state.callStack[state.callStack.length - 1] as string;
      this.processStackRequest(activeId);
      return;
    }

    if (state.microtaskQueue.length > 0) {
      this.runtime.dispatch({ type: 'phase.set', payload: { phase: 'pending' } });
      this.runtime.dispatch({ type: 'microtask.dequeue' });
      this.reconcileDequeuedRequest();
      return;
    }

    if (state.taskQueue.length > 0) {
      this.runtime.dispatch({ type: 'phase.set', payload: { phase: 'poll' } });
      this.runtime.dispatch({ type: 'task.dequeue' });
      this.reconcileDequeuedRequest();
      return;
    }

    const idlePhase = IDLE_PHASE_ROTATION[this.idlePhasePointer % IDLE_PHASE_ROTATION.length] as NodeEventLoopState['activePhase'];
    this.idlePhasePointer += 1;
    this.runtime.dispatch({ type: 'phase.set', payload: { phase: idlePhase } });
  }

  private processStackRequest(requestId: string): void {
    const request = this.requests.get(requestId);
    if (!request || request.status === 'completed') {
      this.runtime.dispatch({ type: 'callstack.pop' });
      return;
    }

    const operation = request.profile.operations[request.operationIndex];
    if (!operation) {
      request.status = 'completed';
      request.completedTick = this.runtime.getTick();
      this.runtime.dispatch({ type: 'callstack.pop' });
      return;
    }

    if (isIoOperation(operation.kind)) {
      request.status = 'running';
      request.startedTick ??= this.runtime.getTick();
      request.operationIndex += 1;
      request.cpuRemaining = 0;
      this.consumeCpuSlice(request);
      return;
    }

    request.status = 'running';
    request.startedTick ??= this.runtime.getTick();

    if (request.cpuRemaining === 0) {
      request.cpuRemaining = Math.max(1, operation.ticks);
    }

    request.cpuRemaining -= 1;

    if (request.cpuRemaining > 0) {
      return;
    }

    request.operationIndex += 1;

    const nextOperation = request.profile.operations[request.operationIndex];
    if (!nextOperation) {
      request.status = 'completed';
      request.completedTick = this.runtime.getTick();
      this.runtime.dispatch({ type: 'callstack.pop' });
      return;
    }

    if (isIoOperation(nextOperation.kind)) {
      request.status = 'waiting-io';
      this.runtime.scheduleIn(nextOperation.ticks, {
        type: 'io.completed',
        payload: { label: request.id },
      });
      this.runtime.dispatch({ type: 'callstack.pop' });
      return;
    }

    request.cpuRemaining = Math.max(1, nextOperation.ticks);
  }

  private reconcileDequeuedRequest(): void {
    const state = this.runtime.getState();
    const activeId = state.callStack[state.callStack.length - 1];
    if (!activeId) {
      return;
    }

    const request = this.requests.get(activeId);
    if (!request || request.status === 'completed') {
      return;
    }

    const operation = request.profile.operations[request.operationIndex];
    if (!operation) {
      request.status = 'completed';
      request.completedTick = this.runtime.getTick();
      return;
    }

    if (isIoOperation(operation.kind)) {
      // This call stack entry is the resumed callback after async I/O completion.
      request.status = 'running';
      request.startedTick ??= this.runtime.getTick();
      request.operationIndex += 1;
      request.cpuRemaining = 0;
      this.consumeCpuSlice(request);
      return;
    }

    request.status = 'running';
    request.startedTick ??= this.runtime.getTick();
    if (request.cpuRemaining === 0) {
      request.cpuRemaining = Math.max(1, operation.ticks);
    }
  }

  private consumeCpuSlice(request: RequestRuntimeState): void {
    const operation = request.profile.operations[request.operationIndex];
    if (!operation) {
      request.status = 'completed';
      request.completedTick = this.runtime.getTick();
      this.runtime.dispatch({ type: 'callstack.pop' });
      return;
    }

    if (isIoOperation(operation.kind)) {
      request.status = 'waiting-io';
      this.runtime.scheduleIn(operation.ticks, {
        type: 'io.completed',
        payload: { label: request.id },
      });
      this.runtime.dispatch({ type: 'callstack.pop' });
      return;
    }

    request.cpuRemaining = Math.max(1, operation.ticks) - 1;
    request.status = 'running';

    if (request.cpuRemaining <= 0) {
      request.operationIndex += 1;
      const nextOperation = request.profile.operations[request.operationIndex];
      if (!nextOperation) {
        request.status = 'completed';
        request.completedTick = this.runtime.getTick();
        this.runtime.dispatch({ type: 'callstack.pop' });
        return;
      }

      if (isIoOperation(nextOperation.kind)) {
        request.status = 'waiting-io';
        this.runtime.scheduleIn(nextOperation.ticks, {
          type: 'io.completed',
          payload: { label: request.id },
        });
        this.runtime.dispatch({ type: 'callstack.pop' });
        return;
      }

      request.cpuRemaining = Math.max(1, nextOperation.ticks);
    }
  }

  private reconcileDetachedRequests(): void {
    const state = this.runtime.getState();

    for (const id of this.requestOrder) {
      const request = this.requests.get(id);
      if (!request || request.status === 'completed') {
        continue;
      }

      const onStack = state.callStack.includes(id);
      const inTaskQueue = state.taskQueue.includes(id);
      const inMicroQueue = state.microtaskQueue.includes(id);

      if (!onStack && !inTaskQueue && !inMicroQueue && request.status === 'running') {
        request.status = 'completed';
        request.completedTick = this.runtime.getTick();
      }
    }
  }
}
