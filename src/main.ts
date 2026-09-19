// Entry point: creates the app and wires the drone, views, runner and input together.
import "./style.css";
import { Application } from "pixi.js";
import { GRID_SIZE, CELL } from "./config";
import { Drone } from "./Drone";
import { GridView } from "./GridView";
import { DroneView } from "./DroneView";
import { CommandRunner } from "./CommandRunner";
import type { Command } from "./CommandRunner";

async function main() {
  const app = new Application();
  await app.init({
    width: GRID_SIZE * CELL,
    height: GRID_SIZE * CELL,
    backgroundColor: 0x222222,
  });
  document.getElementById("grid")?.appendChild(app.canvas);

  const drone = new Drone();
  const droneView = new DroneView(drone);
  app.stage.addChild(new GridView().display, droneView.display);

  // temporary: hardcoded commands (the spec's example c) until the control panel builds them
  const commands: Command[] = [
    { type: "PLACE", x: 1, y: 2, facing: "EAST" },
    { type: "MOVE" },
    { type: "MOVE" },
    { type: "LEFT" },
    { type: "MOVE" },
    { type: "ATTACK" },
    { type: "REPORT" },
  ];

  const playButton = document.getElementById("play") as HTMLButtonElement;

  const runner = new CommandRunner(
    drone,
    () => droneView.render(),
    (state) => {
      playButton.disabled = state === "executing";
    },
  );
  playButton.addEventListener("click", () => runner.run(commands));

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") drone.move();
    if (e.key === "ArrowLeft") drone.left();
    if (e.key === "ArrowRight") drone.right();
    if (e.key === " ") drone.attack();
    droneView.render();
  });
}

main();
