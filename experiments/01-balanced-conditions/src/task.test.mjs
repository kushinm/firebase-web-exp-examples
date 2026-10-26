import test from "node:test";
import assert from "node:assert/strict";
import { PRACTICE_ITEMS, TEST_ITEMS, scoreResponse } from "./task.mjs";

test("practice and test sets are distinct and test items are balanced", () => {
  const all = [...PRACTICE_ITEMS, ...TEST_ITEMS];
  assert.equal(new Set(all.map((item) => item.text)).size, all.length);
  assert.equal(TEST_ITEMS.filter((item) => item.lexicality === "word").length, 6);
  assert.equal(TEST_ITEMS.filter((item) => item.lexicality === "nonword").length, 6);
});

test("scores correct, incorrect, and timed-out responses", () => {
  const item = { text: "garden", lexicality: "word" };
  assert.deepEqual(scoreResponse(item, "f", 412.4), {
    stimulus: "garden", lexicality: "word", response: "word", rtMs: 412, correct: true
  });
  assert.equal(scoreResponse(item, "j", 600).correct, false);
  assert.deepEqual(scoreResponse(item, null, null), {
    stimulus: "garden", lexicality: "word", response: null, rtMs: null, correct: false
  });
});
