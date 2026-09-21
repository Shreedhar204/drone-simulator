// The timing rules for a run: when to pause around each command. Pure functions, so they are easy to tune and test.
import type { Command, Effect } from "./CommandRunner";

const TURN_PAUSE_MS = 200; // pause before and after a run of turns, so rotating feels deliberate
export const ATTACK_PAUSE_MS = 200; // aim before firing, and hold after the explosion
const BEAT_MS = 500; // pause after an ignored command, so it doesn't flash past unseen

const isTurn = (command?: Command) =>
  command?.type === "LEFT" || command?.type === "RIGHT";

// Pause before a command's state changes (and so before it starts animating).
export const pauseBefore = (command: Command, previous?: Command) =>
  isTurn(command) && !isTurn(previous) ? TURN_PAUSE_MS : 0;

// Pause after a command has finished animating.
export const pauseAfter = (
  command: Command,
  next: Command | undefined,
  effect: Effect,
) => {
  if (isTurn(command)) return isTurn(next) ? 0 : TURN_PAUSE_MS;
  if (effect.kind === "attacked") return ATTACK_PAUSE_MS;
  return effect.kind === "blocked" ? BEAT_MS : 0;
};
