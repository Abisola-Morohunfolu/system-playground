import { useState } from 'react';
import { NodeEventLoopPlayground } from '../components/node/NodeEventLoopPlayground';
import { ReactRenderCyclePlayground } from '../components/react/ReactRenderCyclePlayground';

type SimulationKey = 'node' | 'react' | 'concurrency';

export const App = (): JSX.Element => {
  const [activeSimulation, setActiveSimulation] = useState<SimulationKey>('node');

  return (
    <main className="app-shell">
      <header className="app-hero">
        <p>System Playground</p>
        <h1>Visual Runtime Playground</h1>
        <small>Animate how event loops, render cycles, and concurrency models actually behave.</small>
      </header>

      <nav className="sim-switch" aria-label="Simulation picker">
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
      </nav>

      {activeSimulation === 'node' ? <NodeEventLoopPlayground /> : null}
      {activeSimulation === 'react' ? <ReactRenderCyclePlayground /> : null}
      {activeSimulation === 'concurrency' ? (
        <PlaceholderSection
          title="Concurrency vs Parallelism Playground"
          description="Next: model cooperative scheduling, workers, and true parallel execution side-by-side."
        />
      ) : null}
    </main>
  );
};

const PlaceholderSection = ({
  title,
  description,
}: {
  title: string;
  description: string;
}): JSX.Element => {
  return (
    <section className="placeholder-section">
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
};
