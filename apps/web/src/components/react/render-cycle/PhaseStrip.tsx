import { phaseDetail, phaseLabel, phaseOrder } from './model';

interface PhaseStripProps {
  hasActiveRun: boolean;
  phaseIndex: number;
}

export const PhaseStrip = ({ hasActiveRun, phaseIndex }: PhaseStripProps): JSX.Element => {
  return (
    <ol className="react-phase-strip">
      {phaseOrder.map((phase, index) => (
        <li
          key={phase}
          className={
            hasActiveRun
              ? index === phaseIndex
                ? 'active'
                : index < phaseIndex
                  ? 'done'
                  : ''
              : ''
          }
        >
          <strong>{phaseLabel[phase]}</strong>
          <small>{phaseDetail[phase]}</small>
        </li>
      ))}
    </ol>
  );
};
