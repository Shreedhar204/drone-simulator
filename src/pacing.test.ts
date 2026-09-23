import { describe, it, expect } from "@jest/globals";
import { ATTACK_PAUSE_MS, pauseAfter, pauseBefore } from "./pacing";
import type { Command, Effect } from "./CommandRunner";

const MOVE: Command = { type: "MOVE" };
const LEFT: Command = { type: "LEFT" };
const RIGHT: Command = { type: "RIGHT" };
const REPORT: Command = { type: "REPORT" };
const ATTACK: Command = { type: "ATTACK" };

const MOVED: Effect = { kind: "moved" };
const REPORTED: Effect = { kind: "reported" };
const BLOCKED: Effect = { kind: "blocked" };
const ATTACKED: Effect = { kind: "attacked", target: { x: 0, y: 0 } };

describe("pauseBefore", () => {
  it("pauses before a turn that isn't preceded by another turn", () => {
    expect(pauseBefore(LEFT, undefined)).toBeGreaterThan(0);
    expect(pauseBefore(RIGHT, MOVE)).toBeGreaterThan(0);
  });

  it("does not pause between consecutive turns", () => {
    expect(pauseBefore(RIGHT, LEFT)).toBe(0);
    expect(pauseBefore(LEFT, RIGHT)).toBe(0);
  });

  it("does not pause before a non-turn command", () => {
    expect(pauseBefore(MOVE, undefined)).toBe(0);
    expect(pauseBefore(ATTACK, LEFT)).toBe(0);
    expect(pauseBefore(REPORT, RIGHT)).toBe(0);
  });
});

describe("pauseAfter", () => {
  it("pauses after a turn that isn't followed by another turn", () => {
    expect(pauseAfter(LEFT, undefined, MOVED)).toBeGreaterThan(0);
    expect(pauseAfter(RIGHT, MOVE, MOVED)).toBeGreaterThan(0);
  });

  it("does not pause between consecutive turns", () => {
    expect(pauseAfter(LEFT, RIGHT, MOVED)).toBe(0);
  });

  it("pauses after a hit ATTACK, by the aim/fire amount", () => {
    expect(pauseAfter(ATTACK, undefined, ATTACKED)).toBe(ATTACK_PAUSE_MS);
  });

  it("pauses after any blocked/ignored command", () => {
    expect(pauseAfter(MOVE, undefined, BLOCKED)).toBeGreaterThan(0);
    expect(pauseAfter(ATTACK, undefined, BLOCKED)).toBeGreaterThan(0);
  });

  it("does not pause after MOVE, PLACE or REPORT that took effect", () => {
    expect(pauseAfter(MOVE, undefined, MOVED)).toBe(0);
    expect(pauseAfter(REPORT, undefined, REPORTED)).toBe(0);
  });
});
