const statsEl = document.querySelector("#runStats");
const mapEl = document.querySelector("#runMap");
const deckEl = document.querySelector("#runDeck");
const logEl = document.querySelector("#rogueLog");
const choiceEl = document.querySelector("#choicePanel");
const missionStage = document.querySelector("#missionStage");
const missionKicker = document.querySelector("#missionKicker");
const missionTitle = document.querySelector("#missionTitle");
const missionText = document.querySelector("#missionText");
const missionIntel = document.querySelector("#missionIntel");
const deploySubtext = document.querySelector("#deploySubtext");
const claimSectorButton = document.querySelector("#claimSector");

const upgradePool = [
  { name: "Longbow Training", klass: "archer", stat: "range", amount: 1.20, text: "Archers hold the line from safer ground." },
  { name: "Fletching", klass: "archer", stat: "damage", amount: 0.22, text: "Your first volley lands harder." },
  { name: "Shield Wall", klass: "soldier", stat: "hp", amount: 0.22, text: "Warriors survive long enough to pin threats." },
  { name: "Tempered Blades", klass: "soldier", stat: "damage", amount: 0.24, text: "Close fights end faster." },
  { name: "Blast Charges", klass: "bomber", stat: "damage", amount: 0.75, text: "Worker lines are no longer safe." },
  { name: "Siege Optics", klass: "siege", stat: "range", amount: 1.10, text: "Tanks punish greedy positions." },
  { name: "Stabilized Cannons", klass: "siege", stat: "damage", amount: 0.36, text: "Anchored pushes carry more threat." },
  { name: "Raider Engines", klass: "vulture", stat: "damage", amount: 0.22, text: "Harass squads bite harder." },
  { name: "Field Medicine", klass: "healer", stat: "range", amount: 1.00, text: "Support can stay behind the fight." },
  { name: "Matrix Batteries", klass: "matrix_caster", stat: "hp", amount: 0.26, text: "Key units are harder to burst down." },
  { name: "Storm Conductors", klass: "storm_caster", stat: "damage", amount: 0.24, text: "Clusters become dangerous for both sides." },
  { name: "Psionic Reach", klass: "storm_caster", stat: "range", amount: 1.05, text: "Caster pressure starts earlier." },
  { name: "Better Pickaxes", klass: "worker", stat: "harvest", amount: 0.14, text: "A safer economy comes online sooner." },
  { name: "Cheap Contracts", klass: "all", stat: "cost", amount: -0.08, text: "Every production wave stretches farther." },
  { name: "War Treasury", klass: "all", stat: "mana", amount: 35, text: "A reserve for a brutal opening." },
  { name: "Base Guns", klass: "all", stat: "defense", amount: 1, text: "Expansions can buy time." },
  { name: "Hardier Army", klass: "all", stat: "hp", amount: 0.10, text: "Your whole army takes a better hit." },
  { name: "Combined Arms", klass: "all", stat: "damage", amount: 0.10, text: "Mixed armies are rewarded." },
];

