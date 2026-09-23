import { Assets, Sprite } from "pixi.js";
import type { Texture } from "pixi.js";
import { CELL } from "./config";
import { cellCenter } from "./geometry";
import { Drone } from "./Drone";
import type { Facing } from "./Drone";
import stillUrl from "./assets/drone/drone-still.png";
import spinningUrl from "./assets/drone/drone-spinning.png";

const ANGLE: Record<Facing, number> = {
  NORTH: 0,
  EAST: Math.PI / 2,
  SOUTH: Math.PI,
  WEST: (3 * Math.PI) / 2,
};

const MOVE_SPEED = CELL * 2.5; // pixels per second (2.5 cells per second)
const TURN_SPEED = Math.PI * 1.5; // radians per second (a 90° turn takes ~0.33s)
const SNAP_DISTANCE = CELL * 1.5;
const DRONE_SIZE = CELL * 1.2;
const LANDED_SCALE = 0.8; // resting size; full size when airborne
const STILL_HOLD_MS = 500; // takeoff: propellers off before they start
const SPIN_HOLD_MS = 300; // spinning at resting size, before rising / after landing
const SCALE_MS = 500; // rising / descending

type TransitionKind = "takeoff" | "land";

export class DroneView {
  readonly display: Sprite;
  private drone: Drone;
  private still: Texture;
  private spinning: Texture;
  private fullScale: number;
  private transition: {
    kind: TransitionKind;
    elapsed: number;
    done: () => void;
  } | null = null;
  private motionWaiters: Array<() => void> = [];

  static async create(drone: Drone) {
    // mipmaps keep the 512px art smooth when it is drawn at ~48px
    const data = { autoGenerateMipmaps: true };
    const [still, spinning] = await Promise.all([
      Assets.load<Texture>({ src: stillUrl, data }),
      Assets.load<Texture>({ src: spinningUrl, data }),
    ]);
    return new DroneView(drone, still, spinning);
  }

  private constructor(drone: Drone, still: Texture, spinning: Texture) {
    this.drone = drone;
    this.still = still;
    this.spinning = spinning;
    this.display = new Sprite(still);
    this.display.anchor.set(0.5);
    this.display.width = DRONE_SIZE;
    this.display.height = DRONE_SIZE;
    this.fullScale = this.display.scale.x;
    this.snap();
  }

  takeOff(): Promise<void> {
    this.snap(); // appear straight at the PLACE cell, no glide
    this.display.texture = this.still;
    this.display.scale.set(this.fullScale * LANDED_SCALE);
    return this.startTransition("takeoff");
  }

  land(): Promise<void> {
    this.display.texture = this.spinning;
    return this.startTransition("land");
  }

  // Resolves once the drone has finished moving/turning, or straight away if there's nothing to animate.
  waitForMotion(): Promise<void> {
    if (!this.drone.placed || this.atTarget()) return Promise.resolve();
    return new Promise((resolve) => {
      this.motionWaiters.push(resolve);
    });
  }

  snap() {
    const { x, y, rotation } = this.target();
    this.display.visible = this.drone.placed;
    this.display.x = x;
    this.display.y = y;
    this.display.rotation = rotation;
  }

  update(deltaMS: number) {
    if (!this.drone.placed) return;
    if (!this.display.visible) return this.snap();
    if (this.transition) this.advanceTransition(deltaMS);

    const { x, y, rotation } = this.target();
    const dx = x - this.display.x;
    const dy = y - this.display.y;
    const distance = Math.hypot(dx, dy);
    if (distance > SNAP_DISTANCE) return this.snap();

    const seconds = deltaMS / 1000;
    const step = MOVE_SPEED * seconds;
    if (distance <= step) {
      this.display.x = x;
      this.display.y = y;
    } else {
      this.display.x += (dx / distance) * step;
      this.display.y += (dy / distance) * step;
    }

    const diff = this.angleDiff(rotation);
    const turn = TURN_SPEED * seconds;
    if (Math.abs(diff) <= turn) this.display.rotation = rotation;
    else this.display.rotation += Math.sign(diff) * turn;

    if (this.atTarget()) {
      for (const done of this.motionWaiters.splice(0)) done();
    }
  }

  private atTarget() {
    const { x, y, rotation } = this.target();
    return (
      Math.hypot(x - this.display.x, y - this.display.y) < 0.01 &&
      Math.abs(this.angleDiff(rotation)) < 0.001
    );
  }

  // Shortest signed distance (in radians) from the display's current rotation to a target angle.
  private angleDiff(target: number) {
    return Math.atan2(
      Math.sin(target - this.display.rotation),
      Math.cos(target - this.display.rotation),
    );
  }

  private startTransition(kind: TransitionKind) {
    return new Promise<void>((done) => {
      this.transition = { kind, elapsed: 0, done };
    });
  }

  private advanceTransition(deltaMS: number) {
    const t = this.transition!;
    t.elapsed += deltaMS;
    const ease = (p: number) => 1 - (1 - p) ** 3;
    const setScale = (s: number) => this.display.scale.set(this.fullScale * s);

    if (t.kind === "takeoff") {
      if (t.elapsed < STILL_HOLD_MS) return;
      this.display.texture = this.spinning;
      const p = Math.min(
        Math.max((t.elapsed - STILL_HOLD_MS - SPIN_HOLD_MS) / SCALE_MS, 0),
        1,
      );
      setScale(LANDED_SCALE + (1 - LANDED_SCALE) * ease(p));
      if (p < 1) return;
    } else {
      const p = Math.min(t.elapsed / SCALE_MS, 1);
      setScale(1 - (1 - LANDED_SCALE) * ease(p));
      if (t.elapsed < SCALE_MS + SPIN_HOLD_MS) return;
      this.display.texture = this.still;
    }

    this.transition = null;
    t.done();
  }

  private target() {
    return {
      ...cellCenter(this.drone.x, this.drone.y),
      rotation: ANGLE[this.drone.facing],
    };
  }
}
