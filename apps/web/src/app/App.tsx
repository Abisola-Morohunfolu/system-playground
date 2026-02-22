import { useState } from 'react';
import { useNodeEventLoopController } from '../hooks/use-node-event-loop-controller';

type SimulationKey = 'node' | 'react' | 'concurrency';

export const App = (): JSX.Element => {
  const [activeSimulation, setActiveSimulation] = useState<SimulationKey>('node');
  
  const title =
    activeSimulation === 'node'
      ? 'Node.js Event Loop Playground'
      : activeSimulation === 'react'
        ? 'React Rendering Cycle Playground'
        : 'Concurrency vs Parallelism Playground';

  const description =
    activeSimulation === 'node'
      ? 'Run and inspect queued request/microtask behavior.'
      : activeSimulation === 'react'
        ? 'Placeholder scaffold for render/reconcile/commit simulation.'
        : 'Placeholder scaffold for worker/thread scheduling simulation.';

  return (
    <main className="app-shell">
      <header>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>

      <section className="panel controls">
        <strong>Simulation</strong>
        <button
          className={activeSimulation === 'node' ? 'active' : ''}
          onClick={() => setActiveSimulation('node')}
        >
          Node Event Loop
        </button>
        <button
          className={activeSimulation === 'react' ? 'active' : ''}
          onClick={() => setActiveSimulation('react')}
        >
          React Cycle
        </button>
        <button
          className={activeSimulation === 'concurrency' ? 'active' : ''}
          onClick={() => setActiveSimulation('concurrency')}
        >
          Concurrency
        </button>
      </section>

      {activeSimulation === 'node' ? <NodeEventLoopView /> : null}
      {activeSimulation === 'react' ? (
        <PlaceholderCard
          headline="React cycle simulation coming next"
          points={['Render queue', 'Reconciliation', 'Commit + effects timeline']}
        />
      ) : null}
      {activeSimulation === 'concurrency' ? (
        <PlaceholderCard
          headline="Concurrency simulation coming next"
          points={['Task lanes', 'CPU worker model', 'Parallel vs interleaved trace']}
        />
      ) : null}
    </main>
  );
};

const NodeEventLoopView = (): JSX.Element => {
  const { controller, snapshot } = useNodeEventLoopController();

  return (
    <>
      <section className="panel controls">
        <button onClick={() => controller.start()}>Start</button>
        <button onClick={() => controller.pause()}>Pause</button>
        <button onClick={() => controller.step()}>Step</button>
        <button onClick={() => controller.reset()}>Reset</button>

        <label>
          Speed (ms)
          <input
            type="range"
            min={50}
            max={1500}
            step={50}
            value={snapshot.speedMs}
            onChange={(event) => controller.setSpeed(Number(event.target.value))}
          />
          <span>{snapshot.speedMs}</span>
        </label>
      </section>

      <section className="panel controls">
        <button onClick={() => controller.injectRequest()}>Inject Request</button>
        <button onClick={() => controller.enqueueIoCompletion()}>IO Complete</button>
      </section>

      <section className="panel controls">
        <strong>Presets</strong>
        <button onClick={() => controller.loadSingleRequestPreset()}>Single Request Flow</button>
        <button onClick={() => controller.loadIoBurstPreset()}>I/O Microtask Burst</button>
        <button onClick={() => controller.clearHistory()}>Clear Timeline</button>
      </section>

      <section className="panel metrics">
        <div>Runtime Tick: {snapshot.runtimeTick}</div>
        <div>Scheduler Tick: {snapshot.schedulerTick ?? '-'}</div>
        <div>Incoming Requests: {snapshot.state.incomingRequests}</div>
        <div>Status: {snapshot.isRunning ? 'running' : 'paused'}</div>
      </section>

      <section className="grid">
        <QueuePanel title="Call Stack" values={snapshot.state.callStack} />
        <QueuePanel title="Task Queue" values={snapshot.state.taskQueue} />
        <QueuePanel title="Microtask Queue" values={snapshot.state.microtaskQueue} />
      </section>

      <section className="panel timeline">
        <h2>Recent Timeline</h2>
        {snapshot.history.length === 0 ? <p className="muted">(no events yet)</p> : null}
        <ul>
          {snapshot.history
            .slice()
            .reverse()
            .map((entry) => (
              <li key={`${entry.tick}-${entry.timestamp}-${entry.actionType}`}>
                <span className="tick">t{entry.tick}</span>
                <span className="action">{entry.actionType}</span>
              </li>
            ))}
        </ul>
      </section>
    </>
  );
};

const PlaceholderCard = ({
  headline,
  points,
}: {
  headline: string;
  points: string[];
}): JSX.Element => {
  return (
    <section className="panel placeholder">
      <h2>{headline}</h2>
      <ul>
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </section>
  );
};

const QueuePanel = ({ title, values }: { title: string; values: string[] }): JSX.Element => {
  return (
    <article className="panel queue-panel">
      <h2>{title}</h2>
      {values.length === 0 ? <p className="muted">(empty)</p> : null}
      <ul>
        {values.map((value, index) => (
          <li key={`${title}-${value}-${index}`}>{value}</li>
        ))}
      </ul>
    </article>
  );
};
