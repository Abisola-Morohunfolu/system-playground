import { useNodeEventLoopController } from '../../hooks/use-node-event-loop-controller';
import { NodeEventLoopBoard } from './NodeEventLoopBoard';

export const NodeEventLoopPlayground = (): JSX.Element => {
  const { controller, snapshot } = useNodeEventLoopController();
  const activeRequest =
    snapshot.requests.find((request) => request.status === 'running') ??
    snapshot.requests.find((request) => request.status === 'waiting-io') ??
    snapshot.requests.find((request) => request.status === 'queued');

  return (
    <section className="node-playground" aria-label="Node.js event loop simulation">
      <header className="playground-headline">
        <p>Interactive Simulation</p>
        <h2>Node.js Event Loop</h2>
        <small>
          The engine runs continuously and schedules each request like a real event loop tick.
        </small>
      </header>

      <div className="status-ribbon" aria-live="polite">
        <span>Now Processing</span>
        <strong>
          {activeRequest
            ? `${activeRequest.label} · ${activeRequest.currentOperationLabel ?? activeRequest.status}`
            : 'No active request'}
        </strong>
      </div>

      <section className="control-panel request-builder" aria-label="Request controls">
        <h3>Request Builder</h3>
        <p>Send realistic request profiles into the event loop.</p>
        <div className="request-actions">
          <button onClick={() => controller.injectRequest()}>+ CPU Hash Request</button>
          <button onClick={() => controller.injectIoRequest()}>+ DB Lookup Request</button>
          <button onClick={() => controller.injectCompositeRequest()}>+ Composite API Request</button>
          <button onClick={() => controller.injectMixedBurst(4)}>+ Mixed Burst</button>
          <button onClick={() => controller.loadSingleRequestPreset()}>Single Request Flow</button>
          <button onClick={() => controller.loadIoBurstPreset()}>I/O Burst Flow</button>
        </div>
      </section>

      {/* The board mirrors runtime state each tick so users can follow request movement live. */}
      <NodeEventLoopBoard snapshot={snapshot} />

      <section className="runtime-dock" aria-label="Runtime controls">
        <h3>Runtime Controls</h3>
        <div className="runtime-actions">
          <label>
            Speed
            <select
              value={String(snapshot.speedMs)}
              onChange={(event) => controller.setSpeed(Number(event.target.value))}
            >
              <option value="1200">Slow</option>
              <option value="900">Normal</option>
              <option value="600">Fast</option>
            </select>
          </label>
          <div className="runtime-buttons">
            <button onClick={() => controller.step()}>Step</button>
            <button onClick={() => (snapshot.isRunning ? controller.pause() : controller.start())}>
              {snapshot.isRunning ? 'Pause' : 'Resume'}
            </button>
            <button onClick={() => controller.clearHistory()}>Clear Timeline</button>
            <button onClick={() => controller.reset()}>Reset</button>
          </div>
        </div>
      </section>
    </section>
  );
};
