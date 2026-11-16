# Flappy Bird Web Game

A lightweight, responsive HTML5 canvas Flappy Bird clone created autonomously by [Swarmixs](https://github.com/kelimira/swarmixs).

## Features
- **Canvas Physics**: Fluid gravity, flapping velocity, and collision detection.
- **Responsive**: Adapts to any viewport with a fixed 2:3 aspect ratio.
- **Score & High Score**: Persisted across game sessions via `localStorage`.
- **Keyboard & Touch Controls**: Click or tap anywhere, or press `Space`/`Up Arrow` to flap.
- **Unit Tests**: Includes test suite covering physics tick simulation, collision boundaries, and reset mechanics.

## Quick Start
Open `index.html` in any modern web browser, or serve locally:
```bash
npx serve .
```

## Running Tests
```bash
node --test game.test.js
```
