import { phaseLabel, triggerLabel } from './model';
import type { CycleEvent } from './types';

interface ReconciliationLogProps {
  events: CycleEvent[];
}

export const ReconciliationLog = ({ events }: ReconciliationLogProps): JSX.Element => {
  return (
    <section className="react-cycle-log">
      <h3>Reconciliation Log</h3>
      <ul>
        {events.length === 0 ? <li>(no events yet)</li> : null}
        {events.map((event) => (
          <li key={event.id}>
            <span>[T{event.tick}]</span>
            <em>{triggerLabel[event.trigger]}</em>
            <strong>{phaseLabel[event.phase]}</strong>
            <p>{event.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};
