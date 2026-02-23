import { NodeEventLoopSnapshot, RequestFlowItem } from '../../lib/node-event-loop-controller';

interface NodeEventLoopBoardProps {
  snapshot: NodeEventLoopSnapshot;
}

const statusLabel: Record<RequestFlowItem['status'], string> = {
  queued: 'Queued',
  running: 'Running',
  'waiting-io': 'Waiting I/O',
  completed: 'Done',
};

const phaseLabel: Record<NodeEventLoopSnapshot['state']['activePhase'], string> = {
  timers: 'Timers',
  pending: 'Pending',
  poll: 'Poll',
  check: 'Check',
  close: 'Close',
  idle: 'Idle',
};

const laneForRequest = (request: RequestFlowItem): 'client' | 'server' | 'io' => {
  if (request.status === 'queued') {
    return 'client';
  }

  if (request.status === 'waiting-io') {
    return 'io';
  }

  return 'server';
};

const requestsByLane = (requests: RequestFlowItem[]): Record<'client' | 'server' | 'io', RequestFlowItem[]> => {
  const initialLanes: Record<'client' | 'server' | 'io', RequestFlowItem[]> = {
    client: [],
    server: [],
    io: [],
  };

  return requests.reduce(
    (lanes, request) => {
      lanes[laneForRequest(request)].push(request);
      return lanes;
    },
    initialLanes,
  );
};

const Lane = ({
  title,
  subtitle,
  requests,
}: {
  title: string;
  subtitle: string;
  requests: RequestFlowItem[];
}): JSX.Element => {
  return (
    <div className="flow-lane">
      <div className="flow-lane-head">
        <h3>{title}</h3>
        <small>{subtitle}</small>
      </div>
      <ul>
        {requests.length === 0 ? <li className="lane-empty">No active requests</li> : null}
        {requests.map((request) => (
          <li key={request.id} className={`request-token ${request.kind} ${request.status}`}>
            <span>{request.label}</span>
            <small>{request.currentOperationLabel ?? 'Waiting slot'}</small>
            <strong>{statusLabel[request.status]}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const NodeEventLoopBoard = ({ snapshot }: NodeEventLoopBoardProps): JSX.Element => {
  const lanes = requestsByLane(snapshot.requests);
  const events = snapshot.history.slice(-6).reverse();

  return (
    <section className="node-flow-board" aria-label="Node event loop flow board">
      <div className="loop-rail" aria-hidden="true">
        <svg viewBox="0 0 1000 360" preserveAspectRatio="none" role="img">
          <path d="M42 58 C 312 58, 312 58, 642 58 C 822 58, 936 112, 936 180 C 936 248, 822 302, 642 302 L 160 302 C 88 302, 42 266, 42 222 C 42 176, 72 154, 140 154 L 580 154" />
        </svg>
      </div>

      <div className="flow-metrics">
        <div>
          <span>Active Phase</span>
          <strong>{phaseLabel[snapshot.state.activePhase]}</strong>
        </div>
        <div>
          <span>Runtime Tick</span>
          <strong>{snapshot.runtimeTick}</strong>
        </div>
        <div>
          <span>Queued</span>
          <strong>{snapshot.metrics.queued}</strong>
        </div>
        <div>
          <span>Running</span>
          <strong>{snapshot.metrics.running}</strong>
        </div>
        <div>
          <span>Waiting I/O</span>
          <strong>{snapshot.metrics.waitingIo}</strong>
        </div>
        <div>
          <span>Completed</span>
          <strong>{snapshot.metrics.completed}</strong>
        </div>
      </div>

      <div className="phase-strip" aria-label="Event loop phase strip">
        {(['timers', 'pending', 'poll', 'check', 'close'] as const).map((phase) => (
          <span
            key={phase}
            className={snapshot.state.activePhase === phase ? 'phase-node active' : 'phase-node'}
          >
            {phaseLabel[phase]}
          </span>
        ))}
      </div>

      <div className="flow-lanes">
        <Lane title="Clients" subtitle="Incoming HTTP requests" requests={lanes.client} />
        <Lane title="Node Server" subtitle="Call stack + queues" requests={lanes.server} />
        <Lane title="I/O Workers" subtitle="DB, file, network callbacks" requests={lanes.io} />
      </div>

      <div className="queue-strip" aria-label="Queue snapshot">
        <article>
          <h4>Task Queue</h4>
          <p>{snapshot.state.taskQueue.length > 0 ? snapshot.state.taskQueue.join(', ') : '(empty)'}</p>
        </article>
        <article>
          <h4>Microtask Queue</h4>
          <p>
            {snapshot.state.microtaskQueue.length > 0
              ? snapshot.state.microtaskQueue.join(', ')
              : '(empty)'}
          </p>
        </article>
        <article>
          <h4>Call Stack</h4>
          <p>{snapshot.state.callStack.length > 0 ? snapshot.state.callStack.join(', ') : '(empty)'}</p>
        </article>
      </div>

      <div className="event-ticker" aria-label="Runtime event timeline">
        <h4>Runtime Timeline</h4>
        <ol>
          {events.length === 0 ? <li>(no events yet)</li> : null}
          {events.map((event) => (
            <li key={`${event.tick}-${event.timestamp}`}>
              <span>T{event.tick}</span>
              <strong>{event.actionType}</strong>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
