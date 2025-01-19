import fs from "fs";
import Mustache from "mustache";
import { parse } from "csv-parse/sync";

const googleSheetPublicCSVUrl = (url) => {
  const { groups: { gid, sheetId } } =
    /\/d\/(?<sheetId>(\w|-)+)\/.+gid=(?<gid>\d+)/
      .exec(url);

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
};

async function fetchGoogleSheetData(url) {
  const res = await fetch(googleSheetPublicCSVUrl(url));

  if (!res.ok) {
    throw new Error(`Failed to fetch: ${url}`);
  }

  const csvText = await res.text();
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
  });

  return records;
}

const url =
  "https://docs.google.com/spreadsheets/d/1CI0aGjYIyPN0ExFJhUMFB3WaE2yV3UvnS6HKVt0Ti00/edit?resourcekey=&gid=131035744#gid=131035744";
const csvData = await fetchGoogleSheetData(url);

console.log(csvData);

// Reduce function to process the ladder

const ladderSystem = csvData.reduce((ladder, record) => {
  const { Challenger: challenger, Challenged: challenged, Results: result } =
    record;

  // Ensure both players are on the ladder
  if (!ladder.includes(challenger)) ladder.push(challenger);
  if (!ladder.includes(challenged)) ladder.push(challenged);

  console.log(ladder, record);

  const challengerIndex = ladder.indexOf(challenger);
  const challengedIndex = ladder.indexOf(challenged);

  // Parse game results and determine the match winner
  const scores = result.split(" ").map((game) => game.split("-").map(Number));
  let challengerWins = 0;
  let challengedWins = 0;

  scores.forEach(([challengerScore, challengedScore]) => {
    if (challengerScore > challengedScore) challengerWins++;
    else challengedWins++;
  });

  console.log("challengerWins", challengerWins);
  console.log("challengedWins", challengedWins);

  if (challengerWins >= 2) {
    // Only swap of challenger has lower rank than challenged.
    if (challengedIndex < challengerIndex) {
      // Remove the challenger from its old spot
      ladder.splice(challengerIndex, 1);

      // Place challenger on challenged spot
      ladder.splice(challengedIndex, 0, challenger);
    }
  }

  return ladder;
}, []);

let currentLevel = 1; // Start at level 1
const ladderData = {
  ladder: ladderSystem.map((name, index) => {
    const addHr = (index & (index + 1)) === 0; // Check if index is one less than a power of two
    const level = currentLevel;

    if (addHr) {
      currentLevel++; // Increment the level after an <hr>
    }

    return {
      rank: index + 1,
      name,
      level,
      addHr,
      isFirst: index === 0,
      isSecond: index === 1,
      isThird: index === 2,
      isOther: index >= 3,
    };
  }),
};

const template = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Promitheas Yearly Ladder</title>
  <style>
    html {
      scroll-behavior: smooth;
    }
    body {
      font-family: "Courier New", Courier, monospace;
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
      color: #212529;
      line-height: 1.6;
    }
    header, footer {
      padding-right: 4vw;
      padding-left: 4vw;
      padding-top: 4vw;
      padding-bottom: 4vw;
    }
    header h1, footer p {
      margin: 0;
    }
    main {
      padding-right: 4vw;
      padding-left: 4vw;
    }
    ol {
      list-style-type: decimal;
      padding-left: 2rem;
    }
    li {
      margin: 0.5rem 0;
    }
    h1 {
      margin-top: 20vh;
    }
    h2 {
      margin-top: 20vh;
      opacity: 0.5;
    }
    h3 {
      opacity: 0.3;
      margin: 2rem 0 0.5rem;
          font-size: 1.5rem;
          padding-bottom: 0.5rem;
        }
        .medal {
          font-weight: bold;
        }

        ol {
     padding-left: 0;
     /* If you want you can change the list type from inside or outside */
     list-style: inside decimal;
     }

      </style>
    </head>
    <body>
      <header>
        <h1>Promitheas ${new Date().getFullYear()} Yearly Ladder</h1>
        <nav>
          <a href="#Ranking">Ranking</a>
          <a href="#Rules">Rules</a>
          <a href="#Play">Play</a>
        </nav>
      </header>
      <main>
        <h2 id="Ranking">Ranking</h2>
        <ol>
          {{#ladder}}
          {{#addHr}}
            <h3>Level {{level}}</h3>
          {{/addHr}}
          <li>
            {{name}}
            {{#isFirst}}<span class="medal">🥇</span>{{/isFirst}}
            {{#isSecond}}<span class="medal">🥈</span>{{/isSecond}}
            {{#isThird}}<span class="medal">🥉</span>{{/isThird}}
          </li>
          {{/ladder}}
        </ol>

        <h2 id="Rules">Rules</h2>

    <ol>
      <li>
        <strong>Player Entry</strong>
        <ul>
          <li>Players are <strong>automatically added</strong> to the ladder when they play their first game.</li>
          <li>New players enter the ladder at the position of the <strong>player they defeated</strong> in their first match. If the challenger wins, they take the defeated player's rank, and the defeated player moves down one rank.</li>
          <li>If the challenger loses, the ladder remains unchanged, and they enter the bottom of the ladder.</li>
        </ul>
      </li>
      <li>
        <strong>Challenges</strong>
        <ul>
          <li>Players can challenge any other player on the ladder.</li>
          <li>If the challenger wins, they move up to the position of the challenged player, and the challenged player moves down one rank.</li>
          <li>If the challenger loses, the ladder remains unchanged.</li>
        </ul>
      </li>
      <li>
        <strong>Match Format</strong>
        <ul>
          <li>Matches are played in a <strong>best-of-three</strong> format (first to 2 game wins).</li>
          <li>The score is tracked in a <code>x-y</code> format (e.g., "21-19 19-21 21-18").</li>
        </ul>
      </li>
      <li>
        <strong>Ladder Reset</strong>
        <ul>
          <li>The ladder is <strong>reset every year</strong>.</li>
        </ul>
      </li>
    </ol>

    <h2 id="Play">Play</h2>
    <ol>
      <li>
        Join the WhatsApp chat group and start challenging players.
        <a href="https://chat.whatsapp.com/CIl4T9qvd4Q1BiYNMVQXp8" target="_blank">
          Promitheas Yearly Ladder WhatsApp Group
        </a>
      </li>

      <li>
        Register a match result.
        <a href="https://forms.gle/6x2Eygpfm2owNoZf6" target="_blank">
          Result Form
        </a>
      </li>

    </ol>

  </main>

  <footer>
    <p>${new Date()}</p>
  </footer>
</body>
</html>
`;

// Generate and save the HTML file
const renderedMarkup = Mustache.render(template, ladderData);
fs.writeFileSync("public/index.html", renderedMarkup);
console.info("Ranking page regenerated!");
