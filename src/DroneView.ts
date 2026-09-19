// Draws the drone triangle from a Drone's state (position + rotation). Rendering only.
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
    this.render();
  }

  render() {
    this.display.visible = this.drone.placed;
    this.display.x = this.drone.x * CELL + CELL / 2;
    this.display.y = (GRID_SIZE - 1 - this.drone.y) * CELL + CELL / 2;
    this.display.rotation = ANGLE[this.drone.facing];
  }
}
