import type { ComponentId, ComponentNode, RenderPhase, RenderTrigger } from './types';

export const phaseOrder: RenderPhase[] = ['schedule', 'render', 'reconcile', 'commit', 'layout-effects', 'passive-effects'];

export const phaseLabel: Record<RenderPhase, string> = {
  schedule: 'Schedule Update',
  render: 'Render',
  reconcile: 'Reconcile',
  commit: 'Commit',
  'layout-effects': 'Layout Effects',
  'passive-effects': 'Passive Effects',
};

export const triggerLabel: Record<RenderTrigger, string> = {
  'state-update': 'State Change',
  'prop-change': 'Props Change',
  'context-update': 'Context Change',
  'async-resume': 'Async Resume',
};

export const phaseDetail: Record<RenderPhase, string> = {
  schedule: 'Queue and prioritize update work.',
  render: 'Compute next React tree.',
  reconcile: 'Diff previous and next fibers.',
  commit: 'Apply DOM mutations.',
  'layout-effects': 'Run sync layout effects.',
  'passive-effects': 'Flush deferred effects.',
};

export const components: ComponentNode[] = [
  {
    id: 'AppRoot',
    label: 'AppRoot',
    parent: null,
    children: ['NavBar', 'DataTable', 'SideMenu'],
    avgMs: 0.45,
    wastedPercent: 0,
  },
  { id: 'NavBar', label: 'NavBar', parent: 'AppRoot', children: ['Logo', 'Search'], avgMs: 0.08, wastedPercent: 2 },
  { id: 'Logo', label: 'Logo', parent: 'NavBar', children: [], avgMs: 0.01, wastedPercent: 1 },
  { id: 'Search', label: 'Search', parent: 'NavBar', children: [], avgMs: 0.05, wastedPercent: 3 },
  {
    id: 'DataTable',
    label: 'DataTable',
    parent: 'AppRoot',
    children: ['Row1', 'Row2', 'Row3', 'Row4', 'Row5', 'Row6'],
    consumesContext: true,
    avgMs: 1.2,
    wastedPercent: 68,
  },
  { id: 'Row1', label: 'Row-1', parent: 'DataTable', children: [], avgMs: 0.12, wastedPercent: 24 },
  { id: 'Row2', label: 'Row-2', parent: 'DataTable', children: [], avgMs: 0.45, wastedPercent: 57 },
  { id: 'Row3', label: 'Row-3', parent: 'DataTable', children: [], avgMs: 0.14, wastedPercent: 26 },
  { id: 'Row4', label: 'Row-4', parent: 'DataTable', children: [], avgMs: 0.11, wastedPercent: 21 },
  { id: 'Row5', label: 'Row-5', parent: 'DataTable', children: [], avgMs: 0.42, wastedPercent: 52 },
  { id: 'Row6', label: 'Row-6', parent: 'DataTable', children: [], avgMs: 0.13, wastedPercent: 25 },
  {
    id: 'SideMenu',
    label: 'SideMenu',
    parent: 'AppRoot',
    children: ['MenuItem1', 'MenuItem2', 'MenuItem3'],
    consumesContext: true,
    avgMs: 0.02,
    wastedPercent: 1,
  },
  { id: 'MenuItem1', label: 'Item (Memo)', parent: 'SideMenu', children: [], avgMs: 0.01, wastedPercent: 0 },
  { id: 'MenuItem2', label: 'Item (Memo)', parent: 'SideMenu', children: [], avgMs: 0.01, wastedPercent: 0 },
  { id: 'MenuItem3', label: 'Item (Memo)', parent: 'SideMenu', children: [], avgMs: 0.01, wastedPercent: 0 },
];

export const componentMap = new Map<ComponentId, ComponentNode>(components.map((node) => [node.id, node]));

const descendantsOf = (source: ComponentId): ComponentId[] => {
  const queue = [source];
  const seen = new Set<ComponentId>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current)) {
      continue;
    }

    seen.add(current);
    const node = componentMap.get(current);
    if (!node) {
      continue;
    }

    for (const child of node.children) {
      queue.push(child);
    }
  }

  return [...seen];
};

export const computeAffectedComponents = (trigger: RenderTrigger, source: ComponentId): ComponentId[] => {
  if (trigger === 'context-update') {
    const consumers = components
      .filter((node) => node.consumesContext)
      .flatMap((node) => descendantsOf(node.id));

    return [...new Set(consumers)];
  }

  if (trigger === 'state-update' || trigger === 'prop-change' || trigger === 'async-resume') {
    return descendantsOf(source);
  }

  return [source];
};
