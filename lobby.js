const form = document.querySelector("#newGameForm");
const modeEl = document.querySelector("#mode");
const playerCountEl = document.querySelector("#playerCount");
const playerCountField = document.querySelector("#playerCountField");
const scenarioEl = document.querySelector("#scenario");
const challengeEl = document.querySelector("#challenge");
const botDifficultyEl = document.querySelector("#botDifficulty");
const botDifficultyField = document.querySelector("#botDifficultyField");
const tickRateEl = document.querySelector("#tickRate");
const inputDelayEl = document.querySelector("#inputDelay");
const seedEl = document.querySelector("#seed");
const randomSeedButton = document.querySelector("#randomSeed");
const createGameButton = document.querySelector("#createGame");
const createStatus = document.querySelector("#createStatus");
const matchSummary = document.querySelector("#matchSummary");
const seatLinks = document.querySelector("#seatLinks");
const mapCards = document.querySelector("#mapCards");
const matchHeading = document.querySelector("#matchHeading");
const inviteCodeBox = document.querySelector("#inviteCodeBox");
const onlineHint = document.querySelector("#onlineHint");
const seatStatus = document.querySelector("#seatStatus");
const copyCodeButton = document.querySelector("#copyCode");
const copyJoinButton = document.querySelector("#copyJoin");
const openSeatLink = document.querySelector("#openSeat");
const joinForm = document.querySelector("#joinForm");
const joinCodeEl = document.querySelector("#joinCode");
const copyLobbyButton = document.querySelector("#copyLobby");
const copyP2Button = document.querySelector("#copyP2");
const copyAllButton = document.querySelector("#copyAll");
const quickAiButton = document.querySelector("#quickAi");
const quickPartyButton = document.querySelector("#quickParty");
const quickStoryButton = document.querySelector("#quickStory");
const quickJoinButton = document.querySelector("#quickJoin");
const relayPort = "8790";

const scenarios = [
  { id: 0, name: "Training Duel", brief: "Clear two-expansion duel.", tag: "default" },
  { id: 1, name: "Rush Defense", brief: "Closer pressure and faster attacks.", tag: "rush" },
  { id: 2, name: "Beginner Map", brief: "Small duel map with fewer bases and easier pressure.", tag: "beginner" },
  { id: 3, name: "Random Terrain", brief: "Seeded terrain and path choices.", tag: "terrain" },
  { id: 4, name: "Harass Bot", brief: "Worker-raid pressure map.", tag: "harass" },
  { id: 5, name: "Siege Break", brief: "Longer claims and siege pressure.", tag: "siege" },
  { id: 6, name: "Back Bases", brief: "Safer rear bases, long crossing.", tag: "greedy" },
  { id: 7, name: "Wide Ring", brief: "Outer expansions and rotations.", tag: "control" },
  { id: 8, name: "Close Natural", brief: "Fast natural, early punishment.", tag: "timing" },
  { id: 9, name: "Very Hard Bot", brief: "Unfair fortress pressure.", tag: "hard" },
];
let formDirty = false;
let latestLobby = null;
let activeApiOrigin = "";

function status(text) {
  createStatus.textContent = text;
}

function playerText(player) {
  if (!player) return "open";
  if (player.bot) return "bot ready";
  return `${player.connected ? "connected" : "open"} · ${player.ready ? "ready" : "waiting"}`;
}

function playerStateClass(player) {
  if (!player) return "open";
  if (player.bot || player.ready) return "ready";
  if (player.connected) return "connected";
  return "open";
}

function scenarioName(id) {
  return scenarios.find((scenario) => scenario.id === Number(id))?.name || `Map ${id}`;
}

function renderScenarioPicker() {
  scenarioEl.innerHTML = "";
  for (const scenario of scenarios) {
    const option = document.createElement("option");
    option.value = String(scenario.id);
    option.textContent = scenario.name;
    scenarioEl.appendChild(option);
  }
  mapCards.innerHTML = "";
  for (const scenario of scenarios) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "map-card";
    button.dataset.map = String(scenario.id);
    button.innerHTML = `<strong>${scenario.name}</strong><span>${scenario.brief}</span><em>${scenario.tag}</em>`;
    button.addEventListener("click", () => {
      scenarioEl.value = String(scenario.id);
      formDirty = true;
      updateMapCards();
    });
    mapCards.appendChild(button);
  }
  updateMapCards();
}

