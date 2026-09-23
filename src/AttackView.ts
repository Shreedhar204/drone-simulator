import {
  AnimatedSprite,
  Assets,
  Container,
  Rectangle,
  Sprite,
  Texture,
} from "pixi.js";
import { CELL } from "./config";
import { cellCenter } from "./geometry";
import type { Cell } from "./Drone";
import laserUrl from "./assets/projectile/laser-projectile.png";
import explosionUrl from "./assets/explosion-sequence/explosion-sequence-half.png";

type Point = { x: number; y: number };

const COLUMNS = 3;
const ROWS = 2;
const LASER_SIZE = CELL * 1.25; // includes the soft glow around the bolt
const LASER_SPEED = CELL * 10; // pixels per second
const LASER_ROTATION_OFFSET = 0; // the sprite's round end is assumed to be its front, facing right
const EXPLOSION_SIZE = CELL * 2;
const EXPLOSION_SPEED = 0.2; // AnimatedSprite speed: ~12 frames per second, so about 0.5s in total

// Cuts the 3 x 2 sheet into 6 frames (left to right, top to bottom), all views into one texture.
function sliceSheet(sheet: Texture): Texture[] {
  const width = Math.floor(sheet.width / COLUMNS);
  const height = Math.floor(sheet.height / ROWS);
  const frames: Texture[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLUMNS; col++) {
      const frame = new Rectangle(col * width, row * height, width, height);
      frames.push(new Texture({ source: sheet.source, frame }));
    }
  }
  return frames;
}

export class AttackView {
  readonly display = new Container();
  private laser: Sprite;
  private explosion: AnimatedSprite;
  private flight: {
    start: Point;
    end: Point;
    elapsed: number;
    done: () => void;
  } | null = null;

  static async create() {
    // mipmaps keep the large source art smooth when it is drawn small
    const data = { autoGenerateMipmaps: true };
    const [laser, sheet] = await Promise.all([
      Assets.load<Texture>({ src: laserUrl, data }),
      Assets.load<Texture>({ src: explosionUrl, data }),
    ]);
    return new AttackView(laser, sliceSheet(sheet));
  }

  private constructor(laser: Texture, frames: Texture[]) {
    this.laser = new Sprite(laser);
    this.laser.anchor.set(0.5);
    this.laser.scale.set(LASER_SIZE / laser.width);
    this.laser.visible = false;

    this.explosion = new AnimatedSprite(frames);
    this.explosion.anchor.set(0.5);
    this.explosion.scale.set(EXPLOSION_SIZE / frames[0].width);
    this.explosion.animationSpeed = EXPLOSION_SPEED;
    this.explosion.loop = false;
    this.explosion.visible = false;

    this.display.addChild(this.laser, this.explosion);
  }

  // Resolves once the laser has landed and the explosion has finished playing.
  fire(from: Cell, to: Cell): Promise<void> {
    const start = cellCenter(from.x, from.y);
    const end = cellCenter(to.x, to.y);
    this.laser.position.set(start.x, start.y);
    this.laser.rotation =
      Math.atan2(end.y - start.y, end.x - start.x) + LASER_ROTATION_OFFSET;
    this.laser.visible = true;
    return new Promise<void>((done) => {
      this.flight = { start, end, elapsed: 0, done };
    });
  }

  update(deltaMS: number) {
    const flight = this.flight;
    if (!flight) return;

    flight.elapsed += deltaMS;
    const distance = Math.hypot(
      flight.end.x - flight.start.x,
      flight.end.y - flight.start.y,
    );
    const progress = Math.min(
      ((flight.elapsed / 1000) * LASER_SPEED) / distance,
      1,
    );
    this.laser.position.set(
      flight.start.x + (flight.end.x - flight.start.x) * progress,
      flight.start.y + (flight.end.y - flight.start.y) * progress,
    );
    if (progress < 1) return;

    this.flight = null;
    this.laser.visible = false;
    this.explode(flight.end, flight.done);
  }

  private explode(at: Point, done: () => void) {
    this.explosion.position.set(at.x, at.y);
    this.explosion.visible = true;
    this.explosion.onComplete = () => {
      this.explosion.visible = false;
      done();
    };
    this.explosion.gotoAndPlay(0);
  }
}