const storyBeats = [
  {
    name: "Ash Crossing",
    region: "Outer Line",
    scenario: 2,
    difficulty: 2,
    text: "Blue scouts have found the old bridge town. Take the crossing before their workers turn it into a fortress.",
    threat: "Light economy",
  },
  {
    name: "Glass Flats",
    region: "Outer Line",
    scenario: 0,
    difficulty: 3,
    text: "A wide mineral plain sits undefended. It will belong to whoever expands with enough nerve to hold it.",
    threat: "Greedy macro",
  },
  {
    name: "The Broken Pump",
    region: "Outer Line",
    scenario: 4,
    difficulty: 3,
    text: "Enemy raiders circle the wells. Keep your workers alive and punish the route they keep taking home.",
    threat: "Worker harass",
  },
  {
    name: "Knife Ridge",
    region: "Red March",
    scenario: 1,
    difficulty: 4,
    text: "The ridge is narrow, the first push is early, and retreating gives blue the natural for free.",
    threat: "Fast pressure",
  },
  {
    name: "Citadel Wake",
    region: "Red March",
    scenario: 8,
    difficulty: 5,
    boss: true,
    text: "The first citadel has lit its tower guns. Break it before the line behind it wakes up.",
    threat: "Fortified base",
  },
  {
    name: "Green Channel",
    region: "Red March",
    scenario: 0,
    difficulty: 5,
    text: "A clean lane cuts through the center. Whoever controls it can punish every expansion.",
    threat: "Map control",
  },
  {
    name: "Foundry Steps",
    region: "Red March",
    scenario: 5,
    difficulty: 6,
    text: "Blue is dragging siege parts through the old factory. Hit the setup timing or live under its range.",
    threat: "Siege timing",
  },
  {
    name: "Silent Natural",
    region: "Deep Claim",
    scenario: 4,
    difficulty: 6,
    text: "The nearest expansion looks free. It is not. Take it anyway, then make the counterattack expensive.",
    threat: "Expansion trap",
  },
  {
    name: "Furnace Gate",
    region: "Deep Claim",
    scenario: 6,
    difficulty: 7,
    text: "There is only one clean push lane. Let blue hold it too long and every fight becomes theirs.",
    threat: "Choke control",
  },
  {
    name: "Blue Crown",
    region: "Deep Claim",
    scenario: 9,
    difficulty: 8,
    boss: true,
    text: "Their command core is overbuilt and overconfident. Crack a worker line before you test the walls.",
    threat: "Heavy defense",
  },
  {
    name: "Salt Circuit",
    region: "Last Rail",
    scenario: 1,
    difficulty: 8,
    text: "The fight starts fast and keeps moving. The first bad army split will become a rout.",
    threat: "Mobile attack",
  },
  {
    name: "North Array",
    region: "Last Rail",
    scenario: 7,
    difficulty: 9,
    text: "Every expansion is visible from the center. Feint, expand, then punish the response.",
    threat: "Reactive bot",
  },
  {
    name: "Iron Orchard",
    region: "Last Rail",
    scenario: 5,
    difficulty: 9,
    text: "The minerals are rich and far apart. If you over-macro without cover, blue will harvest your workers instead.",
    threat: "Long map",
  },
  {
    name: "The Black Span",
    region: "Last Rail",
    scenario: 9,
    difficulty: 10,
    text: "Blue has learned to wait until you are stretched thin. Make the final expansion a trap.",
    threat: "Punish timing",
  },
  {
    name: "Last Command",
    region: "Core",
    scenario: 9,
    difficulty: 10,
    boss: true,
    text: "The last base is not brave. It is rich, defended, and patient. Deny its workers and end the run.",
    threat: "Final fortress",
  },
];

const events = [
  { name: "Abandoned Foundry", choices: [["Steel", ["Combined Arms"]], ["Sell", ["War Treasury"]]] },
  { name: "Siege Yard", choices: [["Optics", ["Siege Optics"]], ["Cannons", ["Stabilized Cannons"]]] },
  { name: "Old Academy", choices: [["Storm", ["Storm Conductors"]], ["Matrix", ["Matrix Batteries"]]] },
  { name: "Miner Strike", choices: [["Tools", ["Better Pickaxes"]], ["Guards", ["Base Guns"]]] },
];

let run = loadRun();

function newRun() {
  return {
    hp: 80,
    maxHp: 80,
    floor: 0,
    seed: Math.floor(Math.random() * 1000000),
    upgrades: [],
    awaitingReport: false,
    log: ["The convoy reaches the outer line."],
  };
}

function loadRun() {
  try {
    const saved = JSON.parse(sessionStorage.getItem("simsystem_campaign_run") || "null");
    if (saved && Number.isFinite(saved.floor)) return { ...newRun(), ...saved };
  } catch {
    // Corrupt session data should never block the campaign wrapper.
  }
  return newRun();
}

function saveRun() {
  sessionStorage.setItem("simsystem_campaign_run", JSON.stringify(run));
}

