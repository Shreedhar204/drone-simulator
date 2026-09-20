// Draws the drone triangle and eases it toward the Drone's state (position + rotation). Rendering only.
import { Graphics } from "pixi.js";
import { GRID_SIZE, CELL } from "./config";
import { Drone } from "./Drone";
import type { Facing } from "./Drone";

const ANGLE: Record<Facing, number> = {
  NORTH: 0,
  EAST: Math.PI / 2,
  SOUTH: Math.PI,
  WEST: (3 * Math.PI) / 2,
};

const SMOOTHING_MS = 80;
const SNAP_DISTANCE = CELL * 1.5;

export class DroneView {
  readonly display = new Graphics();
  private drone: Drone;

  constructor(drone: Drone) {
    this.drone = drone;
    this.display
      .moveTo(0, -14)
      .lineTo(10, 10)
      .lineTo(-10, 10)
      .closePath()
      .fill(0xff5555);
    this.snap();
  }

  snap() {
    const { x, y, rotation } = this.target();
    this.display.visible = this.drone.placed;
    this.display.x = x;
    this.display.y = y;
    this.display.rotation = rotation;
  }

  update(deltaMS: number) {
    if (!this.drone.placed) return;
    if (!this.display.visible) return this.snap();

    const { x, y, rotation } = this.target();
    if (Math.hypot(x - this.display.x, y - this.display.y) > SNAP_DISTANCE) {
      return this.snap();
    }

    const t = 1 - Math.exp(-deltaMS / SMOOTHING_MS);
    const diff = rotation - this.display.rotation;
    this.display.x += (x - this.display.x) * t;
    this.display.y += (y - this.display.y) * t;
    this.display.rotation += Math.atan2(Math.sin(diff), Math.cos(diff)) * t;
  }

  private target() {
    return {
      x: this.drone.x * CELL + CELL / 2,
      y: (GRID_SIZE - 1 - this.drone.y) * CELL + CELL / 2,
      rotation: ANGLE[this.drone.facing],
    };
  }
}
