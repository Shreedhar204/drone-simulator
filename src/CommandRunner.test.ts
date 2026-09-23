import { describe, it, expect, jest } from "@jest/globals";
import { Drone } from "./Drone";
import { CommandRunner } from "./CommandRunner";
import type { Command, RunnerHooks } from "./CommandRunner";

function makeHooks(): RunnerHooks {
  return {
    onStateChange: jest.fn(),
    onReport: jest.fn(),
    onTakeOff: jest.fn(async () => {}),
    onLand: jest.fn(async () => {}),
    onAttack: jest.fn(async () => {}),
    waitForMotion: jest.fn(async () => {}),
  };
}

describe("CommandRunner", () => {
  it("ignores a second run() while one is already executing", async () => {
    const hooks = makeHooks();
    const runner = new CommandRunner(new Drone(), hooks);

    const first = runner.run([{ type: "REPORT" }]);
    const second = runner.run([{ type: "REPORT" }]); // should be a no-op: state isn't idle yet
    await Promise.all([first, second]);

    expect(hooks.onStateChange).toHaveBeenCalledWith("executing");
    expect(
      (hooks.onStateChange as jest.Mock).mock.calls.filter(
        (call) => call[0] === "executing",
      ),
    ).toHaveLength(1);
  });

  it("goes idle again once the run finishes, with no PLACE so no takeoff/landing", async () => {
    const hooks = makeHooks();
    const runner = new CommandRunner(new Drone(), hooks);

    await runner.run([{ type: "REPORT" }]);

    expect(hooks.onTakeOff).not.toHaveBeenCalled();
    expect(hooks.onLand).not.toHaveBeenCalled();
    expect(runner.state).toBe("idle");
  });

  it("takes off on the first valid PLACE, then lands once at the end of the run", async () => {
    const hooks = makeHooks();
    const drone = new Drone();
    const runner = new CommandRunner(drone, hooks);

    const commands: Command[] = [
      { type: "PLACE", x: 0, y: 0, facing: "NORTH" },
      { type: "MOVE" },
    ];
    await runner.run(commands);

    expect(hooks.onTakeOff).toHaveBeenCalledTimes(1);
    expect(hooks.waitForMotion).toHaveBeenCalledTimes(1); // for the MOVE
    expect(hooks.onLand).toHaveBeenCalledTimes(1);
  });

  it("does not take off again on a second PLACE mid-run", async () => {
    const hooks = makeHooks();
    const runner = new CommandRunner(new Drone(), hooks);

    const commands: Command[] = [
      { type: "PLACE", x: 0, y: 0, facing: "NORTH" },
      { type: "PLACE", x: 5, y: 5, facing: "EAST" },
    ];
    await runner.run(commands);

    expect(hooks.onTakeOff).toHaveBeenCalledTimes(1);
    expect(hooks.waitForMotion).toHaveBeenCalledTimes(1); // the re-PLACE just repositions
    expect(hooks.onLand).toHaveBeenCalledTimes(1);
  });

  it("does not land if the drone never got a valid PLACE", async () => {
    const hooks = makeHooks();
    const runner = new CommandRunner(new Drone(), hooks);

    await runner.run([{ type: "MOVE" }, { type: "PLACE", x: 20, y: 20, facing: "NORTH" }]);

    expect(hooks.onTakeOff).not.toHaveBeenCalled();
    expect(hooks.onLand).not.toHaveBeenCalled();
  });

  it("fires onAttack with the drone's position and the target cell when there's room", async () => {
    const hooks = makeHooks();
    const drone = new Drone();
    const runner = new CommandRunner(drone, hooks);

    await runner.run([
      { type: "PLACE", x: 5, y: 5, facing: "NORTH" },
      { type: "ATTACK" },
    ]);

    expect(hooks.onAttack).toHaveBeenCalledWith({ x: 5, y: 5 }, { x: 5, y: 7 });
  }, 10000);

  it("does not fire onAttack when there isn't 2 free spaces ahead", async () => {
    const hooks = makeHooks();
    const runner = new CommandRunner(new Drone(), hooks);

    await runner.run([
      { type: "PLACE", x: 0, y: 0, facing: "SOUTH" },
      { type: "ATTACK" },
    ]);

    expect(hooks.onAttack).not.toHaveBeenCalled();
  }, 10000);

  it("reports the drone's position only once placed", async () => {
    const hooks = makeHooks();
    const runner = new CommandRunner(new Drone(), hooks);

    await runner.run([{ type: "REPORT" }]);
    expect(hooks.onReport).not.toHaveBeenCalled();

    await runner.run([
      { type: "PLACE", x: 3, y: 4, facing: "WEST" },
      { type: "REPORT" },
    ]);
    expect(hooks.onReport).toHaveBeenCalledWith("3,4,WEST");
  });
});
