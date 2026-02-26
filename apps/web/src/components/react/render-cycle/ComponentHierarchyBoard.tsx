import { componentMap } from './model';
import { HierarchyCard } from './HierarchyCard';
import type { ComponentId, ComponentNode, CycleEvent, RenderPhase, Severity } from './types';

interface ComponentHierarchyBoardProps {
  selectedComponent: ComponentId;
  onSelectComponent: (id: ComponentId) => void;
  severityFor: (component: ComponentNode) => Severity;
  historyEvents: CycleEvent[];
  phaseLabel: Record<RenderPhase, string>;
}

export const ComponentHierarchyBoard = ({
  selectedComponent,
  onSelectComponent,
  severityFor,
  historyEvents,
  phaseLabel,
}: ComponentHierarchyBoardProps): JSX.Element => {
  const rootNode = componentMap.get('AppRoot') as ComponentNode;
  const navNode = componentMap.get('NavBar') as ComponentNode;
  const dataNode = componentMap.get('DataTable') as ComponentNode;
  const menuNode = componentMap.get('SideMenu') as ComponentNode;
  const navChildren = navNode.children.map((id) => componentMap.get(id) as ComponentNode);
  const dataChildren = dataNode.children.map((id) => componentMap.get(id) as ComponentNode);
  const menuChildren = menuNode.children.map((id) => componentMap.get(id) as ComponentNode);

  return (
    <section className="component-impact-board">
      <header>
        <h3>Hierarchy View</h3>
        <div className="hierarchy-legend">
          <span className="optimal">Optimal</span>
          <span className="heavy">Heavy</span>
          <span className="critical">Critical</span>
        </div>
      </header>
      <div className="hierarchy-canvas">
        <div className="hierarchy-row root">
          <HierarchyCard node={rootNode} selected={selectedComponent === rootNode.id} severity={severityFor(rootNode)} onSelect={onSelectComponent} />
        </div>
        <div className="hierarchy-row top">
          {[navNode, dataNode, menuNode].map((node) => (
            <HierarchyCard
              key={node.id}
              node={node}
              selected={selectedComponent === node.id}
              severity={severityFor(node)}
              onSelect={onSelectComponent}
            />
          ))}
        </div>
        <div className="hierarchy-grid">
          <div className="hierarchy-col">
            {navChildren.map((node) => (
              <HierarchyCard
                key={node.id}
                node={node}
                selected={selectedComponent === node.id}
                severity={severityFor(node)}
                onSelect={onSelectComponent}
              />
            ))}
          </div>
          <div className="hierarchy-col grid-rows">
            {dataChildren.map((node) => (
              <HierarchyCard
                key={node.id}
                node={node}
                selected={selectedComponent === node.id}
                severity={severityFor(node)}
                onSelect={onSelectComponent}
              />
            ))}
          </div>
          <div className="hierarchy-col stack">
            {menuChildren.map((node) => (
              <HierarchyCard
                key={node.id}
                node={node}
                selected={selectedComponent === node.id}
                severity={severityFor(node)}
                onSelect={onSelectComponent}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="render-events">
        <header>
          <h4>Render Events History</h4>
          <span>Live</span>
        </header>
        <div className="events-list">
          {historyEvents.length === 0 ? <p className="empty">(waiting for events)</p> : null}
          {historyEvents.map((event) => (
            <HierarchyCard
              key={event.id}
              node={componentMap.get(event.source) as ComponentNode}
              selected={selectedComponent === event.source}
              severity={severityFor(componentMap.get(event.source) as ComponentNode)}
              onSelect={onSelectComponent}
              compact
              meta={`[T${event.tick}] ${phaseLabel[event.phase]}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
