export type CastIdleState = 'running' | 'paused' | 'done' | 'stopped';

export interface CastIdleOptions {
  count: number;
  bow: (index: number) => void;
  random?: () => number;
  idleMs?: number;
  maxBows?: number;
}

export interface CastIdle {
  hover(): void;
  setVisible(visible: boolean): void;
  stop(): void;
  readonly bows: number;
  readonly state: CastIdleState;
}

export function createCastIdle(opts: CastIdleOptions): CastIdle {
  const idleMs = opts.idleMs ?? 5000;
  const maxBows = opts.maxBows ?? 6;
  const random = opts.random ?? Math.random;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let bows = 0;
  let last = -1;
  let visible = true;
  let stopped = false;

  const state = (): CastIdleState => (stopped ? 'stopped' : bows >= maxBows ? 'done' : visible ? 'running' : 'paused');

  const clear = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };

  const pick = (): number => {
    if (opts.count <= 1) return 0;
    if (last < 0) return Math.floor(random() * opts.count);
    let i = Math.floor(random() * (opts.count - 1));
    if (i >= last) i += 1;
    return i;
  };

  const fire = () => {
    timer = undefined;
    const i = pick();
    last = i;
    bows += 1;
    opts.bow(i);
    schedule();
  };

  function schedule() {
    clear();
    if (state() === 'running') timer = setTimeout(fire, idleMs);
  }

  schedule();
  return {
    hover: schedule,
    setVisible(v) {
      visible = v;
      schedule();
    },
    stop() {
      stopped = true;
      clear();
    },
    get bows() {
      return bows;
    },
    get state() {
      return state();
    },
  };
}
