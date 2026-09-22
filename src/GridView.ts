// Draws the grid lines. Rendering only, no game state.
import { Graphics } from "pixi.js";
import type { StrokeStyle } from "pixi.js";
import { GRID_SIZE, CELL } from "./config";

const SIZE = GRID_SIZE * CELL;
// a dark halo under a light line keeps the grid readable on any background
const HALO = { width: 4, color: 0x000000, alpha: 0.4 };
const LINE = { width: 2, color: 0xffffff, alpha: 0.9 };

export class GridView {
  readonly display = new Graphics();

  constructor() {
    this.strokeGrid(HALO);
    this.strokeGrid(LINE);
  }

  // inner lines are centred on their path; the border is stroked inside the canvas so it isn't clipped
  private strokeGrid(style: StrokeStyle) {
    for (let i = 1; i < GRID_SIZE; i++) {
      this.display.moveTo(i * CELL, 0).lineTo(i * CELL, SIZE);
      this.display.moveTo(0, i * CELL).lineTo(SIZE, i * CELL);
    }
    this.display.stroke(style);
    this.display.rect(0, 0, SIZE, SIZE).stroke({ ...style, alignment: 1 });
  }
}
