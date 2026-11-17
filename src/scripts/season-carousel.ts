export interface SeasonCarouselOptions {
  count: number;
  /** Called whenever the shown step changes (not on creation). `cause` says whether the timer or the user moved it. */
  onChange: (index: number, cause: 'auto' | 'user') => void;
  /** Called whenever `rotating` or `userPaused` may have changed. */
  onState?: (state: SeasonCarouselState) => void;
  intervalMs?: number;
  /** Start with auto-advance off (prefers-reduced-motion). */
  startPaused?: boolean;
}

export interface SeasonCarouselState {
  index: number;
  /** True while a timer is armed: nothing is pausing the carousel. */
  rotating: boolean;
  /** True once the user has activated a tab or dot (or reduced motion started it paused). */
  userPaused: boolean;
}

export interface SeasonCarousel {
  /**
   * The user chose a step (tab or dial dot): show it and stop auto-advance for the rest of the page view.
   * This is the WCAG 2.2.2 mechanism for stopping moving content, in the same way as the APG carousel pattern,
   * where rotation stops once the user activates a control. There is deliberately no way to resume.
   */
  activate(index: number): void;
  setHovered(hovered: boolean): void;
  setFocused(focused: boolean): void;
  /** False while the carousel is off-screen or the tab is hidden. */
  setVisible(visible: boolean): void;
  stop(): void;
  readonly state: SeasonCarouselState;
}

export function createSeasonCarousel(opts: SeasonCarouselOptions): SeasonCarousel {
  const intervalMs = opts.intervalMs ?? 6000;
  let index = 0;
  let userPaused = opts.startPaused ?? false;
  let hovered = false;
  let focused = false;
  let visible = true;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const rotating = () => !stopped && !userPaused && !hovered && !focused && visible;
  const state = (): SeasonCarouselState => ({ index, rotating: rotating(), userPaused });

  const schedule = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    if (rotating()) {
      timer = setTimeout(() => {
        timer = undefined;
        move((index + 1) % opts.count, 'auto');
      }, intervalMs);
    }
    opts.onState?.(state());
  };

  function move(to: number, cause: 'auto' | 'user') {
    index = ((to % opts.count) + opts.count) % opts.count;
    opts.onChange(index, cause);
    schedule();
  }

  schedule();
  return {
    activate(i) {
      userPaused = true;
      move(i, 'user');
    },
    setHovered(h) {
      hovered = h;
      schedule();
    },
    setFocused(f) {
      focused = f;
      schedule();
    },
    setVisible(v) {
      visible = v;
      schedule();
    },
    stop() {
      stopped = true;
      schedule();
    },
    get state() {
      return state();
    },
  };
}
