import type { ComponentId, ComponentNode, Severity } from './types';

interface HierarchyCardProps {
  node: ComponentNode;
  selected: boolean;
  severity: Severity;
  onSelect: (id: ComponentId) => void;
  compact?: boolean;
  meta?: string;
}

export const HierarchyCard = ({
  node,
  selected,
  severity,
  onSelect,
  compact = false,
  meta,
}: HierarchyCardProps): JSX.Element => {
  const parentLabel = node.parent ? `<${node.parent} />` : 'Root';

  return (
    <button
      className={selected ? `hierarchy-card ${severity} ${compact ? 'compact' : ''} selected` : `hierarchy-card ${severity} ${compact ? 'compact' : ''}`}
      onClick={() => onSelect(node.id)}
      type="button"
    >
      <div className="top">
        <strong>{`<${node.label} />`}</strong>
        <span>{meta ?? `${node.avgMs.toFixed(2)}ms`}</span>
      </div>
      <small>{`Parent: ${parentLabel}`}</small>
    </button>
  );
};
