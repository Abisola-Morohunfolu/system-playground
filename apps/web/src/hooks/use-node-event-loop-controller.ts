import { useEffect, useMemo, useState } from 'react';
import {
  NodeEventLoopController,
  NodeEventLoopSnapshot,
} from '../lib/node-event-loop-controller';

export const useNodeEventLoopController = (): {
  controller: NodeEventLoopController;
  snapshot: NodeEventLoopSnapshot;
} => {
  const controller = useMemo(() => new NodeEventLoopController(), []);
  const [snapshot, setSnapshot] = useState<NodeEventLoopSnapshot>(controller.getSnapshot());

  useEffect(() => {
    const unsubscribe = controller.subscribe((next) => setSnapshot(next));
    controller.start();

    return () => {
      unsubscribe();
      controller.destroy();
    };
  }, [controller]);

  return { controller, snapshot };
};
