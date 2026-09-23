# Drone Simulator

Toy Drone Assessment for Stormcraft Studios / Games Global, by **Shreedhar Ramnarain**
(shreedhar.maharaj86@gmail.com).

**Live URL:** https://drone-simulator-blush.vercel.app/

A simulation of a toy drone moving on a 10x10 grid, controlled by a queue of commands
(PLACE, MOVE, LEFT, RIGHT, ATTACK, REPORT) built through the UI and executed step by step.

## Running locally

```bash
npm install
npm run dev
npm run build
npm test
```

## Tech stack

- TypeScript + Vite
- PixiJS for rendering
- Vanilla CSS (no framework)
- Jest for unit tests

## Notes for the assessor

- **Logic vs. rendering:** all drone rules and state live in `src/Drone.ts`, a plain
  TypeScript class with no Pixi or DOM dependencies. Rendering (`DroneView`, `GridView`,
  `AttackView`) only reads that state; it never decides it. This is what `src/Drone.test.ts`
  exercises directly.
- **Boundary handling:** an out-of-bounds command is rejected outright (position/state
  unchanged), not clamped to the edge, per the spec's wording. Subsequent valid commands
  still work normally.
- **Source maps** are enabled in the production build (`vite.config.ts`) and are publicly
  reachable on the hosted deployment.
- Built mobile-first; the interface is capped to fit the viewport with no page scrolling.
- **Tests:** Jest unit tests in `src/Drone.test.ts` cover the drone's rules — boundary
  rejection, discard-before-a-valid-PLACE, ATTACK's "2 free spaces" rule, rotation,
  and the spec's own worked examples.
- **Assets:** the arena background, drone sprites, explosion sequence and compass
  graphics are AI-generated for this project. The projectile graphic is not.
