import { SimulationPlugin, SimulationState } from '@system-playground/engine';

export interface NodeEventLoopState extends SimulationState {
  incomingRequests: number;
}

export const nodeEventLoopPlugin: SimulationPlugin<NodeEventLoopState> = {
  id: 'node-event-loop',
  init: () => ({
    tick: 0,
    incomingRequests: 0,
  }),
  step: (state, action) => {
    const next = { ...state, tick: state.tick + 1 };

    if (action?.type === 'request.received') {
      next.incomingRequests += 1;
    }

    return next;
  },
};
