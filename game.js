export const W = 400;
export const H = 600;
export const GROUND = 80;
export const BIRD_X = 100;
export const BIRD_R = 12;
export const GRAVITY = 1500;
export const FLAP_V = -420;
export const PIPE_W = 60;
export const GAP = 150;
export const PIPE_SPEED = 140;
export const PIPE_EVERY = 1.6;
export const MARGIN = 60;
export const MAX_DT = 0.05;
const TICK = 1 / 60;

export function createState(rng = Math.random, best = 0) {
  return { phase: 'ready', bird: { y: H / 2, vy: 0 }, pipes: [], score: 0, best, spawnT: PIPE_EVERY, rng };
}

export function reset(state) {
  Object.assign(state, createState(state.rng, state.best));
}

export function flap(state) {
  if (state.phase === 'over') return;
  state.phase = 'playing';
  state.bird.vy = FLAP_V;
}

export function collides(bird, pipes) {
  if (bird.y - BIRD_R < 0 || bird.y + BIRD_R > H - GROUND) return true;
  return pipes.some(
    (p) =>
      BIRD_X + BIRD_R > p.x &&
      BIRD_X - BIRD_R < p.x + PIPE_W &&
      (bird.y - BIRD_R < p.gapY || bird.y + BIRD_R > p.gapY + GAP),
  );
}

function tick(state, h, rng) {
  const { bird } = state;
  bird.vy += GRAVITY * h;
  bird.y += bird.vy * h;

  state.spawnT += h;
  if (state.spawnT >= PIPE_EVERY) {
    state.spawnT -= PIPE_EVERY;
    state.pipes.push({ x: W, gapY: MARGIN + rng() * (H - GROUND - GAP - 2 * MARGIN), scored: false });
  }
  for (const p of state.pipes) {
    p.x -= PIPE_SPEED * h;
    if (!p.scored && p.x + PIPE_W < BIRD_X) {
      p.scored = true;
      state.score++;
    }
  }
  state.pipes = state.pipes.filter((p) => p.x + PIPE_W >= 0);

  if (collides(bird, state.pipes)) state.phase = 'over';
  if (state.score > state.best) state.best = state.score;
}

export function step(state, dt, rng = state.rng ?? Math.random) {
  if (state.phase !== 'playing') return;
  dt = Math.min(Math.max(dt, 0), MAX_DT);
  const n = Math.max(1, Math.ceil(dt / TICK - 1e-9));
  for (let i = 0; i < n && state.phase === 'playing'; i++) tick(state, dt / n, rng);
}

function loadBest() {
  try {
    const v = parseInt(localStorage.getItem('flappy-best'), 10);
    return Number.isFinite(v) && v > 0 ? v : 0;
  } catch {
    return 0;
  }
}

function saveBest(v) {
  try {
    localStorage.setItem('flappy-best', String(v));
  } catch {
    /* storage unavailable */
  }
}

export function start(canvas) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const state = createState(Math.random, loadBest());
  let savedBest = state.best;

  const act = () => {
    if (state.phase === 'over') reset(state);
    else flap(state);
  };
  addEventListener('keydown', (e) => {
    if (e.code !== 'Space' && e.code !== 'ArrowUp') return;
    e.preventDefault();
    if (!e.repeat) act();
  });
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    act();
  });

  const text = (s, y, size = 28) => {
    ctx.font = `bold ${size}px sans-serif`;
    ctx.fillText(s, W / 2, y);
  };

  const draw = () => {
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#4caf50';
    for (const p of state.pipes) {
      ctx.fillRect(p.x, 0, PIPE_W, p.gapY);
      ctx.fillRect(p.x, p.gapY + GAP, PIPE_W, H - GROUND - p.gapY - GAP);
    }
    ctx.fillStyle = '#ded895';
    ctx.fillRect(0, H - GROUND, W, GROUND);
    ctx.fillStyle = '#f7d51d';
    ctx.beginPath();
    ctx.arc(BIRD_X, state.bird.y, BIRD_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    text(String(state.score), 60);
    if (state.phase === 'ready') text('Press Space / Tap to flap', H / 2 + 80, 20);
    if (state.phase === 'over') {
      text('Game Over', H / 2 - 20);
      text(`Score ${state.score}  Best ${state.best}`, H / 2 + 20, 20);
      text('Space / Click to restart', H / 2 + 50, 18);
    }
  };

  let last = performance.now();
  const frame = (now) => {
    step(state, (now - last) / 1000);
    last = now;
    if (state.best > savedBest) saveBest((savedBest = state.best));
    draw();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
