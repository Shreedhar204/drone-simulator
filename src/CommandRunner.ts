import type { Cell, Drone, Facing } from "./Drone";
import { ATTACK_PAUSE_MS, pauseAfter, pauseBefore } from "./pacing";

export type Command =
  | { type: "PLACE"; x: number; y: number; facing: Facing }
  | { type: "MOVE" }
  | { type: "LEFT" }
  | { type: "RIGHT" }
  | { type: "REPORT" }
  | { type: "ATTACK" };

// What a command actually did, as reported by the drone's logic.
export type Effect =
  | { kind: "placed" }
  | { kind: "moved" } // MOVE, LEFT or RIGHT changed the drone's position or facing
  | { kind: "attacked"; target: Cell }
  | { kind: "reported" }
  | { kind: "blocked" }; // ignored: blocked MOVE, ignored ATTACK, invalid PLACE, or not placed yet

export type RunnerState = "idle" | "executing";

export type RunnerHooks = {
  onStateChange: (state: RunnerState) => void;
  onReport: (text: string) => void;
  onTakeOff: () => Promise<void>;
  onLand: () => Promise<void>;
  onAttack: (from: Cell, to: Cell) => Promise<void>;
  waitForMotion: () => Promise<void>;
};

const PLACED: Effect = { kind: "placed" };
const MOVED: Effect = { kind: "moved" };
const REPORTED: Effect = { kind: "reported" };
const BLOCKED: Effect = { kind: "blocked" };

// sleep(0) returns immediately instead of waiting a real tick, so back-to-back unpaused commands don't stutter.
const sleep = (ms: number) =>
  ms > 0 ? new Promise<void>((r) => setTimeout(r, ms)) : Promise.resolve();

export class CommandRunner {
  state: RunnerState = "idle";
  private drone: Drone;
  private hooks: RunnerHooks;
  private airborne = false;

  constructor(drone: Drone, hooks: RunnerHooks) {
    this.drone = drone;
    this.hooks = hooks;
  }

  async run(commands: Command[]) {
    if (this.state !== "idle") return;
    this.setState("executing");
    try {
      for (const [i, command] of commands.entries()) {
        await sleep(pauseBefore(command, commands[i - 1]));
        const effect = this.execute(command);
        await this.animate(effect);
        await sleep(pauseAfter(command, commands[i + 1], effect));
      }
    } finally {
      if (this.airborne) await this.hooks.onLand();
      this.airborne = false;
      this.setState("idle");
    }
  }

  private execute(command: Command): Effect {
    switch (command.type) {
      case "PLACE":
        return this.drone.place(command.x, command.y, command.facing)
          ? PLACED
          : BLOCKED;
      case "MOVE":
        return this.drone.move() ? MOVED : BLOCKED;
      case "LEFT":
        return this.drone.left() ? MOVED : BLOCKED;
      case "RIGHT":
        return this.drone.right() ? MOVED : BLOCKED;
      case "ATTACK": {
        const target = this.drone.attack();
        return target ? { kind: "attacked", target } : BLOCKED;
      }
      case "REPORT": {
        const report = this.drone.report();
        if (report) this.hooks.onReport(report);
        return REPORTED;
      }
    }
  }

  private async animate(effect: Effect) {
    switch (effect.kind) {
      case "placed":
        if (this.airborne) return this.hooks.waitForMotion(); // a re-PLACE
        this.airborne = true;
        return this.hooks.onTakeOff();
      case "moved":
        return this.hooks.waitForMotion();
      case "attacked":
        await sleep(ATTACK_PAUSE_MS); // pause before firing
        return this.hooks.onAttack(
          { x: this.drone.x, y: this.drone.y },
          effect.target,
        );
    }
  }

  private setState(state: RunnerState) {
    this.state = state;
    this.hooks.onStateChange(state);
  }
}