function updateMapCards() {
  for (const card of mapCards.querySelectorAll(".map-card")) {
    card.classList.toggle("selected", card.dataset.map === scenarioEl.value);
  }
}

function humanUrlFor(id) {
  return (latestLobby?.urls || []).find((entry) => Number(entry.id) === id && !entry.bot && entry.url)?.url || "";
}

function inviteCode() {
  return String(latestLobby?.inviteCode || "").trim().toUpperCase();
}

function relayOrigin() {
  if (window.location.protocol === "http:" || window.location.protocol === "https:") {
    const host = window.location.hostname || "127.0.0.1";
    return `${window.location.protocol}//${host}:${relayPort}`;
  }
  return `http://127.0.0.1:${relayPort}`;
}

function appOrigin() {
  return activeApiOrigin || relayOrigin();
}

function joinUrl() {
  const code = inviteCode();
  return code ? `${appOrigin()}/join?code=${encodeURIComponent(code)}` : "";
}

function playUrl(url, autostart = false) {
  if (!url) return "";
  const parsed = new URL(url, window.location.origin);
  if (autostart) parsed.searchParams.set("autostart", "1");
  else parsed.searchParams.delete("autostart");
  return parsed.toString();
}

async function copyText(text, label) {
  if (!text) {
    status(`${label} unavailable for this match.`);
    return;
  }
  await navigator.clipboard.writeText(text);
  status(`Copied ${label}.`);
}

