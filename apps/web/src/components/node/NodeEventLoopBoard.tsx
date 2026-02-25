import { CSSProperties } from 'react';
import { NodeEventLoopSnapshot, RequestFlowItem } from '../../lib/node-event-loop-controller';

interface NodeEventLoopBoardProps {
  snapshot: NodeEventLoopSnapshot;
}

type LoopPhase = 'timers' | 'pending' | 'poll' | 'check' | 'close';

const PHASES: LoopPhase[] = ['timers', 'pending', 'poll', 'check', 'close'];

const phaseLabel: Record<LoopPhase, string> = {
  timers: 'Timers',
  pending: 'Pending',
  poll: 'Poll',
  check: 'Check',
  close: 'Close',
};

const requestStatusLabel: Record<RequestFlowItem['status'], string> = {
  queued: 'Queued',
  running: 'Processing',
  'waiting-io': 'Waiting I/O',
  completed: 'Completed',
};

const methodForRequest = (request: RequestFlowItem): 'GET' | 'POST' => {
  return request.kind === 'cpu' ? 'GET' : 'POST';
};

const endpointForRequest = (request: RequestFlowItem): string => {
  if (request.profileId === 'db-lookup') {
    return '/api/v1/users';
  }

  if (request.profileId === 'composite-flow') {
    return '/api/v1/composite';
  }

  return '/api/v1/hash';
};

const logLevelForAction = (actionType: string): 'info' | 'debug' | 'event' => {
  if (actionType.includes('io.')) {
    return 'event';
  }

  if (actionType.includes('dequeue') || actionType.includes('pop')) {
    return 'debug';
  }

  return 'info';
};

const toStreamMessage = (actionType: string): string => {
  switch (actionType) {
    case 'request.received':
      return 'Incoming request accepted by ingress.';
    case 'task.dequeue':
      return 'Moved macrotask into call stack.';
    case 'microtask.dequeue':
      return 'Flushed microtask into call stack.';
    case 'callstack.pop':
      return 'Completed active stack frame.';
    case 'io.completed':
      return 'Libuv worker completed async operation.';
    case 'phase.set':
      return 'Loop transitioned to next phase.';
    default:
      return actionType;
  }
};

export const NodeEventLoopBoard = ({ snapshot }: NodeEventLoopBoardProps): JSX.Element => {
  const ingress = [...snapshot.requests].reverse().slice(0, 4);
  const selectedRequest =
    snapshot.requests.find((request) => request.status === 'running') ??
    snapshot.requests.find((request) => request.status === 'waiting-io') ??
    ingress[0];

  const activePhase = snapshot.state.activePhase === 'idle' ? 'timers' : snapshot.state.activePhase;
  const activePhaseIndex = PHASES.indexOf(activePhase as LoopPhase);

  const ioRequests = snapshot.requests.filter(
    (request) => request.kind === 'io' && request.status !== 'completed',
  );
  const threads = Array.from({ length: 4 }, (_, index) => {
    const request = ioRequests[index];

    if (!request) {
      return {
        id: index + 1,
        status: 'Idle',
        detail: 'Waiting',
        progress: 0,
      };
    }

    const progress =
      request.status === 'queued'
        ? 8
        : Math.min(94, 20 + (snapshot.runtimeTick - request.createdTick + 1) * 12);

    return {
      id: index + 1,
      status:
        request.status === 'waiting-io'
          ? 'Busy: DB Query'
          : request.status === 'running'
            ? 'Busy: Callback'
            : 'Queued',
      detail: request.currentOperationLabel ?? (request.status === 'queued' ? 'Waiting slot' : 'Processing'),
      progress,
    };
  });

  const streamEvents = snapshot.history.slice(-10).reverse();

  return (
    <section className="nexus-board" aria-label="Node event loop control board">
      <div className="nexus-main-grid">
        <section className="nexus-panel ingress-panel">
          <header>
            <h3>Request Ingress</h3>
            <span>Port: 3000</span>
          </header>
          <ul className="ingress-list">
            {ingress.length === 0 ? <li className="ghost-item">No inbound requests</li> : null}
            {ingress.map((request) => (
              <li key={request.id} className={`ingress-item ${request.kind}`}>
                <small>{methodForRequest(request)}</small>
                <strong>{endpointForRequest(request)}</strong>
                <div>
                  <span>{request.id}</span>
                  <span>{requestStatusLabel[request.status]}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="request-detail">
            <h4>Request Details</h4>
            {selectedRequest ? (
              <>
                <p>
                  <strong>ID:</strong> {selectedRequest.id}
                </p>
                <p>
                  <strong>Operation:</strong> {selectedRequest.currentOperationLabel ?? 'Queued'}
                </p>
                <p>
                  <strong>Status:</strong> {requestStatusLabel[selectedRequest.status]}
                </p>
              </>
            ) : (
              <p>No request selected.</p>
            )}
          </div>
        </section>

        <section className="nexus-panel lifecycle-panel">
          <header>
            <h3>Event Loop Lifecycle</h3>
            <span>Runtime Tick: {snapshot.runtimeTick}</span>
          </header>

          <div
            className="lifecycle-ring"
            style={{ '--phase-index': String(Math.max(0, activePhaseIndex)) } as CSSProperties}
          >
            <div className="ring-center">
              <small>Active Phase</small>
              <strong>{phaseLabel[activePhase as LoopPhase]}</strong>
            </div>
            {PHASES.map((phase) => (
              <span
                key={phase}
                className={phase === activePhase ? 'phase-label active' : 'phase-label'}
                data-phase={phase}
              >
                {phaseLabel[phase]}
              </span>
            ))}
          </div>

          <div className="queue-row">
            <article>
              <h4>Microtask Queue</h4>
              <p>
                {snapshot.state.microtaskQueue.length > 0
                  ? snapshot.state.microtaskQueue.slice(0, 3).join(', ')
                  : '(empty)'}
              </p>
            </article>
            <article>
              <h4>Macrotask Queue</h4>
              <p>
                {snapshot.state.taskQueue.length > 0
                  ? snapshot.state.taskQueue.slice(0, 3).join(', ')
                  : '(empty)'}
              </p>
            </article>
            <article>
              <h4>Call Stack</h4>
              <p>
                {snapshot.state.callStack.length > 0
                  ? snapshot.state.callStack.slice(0, 3).join(', ')
                  : '(empty)'}
              </p>
            </article>
          </div>
        </section>

        <section className="nexus-panel thread-panel">
          <header>
            <h3>Libuv Thread Pool</h3>
            <span>Workers: 4/4</span>
          </header>
          <ul className="thread-list">
            {threads.map((thread) => (
              <li key={thread.id}>
                <div>
                  <strong>Thread #{thread.id}</strong>
                  <span>{thread.status}</span>
                </div>
                <p>{thread.detail}</p>
                <progress value={thread.progress} max={100} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="stream-panel" aria-label="Real-time stream">
        <header>
          <h3>Real-Time Stream</h3>
        </header>
        <ul>
          {streamEvents.length === 0 ? <li>(no events yet)</li> : null}
          {streamEvents.map((event) => (
            <li key={`${event.tick}-${event.timestamp}`}>
              <span>[T{event.tick}]</span>
              <em className={logLevelForAction(event.actionType)}>{event.actionType}</em>
              <strong>{toStreamMessage(event.actionType)}</strong>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
};
