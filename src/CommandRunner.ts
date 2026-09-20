// Runs a list of commands on the drone one step at a time and tracks idle/executing state,
// so the play button can't start a second run while one is in progress.
import type { Drone, Facing } from "./Drone";

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
  waitForMotion: () => Promise<boolean>;
};

const IDLE_BEAT_MS = 500; // pause for commands with nothing to animate (ATTACK, blocked MOVE)
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
        this.execute(command);
        if (!airborne && command.type === "PLACE" && this.drone.placed) {
          airborne = true;
          await this.hooks.onTakeOff();
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

  private execute(command: Command) {
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
        this.drone.attack();
        break;
      case "REPORT": {
        const report = this.drone.report();
        if (report) this.hooks.onReport(report);
        break;
      }
    }
  }

  private setState(state: RunnerState) {
    this.state = state;
    this.hooks.onStateChange(state);
  }
}
