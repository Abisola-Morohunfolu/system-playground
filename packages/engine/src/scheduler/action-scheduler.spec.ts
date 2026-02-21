import { describe, expect, it } from 'vitest';
import { ActionScheduler } from './action-scheduler';

describe('ActionScheduler', () => {
  it('drains same-tick actions immediately', () => {
    const scheduler = new ActionScheduler();

    scheduler.enqueue({ type: 'request.received' });
    scheduler.enqueue({ type: 'request.received' });

    expect(scheduler.drainReadyActions()).toEqual([
      { type: 'request.received' },
      { type: 'request.received' },
    ]);
    expect(scheduler.hasPendingActions()).toBe(false);
  });

  it('holds delayed actions until the target tick', () => {
    const scheduler = new ActionScheduler();

    scheduler.scheduleIn(2, { type: 'timer.fired' });

    expect(scheduler.drainReadyActions()).toEqual([]);
    scheduler.advanceTick(1);
    expect(scheduler.drainReadyActions()).toEqual([]);

    scheduler.advanceTick(1);
    expect(scheduler.drainReadyActions()).toEqual([{ type: 'timer.fired' }]);
    expect(scheduler.getCurrentTick()).toBe(2);
  });

  it('keeps deterministic order for actions ready on the same tick', () => {
    const scheduler = new ActionScheduler();

    scheduler.scheduleIn(1, { type: 'b' });
    scheduler.enqueue({ type: 'a' });
    scheduler.scheduleIn(-4, { type: 'c' });

    expect(scheduler.drainReadyActions()).toEqual([{ type: 'a' }, { type: 'c' }]);

    scheduler.advanceTick(1);
    expect(scheduler.drainReadyActions()).toEqual([{ type: 'b' }]);
  });
});
