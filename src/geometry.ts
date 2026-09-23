import { GRID_SIZE, CELL } from "./config";

// Centre of a cell in canvas pixels. Cell y grows north but canvas y grows down, hence the flip.
export const cellCenter = (x: number, y: number) => ({
  x: x * CELL + CELL / 2,
  y: (GRID_SIZE - 1 - y) * CELL + CELL / 2,
});
