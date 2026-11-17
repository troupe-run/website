import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSeasonCarousel } from '../../src/scripts/season-carousel';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const make = (extra: { startPaused?: boolean } = {}) => {
  const shown: number[] = [];
  const causes: string[] = [];
  const c = createSeasonCarousel({
    count: 4,
    onChange: (i, cause) => {
      shown.push(i);
      causes.push(cause);
    },
    ...extra,
  });
  return { c, shown, causes };
};

describe('createSeasonCarousel', () => {
  it('advances one step every 6s and wraps from the last step back to the first', () => {
    const { c, shown } = make();
    vi.advanceTimersByTime(5999);
    expect(shown).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(shown).toEqual([1]);
    vi.advanceTimersByTime(18000);
    expect(shown).toEqual([1, 2, 3, 0]);
    expect(c.state.index).toBe(0);
  });

  it('hover stops it advancing and, when the pointer leaves, a full 6s runs before the next step', () => {
    const { c, shown } = make();
    c.setHovered(true);
    vi.advanceTimersByTime(30000);
    expect(shown).toEqual([]);
    c.setHovered(false);
    vi.advanceTimersByTime(5999);
    expect(shown).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(shown).toEqual([1]);
  });

  it('keyboard focus stops it advancing until focus leaves', () => {
    const { c, shown } = make();
    c.setFocused(true);
    vi.advanceTimersByTime(30000);
    expect(shown).toEqual([]);
    c.setFocused(false);
    vi.advanceTimersByTime(6000);
    expect(shown).toEqual([1]);
  });

  it('activating a step shows it at once and stops auto-advance for good, whatever hover or focus do afterwards', () => {
    const { c, shown } = make();
    vi.advanceTimersByTime(5000);
    c.activate(2);
    expect(shown).toEqual([2]);
    c.setHovered(true);
    c.setHovered(false);
    c.setFocused(true);
    c.setFocused(false);
    c.setVisible(false);
    c.setVisible(true);
    vi.advanceTimersByTime(120000);
    expect(shown).toEqual([2]);
    expect(c.state).toEqual({ index: 2, rotating: false, userPaused: true });
  });

  it('starts paused when asked to (reduced motion) and never advances on its own', () => {
    const { c, shown } = make({ startPaused: true });
    vi.advanceTimersByTime(60000);
    expect(shown).toEqual([]);
    expect(c.state).toEqual({ index: 0, rotating: false, userPaused: true });
  });

  it('reports timer moves as "auto" and chosen steps as "user"', () => {
    const { c, causes } = make();
    vi.advanceTimersByTime(6000);
    c.activate(0);
    expect(causes).toEqual(['auto', 'user']);
  });

  it('reports the index of the shown step as it advances', () => {
    const { c } = make();
    vi.advanceTimersByTime(12000);
    expect(c.state.index).toBe(2);
  });

  it('does not advance while off-screen or hidden, and resumes when visible again', () => {
    const { c, shown } = make();
    c.setVisible(false);
    vi.advanceTimersByTime(60000);
    expect(shown).toEqual([]);
    c.setVisible(true);
    vi.advanceTimersByTime(6000);
    expect(shown).toEqual([1]);
  });

  it('reports rotating only while nothing is pausing it', () => {
    const { c } = make();
    expect(c.state.rotating).toBe(true);
    c.setHovered(true);
    expect(c.state.rotating).toBe(false);
    c.setHovered(false);
    c.setVisible(false);
    expect(c.state.rotating).toBe(false);
  });
});