function sanitizeJoinCode(value) {
  return String(value || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
}

async function apiJson(url, options = {}) {
  const origins = [];
  if (activeApiOrigin) origins.push(activeApiOrigin);
  if (window.location.protocol === "http:" || window.location.protocol === "https:") origins.push(window.location.origin);
  origins.push(relayOrigin());
  let lastError = null;
  for (const origin of [...new Set(origins)]) {
    const target = origin ? new URL(url, origin).toString() : url;
    try {
      const res = await fetch(target, options);
      const text = await res.text();
      let body = {};
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          body = { error: text.trim().slice(0, 180) };
        }
      }
      if (res.ok) {
        activeApiOrigin = origin;
        return body;
      }
      lastError = new Error(body.error || `HTTP ${res.status}`);
      if (![404, 405, 501].includes(res.status)) break;
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(lastError?.message || `LAN relay unavailable on ${relayOrigin()}`);
}

function renderLobby(lobby, { syncForm = false } = {}) {
  if (!lobby) return;
  latestLobby = lobby;
  if (syncForm || !formDirty) {
    seedEl.value = lobby.seed || seedEl.value;
    playerCountEl.value = String(lobby.playerCount ?? playerCountEl.value);
    scenarioEl.value = String(lobby.scenario ?? scenarioEl.value);
    botDifficultyEl.value = String(lobby.botDifficulty ?? botDifficultyEl.value);
    tickRateEl.value = String(lobby.tickRate ?? tickRateEl.value);
    inputDelayEl.value = String(lobby.inputDelay ?? inputDelayEl.value);
    modeEl.value = lobby.mode || modeEl.value;
    formDirty = false;
    updateMapCards();
  }

  const players = lobby.players || [];
  const p0 = players[0];
  const isBotMatch = lobby.mode === "bot";
  const humanUrls = (lobby.urls || []).filter((entry) => entry && !entry.bot && entry.url);
  const p1Url = humanUrls.find((entry) => Number(entry.id) === 1)?.url || "";
  const p0Url = humanUrls.find((entry) => Number(entry.id) === 0)?.url || "";
  const lobbyUrl = `${appOrigin()}/lobby.html`;
  matchHeading.textContent = isBotMatch ? "Play AI" : "Invite";
  inviteCodeBox.textContent = lobby.inviteCode || "------";
  inviteCodeBox.title = isBotMatch ? "AI games do not need invite codes." : "Click to copy invite code.";
  inviteCodeBox.classList.toggle("hidden", isBotMatch);
  copyCodeButton.classList.toggle("hidden", isBotMatch);
  copyJoinButton.classList.toggle("hidden", isBotMatch);
  joinForm.classList.toggle("hidden", isBotMatch);
  onlineHint.textContent = isBotMatch
    ? "AI games start from your seat. Use bot difficulty on the left."
    : lobby.started
      ? "Match is live. Reset creates a fresh rematch and both players ready up again."
      : "Give players this code or join link. Everyone readies before the match starts.";
  openSeatLink.href = p0Url ? playUrl(p0Url, isBotMatch) : lobbyUrl;
  openSeatLink.textContent = isBotMatch ? "Play vs AI" : p0Url ? "Open My Seat" : "Open Lobby";
  matchSummary.innerHTML = `
    <div class="match-title">${lobby.started ? "Live" : "Lobby"} · ${scenarioName(lobby.scenario)}</div>
    <div class="match-players">${players.map((player) => `<span>P${player.id} ${playerText(player)}</span>`).join("")}</div>
    <div class="match-meta">seed ${lobby.seed} · ${lobby.tickRate} fps · delay ${lobby.inputDelay} · bot ${lobby.botDifficulty}${lobby.challenge && lobby.challenge !== "standard" ? ` · ${lobby.challenge}` : ""}</div>
    ${isBotMatch ? `<div class="bot-note">P1 is bot-controlled. Open your seat and press Ready / Start.</div>` : `<div class="bot-note">Give the party code <strong>${lobby.inviteCode}</strong>, or send the join link.</div>`}
  `;
  seatStatus.innerHTML = players.map((player) => `
    <div class="seat-state ${playerStateClass(player)}">
      <strong>P${player.id}</strong>
      <span>${player.bot ? "Bot" : player.connected ? "Connected" : "Open"}</span>
      <em>${player.ready ? "Ready" : "Not ready"}</em>
    </div>
  `).join("");

  seatLinks.innerHTML = "";
  for (const entry of lobby.urls || []) {
    const card = document.createElement("div");
    card.className = "seat-card";
    const title = document.createElement("strong");
    title.textContent = `P${entry.id}`;
    card.appendChild(title);
    const state = document.createElement("span");
    state.textContent = entry.bot ? "Bot controlled" : "Player seat";
    card.appendChild(state);
    if (entry.url) {
      const open = document.createElement("a");
      open.href = playUrl(entry.url, isBotMatch);
      open.textContent = entry.id === 1 ? "Join P2" : "Open P0";
      open.className = "seat-button";
      card.appendChild(open);
      const copy = document.createElement("button");
      copy.type = "button";
      copy.textContent = "Copy";
      copy.addEventListener("click", async () => {
        await navigator.clipboard.writeText(entry.url);
        status(`Copied ${entry.id === 1 ? "Player 2" : "Player 1"} link.`);
      });
      card.appendChild(copy);
      const url = document.createElement("code");
      url.textContent = entry.url;
      card.appendChild(url);
    }
    seatLinks.appendChild(card);
  }
}

async function loadLobby() {
  try {
    renderLobby(await apiJson("/api/lobby"));
  } catch (err) {
    matchSummary.textContent = `Relay unavailable: ${err.message}`;
  }
}

async function createGame(event) {
  event?.preventDefault();
  status(modeEl.value === "bot" ? "Creating AI match..." : "Creating invite match...");
  const challenge = challengeEl.value || "standard";
  const challengeScenario = {
    workers: { scenario: 2, botDifficulty: 2 },
    rush: { scenario: 1, botDifficulty: 5 },
    fortress: { scenario: 9, botDifficulty: 9 },
  }[challenge];
  const body = {
    mode: challenge === "standard" ? modeEl.value : "bot",
    playerCount: Number(playerCountEl.value),
    scenario: challengeScenario?.scenario ?? Number(scenarioEl.value),
    botDifficulty: challengeScenario?.botDifficulty ?? Number(botDifficultyEl.value),
    tickRate: Number(tickRateEl.value),
    inputDelay: Number(inputDelayEl.value),
    seed: Number(seedEl.value),
    challenge,
  };
  try {
    const lobby = await apiJson("/api/new-game", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    renderLobby(lobby, { syncForm: true });
    formDirty = false;
    status(lobby.mode === "bot" ? "AI match ready. Open your seat." : `Invite ready: ${lobby.inviteCode}.`);
  } catch (err) {
    status(`Create failed: ${err.message}`);
  }
}

function updateModeLabels() {
  const bot = modeEl.value === "bot";
  createGameButton.textContent = bot ? "Start vs AI" : "Create Invite";
  matchHeading.textContent = bot ? "Play AI" : "Invite";
  botDifficultyField?.classList.toggle("hidden", !bot);
  playerCountField.classList.toggle("hidden", bot);
  if (bot) playerCountEl.value = "2";
}

async function joinWithCode(event) {
  event.preventDefault();
  const code = sanitizeJoinCode(joinCodeEl.value);
  joinCodeEl.value = code;
  if (!code) {
    status("Enter an invite code.");
    return;
  }
  try {
    const body = await apiJson("/api/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    });
    window.location.href = body.url;
  } catch (err) {
    status(`Join failed: ${err.message}`);
  }
}

randomSeedButton.addEventListener("click", () => {
  seedEl.value = String(Math.floor(Math.random() * 1000000) + 1);
  formDirty = true;
});
quickAiButton?.addEventListener("click", () => {
  const params = new URLSearchParams({
    scenario: "2",
    difficulty: "8",
    botPolicy: "moe8",
    speed: "1",
    fps: "60",
    seed: String(Math.floor(Math.random() * 1000000) + 1),
  });
  window.location.href = `/play.html?${params.toString()}`;
});
quickPartyButton?.addEventListener("click", () => {
  modeEl.value = "human";
  challengeEl.value = "standard";
  scenarioEl.value = "0";
  playerCountEl.value = "2";
  seedEl.value = String(Math.floor(Math.random() * 1000000) + 1);
  updateModeLabels();
  createGame();
});
quickStoryButton?.addEventListener("click", () => {
  window.location.href = "/roguelike.html";
});
quickJoinButton?.addEventListener("click", () => joinWithCode(new Event("submit")));
inviteCodeBox.addEventListener("click", () => {
  if (!inviteCodeBox.classList.contains("hidden")) copyText(inviteCode(), "invite code");
});
joinCodeEl.addEventListener("input", () => {
  const clean = sanitizeJoinCode(joinCodeEl.value);
  if (joinCodeEl.value !== clean) joinCodeEl.value = clean;
});
copyLobbyButton.addEventListener("click", () => copyText(`${appOrigin()}/lobby.html`, "lobby link"));
copyCodeButton.addEventListener("click", () => copyText(inviteCode(), "invite code"));
copyJoinButton.addEventListener("click", () => copyText(joinUrl(), "join link"));
copyP2Button.addEventListener("click", () => copyText(humanUrlFor(1), "Player 2 link"));
copyAllButton.addEventListener("click", () => {
  const links = [
    `Lobby ${appOrigin()}/lobby.html`,
    ...((latestLobby?.urls || []).filter((entry) => entry.url).map((entry) => `P${entry.id} ${entry.url}`)),
  ].join("\n");
  copyText(links, "all links");
});
for (const input of [modeEl, playerCountEl, scenarioEl, challengeEl, botDifficultyEl, tickRateEl, inputDelayEl, seedEl]) {
  input.addEventListener("input", () => {
    formDirty = true;
  });
  input.addEventListener("change", () => {
    formDirty = true;
    if (input === scenarioEl) updateMapCards();
    if (input === modeEl) updateModeLabels();
  });
}
form.addEventListener("submit", createGame);
joinForm.addEventListener("submit", joinWithCode);
renderScenarioPicker();
updateModeLabels();
loadLobby().then(() => {
  formDirty = false;
});
setInterval(loadLobby, 1500);
