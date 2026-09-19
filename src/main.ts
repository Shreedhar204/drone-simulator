import "./style.css";
import { Application, Graphics } from "pixi.js";

const GRID_SIZE = 10;
const CELL = 40;

async function main() {
  const app = new Application();

  await app.init({
    width: GRID_SIZE * CELL,
    height: GRID_SIZE * CELL,
    backgroundColor: 0x222222,
    // resizeTo: window,
  });

  document.getElementById("app")?.appendChild(app.canvas);

  // Draw grid lines
  const grid = new Graphics();
  for (let i = 0; i <= GRID_SIZE; i++) {
    grid.moveTo(i * CELL, 0).lineTo(i * CELL, GRID_SIZE * CELL);
    grid.moveTo(0, i * CELL).lineTo(GRID_SIZE * CELL, i * CELL);
  }
  grid.stroke({ width: 1, color: 0x444444 });
  app.stage.addChild(grid);

  // drone for now
  let x = 0;
  let y = 0;
  const drone = new Graphics();
  drone.rect(2, 2, CELL - 4, CELL - 4).fill(0xff5555);
  app.stage.addChild(drone);

  function render() {
    drone.x = x * CELL;
    drone.y = (GRID_SIZE - 1 - y) * CELL;
  }
  // render();

  // boundry logic
  function tryMove(dx: number, dy: number) {
    const newX = x + dx;
    const newY = y + dy;

    if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
      return; // illegal move: ignored, position unchanged
    }

    x = newX;
    y = newY;
    render();
  }

  // commands

  // One key press = one grid step (not held-down continuous movement)
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") tryMove(-1, 0);
    if (e.key === "ArrowRight") tryMove(1, 0);
    if (e.key === "ArrowUp") tryMove(0, 1);
    if (e.key === "ArrowDown") tryMove(0, -1);
  });
}

main();