function rng(seed) {
  let x = seed >>> 0;
  return () => ((x = Math.imul(1664525, x) + 1013904223 >>> 0) / 4294967296);
}

const campaignStarterUnits = ["warrior", "archer", "bomber", "vulture", "skirmisher"];
const campaignLateUnits = ["siege", "medic", "matrix", "storm"];
const campaignUnitNames = {
  worker: "Worker",
  warrior: "Warrior",
  archer: "Archer",
  bomber: "Bomber",
  siege: "Siege",
  vulture: "Vulture",
  medic: "Medic",
  matrix: "Matrix",
  storm: "Storm",
  skirmisher: "Skirmisher",
};

function shuffled(seed, items) {
  const out = [...items];
  const random = rng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function campaignUnitOrder(seed) {
  return [...shuffled(seed + 17, campaignStarterUnits), ...shuffled(seed + 991, campaignLateUnits)];
}

function campaignUnlockedUnits(state = run) {
  const order = campaignUnitOrder(state.seed);
  const combatSlots = Math.min(order.length, 3 + Math.floor(state.floor / 2));
  return ["worker", ...order.slice(0, combatSlots)];
}

function currentBeat() {
  return storyBeats[Math.min(run.floor, storyBeats.length - 1)];
}

function upgradeByName(name) {
  return upgradePool.find((u) => u.name === name);
}

function modelValue(upgrade) {
  const base = upgrade.klass === "all" ? 42 : upgrade.klass === "worker" ? 26 : upgrade.klass === "siege" ? 54 : 34;
  if (upgrade.stat === "mana") return upgrade.amount * 0.45;
  if (upgrade.stat === "defense") return 18 * upgrade.amount;
  if (upgrade.stat === "cost") return base * Math.abs(upgrade.amount) * 1.20;
  if (upgrade.stat === "hp") return base * upgrade.amount * 1.25;
  if (upgrade.stat === "range") return base * upgrade.amount * 0.22;
  return base * upgrade.amount * 0.62;
}

function offerUpgrades(count = 3) {
  const random = rng(run.seed + run.floor * 991);
  const owned = new Set(run.upgrades.map((u) => u.name));
  return upgradePool
    .filter((u) => !owned.has(u.name))
    .map((u) => ({ ...u, modelValue: Number(modelValue(u).toFixed(1)) }))
    .sort((a, b) => Math.abs(a.modelValue - 24) - Math.abs(b.modelValue - 24) || random() - 0.5)
    .slice(0, count);
}

function eventChoices() {
  const event = events[(run.seed + run.floor * 7) % events.length];
  return event.choices.map(([label, rewards]) => ({
    label: `${event.name}: ${label}`,
    upgrades: rewards.map((reward) => upgradeByName(reward) || upgradePool.find((u) => u.name === "War Treasury")),
  }));
}

function rewardText(upgrade) {
  const sign = upgrade.amount > 0 ? "+" : "";
  if (upgrade.stat === "mana") return `Reserve ${sign}${upgrade.amount}`;
  if (upgrade.stat === "defense") return "Base guns";
  if (upgrade.stat === "cost") return `Costs ${Math.round(upgrade.amount * 100)}%`;
  return `${upgrade.klass} ${upgrade.stat} ${sign}${upgrade.amount}`;
}

function render() {
  const beat = currentBeat();
  missionKicker.textContent = `${beat.region} · Operation ${run.floor + 1}`;
  missionTitle.textContent = beat.name;
  missionText.textContent = beat.text;
  deploySubtext.textContent = beat.boss ? "Break the stronghold" : "Enter the battle";
  claimSectorButton?.classList.toggle("hidden", !run.awaitingReport);
  missionIntel.innerHTML = `
    <span>${beat.threat}</span>
    <span>Bot ${Math.min(10, beat.difficulty + (beat.boss ? 1 : 0))}</span>
    <span>Map ${beat.scenario}</span>
    <span>${campaignUnlockedUnits().length - 1} unit techs</span>
  `;

  statsEl.innerHTML = `
    <span>Integrity <strong>${run.hp}/${run.maxHp}</strong></span>
    <span>Sector <strong>${Math.min(run.floor + 1, storyBeats.length)}/${storyBeats.length}</strong></span>
    <span>Seed <strong>${run.seed}</strong></span>
  `;

  mapEl.innerHTML = storyBeats
    .map((beatNode, i) => {
      const state = i < run.floor ? "done" : i === run.floor ? "current" : beatNode.boss ? "boss" : "";
      return `<div class="route-node ${state}" data-node="${i}" title="${beatNode.name}">
        <span>${beatNode.boss ? "B" : i + 1}</span>
      </div>`;
    })
    .join("");

  deckEl.innerHTML = run.upgrades.length
    ? run.upgrades.slice(-4).map((u) => `<span>${u.name}</span>`).join("")
    : campaignUnlockedUnits().map((unit) => `<span>${campaignUnitNames[unit] || unit}</span>`).join("");

  logEl.innerHTML = run.log.slice(0, 3).map((l) => `<span>${l}</span>`).join("");
}

function showChoice() {
  const choices = run.floor > 0 && run.floor % 3 === 0
    ? eventChoices()
    : offerUpgrades(3).map((u) => ({ label: u.name, upgrades: [u] }));

  choiceEl.classList.remove("hidden");
  choiceEl.innerHTML = `
    <div class="draft-heading">
      <strong>Choose one reward</strong>
      <button id="closeDraft" type="button">Back</button>
    </div>
    <div class="draft-grid">
      ${choices.map((choice, i) => {
        const upgrade = choice.upgrades[0];
        return `<button class="draft-card" type="button" data-choice="${i}">
          <strong>${choice.label}</strong>
          <span>${upgrade.text || "The convoy adapts."}</span>
          <em>${choice.upgrades.map(rewardText).join(" · ")}</em>
        </button>`;
      }).join("")}
    </div>
  `;

  choiceEl.querySelector("#closeDraft").addEventListener("click", () => choiceEl.classList.add("hidden"));
  choiceEl.querySelectorAll("[data-choice]").forEach((button, i) => button.addEventListener("click", () => {
    const choice = choices[i];
    run.upgrades.push(...choice.upgrades);
    run.log.unshift(`Reward chosen: ${choice.label}`);
    saveRun();
    choiceEl.classList.add("hidden");
    render();
  }));
}

function launchBattle() {
  const beat = currentBeat();
  run.log.unshift(`Deployed to ${beat.name}`);
  saveRun();
  const params = new URLSearchParams({
    scenario: String(beat.scenario),
    difficulty: String(Math.min(10, beat.difficulty + (beat.boss ? 1 : 0))),
    seed: String(run.seed + run.floor * 17),
    campaign: "1",
    floor: String(run.floor + 1),
    unlocks: campaignUnlockedUnits().join(","),
    speed: "0.5",
  });
  run.awaitingReport = true;
  saveRun();
  window.location.href = `/play.html?${params.toString()}`;
}

function claimSector() {
  const beat = currentBeat();
  run.awaitingReport = false;
  run.floor = Math.min(storyBeats.length - 1, run.floor + 1);
  if (beat.boss) {
    run.maxHp += 8;
    run.hp = Math.min(run.maxHp, run.hp + 16);
  } else {
    run.hp = Math.min(run.maxHp, run.hp + 6);
  }
  run.log.unshift(`${beat.name} held.`);
  saveRun();
  choiceEl.classList.add("hidden");
  render();
}

function newRunAndRender() {
  run = newRun();
  saveRun();
  choiceEl.classList.add("hidden");
  render();
}

document.querySelector("#newRun")?.addEventListener("click", newRunAndRender);
document.querySelector("#startBattle")?.addEventListener("click", launchBattle);
document.querySelector("#draftMore")?.addEventListener("click", showChoice);
claimSectorButton?.addEventListener("click", claimSector);
missionStage?.classList.add("hidden");
render();
