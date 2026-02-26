import { useEffect, useMemo, useRef, useState } from 'react';

import { ComponentHierarchyBoard } from './render-cycle/ComponentHierarchyBoard';
import { PhaseStrip } from './render-cycle/PhaseStrip';
import { ReconciliationLog } from './render-cycle/ReconciliationLog';
import { ReactCycleActions } from './render-cycle/ReactCycleActions';
import { computeAffectedComponents, phaseLabel, phaseOrder, triggerLabel } from './render-cycle/model';
import type { ActiveRun, ComponentId, ComponentNode, CycleEvent, RenderTrigger, Severity } from './render-cycle/types';

export const ReactRenderCyclePlayground = (): JSX.Element => {
  const [events, setEvents] = useState<CycleEvent[]>([]);
  const [speedMs, setSpeedMs] = useState(700);
  const [isRunning, setIsRunning] = useState(true);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const [lastRun, setLastRun] = useState<ActiveRun | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<ComponentId>('AppRoot');

  const tickRef = useRef(0);
  const eventCounterRef = useRef(0);

  const queueTrigger = (trigger: RenderTrigger, source: ComponentId): void => {
    if (activeRun) {
      return;
    }

    setActiveRun({
      trigger,
      source,
      affected: computeAffectedComponents(trigger, source),
    });
    setPhaseIndex(0);
  };

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const id = setInterval(() => {
      tickRef.current += 1;
      const nextTick = tickRef.current;

      if (!activeRun) {
        return;
      }

      const currentPhase = phaseOrder[phaseIndex] ?? 'schedule';
      eventCounterRef.current += 1;
      const nextId = eventCounterRef.current;

      setEvents((current) => [
        {
          id: nextId,
          tick: nextTick,
          trigger: activeRun.trigger,
          source: activeRun.source,
          affected: activeRun.affected,
          phase: currentPhase,
          detail: `${triggerLabel[activeRun.trigger]} from ${activeRun.source} -> ${activeRun.affected.join(', ')}. ${phaseLabel[currentPhase]}.`,
        },
        ...current,
      ].slice(0, 30));

      if (phaseIndex >= phaseOrder.length - 1) {
        setLastRun(activeRun);
        setPhaseIndex(0);
        setActiveRun(null);
      } else {
        setPhaseIndex((index) => index + 1);
      }
    }, speedMs);

    return () => clearInterval(id);
  }, [activeRun, isRunning, phaseIndex, speedMs]);

  const highlightedComponents = activeRun?.affected ?? lastRun?.affected ?? [];

  const severityFor = (component: ComponentNode): Severity => {
    if (activeRun?.source === component.id) {
      return 'critical';
    }
    if (highlightedComponents.includes(component.id)) {
      return component.wastedPercent >= 40 ? 'critical' : 'heavy';
    }
    return 'optimal';
  };

  const historyEvents = useMemo(() => events.slice(0, 6), [events]);

  return (
    <section className="react-cycle-minimal" aria-label="React rendering cycle playground">
      <header className="react-cycle-head">
        <h2>React Rendering Cycle Playground</h2>
        <small>Trigger updates from a component and inspect parent/child rerender impact.</small>
      </header>

      <ReactCycleActions
        active={Boolean(activeRun)}
        isRunning={isRunning}
        speedMs={speedMs}
        onTrigger={(trigger) => queueTrigger(trigger, selectedComponent)}
        onToggleRun={() => setIsRunning((value) => !value)}
        onClearLog={() => setEvents([])}
        onSpeedChange={setSpeedMs}
      />

      <ComponentHierarchyBoard
        selectedComponent={selectedComponent}
        onSelectComponent={setSelectedComponent}
        severityFor={severityFor}
        historyEvents={historyEvents}
        phaseLabel={phaseLabel}
      />

      <PhaseStrip hasActiveRun={Boolean(activeRun)} phaseIndex={phaseIndex} />

      <ReconciliationLog events={events} />
    </section>
  );
};
