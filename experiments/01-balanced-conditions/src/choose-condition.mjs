// A tie is randomized; otherwise the smaller count wins.
export function chooseCondition({ a, b }, random = Math.random) {
  if (!Number.isSafeInteger(a) || a < 0 || !Number.isSafeInteger(b) || b < 0) {
    throw new Error("The experiment counts must be nonnegative integers.");
  }
  if (a === b) return random() < 0.5 ? "A" : "B";
  return a < b ? "A" : "B";
}
