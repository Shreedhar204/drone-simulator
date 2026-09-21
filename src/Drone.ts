// Pure drone logic (state + rules). No Pixi or DOM, so it's testable and independent of visuals.
import { GRID_SIZE } from "./config";

export type Facing = "NORTH" | "EAST" | "SOUTH" | "WEST";
export type Cell = { x: number; y: number };
const CARDINAL_DIRECTIONS_ORDER: Facing[] = ["NORTH", "EAST", "SOUTH", "WEST"];
const STEP: Record<Facing, { dx: number; dy: number }> = {
  NORTH: { dx: 0, dy: 1 },
  EAST: { dx: 1, dy: 0 },
  SOUTH: { dx: 0, dy: -1 },
  WEST: { dx: -1, dy: 0 },
};

const inBounds = (x: number, y: number) =>
  x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;

export class Drone {
  x = 0;
  y = 0;
  facing: Facing = "NORTH";
  placed = false;

  place(x: number, y: number, facing: Facing) {
    if (!inBounds(x, y)) return;
    this.x = x;
    this.y = y;
    this.facing = facing;
    this.placed = true;
  }

  move() {
    if (!this.placed) return;
    const { dx, dy } = STEP[this.facing];
    if (inBounds(this.x + dx, this.y + dy)) {
      this.x += dx;
      this.y += dy;
    }
  }

  left() {
    this.rotate(-1);
  }

  right() {
    this.rotate(1);
  }

  // Returns the cell hit, or null if there aren't 2 free spaces ahead.
  attack(): Cell | null {
    if (!this.placed) return null;
    const { dx, dy } = STEP[this.facing];
    const tx = this.x + dx * 2;
    const ty = this.y + dy * 2;
    return inBounds(tx, ty) ? { x: tx, y: ty } : null;
  }

  report(): string | null {
    return this.placed ? `${this.x},${this.y},${this.facing}` : null;
  }

  private rotate(step: number) {
    if (!this.placed) return;
    const i = CARDINAL_DIRECTIONS_ORDER.indexOf(this.facing);
    this.facing = CARDINAL_DIRECTIONS_ORDER[(i + step + 4) % 4];
  }
}
