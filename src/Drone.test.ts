// Unit tests for the spec's rules, exercised through the Drone logic class (no Pixi/DOM involved).
import { describe, it, expect } from "@jest/globals";
import { Drone } from "./Drone";
import type { Facing } from "./Drone";

const FACINGS: Facing[] = ["NORTH", "EAST", "SOUTH", "WEST"];

// Feeds spec-style commands ("PLACE 1,2,EAST", "MOVE", ...) to a drone; returns the last REPORT output.
function run(drone: Drone, commands: string[]): string | null {
  let output: string | null = null;
  for (const line of commands) {
    const [name, args] = line.split(" ");
    switch (name) {
      case "PLACE": {
        const [x, y, facing] = args.split(",");
        drone.place(Number(x), Number(y), facing as Facing);
        break;
      }
      case "MOVE":
        drone.move();
        break;
      case "LEFT":
        drone.left();
        break;
      case "RIGHT":
        drone.right();
        break;
      case "ATTACK":
        drone.attack();
        break;
      case "REPORT":
        output = drone.report();
        break;
    }
  }
  return output;
}

const placedAt = (x: number, y: number, facing: Facing) => {
  const drone = new Drone();
  drone.place(x, y, facing);
  return drone;
};

describe("surface (10 x 10, origin SW)", () => {
  it.each<[number, number]>([[0, 0], [9, 0], [0, 9], [9, 9]])(
    "accepts the corner %i,%i",
    (x, y) => {
      expect(placedAt(x, y, "NORTH").report()).toBe(`${x},${y},NORTH`);
    },
  );

  it.each<[number, number]>([[-1, 0], [0, -1], [10, 0], [0, 10], [10, 10]])(
    "rejects a PLACE outside the surface at %i,%i",
    (x, y) => {
      const drone = new Drone();
      drone.place(x, y, "NORTH");
      expect(drone.placed).toBe(false);
      expect(drone.report()).toBeNull();
    },
  );
});

describe("PLACE", () => {
  it.each(FACINGS)("puts the drone at X,Y facing %s", (facing) => {
    expect(placedAt(3, 4, facing).report()).toBe(`3,4,${facing}`);
  });

  it("can be issued again to reposition the drone", () => {
    expect(run(new Drone(), ["PLACE 1,1,NORTH", "PLACE 5,6,WEST", "REPORT"])).toBe("5,6,WEST");
  });

  it("ignores an invalid PLACE and leaves the drone where it was", () => {
    expect(run(new Drone(), ["PLACE 2,2,EAST", "PLACE 10,10,NORTH", "REPORT"])).toBe("2,2,EAST");
  });
});

describe("commands before a valid PLACE are discarded", () => {
  it("ignores MOVE, LEFT, RIGHT, ATTACK and REPORT while not on the surface", () => {
    const drone = new Drone();
    expect(run(drone, ["MOVE", "LEFT", "RIGHT", "ATTACK", "REPORT"])).toBeNull();
    expect(drone.attack()).toBeNull();
    expect(drone.placed).toBe(false);
  });

  it("keeps discarding after an invalid PLACE", () => {
    expect(run(new Drone(), ["PLACE 10,10,NORTH", "MOVE", "REPORT"])).toBeNull();
  });

  it("starts the sequence at the first valid PLACE", () => {
    expect(run(new Drone(), ["MOVE", "LEFT", "PLACE 2,3,EAST", "REPORT"])).toBe("2,3,EAST");
  });
});

describe("MOVE", () => {
  it.each<[Facing, number, number]>([
    ["NORTH", 5, 6],
    ["EAST", 6, 5],
    ["SOUTH", 5, 4],
    ["WEST", 4, 5],
  ])("moves one unit forward when facing %s", (facing, x, y) => {
    const drone = placedAt(5, 5, facing);
    drone.move();
    expect(drone.report()).toBe(`${x},${y},${facing}`);
  });

  it.each<[number, number, Facing]>([
    [4, 9, "NORTH"],
    [4, 0, "SOUTH"],
    [9, 4, "EAST"],
    [0, 4, "WEST"],
    [0, 0, "SOUTH"],
    [9, 9, "EAST"],
  ])("is prevented at the edge: %i,%i facing %s", (x, y, facing) => {
    const drone = placedAt(x, y, facing);
    drone.move();
    expect(drone.report()).toBe(`${x},${y},${facing}`);
  });

  it("stays on the surface however many times it is pushed at the edge", () => {
    const drone = placedAt(0, 0, "NORTH");
    run(drone, Array(15).fill("MOVE"));
    expect(drone.report()).toBe("0,9,NORTH");
  });

  it("still accepts valid movement after a blocked move", () => {
    expect(run(new Drone(), ["PLACE 0,0,WEST", "MOVE", "RIGHT", "MOVE", "REPORT"])).toBe("0,1,NORTH");
  });
});

