import { SimulationPlugin, SimulationState } from '@system-playground/engine';

export type NodeEventLoopActionType =
  | 'request.received'
  | 'io.completed'
  | 'task.dequeue'
  | 'microtask.dequeue'
  | 'callstack.pop'
  | 'microtask.enqueued';

export interface NodeEventLoopActionPayload {
  label?: string;
}

export interface NodeEventLoopState extends SimulationState {
  incomingRequests: number;
  callStack: string[];
  taskQueue: string[];
  microtaskQueue: string[];
}

const toLabel = (value: unknown | undefined, fallback: string): string => {
  if (
    value &&
    typeof value === 'object' &&
    'label' in value &&
    typeof (value as NodeEventLoopActionPayload).label === 'string'
  ) {
    return (value as NodeEventLoopActionPayload).label as string;
  }

  return fallback;
};

export const nodeEventLoopPlugin: SimulationPlugin<NodeEventLoopState> = {
  id: 'node-event-loop',
  init: () => ({
    tick: 0,
    incomingRequests: 0,
    callStack: [],
    taskQueue: [],
    microtaskQueue: [],
  }),
  step: (state, action) => {
    const next: NodeEventLoopState = {
      ...state,
      tick: state.tick + 1,
      callStack: [...state.callStack],
      taskQueue: [...state.taskQueue],
      microtaskQueue: [...state.microtaskQueue],
    };

    switch (action?.type as NodeEventLoopActionType | undefined) {
      case 'request.received': {
        next.incomingRequests += 1;
        next.taskQueue.push(toLabel(action?.payload, `request-${next.incomingRequests}`));
        break;
      }
      case 'io.completed': {
        next.microtaskQueue.push(toLabel(action?.payload, 'promise-continuation'));
        break;
      }
      case 'microtask.enqueued': {
        next.microtaskQueue.push(toLabel(action?.payload, 'microtask'));
        break;
      }
      case 'task.dequeue': {
        if (next.callStack.length === 0 && next.taskQueue.length > 0) {
          next.callStack.push(next.taskQueue.shift() as string);
        }
        break;
      }
      case 'microtask.dequeue': {
        if (next.callStack.length === 0 && next.microtaskQueue.length > 0) {
          next.callStack.push(next.microtaskQueue.shift() as string);
        }
        break;
      }
      case 'callstack.pop': {
        next.callStack.pop();
        break;
      }
      default: {
        // No-op action: tick still advances for deterministic timeline playback.
      }
    }

    return next;
  },
};
