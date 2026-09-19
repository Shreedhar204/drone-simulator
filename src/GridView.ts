// Draws the grid lines. Rendering only, no game state.
import { Graphics } from "pixi.js";
import { GRID_SIZE, CELL } from "./config";

export class GridView {
  readonly display = new Graphics();

  constructor() {
    for (let i = 0; i <= GRID_SIZE; i++) {
      this.display.moveTo(i * CELL, 0).lineTo(i * CELL, GRID_SIZE * CELL);
      this.display.moveTo(0, i * CELL).lineTo(GRID_SIZE * CELL, i * CELL);
    }
    this.display.stroke({ width: 1, color: 0x444444 });
  }
}
