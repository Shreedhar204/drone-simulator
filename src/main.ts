// Entry point: creates the app and wires the drone, views, runner and control panel together.
import "./style.css";
import { Application } from "pixi.js";
import { GRID_SIZE, CELL } from "./config";
import { Drone } from "./Drone";
import { GridView } from "./GridView";
import { DroneView } from "./DroneView";
import { AttackView } from "./AttackView";
import { CommandRunner } from "./CommandRunner";
import { ControlPanel } from "./ControlPanel";
import { ReportLog } from "./ReportLog";

async function main() {
  const app = new Application();
  await app.init({
    width: GRID_SIZE * CELL,
    height: GRID_SIZE * CELL,
    backgroundAlpha: 0,
    resolution: window.devicePixelRatio,
  });
  document.getElementById("grid")?.appendChild(app.canvas);

  const drone = new Drone();
  const droneView = await DroneView.create(drone);
  const attackView = await AttackView.create();
  app.stage.addChild(
    new GridView().display,
    droneView.display,
    attackView.display,
  );

  const reportLog = new ReportLog();

  const runner = new CommandRunner(drone, {
    onStateChange: (state) => {
      panel.setRunning(state === "executing");
      if (state === "executing") reportLog.clear();
    },
    onReport: (text) => reportLog.add(text),
    onTakeOff: () => droneView.takeOff(),
    onLand: () => droneView.land(),
    onAttack: (from, to) => attackView.fire(from, to),
    waitForMotion: () => droneView.waitForMotion(),
  });
  const panel = new ControlPanel((commands) => runner.run(commands));

  // window.addEventListener("keydown", (e) => {
  //   if (e.key === "ArrowUp") drone.move();
  //   if (e.key === "ArrowLeft") drone.left();
  //   if (e.key === "ArrowRight") drone.right();
  //   if (e.key === " ") drone.attack();
  //   droneView.render();
  // });

  app.ticker.add((ticker) => {
    droneView.update(ticker.deltaMS);
    attackView.update(ticker.deltaMS);
  });
}

main();
