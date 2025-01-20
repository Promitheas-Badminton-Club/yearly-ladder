import notProd from "./not-prod.mjs";

export function parseScore(scoreString) {
  // Regex to match all game scores
  const regex = /(\d{1,2})[^\d\s](\d{1,2})/g;

  const matches = [];
  let match;
  // Use a loop to collect all matches
  while ((match = regex.exec(scoreString)) !== null) {
    matches.push([parseInt(match[1], 10), parseInt(match[2], 10)]);
  }

  if (matches.length === 0) {
    throw new Error("Invalid score format");
  }

  return matches;
}

notProd(["tape"], async (tap) => {
  // Tests
  tap.test("parseScores parses single game", (t) => {
    const input = "21-19";
    const expected = [[21, 19]];
    t.same(
      parseScore(input),
      expected,
      "Should correctly parse single game",
    );
    t.end();
  });

  tap.test("parseScore parses two games", (t) => {
    const input = "21a10 21-9";
    const expected = [[21, 10], [21, 9]];
    t.same(
      parseScore(input),
      expected,
      "Should correctly parse two games",
    );
    t.end();
  });

  tap.test("parseScore parses three games", (t) => {
    const input = "21:15 | 21-17 | 15/21";
    const expected = [[21, 15], [21, 17], [15, 21]];
    t.same(
      parseScore(input),
      expected,
      "Should correctly parse three games",
    );
    t.end();
  });

  tap.test("parseScore throws on invalid input", (t) => {
    const input = "invalid input";
    t.throws(
      () => parseScore(input),
      new Error("Invalid score format"),
      "Should throw error on invalid input",
    );
    t.end();
  });
});
