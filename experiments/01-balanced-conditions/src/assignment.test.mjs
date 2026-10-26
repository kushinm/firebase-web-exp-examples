import test from "node:test";
import assert from "node:assert/strict";
import { chooseCondition } from "./choose-condition.mjs";

test("assigns the less full condition", () => {
  assert.equal(chooseCondition({ a: 2, b: 3 }), "A");
  assert.equal(chooseCondition({ a: 4, b: 1 }), "B");
});

test("uses randomness only for ties", () => {
  assert.equal(chooseCondition({ a: 2, b: 2 }, () => 0.1), "A");
  assert.equal(chooseCondition({ a: 2, b: 2 }, () => 0.9), "B");
});

test("repeated assignments stay within one slot of each other", () => {
  const counts = { a: 0, b: 0 };
  for (let i = 0; i < 101; i += 1) {
    const condition = chooseCondition(counts, () => 0.9);
    counts[condition.toLowerCase()] += 1;
    assert.ok(Math.abs(counts.a - counts.b) <= 1);
  }
});

test("rejects invalid counts", () => {
  assert.throws(() => chooseCondition({ a: -1, b: 0 }));
  assert.throws(() => chooseCondition({ a: 0.5, b: 1 }));
});
