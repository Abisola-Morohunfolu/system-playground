import type { RenderTrigger } from './types';

interface ReactCycleActionsProps {
  active: boolean;
  isRunning: boolean;
  speedMs: number;
  onTrigger: (trigger: RenderTrigger) => void;
  onToggleRun: () => void;
  onClearLog: () => void;
  onSpeedChange: (speed: number) => void;
}

export const ReactCycleActions = ({
  active,
  isRunning,
  speedMs,
  onTrigger,
  onToggleRun,
  onClearLog,
  onSpeedChange,
}: ReactCycleActionsProps): JSX.Element => {
  return (
    <div className="react-cycle-actions">
      <button onClick={() => onTrigger('state-update')} disabled={active}>
        Trigger State
      </button>
      <button onClick={() => onTrigger('prop-change')} disabled={active}>
        Trigger Props
      </button>
      <button onClick={() => onTrigger('context-update')} disabled={active}>
        Trigger Context
      </button>
      <button onClick={onToggleRun}>{isRunning ? 'Pause' : 'Resume'}</button>
      <button onClick={onClearLog}>Clear Log</button>
      <label>
        Speed
        <select value={String(speedMs)} onChange={(event) => onSpeedChange(Number(event.target.value))}>
          <option value="1000">Slow</option>
          <option value="700">Normal</option>
          <option value="450">Fast</option>
        </select>
      </label>
    </div>
  );
};
