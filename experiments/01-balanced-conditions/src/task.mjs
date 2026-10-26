export const RESPONSE_DEADLINE_MS = 2500;

export const PRACTICE_ITEMS = [
  { text: "apple", lexicality: "word" },
  { text: "ploon", lexicality: "nonword" },
  { text: "river", lexicality: "word" },
  { text: "tavle", lexicality: "nonword" }
];

export const TEST_ITEMS = [
  { text: "garden", lexicality: "word" },
  { text: "window", lexicality: "word" },
  { text: "planet", lexicality: "word" },
  { text: "basket", lexicality: "word" },
  { text: "candle", lexicality: "word" },
  { text: "rabbit", lexicality: "word" },
  { text: "gorden", lexicality: "nonword" },
  { text: "wondow", lexicality: "nonword" },
  { text: "plonet", lexicality: "nonword" },
  { text: "baskel", lexicality: "nonword" },
  { text: "candel", lexicality: "nonword" },
  { text: "rabbot", lexicality: "nonword" }
];

export function scoreResponse(item, key, rt) {
  const normalizedKey = typeof key === "string" ? key.toLowerCase() : null;
  const response = normalizedKey === "f" ? "word" : normalizedKey === "j" ? "nonword" : null;
  return {
    stimulus: item.text,
    lexicality: item.lexicality,
    response,
    rtMs: rt == null ? null : Math.round(rt),
    correct: response === item.lexicality
  };
}
