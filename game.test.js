import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createState, flap, step, collides, reset,
  GRAVITY, FLAP_V, H, GROUND, GAP, PIPE_W, BIRD_X, MARGIN, W,
} from './game.js';

const playing = (rng = () => 0.5) => {
  const s = createState(rng);
  flap(s);
  return s;
};

test('flap sets vy and starts game; step applies gravity', () => {
  const s = createState();
  assert.equal(s.phase, 'ready');
  flap(s);
  assert.equal(s.phase, 'playing');
  assert.equal(s.bird.vy, FLAP_V);
  const y = s.bird.y;
  step(s, 1 / 60);
  assert.ok(Math.abs(s.bird.vy - (FLAP_V + GRAVITY / 60)) < 1e-9);
  assert.ok(s.bird.y > y + FLAP_V / 60 - 1 && s.bird.y !== y);
});

test('ready phase does not move bird', () => {
  const s = createState();
  step(s, 1 / 60);
  assert.equal(s.bird.y, H / 2);
});

test('pipes spawn with gap inside playfield, for rng 0 and 1', () => {
  for (const r of [0, 1]) {
    const s = playing(() => r);
    for (let i = 0; i < 300; i++) {
      s.bird.y = H / 2; s.bird.vy = 0;
      step(s, 1 / 60);
      s.phase = 'playing';
    }
    assert.ok(s.pipes.length >= 2);
    for (const p of s.pipes) {
      assert.ok(p.gapY >= MARGIN && p.gapY <= H - GROUND - GAP - MARGIN);
    }
  }
});

test('off-screen pipes are removed', () => {
  const s = playing();
  s.pipes.push({ x: -PIPE_W - 1, gapY: 200, scored: true });
  s.bird.vy = 0;
  step(s, 1 / 60);
  assert.ok(s.pipes.every((p) => p.x + PIPE_W >= 0));
});

test('collides', () => {
  const pipes = [{ x: BIRD_X - 10, gapY: 200, scored: false }];
  assert.ok(collides({ y: -5 }, []));
  assert.ok(collides({ y: H - GROUND }, []));
  assert.ok(collides({ y: 100 }, pipes));
  assert.ok(collides({ y: 400 }, pipes));
  assert.ok(!collides({ y: 275 }, pipes));
  assert.ok(!collides({ y: 100 }, []));
});

test('ground collision ends game and updates best', () => {
  const s = playing();
  for (let i = 0; i < 200 && s.phase === 'playing'; i++) step(s, 1 / 60);
  assert.equal(s.phase, 'over');
});

test('score increments exactly once per pipe', () => {
  const s = playing();
  s.spawnT = 0;
  s.pipes.push({ x: BIRD_X - 10, gapY: 200, scored: false });
  for (let i = 0; i < 120; i++) {
    s.bird.y = 275; s.bird.vy = 0;
    step(s, 1 / 60);
  }
  assert.equal(s.phase, 'playing');
  assert.equal(s.score, 1);
  assert.equal(s.best, 1);
});

test('reset keeps best; flap is no-op when over', () => {
  const s = playing();
  s.score = 3; s.best = 3; s.phase = 'over';
  s.pipes.push({ x: 0, gapY: 100, scored: false });
  flap(s);
  assert.equal(s.phase, 'over');
  reset(s);
  assert.equal(s.best, 3);
  assert.equal(s.score, 0);
  assert.equal(s.pipes.length, 0);
  assert.equal(s.phase, 'ready');
});

test('huge dt is clamped and does not tunnel through pipe', () => {
  const s = playing();
  s.spawnT = 0;
  s.pipes.push({ x: BIRD_X + 20, gapY: 300, scored: false });
  s.bird.y = 100; s.bird.vy = 0;
  step(s, 10);
  assert.ok(s.bird.y < 100 + 0.5 * GRAVITY * 0.05 ** 2 + 1);
  assert.equal(W, 400);
});
