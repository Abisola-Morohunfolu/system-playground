export type RenderTrigger = 'state-update' | 'prop-change' | 'context-update' | 'async-resume';

export type RenderPhase = 'schedule' | 'render' | 'reconcile' | 'commit' | 'layout-effects' | 'passive-effects';

export type ComponentId = string;

export type Severity = 'optimal' | 'heavy' | 'critical';

export interface CycleEvent {
  id: number;
  tick: number;
  trigger: RenderTrigger;
  phase: RenderPhase;
  source: ComponentId;
  affected: ComponentId[];
  detail: string;
}

export interface ActiveRun {
  trigger: RenderTrigger;
  source: ComponentId;
  affected: ComponentId[];
}

export interface ComponentNode {
  id: ComponentId;
  label: string;
  parent: ComponentId | null;
  children: ComponentId[];
  consumesContext?: boolean;
  avgMs: number;
  wastedPercent: number;
}
