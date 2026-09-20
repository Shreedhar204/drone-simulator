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

const STEP_DELAY_MS = 1000;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class CommandRunner {
  state: RunnerState = "idle";
  private drone: Drone;
  private onStateChange: (state: RunnerState) => void;

  constructor(drone: Drone, onStateChange: (state: RunnerState) => void) {
    this.drone = drone;
    this.onStateChange = onStateChange;
  }

  async run(commands: Command[]) {
    if (this.state !== "idle") return;
    this.setState("executing");
    try {
      for (const command of commands) {
        this.execute(command);
        await sleep(STEP_DELAY_MS);
      }
    } finally {
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
      case "REPORT":
        break; // output handling comes later
    }
  }

  private setState(state: RunnerState) {
    this.state = state;
    this.onStateChange(state);
  }
}
