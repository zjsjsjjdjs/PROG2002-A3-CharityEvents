import '../../../shared/src/lib/api.spec';
import '../../../shared/src/lib/connection-page.spec';

// Calendar badges follow Brisbane days, including the midnight boundary.
import { eventTiming } from './event-view';
describe('restored event timing badges', () => {
  it('keeps an earlier time today upcoming and marks yesterday past', () => {
    const now = new Date('2026-10-16T00:05:00+10:00');
    expect(eventTiming('2026-10-16T00:01:00+10:00', now)).toBe('upcoming');
    expect(eventTiming('2026-10-15T23:59:00+10:00', now)).toBe('past');
    expect(eventTiming('2026-10-17T00:00:00+10:00', now)).toBe('upcoming');
  });
});
