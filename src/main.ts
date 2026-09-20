// Entry point: creates the app and wires the drone, views, runner and control panel together.
import "./style.css";
import { Application } from "pixi.js";
import { GRID_SIZE, CELL } from "./config";
import { Drone } from "./Drone";
import { GridView } from "./GridView";
import { DroneView } from "./DroneView";
import { CommandRunner } from "./CommandRunner";
import { ControlPanel } from "./ControlPanel";

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

  const runner = new CommandRunner(
    drone,
    (state) => panel.setRunning(state === "executing"),
    (text) => console.log(text),
  );
  const panel = new ControlPanel((commands) => runner.run(commands));

  // window.addEventListener("keydown", (e) => {
  //   if (e.key === "ArrowUp") drone.move();
  //   if (e.key === "ArrowLeft") drone.left();
  //   if (e.key === "ArrowRight") drone.right();
  //   if (e.key === " ") drone.attack();
  //   droneView.render();
  // });

  app.ticker.add((ticker) => droneView.update(ticker.deltaMS));
}

main();
