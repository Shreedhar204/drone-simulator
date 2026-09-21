// Runs a list of commands on the drone one step at a time and tracks idle/executing state,
// so the play button can't start a second run while one is in progress.
import type { Cell, Drone, Facing } from "./Drone";

export type Command =
  | { type: "PLACE"; x: number; y: number; facing: Facing }
  | { type: "MOVE" }
  | { type: "LEFT" }
  | { type: "RIGHT" }
  | { type: "REPORT" }
  | { type: "ATTACK" };

export type RunnerState = "idle" | "executing";

export type RunnerHooks = {
  onStateChange: (state: RunnerState) => void;
  onReport: (text: string) => void;
  onTakeOff: () => Promise<void>;
  onLand: () => Promise<void>;
  onAttack: (from: Cell, to: Cell) => Promise<void>;
  waitForMotion: () => Promise<boolean>;
};

const DRONE_ATTACK_IDLE_BEAT_MS = 200;
const IDLE_BEAT_MS = 500; // pause for commands with nothing to animate (ignored ATTACK, blocked MOVE)
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class CommandRunner {
  state: RunnerState = "idle";
  private drone: Drone;
  private hooks: RunnerHooks;

  constructor(drone: Drone, hooks: RunnerHooks) {
    this.drone = drone;
    this.hooks = hooks;
  }

  async run(commands: Command[]) {
    if (this.state !== "idle") return;
    this.setState("executing");
    let airborne = false;
    try {
      for (const command of commands) {
        const hit = this.execute(command);
        if (!airborne && command.type === "PLACE" && this.drone.placed) {
          airborne = true;
          await this.hooks.onTakeOff();
        } else if (hit) {
          await sleep(DRONE_ATTACK_IDLE_BEAT_MS);
          await this.hooks.onAttack({ x: this.drone.x, y: this.drone.y }, hit);
          await sleep(DRONE_ATTACK_IDLE_BEAT_MS);
        } else {
          const moved = await this.hooks.waitForMotion();
          if (!moved && command.type !== "REPORT") await sleep(IDLE_BEAT_MS);
        }
      }
    } finally {
      if (airborne) await this.hooks.onLand();
      this.setState("idle");
    }
  }

  // Returns the cell an ATTACK hit, or null for everything else (including an ignored ATTACK).
  private execute(command: Command): Cell | null {
    let hit: Cell | null = null;
    switch (command.type) {
      case "PLACE":
        this.drone.place(command.x, command.y, command.facing);
        break;
      case "MOVE":
        this.drone.move();
        break;
      case "LEFT":
        this.drone.left();
        break;
      case "RIGHT":
        this.drone.right();
        break;
      case "ATTACK":
        hit = this.drone.attack();
        break;
      case "REPORT": {
        const report = this.drone.report();
        if (report) this.hooks.onReport(report);
        break;
      }
    }
    return hit;
  }

  private setState(state: RunnerState) {
    this.state = state;
    this.hooks.onStateChange(state);
  }
}