describe("LEFT and RIGHT", () => {
  it.each<[Facing, Facing]>([
    ["NORTH", "WEST"],
    ["WEST", "SOUTH"],
    ["SOUTH", "EAST"],
    ["EAST", "NORTH"],
  ])("LEFT from %s faces %s", (from, to) => {
    const drone = placedAt(3, 4, from);
    drone.left();
    expect(drone.report()).toBe(`3,4,${to}`);
  });

  it.each<[Facing, Facing]>([
    ["NORTH", "EAST"],
    ["EAST", "SOUTH"],
    ["SOUTH", "WEST"],
    ["WEST", "NORTH"],
  ])("RIGHT from %s faces %s", (from, to) => {
    const drone = placedAt(3, 4, from);
    drone.right();
    expect(drone.report()).toBe(`3,4,${to}`);
  });

  it("never changes the position", () => {
    expect(run(new Drone(), ["PLACE 3,4,NORTH", "LEFT", "RIGHT", "RIGHT", "LEFT", "LEFT", "REPORT"])).toBe("3,4,WEST");
  });
});

describe("REPORT", () => {
  it("announces X,Y,F", () => {
    expect(placedAt(7, 2, "SOUTH").report()).toBe("7,2,SOUTH");
  });

  it("does not change the drone", () => {
    const drone = placedAt(7, 2, "SOUTH");
    drone.report();
    expect(drone.report()).toBe("7,2,SOUTH");
  });
});

describe("ATTACK", () => {
  it.each<[Facing, number, number]>([
    ["NORTH", 5, 7],
    ["EAST", 7, 5],
    ["SOUTH", 5, 3],
    ["WEST", 3, 5],
  ])("hits 2 units ahead when facing %s", (facing, x, y) => {
    expect(placedAt(5, 5, facing).attack()).toEqual({ x, y });
  });

  it.each<[number, number, Facing, number, number]>([
    [4, 7, "NORTH", 4, 9],
    [4, 2, "SOUTH", 4, 0],
    [7, 4, "EAST", 9, 4],
    [2, 4, "WEST", 0, 4],
  ])("still fires with exactly 2 free spaces: %i,%i facing %s", (x, y, facing, tx, ty) => {
    expect(placedAt(x, y, facing).attack()).toEqual({ x: tx, y: ty });
  });

  it.each<[number, number, Facing]>([
    [4, 9, "NORTH"],
    [4, 8, "NORTH"],
    [4, 0, "SOUTH"],
    [4, 1, "SOUTH"],
    [9, 4, "EAST"],
    [8, 4, "EAST"],
    [0, 4, "WEST"],
    [1, 4, "WEST"],
  ])("is ignored with fewer than 2 free spaces: %i,%i facing %s", (x, y, facing) => {
    expect(placedAt(x, y, facing).attack()).toBeNull();
  });

  it("does not move or turn the drone", () => {
    const drone = placedAt(5, 5, "EAST");
    drone.attack();
    expect(drone.report()).toBe("5,5,EAST");
  });
});

describe("spec examples", () => {
  it("b) PLACE 0,0,NORTH / LEFT / REPORT -> 0,0,WEST", () => {
    expect(run(new Drone(), ["PLACE 0,0,NORTH", "LEFT", "REPORT"])).toBe("0,0,WEST");
  });

  it("c) PLACE 1,2,EAST / MOVE / MOVE / LEFT / MOVE / ATTACK / REPORT -> 3,3,NORTH", () => {
    const commands = ["PLACE 1,2,EAST", "MOVE", "MOVE", "LEFT", "MOVE", "ATTACK", "REPORT"];
    expect(run(new Drone(), commands)).toBe("3,3,NORTH");
  });

  // The spec prints 0,0,SOUTH, but MOVE from 0,0 facing NORTH is valid and reaches 0,1.
  // Example c only works if NORTH is +Y, so the printed output in a) looks like a typo.
  it("a) follows the rules: ends at 0,1,SOUTH with the ATTACK ignored", () => {
    const drone = new Drone();
    const commands = ["PLACE 0,0,NORTH", "MOVE", "LEFT", "LEFT"];
    run(drone, commands);
    expect(drone.attack()).toBeNull();
    expect(drone.report()).toBe("0,1,SOUTH");
  });
});
