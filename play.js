const canvas = document.querySelector("#arena");
let ctx = canvas.getContext("2d");
const statusEl = document.querySelector("#liveStatus");
const panelEl = document.querySelector("#livePanel");
const productionBar = document.querySelector("#productionBar");
const productionReadout = document.querySelector("#productionReadout");
const resourceHud = document.querySelector("#resourceHud");
const exportPlayLogButton = document.querySelector("#exportPlayLog");
const scenarioSelect = document.querySelector("#scenarioSelect");
const randomScenarioButton = document.querySelector("#randomScenario");
const speedSelect = document.querySelector("#speedSelect");
const difficultySelect = document.querySelector("#difficultySelect");
const readyButton = document.querySelector("#readyButton");
const soundButton = document.querySelector("#sound");
const resultBanner = document.querySelector("#resultBanner");
const lanStartGate = document.querySelector("#lanStartGate");
const tutorialCard = document.querySelector("#tutorialCard");
const tutorialTitle = document.querySelector("#tutorialTitle");
const tutorialBody = document.querySelector("#tutorialBody");
const tutorialNext = document.querySelector("#tutorialNext");
const tutorialHide = document.querySelector("#tutorialHide");

const teamColors = ["#f04d52", "#2e9cff", "#f2cf48", "#5bd37c"];
const teamNames = ["RED", "BLUE", "GOLD", "GREEN"];
const iso = { x: 0.92, y: 0.48, z: 0.58 };
const EXPANSION_COST = 100;
const unitStyle = {
  worker: { label: "$", fill: "#1fc971", mark: "#062112", role: "Mines and builds expansions. Avoid combat unless defending." },
  soldier: { label: "W", fill: "#e64b36", mark: "#260704", role: "Fast front line. Closes distance and pins fragile ranged units." },
  archer: { label: "A", fill: "#f1cf34", mark: "#281b03", role: "Long-range damage. Strong behind a screen, weak when surrounded." },
  bomber: { label: "B", fill: "#ff2f86", mark: "#fff2f7", role: "Burst trade unit. Punishes clumps and worker lines, but is expendable." },
  siege: { label: "S", fill: "#6f89a8", mark: "#071019", role: "Slow heavy artillery. Breaks buildings and dense armies from far away." },
  vulture: { label: "V", fill: "#18d6e8", mark: "#031a1d", role: "Raider. Pressures workers and drops temporary turret fire." },
  healer: { label: "+", fill: "#f7f2d8", mark: "#17683a", role: "Support. Keeps expensive units alive during extended fights." },
  matrix_caster: { label: "◇", fill: "#28e0b2", mark: "#06251f", role: "Defensive caster. Shields the key unit before a hard engage." },
  storm_caster: { label: "Ψ", fill: "#8c68ff", mark: "#10082f", role: "Area caster. Forces enemy armies and workers to move." },
  skirmisher: { label: "K", fill: "#b7f04a", mark: "#172306", role: "Mobile poke. Buys time, chases, and cleans up unsupported units." },
  turret: { label: "T", fill: "#ff9324", mark: "#251000", role: "Static defense. Protects bases and mineral lines." },
};
const classPalette = {
  soldier: { base: "#e64b36", hi: "#ff9a6f", lo: "#741b14", stroke: "#ffd3bf", mark: "#260704", label: "W" },
  archer: { base: "#f1cf34", hi: "#fff08c", lo: "#76580a", stroke: "#fff4a8", mark: "#281b03", label: "A" },
  worker: { base: "#1fc971", hi: "#8df0ae", lo: "#0b5b33", stroke: "#c9ffda", mark: "#062112", label: "$" },
  bomber: { base: "#ff2f86", hi: "#ff92c0", lo: "#7b0b40", stroke: "#ffd0e4", mark: "#fff2f7", label: "B" },
  siege: { base: "#6f89a8", hi: "#dcecff", lo: "#253447", stroke: "#e7f2ff", mark: "#071019", label: "S" },
  vulture: { base: "#18d6e8", hi: "#a9fbff", lo: "#075867", stroke: "#cfffff", mark: "#031a1d", label: "V" },
  healer: { base: "#f7f2d8", hi: "#ffffff", lo: "#7d9f76", stroke: "#fffbe7", mark: "#17683a", label: "+" },
  matrix_caster: { base: "#28e0b2", hi: "#b9fff0", lo: "#075c4d", stroke: "#d2fff7", mark: "#06251f", label: "◇" },
  storm_caster: { base: "#8c68ff", hi: "#dfd6ff", lo: "#261a82", stroke: "#ede8ff", mark: "#10082f", label: "Ψ" },
  skirmisher: { base: "#b7f04a", hi: "#e7ff9b", lo: "#42640d", stroke: "#efffba", mark: "#172306", label: "K" },
  turret: { base: "#ff9324", hi: "#ffd17e", lo: "#7b3a02", stroke: "#ffdfaa", mark: "#251000", label: "T" },
};
const productionUnits = [
  { key: "q", unit: "worker", classKey: "worker", label: "Worker", cardId: 3, cost: 20, materialCost: 4, good: "economy", weak: "raids" },
  { key: "w", unit: "warrior", classKey: "soldier", label: "Warrior", cardId: 1, cost: 32, materialCost: 5, good: "archers, casters", weak: "bombers, siege" },
  { key: "e", unit: "archer", classKey: "archer", label: "Archer", cardId: 2, cost: 28, materialCost: 5, good: "warriors at range", weak: "surrounds, raids" },
  { key: "r", unit: "bomber", classKey: "bomber", label: "Bomber", cardId: 4, cost: 40, materialCost: 6, good: "clumps, workers", weak: "focus fire" },
  { key: "t", unit: "siege", classKey: "siege", label: "Siege", cardId: 5, cost: 104, materialCost: 12, good: "bases, deathballs", weak: "flanks" },
  { key: "y", unit: "vulture", classKey: "vulture", label: "Vulture", cardId: 6, cost: 48, materialCost: 6, good: "harass", weak: "front fights" },
  { key: "o", unit: "storm", classKey: "storm_caster", label: "Storm", cardId: 10, cost: 60, materialCost: 8, good: "areas, workers", weak: "dives" },
  { key: "p", unit: "skirmisher", classKey: "skirmisher", label: "Skirmisher", cardId: 11, cost: 40, materialCost: 6, good: "poke, chase", weak: "hard engages" },
];
const productionByUnitName = new Map(productionUnits.map((item) => [item.unit, item]));
const productionByCardId = new Map(productionUnits.map((item) => [item.cardId, item]));
const supplyCostByClass = {
  worker: 1.0,
  soldier: 1.0,
  archer: 1.0,
  bomber: 0.8,
  siege: 3.0,
  vulture: 2.1,
  storm_caster: 2.0,
  skirmisher: 1.2,
};
const scenarios = [
  { id: 0, name: "Map 1", brief: "", objective: "" },
  { id: 1, name: "Map 2", brief: "", objective: "" },
  { id: 2, name: "Map 3", brief: "", objective: "" },
  { id: 3, name: "Map 4", brief: "", objective: "" },
  { id: 4, name: "Map 5", brief: "", objective: "" },
  { id: 5, name: "Map 6", brief: "", objective: "" },
  { id: 6, name: "Map 7", brief: "", objective: "" },
  { id: 7, name: "Map 8", brief: "", objective: "" },
  { id: 8, name: "Map 9", brief: "", objective: "" },
  { id: 9, name: "Map 10", brief: "", objective: "" },
];
const audioProbe = document.createElement("audio");
const soundFiles = {
  melee: ["assets/audio/rts_fps_pack/hit_1.wav", "assets/audio/rts_fps_pack/hit_2.wav", "assets/audio/rts_fps_pack/hit_3.wav"],
  hit: ["assets/audio/rts_fps_pack/hit_4.wav", "assets/audio/rts_fps_pack/hit_5.wav", "assets/audio/rts_fps_pack/hit_1a.wav"],
  shot: ["assets/audio/rts_fps_pack/shot_2.wav", "assets/audio/rts_fps_pack/shot_3.wav", "assets/audio/rts_fps_pack/shot_7.wav", "assets/audio/rts_fps_pack/shot_10.wav"],
  ability: ["assets/audio/rts_fps_pack/explosion_4.wav", "assets/audio/rts_fps_pack/explosion_5.wav", "assets/audio/rts_fps_pack/explosion_9.wav", "assets/audio/rts_fps_pack/explosion_11.wav"],
  economy: ["assets/audio/rts_fps_pack/misc_1.wav", "assets/audio/rts_fps_pack/misc_2.wav"],
  spawn: ["assets/audio/rts_fps_pack/shot_11.wav", "assets/audio/rts_fps_pack/misc_2.wav"],
  power: ["assets/audio/rts_fps_pack/rocket-engine_1.wav", "assets/audio/rts_fps_pack/explosion_1.wav"],
};
const musicFile = playableAudioSource(["assets/audio/rts_theme.ogg", "assets/audio/theme.ogg", "assets/audio/theme.wav"]);
const chosenSoundFiles = Object.fromEntries(Object.entries(soundFiles).map(([key, sources]) => [key, playableAudioSources(sources)]));
const soundPools = new Map(Object.entries(chosenSoundFiles).map(([key, sources]) => [
  key,
  sources.flatMap((src) => Array.from({ length: key === "hit" || key === "shot" ? 2 : 1 }, () => {
    const audio = new Audio(src);
    audio.preload = "auto";
    return audio;
  })),
]));
const soundCooldowns = new Map();
const heardAudioEffects = new Map();
const heardAudioEvents = new Map();
const tutorialSteps = [
  {
    title: "Select workers",
    body: "Drag a box around your yellow workers or click one worker.",
    done: () => selectedWorkers().length > 0,
  },
  {
    title: "Take an expansion",
    body: "Click a gray expansion building. The nearest worker will claim it.",
    done: () => (snap?.buildings || []).some((b) => b.owner === controlledPlayer() && b.kind === "expansion"),
  },
  {
    title: "Produce an army",
    body: "Use Q through P to build units. Try Warrior, Archer, Siege, and Storm.",
    done: () => (snap?.units || []).filter((u) => u.owner === controlledPlayer() && u.class !== "worker").length >= 4,
  },
  {
    title: "Attack-move",
    body: "Select combat units and right-click toward the enemy base. Hold Control while clicking for a pure move.",
    done: () => lastPlayerAction === "attack_move",
  },
  {
    title: "Win condition",
    body: "Destroy all enemy buildings. Use expansions to keep production ahead.",
    done: () => (snap?.buildings || []).filter((b) => b.owner !== controlledPlayer() && b.owner >= 0 && b.alive).length === 0,
  },
];
const bounds = 190;
const urlParams = new URLSearchParams(window.location.search);
const relayPort = "8790";
const lanMode = urlParams.get("mode") === "lan";
const campaignMode = urlParams.get("campaign") === "1";
const lanPlayer = Math.max(0, Math.min(3, Number(urlParams.get("player") || 0)));
const lanToken = urlParams.get("token") || "";
const botAdminConfig = readBotAdminConfig();
const unlockedUnits = parseUnlockedUnits();
document.body.classList.toggle("campaign-mode", campaignMode);
if (campaignMode) {
  const floor = Number(urlParams.get("floor") || 1);
  const brand = document.querySelector(".live-toolbar .brand");
  const homeLink = document.querySelector(".home-link");
  document.title = `Frontier Run ${floor}`;
  if (brand) brand.textContent = `Frontier Run ${floor}`;
  if (homeLink) {
    homeLink.href = "roguelike.html";
    homeLink.textContent = "Run";
  }
}

let Module = null;
let wasm = {};
let snap = null;
const unitVisuals = new Map();
const productionButtons = new Map();
const displayUnitsScratch = [];
const drawThingsScratch = [];
let selected = new Set();
let controlGroups = Array.from({ length: 10 }, () => new Set());
let camera = { x: 0, y: 0, zoom: 1.04 };
let groundCache = null;
let groundCacheKey = "";
let drag = null;
let rightClick = null;
const activePointers = new Map();
let pinchStart = null;
let suppressPointerUntil = 0;
let lastContextMenuOrderAt = 0;
let commandMarker = null;
let hoverBuildingId = -1;
let attackMode = false;
let expandMode = false;
let lastFrame = 0;
let fps = 0;
let animTime = 0;
let currentUnitTextAngle = 0;
let simMs = 0;
let simAccumulator = 0;
let lastStatusUpdateAt = 0;
let lastResultKey = "";
let playSpeed = Math.max(0.1, Math.min(3, Number(urlParams.get("speed") || speedSelect.value || 0.5)));
let seed = Math.max(1, Math.min(999999, Number(urlParams.get("seed") || botAdminConfig?.seed || Math.floor(Math.random() * 100000))));
let currentScenario = Math.max(0, Math.min(scenarios.length - 1, Number(urlParams.get("scenario") || botAdminConfig?.scenario || 0)));
let botDifficulty = Math.max(1, Math.min(10, Number(urlParams.get("difficulty") || botAdminConfig?.difficulty || difficultySelect?.value || 3)));
let lastPlayerAction = "";
let soundEnabled = false;
let audioUnlocked = false;
let audioContext = null;
let musicTrack = null;
let soundError = "";
let lastLiveAudioTick = -1;
let lastCommandSoundAt = -1e9;
let lastProductionNotice = null;
let tutorialStep = 0;
let tutorialVisible = false;
let lastPanelUpdateAt = 0;
let lastPanelKey = "";
const playLogStorageKey = "simsystem_live_play_log_v1";
const playLogArchiveStorageKey = "simsystem_live_play_log_archive_v1";
let playLog = null;
let lastLoggedSnapshotTick = -1;
let lan = {
  ready: false,
  started: false,
  seed,
  scenario: currentScenario,
  inputDelay: 8,
  tickRate: 30,
  serverTick: 0,
  receivedThrough: -1,
  packets: new Map(),
  seenCommands: new Set(),
  polling: false,
  lastPoll: 0,
  players: [],
  playerCount: 2,
  botMask: 0,
  visualDelay: 14,
  checksumEvery: 360,
  lastSnapshotReport: 0,
  lastLobbyPoll: 0,
  desyncs: [],
  inviteUrls: [],
  captureDir: "",
  pendingSeatUrl: "",
  autoStartSent: false,
  autoRematchScheduled: false,
  apiOrigin: "",
  netError: "",
  lastPacketAt: 0,
  lastCommandTick: -1,
};

function controlledPlayer() {
  return lanMode ? lanPlayer : 0;
}

function parseUnlockedUnits() {
  const all = new Set(productionUnits.map((item) => item.unit));
  if (!campaignMode) return all;
  const requested = (urlParams.get("unlocks") || "")
    .split(",")
    .map((name) => name.trim())
    .filter((name) => productionByUnitName.has(name));
  const unlocked = new Set(["worker", ...requested]);
  if (unlocked.size <= 1) {
    unlocked.add("warrior");
    unlocked.add("archer");
    unlocked.add("vulture");
  }
  return unlocked;
}

function isUnitUnlocked(unit) {
  return !campaignMode || unlockedUnits.has(unit);
}

function readBotAdminConfig() {
  const parse = (value) => {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      try {
        return JSON.parse(decodeURIComponent(value));
      } catch {
        return null;
      }
    }
  };
  return normalizeBotAdminConfig(
    parse(urlParams.get("botConfig")) ||
    decodeBase64Json(urlParams.get("botAdmin")) ||
    parse(localStorage.getItem("simsystem_bot_admin_config"))
  );
}

function normalizeBotAdminConfig(config) {
  if (!config) return null;
  const rules = Array.isArray(config.reactionRules)
    ? config.reactionRules
    : Array.isArray(config.rules)
      ? config.rules.map((rule) => ({ trigger: rule.when, threshold: rule.weight, prefer: rule.prefer }))
      : [];
  return {
    ...config,
    targetWorkers: config.targetWorkers ?? config.workerTarget,
    buildTimeScale: Math.max(0.15, Math.min(6.0, (config.buildTimeScale ?? config.buildTimePercent ?? 1.0))),
    expansionAggression: config.expansionAggression ?? config.expandBias,
    aggressionThreshold: config.aggressionThreshold ?? config.attackThreshold,
    counterPreferences: Array.isArray(config.counterPreferences) ? config.counterPreferences : [],
    reactionRules: rules,
  };
}

function botAdminSummaryHtml() {
  if (!botAdminConfig || lanMode) return "";
  const rules = Array.isArray(botAdminConfig.reactionRules) ? botAdminConfig.reactionRules : [];
  const preferences = Array.isArray(botAdminConfig.counterPreferences) ? botAdminConfig.counterPreferences : [];
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[ch]));
  const label = (value) => escapeHtml(String(value || "").replaceAll("_", " "));
  const ruleText = rules.length
    ? rules.slice(0, 4).map((rule) => `<li>if ${label(rule.trigger)} >= ${Number(rule.threshold) || "?"}, prefer ${label(rule.prefer)}</li>`).join("")
    : "<li>no reaction rules</li>";
  return `<div class="bot-admin-summary">
    <strong>Bot admin policy</strong>
    <div class="muted">Difficulty ${botDifficulty} is active. Remaining policy fields are saved for engine integration.</div>
      <dl>
        <div><dt>Workers</dt><dd>${escapeHtml(botAdminConfig.targetWorkers ?? "default")}</dd></div>
      <div><dt>Build Time</dt><dd>${Math.round((Number(botAdminConfig.buildTimeScale) || 1.0) * 100)}%</dd></div>
      <div><dt>Expand</dt><dd>${escapeHtml(botAdminConfig.expansionAggression ?? "default")}</dd></div>
      <div><dt>Attack</dt><dd>${escapeHtml(botAdminConfig.aggressionThreshold ?? "default")}</dd></div>
    </dl>
    <div class="admin-policy-tags">${preferences.map((item) => `<span>${label(item)}</span>`).join("") || "<span>default counters</span>"}</div>
    <ul>${ruleText}</ul>
  </div>`;
}

function hasBotOpponent() {
  return lan.players.some((p) => p.id !== controlledPlayer() && p.bot) ||
    Array.from({ length: Math.max(2, lan.playerCount || 2) }, (_, i) => i)
      .some((id) => id !== controlledPlayer() && Boolean(lan.botMask & (1 << id)));
}

function playableAudioSource(sources) {
  for (const source of sources) {
    if (source.endsWith(".ogg") && audioProbe.canPlayType("audio/ogg; codecs=vorbis")) return source;
    if (source.endsWith(".wav") && audioProbe.canPlayType("audio/wav")) return source;
  }
  return sources[sources.length - 1];
}

function playableAudioSources(sources) {
  return sources.filter((source) => {
    if (source.endsWith(".ogg")) return Boolean(audioProbe.canPlayType("audio/ogg; codecs=vorbis"));
    if (source.endsWith(".wav")) return Boolean(audioProbe.canPlayType("audio/wav"));
    return true;
  });
}

async function toggleSound() {
  soundEnabled = !soundEnabled;
  soundButton?.classList.toggle("enabled", soundEnabled);
  if (soundButton) soundButton.textContent = soundEnabled ? "Audio on" : "Enable audio";
  if (!soundEnabled) {
    stopMusic();
    soundError = "";
    return;
  }
  const unlocked = await unlockAudioFromGesture();
  if (!unlocked) {
    soundEnabled = false;
    soundButton?.classList.remove("enabled");
    if (soundButton) soundButton.textContent = "Enable audio";
    return;
  }
  primeSounds();
  startMusic();
  playSound("power", 0.72, true);
  lastLiveAudioTick = snap?.tick ?? -1;
}

async function unlockAudioFromGesture() {
  if (audioUnlocked) return true;
  const source = chosenSoundFiles.power?.[0] || musicFile;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioContext ??= new AudioCtx();
      await audioContext.resume();
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      gain.gain.value = 0.0001;
      osc.frequency.value = 220;
      osc.connect(gain).connect(audioContext.destination);
      osc.start();
      osc.stop(audioContext.currentTime + 0.025);
    }
    const unlock = new Audio(source);
    unlock.volume = 0.001;
    await unlock.play();
    unlock.pause();
    unlock.currentTime = 0;
    audioUnlocked = true;
    soundError = "";
    return true;
  } catch (error) {
    soundError = error?.name || "audio blocked";
    statusEl.textContent = `${soundError} · click Enable audio`;
    return false;
  }
}

function primeSounds() {
  for (const pool of soundPools.values()) {
    for (const audio of pool) audio.load();
  }
}

function startMusic() {
  if (!soundEnabled || !audioUnlocked || !musicFile) return;
  musicTrack ??= new Audio(musicFile);
  musicTrack.loop = true;
  musicTrack.volume = 0.14;
  musicTrack.play().catch((error) => {
    soundError = error?.name || "audio blocked";
  });
}

function stopMusic() {
  if (musicTrack) musicTrack.pause();
}

function playLiveAudio() {
  if (!soundEnabled || !audioUnlocked || !snap || snap.tick === lastLiveAudioTick) return;
  const tickNow = snap.tick ?? 0;
  if (tickNow < lastLiveAudioTick) {
    lastLiveAudioTick = tickNow;
    soundCooldowns.clear();
    heardAudioEffects.clear();
    heardAudioEvents.clear();
    return;
  }
  lastLiveAudioTick = tickNow;
  pruneAudioMemory(tickNow);
  let played = 0;
  for (const effect of snap.effects ?? []) {
    if (played >= 2) break;
    if (!firstAudioOccurrence(heardAudioEffects, effect, tickNow)) continue;
    const key = soundForEffect(effect.kind);
    if (!key || !canPlaySound(key, tickNow)) continue;
    playSound(key, volumeForEffect(effect.kind));
    played++;
  }
  for (const event of snap.events ?? []) {
    if (played >= 4) break;
    if (!firstAudioOccurrence(heardAudioEvents, event, tickNow)) continue;
    const key = soundForEvent(event.kind);
    if (!key || !canPlaySound(key, tickNow)) continue;
    playSound(key, key === "melee" ? 0.42 : 0.32);
    played++;
  }
}

function soundForEffect(kind) {
  if (kind === "explode" || kind === "siege_blast" || kind === "psionic_storm" || kind === "disrupt" || kind === "collapse") return "ability";
  if (kind === "volley") return "shot";
  if (kind === "charge") return "hit";
  if (kind === "deploy_turret" || kind === "base_upgrade" || kind === "defense_matrix") return "power";
  return null;
}

function soundForEvent(kind) {
  if (kind === "arrow" || kind === "shot" || kind === "tower") return "shot";
  if (kind === "melee" || kind === "slash" || kind === "attack") return "melee";
  if (kind === "siege" || kind === "storm" || kind === "explode") return "ability";
  return null;
}

function volumeForEffect(kind) {
  if (kind === "explode" || kind === "siege_blast" || kind === "psionic_storm") return 0.48;
  return 0.32;
}

function canPlaySound(key, tickNow) {
  const minGap = key === "hit" || key === "shot" ? 42 : key === "economy" ? 240 : key === "power" ? 150 : 72;
  const last = soundCooldowns.get(key) ?? -1e9;
  if (tickNow - last < minGap) return false;
  soundCooldowns.set(key, tickNow);
  return true;
}

function firstAudioOccurrence(seen, item, tickNow) {
  const expires = Number(item.expires_tick ?? tickNow);
  if (expires < tickNow) return false;
  const x = Number(item.x ?? item.to_x ?? item.from_x ?? 0).toFixed(1);
  const y = Number(item.y ?? item.to_y ?? item.from_y ?? 0).toFixed(1);
  const key = `${item.kind}:${item.owner}:${x}:${y}:${expires}`;
  if (seen.has(key)) return false;
  seen.set(key, expires);
  return true;
}

function pruneAudioMemory(tickNow) {
  for (const seen of [heardAudioEffects, heardAudioEvents]) {
    if (seen.size < 1200) continue;
    for (const [key, expires] of seen) {
      if (expires < tickNow - 120) seen.delete(key);
    }
    if (seen.size > 1800) seen.clear();
  }
}

function playSound(key, volume = 0.38, force = false) {
  if (!audioUnlocked) return;
  const pool = soundPools.get(key);
  if (!pool) return;
  const audio = pool.find((candidate) => candidate.paused || candidate.ended) ?? pool[0];
  audio.pause();
  audio.currentTime = 0;
  audio.volume = volume;
  audio.play().catch((error) => {
    soundError = error?.name || "audio blocked";
    if (force) statusEl.textContent = soundError;
  });
}

function selectedUnitsForAudio(ids = selected) {
  const idSet = new Set(ids);
  return (snap?.units || []).filter((u) => idSet.has(u.id) && u.owner === controlledPlayer() && u.alive !== false);
}

function majorityClass(units) {
  if (!units.length) return "worker";
  const counts = new Map();
  let best = units[0].class || "worker";
  for (const u of units) {
    const cls = u.class || "worker";
    const next = (counts.get(cls) || 0) + 1;
    counts.set(cls, next);
    if (next > (counts.get(best) || 0)) best = cls;
  }
  return best;
}

function commandSoundKeyForClass(classKey, commandType) {
  if (commandType === "produce") return "spawn";
  if (commandType === "expand" || commandType === "gather") return "economy";
  if (classKey === "worker") return "economy";
  if (classKey === "soldier") return "melee";
  if (classKey === "archer" || classKey === "vulture" || classKey === "skirmisher") return "shot";
  if (classKey === "siege" || classKey === "bomber" || classKey === "storm_caster") return "ability";
  if (classKey === "healer" || classKey === "matrix_caster" || classKey === "turret") return "power";
  return "hit";
}

function playCommandSound(commandType, unitIds = selected) {
  if (!soundEnabled || !audioUnlocked || !snap) return;
  const tickNow = snap.tick ?? 0;
  if (tickNow - lastCommandSoundAt < 8) return;
  const key = commandSoundKeyForClass(majorityClass(selectedUnitsForAudio(unitIds)), commandType);
  if (!key) return;
  lastCommandSoundAt = tickNow;
  playSound(key, commandType === "produce" ? 0.24 : 0.30, true);
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const w = Math.max(640, Math.floor(rect.width * ratio));
  const h = Math.max(420, Math.floor(rect.height * ratio));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    groundCacheKey = "";
  }
}

function scale() {
  return Math.min(canvas.width * 0.92, canvas.height * 0.92) * 0.58 * camera.zoom / bounds;
}

function center() {
  return { x: canvas.width * (canvas.width > 1100 ? 0.45 : 0.50), y: canvas.height * 0.53 };
}

function worldToScreen(x, y, z = 0) {
  const c = center();
  const s = scale();
  const dx = x - camera.x;
  const dy = y - camera.y;
  return {
    x: c.x + (dx - dy) * s * iso.x,
    y: c.y + (dx + dy) * s * iso.y - z * s * iso.z,
  };
}

function screenToWorld(x, y) {
  const c = center();
  const s = scale();
  const sx = (x - c.x) / Math.max(1, s * iso.x);
  const sy = (y - c.y) / Math.max(1, s * iso.y);
  return {
    x: camera.x + (sx + sy) * 0.5,
    y: camera.y + (sy - sx) * 0.5,
  };
}

function clampZoom(value) {
  return Math.max(0.62, Math.min(2.25, value));
}

function setZoomAroundScreenPoint(nextZoom, point) {
  const before = screenToWorld(point.x, point.y);
  camera.zoom = clampZoom(nextZoom);
  const after = screenToWorld(point.x, point.y);
  camera.x += before.x - after.x;
  camera.y += before.y - after.y;
  groundCacheKey = "";
}

function panCameraFromDrag(dragState, point) {
  const prior = { ...camera };
  camera.x = dragState.camera.x;
  camera.y = dragState.camera.y;
  camera.zoom = dragState.camera.zoom;
  const startWorld = screenToWorld(dragState.x, dragState.y);
  const currentWorld = screenToWorld(point.x, point.y);
  camera.x = dragState.camera.x - (currentWorld.x - startWorld.x);
  camera.y = dragState.camera.y - (currentWorld.y - startWorld.y);
  camera.zoom = prior.zoom;
  groundCacheKey = "";
}

function pointerDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointerMidpoint(a, b) {
  return { x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5 };
}

function beginPinchIfNeeded() {
  if (activePointers.size < 2) return false;
  const [a, b] = [...activePointers.values()].slice(0, 2);
  pinchStart = {
    distance: Math.max(1, pointerDistance(a, b)),
    zoom: camera.zoom,
    midpoint: pointerMidpoint(a, b),
  };
  drag = null;
  rightClick = null;
  return true;
}

function ptrJson(ptr) {
  const text = Module.UTF8ToString(ptr);
  wasm.free(ptr);
  return JSON.parse(text);
}

function initPlayLog() {
  archiveExistingPlayLog();
  playLog = {
    version: 1,
    started_at: new Date().toISOString(),
    url: window.location.href,
    seed,
    scenario: currentScenario,
    botDifficulty,
    controlledPlayer: controlledPlayer(),
    entries: [],
  };
  lastLoggedSnapshotTick = -1;
  persistPlayLog();
}

function archiveExistingPlayLog() {
  try {
    const existing = JSON.parse(localStorage.getItem(playLogStorageKey) || "null");
    if (!existing?.entries?.length) return;
    const archive = JSON.parse(localStorage.getItem(playLogArchiveStorageKey) || "[]");
    archive.unshift(existing);
    localStorage.setItem(playLogArchiveStorageKey, JSON.stringify(archive.slice(0, 3)));
  } catch {
    // Debug logging must never break the game page.
  }
}

function playLogArchive() {
  try {
    return JSON.parse(localStorage.getItem(playLogArchiveStorageKey) || "[]");
  } catch {
    return [];
  }
}

function persistPlayLog() {
  if (!playLog) return;
  try {
    localStorage.setItem(playLogStorageKey, JSON.stringify(playLog));
  } catch {
    // Keep logging non-fatal. If storage is full, retain only the newest half.
    playLog.entries = playLog.entries.slice(Math.floor(playLog.entries.length / 2));
    try { localStorage.setItem(playLogStorageKey, JSON.stringify(playLog)); } catch {}
  }
}

function compactSnapshot(state = snap) {
  if (!state) return null;
  return {
    tick: state.tick,
    players: (state.players || []).map((p) => ({
      id: p.id,
      policy: p.policy,
      mana: p.mana,
      supply: p.active_supply,
      pending_supply: p.pending_supply,
      queued_supply: p.queued_supply,
      cap: p.supply_cap,
      queue_used: p.construction_queue_used,
      queue_cap: p.construction_queue_capacity,
      queue: p.production_queue,
      workers: (state.units || []).filter((u) => u.owner === p.id && u.class === "worker" && u.alive !== false).length,
      combat: (state.units || []).filter((u) => u.owner === p.id && u.class !== "worker" && u.alive !== false).length,
      buildings: (state.buildings || []).filter((b) => b.owner === p.id && b.alive !== false).length,
    })),
    selected: [...selected],
    units: (state.units || []).filter((u) => u.alive !== false).map((u) => ({
      id: u.id, owner: u.owner, class: u.class, x: u.x, y: u.y, hp: u.hp,
      target_x: u.target_x, target_y: u.target_y, focus_reason: u.focus_reason,
    })),
    buildings: (state.buildings || []).filter((b) => b.alive !== false).map((b) => ({
      id: b.id, owner: b.owner, kind: b.kind, x: b.x, y: b.y, hp: b.hp, max_hp: b.max_hp,
    })),
  };
}

function appendPlayLog(type, data = {}) {
  if (!playLog) initPlayLog();
  playLog.entries.push({
    wall_ms: Math.round(performance.now()),
    tick: snap?.tick ?? -1,
    type,
    ...data,
  });
  if (playLog.entries.length > 900) {
    playLog.entries.splice(0, playLog.entries.length - 900);
  }
  persistPlayLog();
}

function logStateDelta(before, after, cause) {
  if (!before || !after) return;
  const afterUnits = new Map((after.units || []).map((u) => [u.id, u]));
  for (const u of before.units || []) {
    const next = afterUnits.get(u.id);
    if (u.alive !== false && (!next || next.alive === false)) {
      appendPlayLog("unit_lost", { cause, unit: { id: u.id, owner: u.owner, class: u.class, x: u.x, y: u.y, hp: u.hp } });
    } else if (next && Number(next.hp) + 0.001 < Number(u.hp)) {
      appendPlayLog("unit_damaged", { cause, unit_id: u.id, owner: u.owner, class: u.class, hp_before: u.hp, hp_after: next.hp });
    }
  }
  const afterBuildings = new Map((after.buildings || []).map((b) => [b.id, b]));
  for (const b of before.buildings || []) {
    const next = afterBuildings.get(b.id);
    if (b.alive !== false && (!next || next.alive === false)) {
      appendPlayLog("building_lost", { cause, building: { id: b.id, owner: b.owner, kind: b.kind, x: b.x, y: b.y, hp: b.hp } });
    } else if (next && b.owner >= 0 && Number(next.hp) + 0.001 < Number(b.hp)) {
      appendPlayLog("building_damaged", { cause, building_id: b.id, owner: b.owner, hp_before: b.hp, hp_after: next.hp });
    }
  }
  const commandEvents = (after.events || []).filter((e) => e.kind || e.type).slice(-12);
  if (commandEvents.length && after.tick !== before.tick) {
    appendPlayLog("visual_events", { cause, events: commandEvents });
  }
  if ((after.tick ?? 0) >= lastLoggedSnapshotTick + 180) {
    appendPlayLog("snapshot", { cause, snapshot: compactSnapshot(after) });
    lastLoggedSnapshotTick = after.tick ?? lastLoggedSnapshotTick;
  }
}

function exportPlayLog() {
  if (!playLog) initPlayLog();
  appendPlayLog("manual_export", { snapshot: compactSnapshot() });
  const payload = { current: playLog, archived: playLogArchive() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  link.href = url;
  link.download = `simsystem-play-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function relayOrigin() {
  if (window.location.protocol === "http:" || window.location.protocol === "https:") {
    const host = window.location.hostname || "127.0.0.1";
    return `${window.location.protocol}//${host}:${relayPort}`;
  }
  return `http://127.0.0.1:${relayPort}`;
}

async function lanApi(path, options = {}) {
  const origins = [];
  if (lan.apiOrigin) origins.push(lan.apiOrigin);
  if (window.location.protocol === "http:" || window.location.protocol === "https:") origins.push(window.location.origin);
  origins.push(relayOrigin());
  let lastError = null;
  for (const origin of [...new Set(origins)]) {
    const target = new URL(path, origin).toString();
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
        lan.apiOrigin = origin;
        lan.netError = "";
        return body;
      }
      lastError = new Error(body.error || `HTTP ${res.status}`);
      if (![404, 405, 501].includes(res.status)) break;
    } catch (err) {
      lastError = err;
    }
  }
  lan.netError = lastError?.message || `LAN relay unavailable on ${relayOrigin()}`;
  throw new Error(lan.netError);
}

function lanCommandKey(command) {
  if (Number.isFinite(Number(command?._seq))) return `seq:${command._seq}`;
  return `sig:${JSON.stringify([
    command?.player,
    command?.type,
    command?.tick ?? command?._targetTick ?? 0,
    command?.unit_ids || command?.ids || [],
    command?.target_unit_id ?? -1,
    command?.target_building_id ?? command?.building_id ?? -1,
    Math.round((command?.x ?? 0) * 100),
    Math.round((command?.y ?? 0) * 100),
    command?.unit || "",
  ])}`;
}

function send(command) {
  if (lanMode) {
    appendPlayLog("command", { command: { ...command }, lan: true, before: compactSnapshot() });
    sendLan(command);
    if (command.type) lastPlayerAction = command.type;
    return;
  }
  if (Number.isFinite(command.x)) command.x = Math.round(command.x * 1000) / 1000;
  if (Number.isFinite(command.y)) command.y = Math.round(command.y * 1000) / 1000;
  const before = snap;
  appendPlayLog("command", { command: { ...command }, before: compactSnapshot(before) });
  const json = JSON.stringify(command);
  const bytes = Module.lengthBytesUTF8(json) + 1;
  const ptr = Module._malloc(bytes);
  Module.stringToUTF8(json, ptr, bytes);
  snap = ptrJson(wasm.command(ptr));
  Module._free(ptr);
  logStateDelta(before, snap, `command:${command.type || "unknown"}`);
  appendPlayLog("command_result", { command: { ...command }, after: compactSnapshot() });
  if (command.type) lastPlayerAction = command.type;
}

async function sendLan(command) {
  if (!lanToken) return;
  const body = {
    token: lanToken,
    player: controlledPlayer(),
    command: { ...command, player: controlledPlayer() },
  };
  try {
    const state = await lanApi("/api/command", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    lan.lastCommandTick = Number(state.stampedTick ?? lan.lastCommandTick);
    ingestLanState(state);
  } catch (err) {
    statusEl.textContent = `LAN ${err.message}`;
  }
}

async function setLanReady(value) {
  if (!lanToken) return;
  try {
    const state = await lanApi("/api/ready", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: lanToken, player: controlledPlayer(), ready: value }),
    });
    ingestLanState(state);
  } catch (err) {
    statusEl.textContent = `LAN ${err.message}`;
  }
}

async function pollLan(force = false) {
  if (!lanMode || lan.polling) return;
  const now = performance.now();
  if (!force && now - lan.lastPoll < 65) return;
  lan.polling = true;
  lan.lastPoll = now;
  try {
    const from = Math.max(0, (snap?.tick ?? 0) + 1);
    ingestLanState(await lanApi(`/api/state?player=${controlledPlayer()}&token=${encodeURIComponent(lanToken)}&from=${from}`));
  } catch (err) {
    statusEl.textContent = `LAN ${err.message}`;
  } finally {
    lan.polling = false;
  }
}

async function pollLanLobby(force = false) {
  if (!lanMode) return;
  const now = performance.now();
  if (!force && now - lan.lastLobbyPoll < 3000) return;
  lan.lastLobbyPoll = now;
  try {
    const lobby = await lanApi("/api/lobby");
    lan.inviteUrls = lobby.urls || lan.inviteUrls;
    lan.captureDir = lobby.capture?.dir || "";
    const ownInvite = (lobby.urls || []).find((entry) => Number(entry.id) === controlledPlayer() && entry.url);
    if (ownInvite) {
      const current = new URL(window.location.href);
      const next = new URL(ownInvite.url, window.location.origin);
      if (current.searchParams.get("token") !== next.searchParams.get("token")) {
        lan.pendingSeatUrl = next.href;
      }
    }
  } catch {
    // Token-authenticated state is authoritative; lobby metadata is only UI sugar.
  }
}

function ingestLanState(state) {
  if (!state) return;
  const wasStarted = lan.started;
  const stateTick = Number(state.tick || 0);
  if (Number.isFinite(stateTick) && stateTick < lan.serverTick) {
    lan.packets.clear();
    lan.seenCommands.clear();
    lan.receivedThrough = -1;
  }
  lan.ready = Boolean(state.players?.[controlledPlayer()]?.ready);
  lan.started = Boolean(state.started);
  if (!lan.started) lan.autoRematchScheduled = false;
  lan.seed = Number(state.seed || lan.seed || seed);
  lan.scenario = Number(state.scenario || 0);
  lan.inputDelay = Number(state.inputDelay || lan.inputDelay || 8);
  lan.tickRate = Number(state.tickRate || lan.tickRate || 30);
  lan.playerCount = Math.max(2, Math.min(4, Number(state.playerCount || state.players?.length || lan.playerCount || 2)));
  lan.visualDelay = Math.max(lan.inputDelay + 6, 14);
  lan.botMask = Number(state.botMask || 0);
  lan.botDifficulty = Math.max(1, Math.min(10, Number(state.botDifficulty || botDifficulty || 1)));
  lan.serverTick = stateTick;
  lan.players = state.players || lan.players;
  lan.desyncs = state.desyncs || lan.desyncs || [];
  for (const packet of state.packets || []) {
    const tick = Number(packet.tick);
    if (!Number.isFinite(tick)) continue;
    const existing = lan.packets.get(tick) || [];
    for (const command of packet.commands || []) {
      const key = lanCommandKey(command);
      if (lan.seenCommands.has(key)) continue;
      lan.seenCommands.add(key);
      existing.push(command);
      lan.lastPacketAt = performance.now();
    }
    lan.packets.set(tick, existing);
    lan.receivedThrough = Math.max(lan.receivedThrough, Math.min(tick, lan.serverTick));
  }
  if (lan.seenCommands.size > 2000) lan.seenCommands = new Set([...lan.seenCommands].slice(-1000));
  updateLanChrome();
  const botOpponent = hasBotOpponent();
  if (botOpponent && !lan.ready && !lan.started && !lan.autoStartSent) {
    lan.autoStartSent = true;
    setTimeout(() => setLanReady(true), 0);
  }
  if (!wasStarted && lan.started) {
    lan.lastSnapshotReport = 0;
    setTimeout(() => reportLanSnapshot(true), 0);
  }
}

function updateLanChrome() {
  if (!lanMode) return;
  readyButton.classList.remove("hidden");
  readyButton.classList.toggle("ready", lan.ready);
  const botOpponent = hasBotOpponent();
  readyButton.textContent = lan.ready ? (botOpponent ? "Started" : "Unready") : (botOpponent ? "Start vs Bot" : "Ready");
  readyButton.disabled = botOpponent && lan.started;
  scenarioSelect.disabled = true;
  randomScenarioButton.disabled = true;
  speedSelect.disabled = true;
  difficultySelect.disabled = true;
  document.querySelector("#reset").disabled = false;
  currentScenario = lan.scenario;
  botDifficulty = lan.botDifficulty;
  scenarioSelect.value = String(currentScenario);
  difficultySelect.value = String(botDifficulty);
  updateLanStartGate();
}

function updateLanStartGate() {
  if (!lanStartGate) return;
  if (!lanMode || lan.started) {
    lanStartGate.classList.add("hidden");
    lanStartGate.innerHTML = "";
    return;
  }
  const own = lan.players.find((p) => p.id === controlledPlayer());
  const others = lan.players.filter((p) => p.id !== controlledPlayer());
  const firstOther = others[0];
  const openCount = others.filter((p) => !p.bot && !p.connected).length;
  const waitingCount = others.filter((p) => !p.bot && p.connected && !p.ready).length;
  const readyCount = others.filter((p) => p.bot || p.ready).length;
  const otherText = openCount ? `${openCount} open seat${openCount === 1 ? "" : "s"}`
                  : waitingCount ? `${waitingCount} player${waitingCount === 1 ? "" : "s"} not ready`
                  : `${readyCount} ready`;
  lanStartGate.classList.remove("hidden");
  lanStartGate.innerHTML = `
    <div class="lan-start-card">
      <strong>LAN Lobby</strong>
      <div class="muted">You are P${controlledPlayer()} · ${own?.ready ? "ready" : "not ready"} · ${otherText}</div>
      <button id="lanGateReady" type="button" class="${own?.ready ? "ready" : ""}">${own?.ready ? "Starting..." : firstOther?.bot ? "Start vs Bot" : "Ready / Start"}</button>
    </div>
  `;
  lanStartGate.querySelector("#lanGateReady")?.addEventListener("click", () => setLanReady(!lan.ready));
}

function applyJsonCommand(command) {
  const before = snap;
  appendPlayLog("remote_command", { command: { ...command }, before: compactSnapshot(before) });
  const json = JSON.stringify(command);
  const bytes = Module.lengthBytesUTF8(json) + 1;
  const ptr = Module._malloc(bytes);
  Module.stringToUTF8(json, ptr, bytes);
  snap = ptrJson(wasm.command(ptr));
  Module._free(ptr);
  logStateDelta(before, snap, `remote:${command.type || "unknown"}`);
}

function stepLanToServer() {
  if (!Module || !snap || !lan.started) return;
  const targetTick = Math.max(0, lan.serverTick - lan.visualDelay);
  let guard = 0;
  while (snap.tick < targetTick && guard++ < 24) {
    const nextTick = snap.tick + 1;
    const commands = lan.packets.get(nextTick) || [];
    for (const command of commands) applyJsonCommand(command);
    lan.packets.delete(nextTick);
    stepEngine(1);
    if (snap.tick > 0 && snap.tick % lan.checksumEvery === 0) reportLanChecksum();
  }
  reportLanSnapshot();
}

async function reportLanChecksum() {
  if (!lanToken || !snap) return;
  const checksum = simpleChecksum(snap);
  try {
    const state = await lanApi("/api/checksum", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: lanToken, player: controlledPlayer(), tick: snap.tick, checksum }),
    });
    ingestLanState(state);
  } catch {
    // Non-fatal: checksums are diagnostic and should not interrupt local play.
  }
}

async function reportLanSnapshot(force = false) {
  if (!lanMode || !lanToken || !snap || !lan.started) return;
  if (!lan.captureDir) return;
  const now = performance.now();
  if (!force && now - lan.lastSnapshotReport < 120) return;
  lan.lastSnapshotReport = now;
  try {
    await lanApi("/api/snapshot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token: lanToken,
        player: controlledPlayer(),
        tick: snap.tick,
        snapshot: snap,
      }),
    });
  } catch {
    // Capture is diagnostic only. Never let it interrupt live play.
  }
}

function simpleChecksum(state) {
  let hash = 2166136261;
  const mix = (value) => {
    hash ^= value & 0xff;
    hash = Math.imul(hash, 16777619) >>> 0;
  };
  mix(state.tick || 0);
  for (const u of state.units || []) {
    mix(u.id || 0);
    mix(u.owner || 0);
    mix(Math.round((u.x || 0) * 10));
    mix(Math.round((u.y || 0) * 10));
    mix(Math.round((u.hp || 0) * 10));
  }
  for (const b of state.buildings || []) {
    mix(b.id || 0);
    mix((b.owner ?? -1) + 2);
    mix(Math.round((b.hp || 0) * 10));
  }
  return hash.toString(16).padStart(8, "0");
}

function unitIconPoints(kind) {
  return {
    archer: "35,18 14,8 16,15 8,15 12,18 8,21 16,21 14,28",
    vulture: "36,18 17,12 8,15 13,18 8,21 17,24",
    siege: "9,10 30,10 30,26 9,26",
    worker: "10,10 28,10 28,28 10,28",
    matrix_caster: "8,18 14,10 27,10 34,18 27,26 14,26",
    storm_caster: "19,7 32,17 25,31 13,31 6,17",
    skirmisher: "34,18 19,9 10,15 15,18 10,21 19,27",
    soldier: "31,18 24,7 11,10 7,18 11,26 24,29",
    bomber: "19,5 23,13 32,12 26,19 30,28 20,24 12,31 12,21 5,15 15,13",
    healer: "19,6 30,14 30,23 19,31 8,23 8,14",
  }[kind] || "19,7 31,14 31,24 19,31 7,24 7,14";
}

function unitIconHtml(kind, size = 38) {
  const style = unitStyle[kind] || unitStyle.soldier;
  const palette = classPalette[kind] || classPalette.soldier;
  const points = unitIconPoints(kind);
  return `<svg class="unit-icon unit-icon-${kind}" viewBox="0 0 38 38" width="${size}" height="${size}" aria-hidden="true">
    <defs><linearGradient id="unitIconGloss-${kind}" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${palette.hi || style.fill}"></stop><stop offset="1" stop-color="${palette.lo || style.fill}"></stop></linearGradient></defs>
    <ellipse cx="19" cy="29.5" rx="13.5" ry="4.2" fill="rgba(0,0,0,0.34)"></ellipse>
    <polygon points="${points}" fill="${teamColors[0]}" opacity="0.30"></polygon>
    <polygon points="${points}" fill="${palette.base}" stroke="rgba(3,5,7,0.92)" stroke-width="3.2" stroke-linejoin="round"></polygon>
    <polygon points="${points}" fill="url(#unitIconGloss-${kind})" opacity="0.36"></polygon>
    <path d="M14 13 L25 11" stroke="${palette.hi || style.fill}" stroke-width="2" stroke-linecap="round" opacity="0.78"></path>
    <text x="19" y="22.5" text-anchor="middle" dominant-baseline="middle" fill="${palette.mark || style.mark}" font-size="11" font-weight="900">${style.label}</text>
  </svg>`;
}

function unitTooltip(unit) {
  const style = unitStyle[unit.classKey || unit] || unitStyle.soldier;
  const item = typeof unit === "object" ? unit : null;
  const name = item?.label || unit.replace("_", " ");
  const cost = item ? ` $${item.cost}.` : "";
  const matchup = item ? ` Good vs ${item.good}; weak vs ${item.weak}.` : "";
  return `${name}.${cost} ${style.role}${matchup}`.replace(/\s+/g, " ").trim();
}

function hasIdleProductionCapacity() {
  const me = controlledPlayer();
  const player = (snap?.players || []).find((p) => p.id === me);
  if (player) {
    const used = Number(player.construction_queue_used ?? (player.production_queue || []).length);
    const capacity = Number(player.construction_queue_capacity ?? 3);
    return used < capacity;
  }
  const queued = (snap?.players || []).find((p) => p.id === me)?.production_queue?.length || 0;
  const staticPending = (snap?.buildings || [])
    .filter((b) => b.owner === me && b.alive && Number(b.pending_card_id || 0) > 0)
    .length;
  return queued + staticPending < 3;
}

function playProduceQueueSound(hadCapacity) {
  if (!soundEnabled || !audioUnlocked) return;
  if (hadCapacity) {
    playSound("spawn", 0.34, true);
    playSound("economy", 0.42, true);
  } else {
    playSound("spawn", 0.22, true);
  }
}

function produce(unit) {
  if (!Module) return;
  const item = productionByUnitName.get(unit);
  if (!isUnitUnlocked(unit)) {
    setProductionNotice(`${item?.label || unit} locked`);
    appendPlayLog("produce_blocked", { unit, reason: "locked" });
    return;
  }
  const me = (snap?.players || []).find((p) => p.id === controlledPlayer());
  const mana = Number(me?.mana ?? 0);
  const queueUsed = Number(me?.construction_queue_used ?? (me?.production_queue || []).length ?? 0);
  const queueCapacity = Number(me?.construction_queue_capacity ?? 3);
  const currentSupply = Number(me?.active_supply ?? 0) + Number(me?.pending_supply ?? 0) + Number(me?.queued_supply ?? 0);
  const supplyCap = Number(me?.supply_cap ?? 0);
  const unitSupply = item ? Number(supplyCostByClass[item.classKey] ?? 1) : 1;
  if (queueUsed >= queueCapacity) {
    setProductionNotice(`${item?.label || unit} blocked: production queue full`);
    appendPlayLog("produce_blocked", { unit, reason: "queue_full", player: compactPlayerState(me), queueUsed, queueCapacity });
    return;
  }
  if (currentSupply + unitSupply > supplyCap + 1e-6) {
    setProductionNotice(`${item?.label || unit} blocked: supply cap ${formatSupply(currentSupply)}/${formatSupply(supplyCap)}`);
    appendPlayLog("produce_blocked", { unit, reason: "supply_cap", player: compactPlayerState(me), currentSupply, unitSupply, supplyCap });
    return;
  }
  if (item && mana + 1e-6 < item.cost) {
    setProductionNotice(`${item.label} needs $${Math.ceil(item.cost - mana)} more`);
    appendPlayLog("produce_blocked", { unit, reason: "not_enough_money", player: compactPlayerState(me), mana, cost: item.cost });
    return;
  }
  const hadCapacity = hasIdleProductionCapacity();
  const beforeQueueUsed = queueUsed;
  const beforeMana = mana;
  send({ type: "produce", player: controlledPlayer(), unit });
  const after = (snap?.players || []).find((p) => p.id === controlledPlayer());
  const afterQueueUsed = Number(after?.construction_queue_used ?? (after?.production_queue || []).length ?? 0);
  const afterMana = Number(after?.mana ?? beforeMana);
  if (afterQueueUsed <= beforeQueueUsed && Math.abs(afterMana - beforeMana) < 1e-6) {
    setProductionNotice(`${item?.label || unit} was not queued`);
    appendPlayLog("produce_blocked", { unit, reason: "engine_rejected", before: compactPlayerState(me), after: compactPlayerState(after) });
    return;
  }
  setProductionNotice(`${item?.label || unit} queued`);
  playProduceQueueSound(hadCapacity);
}

function setProductionNotice(message) {
  lastProductionNotice = { message, until: performance.now() + 2200 };
  lastPanelKey = "";
  if (statusEl) statusEl.textContent = message;
}

function compactPlayerState(player) {
  if (!player) return null;
  return {
    mana: player.mana,
    active_supply: player.active_supply,
    pending_supply: player.pending_supply,
    queued_supply: player.queued_supply,
    supply_cap: player.supply_cap,
    construction_queue_used: player.construction_queue_used,
    construction_queue_capacity: player.construction_queue_capacity,
    production_queue: player.production_queue,
  };
}

function formatSupply(value) {
  return Number.isInteger(value) ? String(value) : Number(value).toFixed(1);
}

function renderProductionButtons() {
  productionBar.innerHTML = "";
  productionButtons.clear();
  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = "produce-button select-army-button";
  allButton.title = "Shift+A · select all combat units";
  allButton.innerHTML = `<span class="hotkey">⇧A</span><span class="unit-chip all-army-chip">ALL</span><span class="unit-name">Army</span><span class="cost">select</span>`;
  allButton.addEventListener("click", selectAllArmy);
  productionBar.appendChild(allButton);
  for (const item of productionUnits) {
    if (!isUnitUnlocked(item.unit)) continue;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "produce-button";
    button.title = `${item.key.toUpperCase()} to build · Shift+${item.key.toUpperCase()} to select ${item.label} · costs $${item.cost}`;
    button.dataset.unit = item.unit;
    button.innerHTML = `<span class="hotkey">${item.key.toUpperCase()}</span><span class="unit-chip">${unitIconHtml(item.classKey, 32)}</span><span class="unit-name">${item.label}</span><span class="cost">$${item.cost}</span><span class="build-time">build</span>`;
    button.addEventListener("click", (evt) => {
      if (evt.shiftKey) selectUnitsByClass(item.classKey);
      else produce(item.unit);
    });
    productionBar.appendChild(button);
    productionButtons.set(item.unit, button);
  }
}

function renderScenarioOptions() {
  scenarioSelect.innerHTML = "";
  for (const scenario of scenarios) {
    const option = document.createElement("option");
    option.value = String(scenario.id);
    option.textContent = scenario.name;
    scenarioSelect.appendChild(option);
  }
  scenarioSelect.value = String(currentScenario);
  difficultySelect.value = String(botDifficulty);
}

function resetGame({ randomSeed = false, scenario = currentScenario } = {}) {
  if (lanMode) return;
  if (!Module) return;
  appendPlayLog("reset_requested", { randomSeed, scenario });
  selected.clear();
  attackMode = false;
  expandMode = false;
  lastPlayerAction = "";
  currentScenario = scenario;
  scenarioSelect.value = String(currentScenario);
  botDifficulty = Math.max(1, Math.min(10, Number(difficultySelect.value || botDifficulty)));
  if (randomSeed) seed = Math.floor(Math.random() * 1000000);
  else seed++;
  snap = ptrJson(wasm.initScenarioDifficulty(seed, 240000, currentScenario, botDifficulty));
  applyBotAdminConfig();
  appendPlayLog("engine_reset", { seed, scenario: currentScenario, botDifficulty, snapshot: compactSnapshot() });
  lastLoggedSnapshotTick = snap?.tick ?? -1;
  lastLiveAudioTick = snap?.tick ?? -1;
  soundCooldowns.clear();
  resultBanner.classList.add("hidden");
  tutorialStep = 0;
  updateTutorial();
}

async function resetLiveGame() {
  if (!lanMode) return resetGame();
  let mode = hasBotOpponent() || urlParams.get("autostart") === "1" ? "bot" : "human";
  let lobby = null;
  try {
    lobby = await lanApi("/api/lobby");
    mode = lobby.mode === "bot" ? "bot" : "human";
  } catch {
    // Fall back to the authenticated LAN state below.
  }
  statusEl.textContent = "Resetting live game...";
  try {
    const lobby = await lanApi("/api/reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: lanToken, player: controlledPlayer() }),
    });
    const own = (lobby.urls || []).find((entry) => Number(entry.id) === controlledPlayer() && entry.url);
    if (own?.url) {
      const next = new URL(own.url, window.location.origin);
      if (mode === "bot") next.searchParams.set("autostart", "1");
      window.location.href = next.href;
      return;
    }
    window.location.href = "/lobby.html";
  } catch (err) {
    statusEl.textContent = `Reset failed: ${err.message}`;
  }
}

function stepEngine(ticks = 1) {
  const started = performance.now();
  const before = snap;
  snap = ptrJson(wasm.step(ticks));
  simMs = simMs * 0.85 + (performance.now() - started) * 0.15;
  logStateDelta(before, snap, `step:${ticks}`);
}

function drawGround() {
  const c = center();
  const g = ctx.createRadialGradient(c.x, c.y, 90, c.x, c.y, Math.max(canvas.width, canvas.height) * 0.74);
  g.addColorStop(0, "#223027");
  g.addColorStop(0.54, "#17231d");
  g.addColorStop(1, "#070a09");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const s = scale();
  ctx.strokeStyle = "rgba(210,230,210,0.055)";
  ctx.lineWidth = 1;
  for (let v = -bounds; v <= bounds; v += 12) {
    const a = worldToScreen(v, -bounds);
    const b = worldToScreen(v, bounds);
    const c2 = worldToScreen(-bounds, v);
    const d = worldToScreen(bounds, v);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.moveTo(c2.x, c2.y);
    ctx.lineTo(d.x, d.y);
    ctx.stroke();
  }
  drawIsoWorldRect(-bounds, -bounds, bounds, bounds, "rgba(226,232,210,0.052)", "rgba(226,232,210,0.18)");
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.06;
  for (let r = 48; r < bounds; r += 48) drawIsoWorldRect(-r, -r, r, r, "transparent", "rgba(226,232,210,0.12)");
  ctx.restore();
  const vignette = ctx.createRadialGradient(c.x, c.y, Math.min(canvas.width, canvas.height) * 0.16, c.x, c.y, Math.max(canvas.width, canvas.height) * 0.72);
  vignette.addColorStop(0, "rgba(255,255,255,0)");
  vignette.addColorStop(0.66, "rgba(0,0,0,0.06)");
  vignette.addColorStop(1, "rgba(0,0,0,0.44)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawIsoWorldRect(x0, y0, x1, y1, fill, stroke) {
  SimIsoRenderer.drawIsoWorldRect(playIsoEnv(), x0, y0, x1, y1, fill, stroke);
}

function diamond(x, y, w, h, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x - w, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function drawMineral(m) {
  if (m.amount <= 0) return;
  const p = worldToScreen(m.x, m.y, 1.2);
  ctx.save();
  ctx.shadowColor = "rgba(245,213,92,0.48)";
  ctx.shadowBlur = 14;
  ctx.lineWidth = 1.4;
  diamond(p.x, p.y, 7.5, 6.2, "#d6b34f", "rgba(255,239,157,0.88)");
  ctx.fillStyle = "rgba(255,245,174,0.58)";
  ctx.beginPath();
  ctx.arc(p.x - 1.8, p.y - 1.8, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBuilding(b) {
  drawReplayStyleBuilding(b);
  return;
  if (!b.alive) return;
  const p = worldToScreen(b.x, b.y, 0);
  const owner = b.owner >= 0 ? teamColors[b.owner] : "#8f9799";
  const hoveredNeutral = b.owner < 0 && b.id === hoverBuildingId;
  const size = b.kind === "main" ? 36 : 25;
  ctx.save();
  ctx.shadowColor = b.owner >= 0 ? hexToRgba(owner, 0.62) : "rgba(245,221,128,0.20)";
  ctx.shadowBlur = hoveredNeutral ? 22 : 14;
  if (hoveredNeutral) {
    ctx.strokeStyle = "rgba(245,221,128,0.82)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, size * 1.70, size * 1.08, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(245,221,128,0.12)";
    ctx.fill();
    ctx.font = "800 12px ui-sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#f5dd80";
    ctx.fillText("click to expand", p.x, p.y - size * 1.85);
  }
  ctx.lineWidth = b.kind === "main" ? 3.4 : 2.6;
  const top = b.owner >= 0 ? mixColor(owner, "#ffffff", 0.18) : "#8b9284";
  const inner = b.owner >= 0 ? mixColor(owner, "#050809", 0.16) : "#656d62";
  ctx.strokeStyle = b.owner >= 0 ? owner : "rgba(220,218,204,0.58)";
  if (b.kind === "main") {
    diamond(p.x, p.y + 5, size, size * 0.88, mixColor(inner, "#000000", 0.18), "rgba(0,0,0,0.76)");
    diamond(p.x, p.y - 2, size, size * 0.88, top, hoveredNeutral ? "#f5dd80" : owner);
    ctx.strokeStyle = "rgba(255,255,255,0.34)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(p.x - size * 0.50, p.y - 2);
    ctx.lineTo(p.x + size * 0.50, p.y - 2);
    ctx.moveTo(p.x, p.y - size * 0.52);
    ctx.lineTo(p.x, p.y + size * 0.40);
    ctx.stroke();
  } else {
    diamond(p.x, p.y + 4, size, size * 0.82, mixColor(inner, "#000000", 0.18), "rgba(0,0,0,0.72)");
    diamond(p.x, p.y - 1, size, size * 0.82, top, hoveredNeutral ? "#f5dd80" : owner);
  }
  if (b.static_defense_level > 0) {
    ctx.strokeStyle = "#f5dd80";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size + 7, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (b.owner >= 0) drawTeamPlate(p.x - 29, p.y - size - 23, 58, owner, teamNames[b.owner] || `P${b.owner}`);
  ctx.restore();
  drawBar(p.x - size, p.y + size + 7, size * 2, 4, b.hp / Math.max(1, b.max_hp), owner);
  if (b.owner < 0 && b.claim_progress > 0) {
    drawBar(p.x - size, p.y + size + 13, size * 2, 3, b.claim_progress / Math.max(1, b.claim_required), "#f4d35e");
  }
}

function drawReplayStyleBuilding(b) {
  SimIsoRenderer.drawBuilding(playIsoEnv(), b, {
    hoveredNeutral: b.owner < 0 && b.id === hoverBuildingId,
    expansionLabel: ({ building, hoveredNeutral, activeClaimOwner, claimRatio }) => {
      const needsExpansionMoney = activeClaimOwner < 0 && playerBank(controlledPlayer()) < EXPANSION_COST;
      return {
        text: claimRatio > 0 ? `BUILD ${Math.round(claimRatio * 100)}%` : needsExpansionMoney ? "NEED $100" : "EXPAND $100",
        color: needsExpansionMoney ? "#ffb89b" : hoveredNeutral ? "#fff2ad" : teamColors[activeClaimOwner] || "#f5dd80",
      };
    },
    drawProduction: ({ x, y, size, half, building }) => {
      const item = productionByCardId.get(Number(building.pending_card_id)) || { classKey: "soldier" };
      drawProductionPip(x, y + half + 17, size + 14, productionProgress(building), item.classKey);
    },
  });
}

function playIsoEnv() {
  return {
    ctx,
    crispLine,
    hexToRgba,
    mixColor,
    worldToScreen,
    drawShadow,
    drawHealthPip,
    drawTeamPlate,
    colors: teamColors,
    teamNames,
    animTime,
  };
}

function drawExpansionSiteMarker(x, y, size, progress, color, hovered, active) {
  const w = size * 1.72;
  const h = size * 0.82;
  ctx.save();
  ctx.globalAlpha = hovered || active ? 1 : 0.74;
  ctx.lineWidth = hovered || active ? crispLine(2.8) : crispLine(1.7);
  ctx.strokeStyle = hexToRgba(color, hovered || active ? 0.82 : 0.42);
  ctx.fillStyle = hexToRgba(color, active ? 0.12 : 0.055);
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x - w, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (progress > 0) {
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = hexToRgba(mixColor(color, "#ffffff", 0.36), 0.92);
    ctx.lineWidth = crispLine(4.0);
    const points = [
      [x, y - h],
      [x + w, y],
      [x, y + h],
      [x - w, y],
      [x, y - h],
    ];
    const total = progress * 4;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 0; i < Math.floor(total); i++) ctx.lineTo(points[i + 1][0], points[i + 1][1]);
    const rem = total - Math.floor(total);
    const idx = Math.min(3, Math.floor(total));
    if (rem > 0) {
      const [x0, y0] = points[idx];
      const [x1, y1] = points[idx + 1];
      ctx.lineTo(x0 + (x1 - x0) * rem, y0 + (y1 - y0) * rem);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawIsoBlock(x, y, size, bevel) {
  const h = size / 2;
  const b = size * bevel;
  ctx.beginPath();
  ctx.moveTo(x - h + b, y - h);
  ctx.lineTo(x + h, y - h + b);
  ctx.lineTo(x + h - b, y + h);
  ctx.lineTo(x - h, y + h - b);
  ctx.closePath();
}

function drawIsoBuildingTop(x, y, size, height, bevel) {
  drawIsoBlock(x, y - height, size, bevel);
}

function drawBuildingFoundation(x, y, size, ownerColor, owned, hoveredNeutral, idleReady, pulse) {
  const w = size * 1.42;
  const h = w * 0.46;
  ctx.save();
  ctx.fillStyle = owned
    ? `rgba(${parseInt(ownerColor.slice(1, 3), 16)}, ${parseInt(ownerColor.slice(3, 5), 16)}, ${parseInt(ownerColor.slice(5, 7), 16)}, 0.18)`
    : hoveredNeutral
      ? "rgba(245,221,128,0.18)"
      : "rgba(120,128,116,0.18)";
  ctx.strokeStyle = owned ? hexToRgba(ownerColor, 0.55) : "rgba(220,218,204,0.30)";
  ctx.lineWidth = crispLine(1.4);
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x - w, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (idleReady) {
    const ringAlpha = 0.18 + 0.32 * pulse;
    ctx.strokeStyle = hexToRgba(ownerColor, ringAlpha);
    ctx.lineWidth = crispLine(2.0 + pulse * 1.2);
    const swell = 1.0 + pulse * 0.07;
    ctx.beginPath();
    ctx.moveTo(x, y - h * swell);
    ctx.lineTo(x + w * swell, y);
    ctx.lineTo(x, y + h * swell);
    ctx.lineTo(x - w * swell, y);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

function drawBuildingOwnerBand(x, y, size, height, ownerColor) {
  const half = size / 2;
  const bevel = 0.30;
  const b = size * bevel;
  const topY = y - height;
  const bandTop = topY + 2;
  const bandBottom = topY + 6;
  ctx.save();
  ctx.fillStyle = hexToRgba(ownerColor, 0.92);
  ctx.beginPath();
  ctx.moveTo(x + half, bandTop - half + b);
  ctx.lineTo(x + half - b, bandTop + half);
  ctx.lineTo(x + half - b, bandBottom + half);
  ctx.lineTo(x + half, bandBottom - half + b);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = hexToRgba(mixColor(ownerColor, "#000000", 0.35), 0.92);
  ctx.beginPath();
  ctx.moveTo(x + half - b, bandTop + half);
  ctx.lineTo(x - half, bandTop + half - b);
  ctx.lineTo(x - half, bandBottom + half - b);
  ctx.lineTo(x + half - b, bandBottom + half);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBuildingUpperTier(x, y, size, height, ownerColor, owned, hoveredNeutral, isMain) {
  const tierSize = size * (isMain ? 0.62 : 0.52);
  const tierHeight = isMain ? 12 : 8;
  const baseY = y - height;
  const half = tierSize / 2;
  const bevel = 0.30;
  const b = tierSize * bevel;
  const topY = baseY - tierHeight;
  const top = [
    { x: x - half + b, y: topY - half },
    { x: x + half, y: topY - half + b },
    { x: x + half - b, y: topY + half },
    { x: x - half, y: topY + half - b },
  ];
  const bottom = top.map((p) => ({ x: p.x, y: p.y + tierHeight }));
  ctx.save();
  ctx.strokeStyle = "rgba(4,6,7,0.94)";
  ctx.lineWidth = crispLine(isMain ? 3.4 : 2.8);
  const sideA = ctx.createLinearGradient(x, topY, x, baseY);
  sideA.addColorStop(0, owned ? mixColor(ownerColor, "#ffffff", 0.22) : "#7b8173");
  sideA.addColorStop(1, "#171b1d");
  ctx.fillStyle = sideA;
  ctx.beginPath();
  ctx.moveTo(top[1].x, top[1].y);
  ctx.lineTo(bottom[1].x, bottom[1].y);
  ctx.lineTo(bottom[2].x, bottom[2].y);
  ctx.lineTo(top[2].x, top[2].y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const sideB = ctx.createLinearGradient(x - half, topY, x + half, baseY);
  sideB.addColorStop(0, owned ? mixColor(ownerColor, "#050809", 0.22) : "#50584f");
  sideB.addColorStop(1, "#080b0c");
  ctx.fillStyle = sideB;
  ctx.beginPath();
  ctx.moveTo(top[2].x, top[2].y);
  ctx.lineTo(bottom[2].x, bottom[2].y);
  ctx.lineTo(bottom[3].x, bottom[3].y);
  ctx.lineTo(top[3].x, top[3].y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const cap = ctx.createLinearGradient(x - half, topY - half, x + half, topY + half);
  cap.addColorStop(0, owned ? mixColor(ownerColor, "#ffffff", 0.34) : "#9a9f8d");
  cap.addColorStop(0.6, owned ? ownerColor : hoveredNeutral ? "#9a9f8d" : "#6c7367");
  cap.addColorStop(1, owned ? mixColor(ownerColor, "#000000", 0.30) : "#3a4239");
  ctx.fillStyle = cap;
  ctx.strokeStyle = owned ? "rgba(243,239,230,0.78)" : "rgba(220,218,204,0.62)";
  ctx.lineWidth = crispLine(isMain ? 1.8 : 1.4);
  drawIsoBlock(x, topY, tierSize, bevel);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawBuildingCorePulse(x, y, height, ownerColor, intensity) {
  const cx = x;
  const cy = y - height - 16;
  const baseRadius = 3.2;
  const swell = baseRadius + intensity * 1.6;
  ctx.save();
  ctx.fillStyle = "rgba(4,6,7,0.84)";
  ctx.beginPath();
  ctx.arc(cx, cy, baseRadius + 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hexToRgba(mixColor(ownerColor, "#ffffff", 0.45), 0.85 + intensity * 0.15);
  ctx.beginPath();
  ctx.arc(cx, cy, swell, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawIsoBuildingBlock(x, y, size, height, ownerColor, owned) {
  const h = size / 2;
  const bevel = 0.30;
  const topY = y - height;
  const top = [
    { x: x - h + size * bevel, y: topY - h },
    { x: x + h, y: topY - h + size * bevel },
    { x: x + h - size * bevel, y: topY + h },
    { x: x - h, y: topY + h - size * bevel },
  ];
  const bottom = top.map((point) => ({ x: point.x, y: point.y + height }));
  const sideA = ctx.createLinearGradient(x, topY, x, y + h);
  sideA.addColorStop(0, owned ? mixColor(ownerColor, "#ffffff", 0.10) : "#697166");
  sideA.addColorStop(1, "#111719");
  ctx.fillStyle = sideA;
  ctx.beginPath();
  ctx.moveTo(top[1].x, top[1].y);
  ctx.lineTo(bottom[1].x, bottom[1].y);
  ctx.lineTo(bottom[2].x, bottom[2].y);
  ctx.lineTo(top[2].x, top[2].y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const sideB = ctx.createLinearGradient(x - h, topY, x + h, y + h);
  sideB.addColorStop(0, owned ? mixColor(ownerColor, "#050809", 0.18) : "#50584f");
  sideB.addColorStop(1, "#070a0b");
  ctx.fillStyle = sideB;
  ctx.beginPath();
  ctx.moveTo(top[2].x, top[2].y);
  ctx.lineTo(bottom[2].x, bottom[2].y);
  ctx.lineTo(bottom[3].x, bottom[3].y);
  ctx.lineTo(top[3].x, top[3].y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawTeamPlate(x, y, w, color, label) {
  ctx.save();
  ctx.fillStyle = "rgba(8,10,12,0.72)";
  ctx.strokeStyle = hexToRgba(color, 0.82);
  ctx.lineWidth = 1.2;
  if (ctx.roundRect) ctx.roundRect(x, y, w, 18, 4);
  else ctx.rect(x, y, w, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fillRect(x + 5, y + 5, 9, 8);
  ctx.fillStyle = "#f7f3e8";
  ctx.font = "800 9px ui-sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + 18, y + 9);
  ctx.restore();
}

function drawUnit(u, overridePoint = null) {
  drawReplayStyleUnit(u, overridePoint);
  return;
  const style = unitStyle[u.class] || unitStyle.soldier;
  const palette = classPalette[u.class] || classPalette.soldier;
  const p = overridePoint ? { ...overridePoint } : worldToScreen(u.x, u.y, unitHoverHeight(u));
  if (!overridePoint) {
    const offset = renderSeparationOffset(u);
    p.x += offset.x;
    p.y += offset.y;
  }
  const r = unitRadius(u);
  const team = teamColors[u.owner] || "#ddd";
  const angle = unitAngle(u);
  ctx.save();
  ctx.translate(p.x, p.y);
  drawUnitShadow(0, r * 0.44, r);
  if (selected.has(u.id)) {
    ctx.strokeStyle = "rgba(255,238,156,0.95)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.46, r * 1.20, r * 0.50, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.rotate(angle);
  ctx.fillStyle = hexToRgba(team, 0.34);
  unitShapePath(u.class, r + 4.8);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(team, 0.62);
  ctx.lineWidth = u.class === "siege" ? 2.4 : 1.8;
  unitShapePath(u.class, r + 4.4);
  ctx.stroke();
  ctx.strokeStyle = "rgba(3,5,7,0.92)";
  ctx.lineWidth = u.class === "siege" ? 3.8 : 3.2;
  unitShapePath(u.class, r + 2);
  ctx.stroke();
  ctx.fillStyle = unitGradient(r, team);
  unitShapePath(u.class, r);
  ctx.fill();
  ctx.strokeStyle = "rgba(247,242,220,0.72)";
  ctx.lineWidth = 1.0;
  unitShapePath(u.class, r);
  ctx.stroke();
  drawUnitHighlight(u.class, r, team);
  drawClassFillAccent(u.class, r, palette, team);
  drawUnitTrim(u.class, r, palette, team);
  drawClassMark(u.class, r, palette);
  ctx.restore();
  drawWorkerIntent(u, p, r);
  const hpRatio = u.hp / Math.max(1, u.max_hp);
  if (hpRatio < 0.985 || selected.has(u.id)) drawBar(p.x - r, p.y + r + 6, r * 2, 4, hpRatio, team);
}

function drawReplayStyleUnit(u, overridePoint = null) {
  const p = overridePoint ? { ...overridePoint } : worldToScreen(u.x, u.y, unitHoverHeight(u));
  if (!overridePoint) {
    const offset = renderSeparationOffset(u);
    p.x += offset.x;
    p.y += offset.y;
  }
  const r = unitRadius(u);
  const team = teamColors[u.owner] ?? "#c8c5bc";
  drawReplayUnitAura(p.x, p.y, r, u);
  drawReplayUnitBody(p.x, p.y, r, u);
  if (selected.has(u.id)) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,238,156,0.95)";
    ctx.lineWidth = crispLine(2.2);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + r * 0.50, r * 1.18, r * 0.48, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  const hpRatio = Math.max(0, u.hp / Math.max(1, u.max_hp));
  if (hpRatio < 0.92 || selected.has(u.id)) drawHealthPip(p.x, p.y + r + 8, r * 2.1, hpRatio, team);
  drawWorkerIntent(u, p, r);
}

const unitSpriteCache = new Map();
const UNIT_SPRITE_DPR = 2;

function unitSpriteKey(klass, owner) {
  return `${klass}|${owner}`;
}

function buildUnitSprite(klass, owner) {
  const r = unitRadius({ class: klass });
  const palette = classPalette[klass] ?? classPalette.soldier;
  const team = teamColors[owner] ?? "#c8c5bc";
  const half = Math.ceil(r * 2.0 + 12);
  const sizeCss = half * 2;
  const sprite = document.createElement("canvas");
  sprite.width = sizeCss * UNIT_SPRITE_DPR;
  sprite.height = sizeCss * UNIT_SPRITE_DPR;
  const liveCtx = ctx;
  const sctx = sprite.getContext("2d");
  sctx.scale(UNIT_SPRITE_DPR, UNIT_SPRITE_DPR);
  sctx.translate(half, half);
  ctx = sctx;
  try {
    ctx.fillStyle = hexToRgba(team, 0.24);
    unitShapePath(klass, r + 4.6);
    ctx.fill();
    ctx.strokeStyle = "rgba(3,5,7,0.92)";
    ctx.lineWidth = klass === "siege" ? crispLine(4.2) : crispLine(3.6);
    unitShapePath(klass, r);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = unitFillStyle(klass, r, palette, team);
    unitShapePath(klass, r - 1.0);
    ctx.fill();
    unitHighlightPath(klass, r, mixColor(team, "#ffffff", 0.66));
    unitTrimPath(klass, r, palette);
    drawFacingStripe(klass, r, mixColor(team, "#ffffff", 0.58));
    drawClassMark(klass, r, palette, team);
  } finally {
    ctx = liveCtx;
  }
  return { canvas: sprite, half, sizeCss };
}

function getUnitSprite(klass, owner) {
  const key = unitSpriteKey(klass, owner);
  let sprite = unitSpriteCache.get(key);
  if (!sprite) {
    sprite = buildUnitSprite(klass, owner);
    unitSpriteCache.set(key, sprite);
  }
  return sprite;
}

function drawReplayUnitBody(x, y, r, u) {
  const angle = unitAngle(u);
  drawShadow(x, y + r * 0.56, r * 1.04, 0.31);
  const sprite = getUnitSprite(u.class, u.owner);
  const cx = Math.round(x);
  const cy = Math.round(y);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.drawImage(sprite.canvas, -sprite.half, -sprite.half, sprite.sizeCss, sprite.sizeCss);
  ctx.restore();
  currentUnitTextAngle = angle;
}

function unitHoverHeight(u) {
  if (u.class === "vulture" || u.class === "matrix_caster" || u.class === "storm_caster") return 2.8;
  if (u.class === "siege") return 1.4;
  return 1.8;
}

function unitRadius(u) {
  if (u.class === "worker") return 13;
  if (u.class === "archer") return 19;
  if (u.class === "bomber") return 18;
  if (u.class === "siege") return 25;
  if (u.class === "vulture") return 20;
  if (u.class === "healer") return 18;
  if (u.class === "turret") return 18;
  if (u.class === "matrix_caster") return 19;
  if (u.class === "storm_caster") return 19;
  if (u.class === "skirmisher") return 19;
  return 21;
}

function renderSeparationOffset(unit) {
  const ring = 6.0 * Math.min(1.8, Math.max(1, camera.zoom));
  const a = (unit.id * 2.399963 + classPhase(unit.class)) % (Math.PI * 2);
  const group = unit.id % 5;
  return {
    x: Math.cos(a) * ring * (0.45 + group * 0.16),
    y: Math.sin(a) * ring * (0.35 + group * 0.12),
  };
}

function classPhase(kind) {
  return {
    worker: 0.2,
    archer: 0.8,
    bomber: 1.4,
    siege: 2.1,
    vulture: 2.8,
    healer: 3.5,
    matrix_caster: 4.7,
    storm_caster: 5.2,
    skirmisher: 5.7,
  }[kind] ?? 0;
}

function separateDisplayUnits(items) {
  const margin = 2.8;
  for (let pass = 0; pass < 3; ++pass) {
    for (let i = 0; i < items.length; ++i) {
      const a = items[i];
      for (let j = i + 1; j < items.length; ++j) {
        const b = items[j];
        const minDist = (a.r + b.r) * (a.u.owner === b.u.owner ? 0.86 : 1.03) + margin;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        if (distSq >= minDist * minDist) continue;
        const dist = Math.sqrt(distSq) || 0.001;
        const push = Math.min(6.2, (minDist - dist) * 0.50);
        const nx = dx / dist;
        const ny = dy / dist;
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
      }
    }
  }
}

function unitAngle(u) {
  const tx = u.target_x ?? u.x + 1;
  const ty = u.target_y ?? u.y;
  const from = worldToScreen(u.x, u.y, 0);
  const to = worldToScreen(tx, ty, 0);
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function unitShapePath(kind, r) {
  ctx.beginPath();
  if (kind === "archer") {
    ctx.moveTo(r * 1.55, 0);
    ctx.lineTo(-r * 0.58, -r * 0.92);
    ctx.lineTo(-r * 0.34, -r * 0.24);
    ctx.lineTo(-r * 1.08, -r * 0.24);
    ctx.lineTo(-r * 0.76, 0);
    ctx.lineTo(-r * 1.08, r * 0.24);
    ctx.lineTo(-r * 0.34, r * 0.24);
    ctx.lineTo(-r * 0.58, r * 0.92);
    ctx.closePath();
  } else if (kind === "vulture") {
    ctx.moveTo(r * 1.72, 0);
    ctx.lineTo(-r * 0.18, -r * 0.54);
    ctx.lineTo(-r * 1.12, -r * 0.24);
    ctx.lineTo(-r * 0.62, 0);
    ctx.lineTo(-r * 1.12, r * 0.24);
    ctx.lineTo(-r * 0.18, r * 0.54);
    ctx.closePath();
  } else if (kind === "siege") {
    if (ctx.roundRect) ctx.roundRect(-r * 1.05, -r * 0.66, r * 1.80, r * 1.32, 5);
    else ctx.rect(-r * 1.05, -r * 0.66, r * 1.80, r * 1.32);
  } else if (kind === "worker") {
    ctx.rect(-r * 0.72, -r * 0.72, r * 1.44, r * 1.44);
  } else if (kind === "matrix_caster") {
    ctx.ellipse(0, 0, r * 1.10, r * 0.72, 0, 0, Math.PI * 2);
  } else if (kind === "storm_caster") {
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 1.05, -r * 0.12);
    ctx.lineTo(r * 0.36, r * 1.05);
    ctx.lineTo(-r * 0.36, r * 1.05);
    ctx.lineTo(-r * 1.05, -r * 0.12);
    ctx.closePath();
  } else if (kind === "skirmisher") {
    ctx.moveTo(r * 1.35, 0);
    ctx.lineTo(-r * 0.10, -r * 0.86);
    ctx.lineTo(-r * 0.92, -r * 0.32);
    ctx.lineTo(-r * 0.48, 0);
    ctx.lineTo(-r * 0.92, r * 0.32);
    ctx.lineTo(-r * 0.10, r * 0.86);
    ctx.closePath();
  } else if (kind === "soldier") {
    ctx.moveTo(r * 1.05, 0);
    ctx.lineTo(r * 0.38, -r * 0.90);
    ctx.lineTo(-r * 0.72, -r * 0.66);
    ctx.lineTo(-r * 1.05, 0);
    ctx.lineTo(-r * 0.72, r * 0.66);
    ctx.lineTo(r * 0.38, r * 0.90);
    ctx.closePath();
  } else if (kind === "bomber") {
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const rr = i % 2 === 0 ? r * 1.24 : r * 0.58;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  } else if (kind === "healer") {
    ctx.moveTo(0, -r * 1.10);
    ctx.bezierCurveTo(r * 1.05, -r * 0.70, r * 1.05, r * 0.70, 0, r * 1.10);
    ctx.bezierCurveTo(-r * 1.05, r * 0.70, -r * 1.05, -r * 0.70, 0, -r * 1.10);
    ctx.closePath();
  } else {
    ctx.arc(0, 0, r, 0, Math.PI * 2);
  }
}

function drawUnitShadow(x, y, r) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.05, r * 0.68, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWorkerIntent(u, p, r) {
  if (u.class !== "worker") return;
  const moving = u.target_x !== undefined && u.target_y !== undefined && Math.hypot((u.target_x ?? u.x) - u.x, (u.target_y ?? u.y) - u.y) > 1.0;
  if (moving && (u.intent === "mine" || u.intent === "return" || u.intent === "claim")) {
    const target = worldToScreen(u.target_x, u.target_y, 0.2);
    ctx.save();
    ctx.strokeStyle = u.intent === "return" ? "rgba(245,221,128,0.42)" : "rgba(141,240,174,0.34)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 7]);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    ctx.restore();
  }
  if (u.worker_cargo > 0) {
    ctx.save();
    ctx.fillStyle = "#f5dd80";
    ctx.strokeStyle = "rgba(0,0,0,0.75)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x + r * 0.55, p.y - r * 0.55, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function unitGradient(r, team) {
  const g = ctx.createLinearGradient(-r * 0.8, -r * 0.8, r * 0.85, r * 0.85);
  g.addColorStop(0, mixColor(team, "#ffffff", 0.48));
  g.addColorStop(0.30, mixColor(team, "#ffffff", 0.16));
  g.addColorStop(0.82, mixColor(team, "#020607", 0.24));
  g.addColorStop(1, mixColor(team, "#020607", 0.46));
  return g;
}

function unitFillStyle(kind, r, palette, team) {
  const gradient = ctx.createLinearGradient(-r * 0.65, -r * 0.80, r * 0.78, r * 0.88);
  gradient.addColorStop(0.00, mixColor(team, "#ffffff", 0.46));
  gradient.addColorStop(0.26, mixColor(team, "#ffffff", 0.16));
  gradient.addColorStop(0.76, mixColor(team, "#020607", 0.22));
  gradient.addColorStop(1.00, mixColor(team, "#020607", 0.44));
  return gradient;
}

function drawUnitHighlight(kind, r, team) {
  ctx.save();
  ctx.fillStyle = hexToRgba(mixColor(team, "#ffffff", 0.72), 0.46);
  ctx.beginPath();
  if (kind === "siege") ctx.rect(-r * 0.82, -r * 0.54, r * 1.18, r * 0.22);
  else if (kind === "archer" || kind === "vulture" || kind === "skirmisher") {
    ctx.moveTo(r * 0.78, -r * 0.10);
    ctx.lineTo(-r * 0.28, -r * 0.36);
    ctx.lineTo(-r * 0.48, -r * 0.08);
    ctx.lineTo(r * 0.66, r * 0.10);
    ctx.closePath();
  } else if (kind === "worker") ctx.rect(-r * 0.50, -r * 0.50, r * 0.58, r * 0.24);
  else ctx.arc(-r * 0.24, -r * 0.28, r * 0.36, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function unitHighlightPath(kind, r, color) {
  ctx.save();
  ctx.fillStyle = hexToRgba(color, 0.48);
  ctx.beginPath();
  if (kind === "siege") {
    ctx.rect(-r * 0.82, -r * 0.54, r * 1.18, r * 0.22);
  } else if (kind === "archer" || kind === "vulture" || kind === "skirmisher") {
    ctx.moveTo(r * 0.78, -r * 0.10);
    ctx.lineTo(-r * 0.28, -r * 0.36);
    ctx.lineTo(-r * 0.48, -r * 0.08);
    ctx.lineTo(r * 0.66, r * 0.10);
    ctx.closePath();
  } else if (kind === "worker") {
    ctx.rect(-r * 0.50, -r * 0.50, r * 0.58, r * 0.24);
  } else if (kind === "healer") {
    ctx.arc(-r * 0.22, -r * 0.32, r * 0.30, 0, Math.PI * 2);
  } else if (kind === "bomber") {
    ctx.arc(-r * 0.18, -r * 0.18, r * 0.42, 0, Math.PI * 2);
  } else {
    ctx.arc(-r * 0.24, -r * 0.28, r * 0.36, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();
}

function drawClassFillAccent(kind, r, palette, team) {
  ctx.save();
  ctx.globalAlpha = 0.78;
  const fill = mixColor(team, "#f7f0d2", 0.24);
  const stroke = hexToRgba("#fff3c4", 0.72);
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.15;
  if (kind === "worker") {
    ctx.beginPath();
    ctx.rect(-r * 0.42, -r * 0.42, r * 0.84, r * 0.84);
    ctx.fill();
    ctx.stroke();
  } else if (kind === "archer") {
    ctx.beginPath();
    ctx.moveTo(r * 0.86, 0);
    ctx.lineTo(-r * 0.35, -r * 0.42);
    ctx.lineTo(-r * 0.18, 0);
    ctx.lineTo(-r * 0.35, r * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (kind === "soldier") {
    ctx.beginPath();
    ctx.moveTo(r * 0.56, 0);
    ctx.lineTo(-r * 0.40, -r * 0.46);
    ctx.lineTo(-r * 0.58, 0);
    ctx.lineTo(-r * 0.40, r * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (kind === "siege") {
    ctx.fillStyle = hexToRgba(fill, 0.82);
    if (ctx.roundRect) ctx.roundRect(-r * 0.84, -r * 0.48, r * 1.36, r * 0.96, 3);
    else ctx.rect(-r * 0.84, -r * 0.48, r * 1.36, r * 0.96);
    ctx.fill();
    ctx.stroke();
  } else if (kind === "bomber") {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.58, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (kind === "healer") {
    ctx.fillStyle = hexToRgba(fill, 0.76);
    ctx.fillRect(-r * 0.16, -r * 0.58, r * 0.32, r * 1.16);
    ctx.fillRect(-r * 0.58, -r * 0.16, r * 1.16, r * 0.32);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.46, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawUnitTrim(kind, r, style, team) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(250,244,220,0.88)";
  ctx.lineWidth = 2.1;
  if (kind === "siege") {
    ctx.strokeStyle = "#f3d17a";
    ctx.lineWidth = 5.2;
    ctx.beginPath();
    ctx.moveTo(r * 0.04, 0);
    ctx.lineTo(r * 2.18, 0);
    ctx.stroke();
    ctx.strokeStyle = "rgba(16,18,20,0.92)";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(r * 0.30, -r * 0.16);
    ctx.lineTo(r * 2.10, -r * 0.16);
    ctx.moveTo(r * 0.30, r * 0.16);
    ctx.lineTo(r * 2.10, r * 0.16);
    ctx.stroke();
    ctx.fillStyle = mixColor(team, "#ffffff", 0.22);
    ctx.strokeStyle = "rgba(8,10,12,0.92)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(-r * 0.18, 0, r * 0.50, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#14191c";
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(-r * 0.98, -r * 0.83, r * 1.50, r * 0.22, 3);
      ctx.roundRect(-r * 0.98, r * 0.61, r * 1.50, r * 0.22, 3);
      ctx.fill();
    } else {
      ctx.fillRect(-r * 0.98, -r * 0.83, r * 1.50, r * 0.22);
      ctx.fillRect(-r * 0.98, r * 0.61, r * 1.50, r * 0.22);
    }
  } else if (kind === "archer") {
    ctx.beginPath();
    ctx.moveTo(-r * 0.34, -r * 0.60);
    ctx.lineTo(r * 0.94, 0);
    ctx.lineTo(-r * 0.34, r * 0.60);
    ctx.stroke();
    ctx.strokeStyle = "rgba(10,12,13,0.74)";
    ctx.beginPath();
    ctx.moveTo(-r * 0.62, 0);
    ctx.lineTo(r * 0.56, 0);
    ctx.stroke();
  } else if (kind === "soldier") {
    ctx.beginPath();
    ctx.moveTo(-r * 0.58, -r * 0.44);
    ctx.lineTo(r * 0.24, 0);
    ctx.lineTo(-r * 0.58, r * 0.44);
    ctx.stroke();
  } else if (kind === "storm_caster") {
    ctx.strokeStyle = "#f7e8ff";
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.68);
    ctx.lineTo(r * 0.34, r * 0.12);
    ctx.lineTo(-r * 0.18, r * 0.12);
    ctx.lineTo(r * 0.12, r * 0.72);
    ctx.stroke();
  } else if (kind === "matrix_caster") {
    ctx.strokeStyle = "#d5fff5";
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.58, r * 0.34, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === "healer") {
    ctx.strokeStyle = "#17422a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-r * 0.42, 0);
    ctx.lineTo(r * 0.42, 0);
    ctx.moveTo(0, -r * 0.42);
    ctx.lineTo(0, r * 0.42);
    ctx.stroke();
  } else if (kind === "bomber") {
    ctx.fillStyle = "#fff0aa";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function unitTrimPath(kind, r, palette) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = 0.82;
  const light = "#f8f1da";
  const mid = "#c9c0aa";
  const dark = "#11171a";
  ctx.strokeStyle = light;
  ctx.lineWidth = crispLine(2.1);
  if (kind === "archer") {
    ctx.beginPath();
    ctx.moveTo(-r * 0.34, -r * 0.60);
    ctx.lineTo(r * 0.94, 0);
    ctx.lineTo(-r * 0.34, r * 0.60);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(dark, 0.72);
    ctx.beginPath();
    ctx.moveTo(-r * 0.62, 0);
    ctx.lineTo(r * 0.56, 0);
    ctx.stroke();
  } else if (kind === "soldier") {
    ctx.beginPath();
    ctx.moveTo(-r * 0.58, -r * 0.44);
    ctx.lineTo(r * 0.24, 0);
    ctx.lineTo(-r * 0.58, r * 0.44);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(dark, 0.70);
    ctx.beginPath();
    ctx.moveTo(r * 0.26, -r * 0.48);
    ctx.lineTo(r * 0.62, 0);
    ctx.lineTo(r * 0.26, r * 0.48);
    ctx.stroke();
  } else if (kind === "worker") {
    ctx.strokeStyle = hexToRgba(dark, 0.78);
    ctx.lineWidth = crispLine(2.0);
    ctx.beginPath();
    ctx.moveTo(-r * 0.44, -r * 0.44);
    ctx.lineTo(r * 0.44, r * 0.44);
    ctx.moveTo(r * 0.44, -r * 0.44);
    ctx.lineTo(-r * 0.44, r * 0.44);
    ctx.stroke();
  } else if (kind === "siege") {
    ctx.strokeStyle = hexToRgba(dark, 0.82);
    ctx.lineWidth = crispLine(3.0);
    ctx.beginPath();
    ctx.moveTo(-r * 0.74, -r * 0.52);
    ctx.lineTo(r * 0.66, -r * 0.52);
    ctx.moveTo(-r * 0.74, r * 0.52);
    ctx.lineTo(r * 0.66, r * 0.52);
    ctx.stroke();
    ctx.strokeStyle = light;
    ctx.lineWidth = crispLine(2.2);
    ctx.beginPath();
    ctx.moveTo(-r * 0.24, 0);
    ctx.lineTo(r * 0.86, 0);
    ctx.stroke();
  } else if (kind === "bomber") {
    ctx.strokeStyle = light;
    for (let i = 0; i < 5; ++i) {
      const a = -Math.PI / 2 + i * Math.PI * 0.4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.30, Math.sin(a) * r * 0.30);
      ctx.lineTo(Math.cos(a) * r * 0.70, Math.sin(a) * r * 0.70);
      ctx.stroke();
    }
  } else if (kind === "vulture" || kind === "skirmisher") {
    ctx.beginPath();
    ctx.moveTo(-r * 0.62, -r * 0.30);
    ctx.lineTo(r * 0.92, 0);
    ctx.lineTo(-r * 0.62, r * 0.30);
    ctx.stroke();
  } else if (kind === "healer") {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.62);
    ctx.lineTo(0, r * 0.62);
    ctx.moveTo(-r * 0.62, 0);
    ctx.lineTo(r * 0.62, 0);
    ctx.stroke();
  } else if (kind === "storm_caster") {
    ctx.strokeStyle = mid;
    ctx.beginPath();
    ctx.moveTo(-r * 0.38, -r * 0.44);
    ctx.lineTo(r * 0.12, -r * 0.04);
    ctx.lineTo(-r * 0.08, r * 0.44);
    ctx.stroke();
  } else if (kind === "matrix_caster") {
    ctx.strokeStyle = light;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.68, r * 0.38, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawClassMark(kind, r, style) {
  const light = "#fff4d8";
  const dark = "#101519";
  ctx.strokeStyle = dark;
  ctx.fillStyle = dark;
  ctx.lineWidth = crispLine(2.3);
  if (kind === "archer") {
    ctx.beginPath();
    ctx.moveTo(-r * 0.82, 0);
    ctx.lineTo(r * 0.42, 0);
    ctx.moveTo(r * 0.08, -r * 0.34);
    ctx.lineTo(r * 0.46, 0);
    ctx.lineTo(r * 0.08, r * 0.34);
    ctx.stroke();
  } else if (kind === "soldier") {
    ctx.beginPath();
    ctx.moveTo(-r * 0.62, 0);
    ctx.lineTo(r * 0.18, -r * 0.56);
    ctx.lineTo(r * 0.68, 0);
    ctx.lineTo(r * 0.18, r * 0.56);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = light;
    ctx.fillRect(-r * 0.50, -r * 0.10, r * 0.82, r * 0.20);
  } else if (kind === "siege") {
    ctx.fillRect(-r * 0.16, -r * 1.10, r * 1.08, r * 0.24);
    ctx.fillStyle = light;
    ctx.fillRect(-r * 0.82, -r * 0.34, r * 0.30, r * 0.68);
    ctx.fillRect(r * 0.48, -r * 0.34, r * 0.30, r * 0.68);
  } else if (kind === "bomber") {
    ctx.strokeStyle = light;
    ctx.lineWidth = crispLine(2.0);
    for (let i = 0; i < 4; ++i) {
      const a = i * Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42);
      ctx.lineTo(Math.cos(a) * r * 0.84, Math.sin(a) * r * 0.84);
      ctx.stroke();
    }
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "healer") {
    ctx.fillStyle = light;
    ctx.fillRect(-r * 0.12, -r * 0.48, r * 0.24, r * 0.96);
    ctx.fillRect(-r * 0.48, -r * 0.12, r * 0.96, r * 0.24);
  } else if (kind === "worker") {
    ctx.save();
    ctx.rotate(-currentUnitTextAngle + Math.PI / 4);
    ctx.fillStyle = light;
    ctx.fillRect(-r * 0.20, -r * 0.20, r * 0.40, r * 0.40);
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(-r * 0.44, r * 0.24);
    ctx.lineTo(r * 0.42, -r * 0.34);
    ctx.stroke();
  } else if (kind === "vulture") {
    ctx.strokeStyle = dark;
    ctx.lineWidth = crispLine(2.5);
    ctx.beginPath();
    ctx.moveTo(-r * 0.46, -r * 0.30);
    ctx.lineTo(r * 0.78, 0);
    ctx.lineTo(-r * 0.46, r * 0.30);
    ctx.stroke();
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.arc(-r * 0.56, -r * 0.34, r * 0.16, 0, Math.PI * 2);
    ctx.arc(-r * 0.56, r * 0.34, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "matrix_caster") {
    ctx.strokeStyle = dark;
    ctx.lineWidth = crispLine(2.4);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.55, r * 0.34, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = light;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.78, r * 0.48, 0, Math.PI * 0.10, Math.PI * 1.35);
    ctx.stroke();
  } else if (kind === "storm_caster") {
    ctx.strokeStyle = dark;
    ctx.lineWidth = crispLine(2.5);
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.62);
    ctx.lineTo(r * 0.20, -r * 0.04);
    ctx.lineTo(-r * 0.10, -r * 0.04);
    ctx.lineTo(r * 0.08, r * 0.58);
    ctx.stroke();
    ctx.strokeStyle = light;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.64, -Math.PI * 0.15, Math.PI * 0.70);
    ctx.stroke();
  } else if (kind === "skirmisher") {
    ctx.strokeStyle = dark;
    ctx.lineWidth = crispLine(2.4);
    ctx.beginPath();
    ctx.moveTo(-r * 0.58, -r * 0.26);
    ctx.lineTo(r * 0.72, 0);
    ctx.lineTo(-r * 0.58, r * 0.26);
    ctx.stroke();
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.arc(r * 0.36, 0, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFacingStripe(kind, r, team) {
  ctx.save();
  ctx.fillStyle = team;
  ctx.globalAlpha = 0.86;
  if (kind === "siege") {
    ctx.fillRect(r * 0.58, -r * 0.44, r * 0.12, r * 0.88);
  } else if (kind === "worker") {
    ctx.fillRect(r * 0.48, -r * 0.42, r * 0.14, r * 0.84);
  } else if (kind === "archer" || kind === "vulture" || kind === "skirmisher") {
    ctx.beginPath();
    ctx.moveTo(r * 1.12, 0);
    ctx.lineTo(r * 0.66, -r * 0.16);
    ctx.lineTo(r * 0.66, r * 0.16);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(r * 0.62, 0, Math.max(3.0, r * 0.18), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawReplayUnitAura(x, y, r, u) {
  if (u.ability === "none") return;
  const ready = u.cooldown === 0;
  const color = mixColor(teamColors[u.owner] ?? "#f3efe6", "#ffffff", 0.28);
  const pulse = 0.5 + 0.5 * Math.sin(animTime * (ready ? 7 : 3) + u.id);
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(4,6,7,0.86)";
  ctx.beginPath();
  ctx.arc(Math.round(x + r * 0.72), Math.round(y - r * 0.72), ready ? 5.2 : 4.0, 0, Math.PI * 2);
  ctx.fill();
  if (ready) {
    ctx.fillStyle = hexToRgba(color, 0.95);
    ctx.beginPath();
    ctx.arc(Math.round(x + r * 0.72), Math.round(y - r * 0.72), 3.4 + pulse * 0.8, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = hexToRgba(color, 0.34);
    ctx.lineWidth = crispLine(1.2);
    ctx.beginPath();
    ctx.arc(Math.round(x + r * 0.72), Math.round(y - r * 0.72), 3.2, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHealthPip(x, y, width, ratio, color) {
  drawBar(Math.round(x - width * 0.5), Math.round(y), width, 5, ratio, color);
}

function productionProgress(b) {
  const start = Number(b.pending_start_tick ?? snap?.tick ?? 0);
  const finish = Number(b.pending_finish_tick ?? snap?.tick ?? 0);
  const total = Math.max(1, finish - start);
  const left = Math.max(0, finish - (snap?.tick || 0));
  return Math.max(0, Math.min(1, (total - left) / total));
}

function drawProductionPip(x, y, width, ratio, classKey) {
  const palette = classPalette[classKey] || classPalette.soldier;
  const left = Math.round(x - width * 0.5);
  const top = Math.round(y);
  const w = Math.round(width);
  const h = 8;
  ctx.save();
  ctx.fillStyle = "rgba(3,5,7,0.82)";
  ctx.strokeStyle = "rgba(255,255,255,0.74)";
  ctx.lineWidth = crispLine(1.2);
  roundRect(left, top, w, h, 4);
  ctx.fill();
  ctx.stroke();
  const fillW = Math.max(2, Math.round((w - 4) * ratio));
  const g = ctx.createLinearGradient(left, top, left + w, top);
  g.addColorStop(0, palette.base);
  g.addColorStop(1, "#f5dd80");
  ctx.fillStyle = g;
  roundRect(left + 2, top + 2, fillW, h - 4, 3);
  ctx.fill();
  ctx.restore();
}

function crispLine(width = 1) {
  return Math.max(1, width);
}

function drawShadow(x, y, radius, alpha) {
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const value = Number.parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function mixColor(a, b, t) {
  const ca = parseHex(a);
  const cb = parseHex(b);
  const m = (x, y) => Math.round(x + (y - x) * t);
  return `#${[m(ca[0], cb[0]), m(ca[1], cb[1]), m(ca[2], cb[2])].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function parseHex(hex) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const value = Number.parseInt(full, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function drawBar(x, y, w, h, pct, color) {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, Math.max(0, Math.min(1, pct)) * w, h);
}

function roundRect(x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, Math.abs(w) * 0.5, Math.abs(h) * 0.5));
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawEffects() {
  if (!snap) return;
  const eventLimit = Infinity;
  let drawnEvents = 0;
  for (const e of snap.events || []) {
    if (drawnEvents++ >= eventLimit) break;
    const ttl = Math.max(0, (e.expires_tick - snap.tick) / 12);
    if (ttl <= 0) continue;
    const a = worldToScreen(e.from_x, e.from_y, 3);
    const b = worldToScreen(e.to_x, e.to_y, 3);
    const color = teamColors[e.owner] || "#fff";
    if (e.kind === "strike") {
      drawSlashEffect(a.x, a.y, b.x, b.y, color, ttl);
    } else if (e.kind === "siege_shell" || e.kind === "tank_shot") {
      drawBeamEffect(a.x, a.y, b.x, b.y, "#f6d57a", 5.0, 22, ttl, true);
      drawExplosionEffect(b.x, b.y, 18, color, ttl);
    } else if (e.kind === "storm_bolt") {
      drawBeamEffect(a.x, a.y, b.x, b.y, "#bba5ff", 3.8, 22, ttl, true);
    } else if (e.kind === "matrix_beam") {
      drawBeamEffect(a.x, a.y, b.x, b.y, "#75ffe0", 3.2, 18, ttl, true);
    } else if (e.kind === "bolt") {
      drawBeamEffect(a.x, a.y, b.x, b.y, "#76e6ff", 2.6, 14, ttl, true);
    } else {
      drawBeamEffect(a.x, a.y, b.x, b.y, color, e.kind === "arrow" ? 2.2 : 2.8, 12, ttl, e.kind !== "arrow");
    }
  }
  for (const e of snap.effects || []) {
    const ttl = Math.max(0, (e.expires_tick - snap.tick) / 26);
    if (ttl <= 0) continue;
    const p = worldToScreen(e.x, e.y, 4);
    const radius = Math.max(18, e.radius * scale() * (1.25 - ttl * 0.12));
    drawExplosionEffect(p.x, p.y, radius, teamColors[e.owner] || "#fff", ttl);
  }
}

function drawBeamEffect(x1, y1, x2, y2, color, width, glow, ttl, particles = false) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / len;
  const ny = dx / len;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.strokeStyle = hexToRgba(color, 0.14 * ttl);
  ctx.lineWidth = glow;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const core = ctx.createLinearGradient(x1, y1, x2, y2);
  core.addColorStop(0, hexToRgba(color, 0.12 * ttl));
  core.addColorStop(0.45, hexToRgba(mixColor(color, "#ffffff", 0.52), 0.92 * ttl));
  core.addColorStop(1, hexToRgba(color, 0.28 * ttl));
  ctx.strokeStyle = core;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  if (particles) {
    ctx.fillStyle = hexToRgba(mixColor(color, "#ffffff", 0.65), 0.88 * ttl);
    const phase = (animTime * 90) % len;
    for (let i = 0; i < 3; i++) {
      const t = ((phase + i * len / 4) % len) / len;
      const wobble = Math.sin(animTime * 12 + i * 1.9) * width * 1.7;
      ctx.beginPath();
      ctx.arc(x1 + dx * t + nx * wobble, y1 + dy * t + ny * wobble, Math.max(1.4, width * 0.52), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  drawBloom(x2, y2, color, glow * 0.42, ttl);
  ctx.restore();
}

function drawSlashEffect(x1, y1, x2, y2, color, ttl) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const cx = (x1 + x2) * 0.5;
  const cy = (y1 + y2) * 0.5;
  const r = Math.min(26, Math.max(11, Math.hypot(x2 - x1, y2 - y1) * 0.38));
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = hexToRgba(color, 0.78 * ttl);
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, r, angle - 0.90, angle + 0.80);
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,255,255,${0.72 * ttl})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.68, angle - 0.74, angle + 0.38);
  ctx.stroke();
  drawBloom(x2, y2, color, 11, ttl);
  ctx.restore();
}

function drawExplosionEffect(x, y, radius, color, ttl) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  drawBloom(x, y, color, radius, ttl);
  ctx.strokeStyle = hexToRgba(mixColor(color, "#fff0a0", 0.45), 0.75 * ttl);
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(x, y, radius * (1.08 - ttl * 0.25), 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = hexToRgba("#ffe58a", 0.55 * ttl);
  for (let i = 0; i < 9; i++) {
    const a = i * 2.399 + animTime * 4.0;
    const rr = radius * (0.20 + ((i * 17) % 41) / 70);
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr, 1.2 + (i % 3) * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBloom(x, y, color, radius, ttl) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.0);
  g.addColorStop(0, hexToRgba(mixColor(color, "#ffffff", 0.55), 0.44 * ttl));
  g.addColorStop(0.35, hexToRgba(color, 0.22 * ttl));
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius * 2.0, 0, Math.PI * 2);
  ctx.fill();
}

function drawSelectionBox() {
  if (!drag || !drag.box) return;
  ctx.save();
  ctx.strokeStyle = "#f6e8a8";
  ctx.fillStyle = "rgba(246,232,168,0.08)";
  const x = Math.min(drag.x, drag.cx);
  const y = Math.min(drag.y, drag.cy);
  const w = Math.abs(drag.cx - drag.x);
  const h = Math.abs(drag.cy - drag.y);
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

function drawCommandMarker() {
  if (!commandMarker || !snap) return;
  const age = (performance.now() - commandMarker.time) / 1000;
  if (age > 0.9) {
    commandMarker = null;
    return;
  }
  const p = worldToScreen(commandMarker.x, commandMarker.y, 0.8);
  const t = 1 - age / 0.9;
  const color = commandMarker.color || "#f4d35e";
  const r = 11 + (1 - t) * 18;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = hexToRgba(color, 0.78 * t);
  ctx.lineWidth = crispLine(2.4);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - r);
  ctx.lineTo(p.x + r, p.y);
  ctx.lineTo(p.x, p.y + r);
  ctx.lineTo(p.x - r, p.y);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = hexToRgba(color, 0.22 * t);
  ctx.fill();
  ctx.restore();
}

function draw() {
  resizeCanvas();
  drawGround();
  if (!snap) return;
  updateUnitVisuals();
  for (const m of snap.minerals || []) drawMineral(m);
  const displayUnits = (snap.units || []).map((item) => {
    const visual = unitVisualPosition(item);
    const p = worldToScreen(visual.x, visual.y, unitHoverHeight(item));
    const offset = renderSeparationOffset(item);
    return { kind: "unit", item, u: item, x: p.x + offset.x, y: p.y + offset.y, r: unitRadius(item), depth: visual.y + 0.1 };
  });
  separateDisplayUnits(displayUnits);
  const things = [
    ...(snap.buildings || []).map((item) => ({ kind: "building", item, depth: item.y })),
    ...displayUnits,
  ].sort((a, b) => a.depth - b.depth);
  for (const t of things) t.kind === "building" ? drawBuilding(t.item) : drawUnit(t.item, t);
  drawEffects();
  drawCommandMarker();
  drawSelectionBox();
  drawFpsOverlay();
  updatePanel();
}

function drawFpsOverlay() {
  ctx.save();
  ctx.font = "700 12px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  const text = `${fps.toFixed(0)} fps`;
  const padX = 8;
  const padY = 4;
  const w = ctx.measureText(text).width + padX * 2;
  const h = 18;
  const x = canvas.width - 10 - w;
  const y = 10;
  ctx.fillStyle = "rgba(8,10,12,0.66)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(220,218,204,0.30)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = fps >= 50 ? "#a4f0a4" : fps >= 30 ? "#f5dd80" : "#ff9a7a";
  ctx.fillText(text, x + w - padX, y + padY);
  ctx.restore();
}

function updateUnitVisuals() {
  const alive = new Set();
  const alpha = 0.32;
  for (const u of snap.units || []) {
    alive.add(u.id);
    const old = unitVisuals.get(u.id);
    if (!old) {
      unitVisuals.set(u.id, { x: u.x, y: u.y });
      continue;
    }
    const d = Math.hypot(u.x - old.x, u.y - old.y);
    if (d > 28) {
      old.x = u.x;
      old.y = u.y;
    } else {
      old.x += (u.x - old.x) * alpha;
      old.y += (u.y - old.y) * alpha;
    }
  }
  for (const id of unitVisuals.keys()) {
    if (!alive.has(id)) unitVisuals.delete(id);
  }
}

function updatePanel() {
  if (!snap) return;
  const selectedLabel = selected.size ? `${selected.size} selected` : attackMode ? "attack target" : expandMode ? "choose expansion" : "ready";
  if (statusEl) statusEl.textContent = lanMode ? (lan.started ? "LAN live" : "LAN lobby") : selectedLabel;
  updateResultBanner();

  const now = performance.now();
  const tickBucket = Math.floor((snap.tick || 0) / 10);
  const playerSig = (snap.players || [])
    .map((p) => `${p.id}:${Math.floor(p.mana)}:${Math.round(p.active_supply ?? 0)}:${Math.round(p.pending_supply ?? 0)}:${Math.round(p.queued_supply ?? 0)}:${Math.round(p.supply_cap ?? 0)}:${Math.floor(p.income_total)}:${p.construction_queue_used ?? 0}:${(p.production_queue || []).join(".")}`)
    .join("|");
  const buildingSig = (snap.buildings || [])
    .filter((b) => b.owner >= 0 || b.human_claim_intent_owner >= 0 || b.claim_progress > 0)
    .map((b) => `${b.id}:${b.owner}:${b.human_claim_intent_owner}:${Math.round(b.claim_progress || 0)}:${b.pending_card_id || 0}:${b.pending_finish_tick || -1}`)
    .join(",");
  const panelKey = `${tickBucket}|${controlledPlayer()}|${selected.size}|${playerSig}|${(snap.units || []).length}|${buildingSig}|${lan.started}|${lan.ready}`;
  const panelInterval = 130;
  if (panelKey === lastPanelKey && now - lastPanelUpdateAt < panelInterval) return;
  lastPanelKey = panelKey;
  lastPanelUpdateAt = now;

  updateProductionAffordability();
  if (resourceHud) resourceHud.innerHTML = "";
  if (productionReadout) productionReadout.innerHTML = productionReadoutHtml();
  const lanSummary = lanMode ? lanLobbyHtml() : "";
  panelEl.innerHTML = `${lanSummary}<div class="panel-resources">${resourceHudHtml()}</div>${productionQueueHtml(controlledPlayer())}${campaignUnlockHtml()}${botAdminSummaryHtml()}`;
  updateTutorial();
}

function productionReadoutHtml() {
  const player = (snap.players || []).find((p) => p.id === controlledPlayer());
  const mana = Math.floor(player?.mana ?? 0);
  const queueUsed = Number(player?.construction_queue_used ?? (player?.production_queue || []).length);
  const queueCapacity = Number(player?.construction_queue_capacity ?? 3);
  const openSlots = Math.max(0, queueCapacity - queueUsed);
  const ready = openSlots > 0 ? productionUnits.filter((item) => isUnitUnlocked(item.unit) && mana + 1e-6 >= item.cost) : [];
  const readyHtml = ready.length
    ? ready.slice(0, 5).map((item) => `<span style="--chip:${classPalette[item.classKey]?.base || "#f5dd80"}">${unitIconHtml(item.classKey, 20)}${escapePanelText(item.label)}</span>`).join("")
    : `<em>${openSlots > 0 ? "Nothing affordable yet" : "Queue full"}</em>`;
  const notice = lastProductionNotice && performance.now() < lastProductionNotice.until
    ? `<div class="production-notice">${escapePanelText(lastProductionNotice.message)}</div>`
    : "";
  return `<div class="production-readout-main"><b>$${mana}</b><span>${openSlots}/${queueCapacity} open</span></div><div class="production-ready">${readyHtml}</div>${notice}`;
}

function resourceHudHtml() {
  const players = (snap.players || []).filter((p) => p.id >= 0 && p.id < teamNames.length);
  const ownId = controlledPlayer();
  const ordered = [...players].sort((a, b) => (a.id === ownId ? -1 : b.id === ownId ? 1 : a.id - b.id));
  return ordered.slice(0, lanMode ? 4 : 2).map(playerResourceCardHtml).join("");
}

function playerResourceCardHtml(p) {
  const units = (snap.units || []).filter((u) => u.owner === p.id && u.alive !== false);
  const workers = units.filter((u) => u.class === "worker").length;
  const army = units.length - workers;
  const bases = (snap.buildings || []).filter((b) => b.owner === p.id && b.alive !== false).length;
  const supplyActive = Math.round(p.active_supply ?? 0);
  const supplyPending = Math.round(p.pending_supply ?? 0);
  const supplyQueued = Math.round(p.queued_supply ?? 0);
  const supplyUsed = supplyActive + supplyPending + supplyQueued;
  const supplyCap = Math.round(p.supply_cap ?? 0);
  const supplyLabel = `${supplyUsed}/${supplyCap}`;
  const income = Math.floor(p.income_total ?? 0);
  const bank = Math.floor(p.mana ?? 0);
  const queue = Array.isArray(p.production_queue) ? p.production_queue : [];
  const queueUsed = Number(p.construction_queue_used ?? queue.length);
  const queueCapacity = Number(p.construction_queue_capacity ?? 3);
  const queueChips = queue.length
    ? queue.map((cardId) => {
        const item = productionByCardId.get(Number(cardId));
        const palette = (item && classPalette[item.classKey]) || classPalette.soldier;
        return `<span class="hud-queue-chip" style="--chip:${palette.base}" title="${item ? item.label : "card " + cardId}">${item ? item.label[0] : "?"}</span>`;
      }).join("")
    : `<span class="hud-queue-empty">idle</span>`;
  const selectedOwn = p.id === controlledPlayer() && selected.size ? `<span class="hud-selected">${selected.size} selected</span>` : "";
  return `<article class="resource-card ${p.id === controlledPlayer() ? "own" : "enemy"}" style="--team:${teamColors[p.id]}">
    <header><b>${teamNames[p.id]}</b><span>P${p.id}</span>${selectedOwn}</header>
    <div class="hud-main"><span>$${Math.max(0, bank)}</span><em>${income}/t income</em></div>
    <div class="hud-queue ${queueUsed < queueCapacity ? "has-space" : "full"}"><b>${queueUsed}/${queueCapacity} queue</b><div class="hud-queue-chips">${queueChips}</div></div>
    <div class="hud-grid">
      <span><b>${supplyLabel}</b><em>supply</em></span>
      <span><b>${workers}</b><em>workers</em></span>
      <span><b>${army}</b><em>army</em></span>
      <span><b>${bases}</b><em>bases</em></span>
    </div>
    <div class="hud-plan">${escapePanelText(shortPlan(p.production_reason || p.posture || ""))}</div>
	  </article>`;
}

function playerBank(pid = controlledPlayer()) {
  return Number((snap?.players || []).find((p) => p.id === pid)?.mana ?? 0);
}

function canAffordExpansion(pid = controlledPlayer()) {
  return playerBank(pid) + 1e-6 >= EXPANSION_COST;
}

function campaignUnlockHtml() {
  if (!campaignMode) return "";
  const labels = productionUnits
    .filter((item) => isUnitUnlocked(item.unit))
    .map((item) => `<span>${unitIconHtml(item.classKey, 22)}${escapePanelText(item.label)}</span>`)
    .join("");
  return `<div class="campaign-unlocks"><strong>Unlocked</strong><div>${labels}</div></div>`;
}

function productionQueueHtml(pid) {
  const player = (snap.players || []).find((p) => p.id === pid) || {};
  const capacity = Number(player.construction_queue_capacity ?? 3);
  const details = Array.isArray(player.production_queue_details) ? player.production_queue_details : [];
  const staticPending = (snap.buildings || [])
    .filter((b) => b.owner === pid && b.alive && Number(b.pending_card_id || 0) > 0)
    .map((b) => ({
      card_id: Number(b.pending_card_id),
      remaining_ticks: Math.max(0, Number(b.pending_finish_tick ?? snap.tick ?? 0) - (snap.tick || 0)),
      ready_tick: Number(b.pending_finish_tick ?? snap.tick ?? 0),
      queued_tick: Number(b.pending_start_tick ?? snap.tick ?? 0),
    }));
  const items = [...details, ...staticPending].slice(0, capacity);
  const rows = Array.from({ length: capacity }, (_, slot) => {
    const entry = items[slot];
    if (!entry) {
      return `<div class="build-row empty"><span class="queue-slot-number">${slot + 1}</span><span>Open production slot</span><span class="build-countdown">ready</span></div>`;
    }
    const item = productionByCardId.get(Number(entry.card_id)) || { label: "Unit", classKey: "soldier" };
    const queued = Number(entry.queued_tick ?? snap.tick ?? 0);
    const ready = Number(entry.ready_tick ?? snap.tick ?? 0);
    const total = Math.max(1, ready - queued);
    const left = Math.max(0, Number(entry.remaining_ticks ?? (ready - (snap.tick || 0))));
    const pct = Math.max(0, Math.min(100, ((total - left) / total) * 100));
    const palette = classPalette[item.classKey] || classPalette.soldier;
    return `<div class="build-row active" style="--p:${pct.toFixed(1)}%;--bar:${palette.base};--bar-hi:${palette.hi || "#f5dd80"}">
      <span class="unit-chip">${unitIconHtml(item.classKey, 26)}</span>
      <span>${escapePanelText(item.label)}</span>
      <span class="build-countdown">${left}t · ${Math.round(pct)}%</span>
      <i></i>
    </div>`;
  }).join("");
  const used = Number(player.construction_queue_used ?? items.length);
  const bank = Math.floor(Number(player.mana ?? 0));
  const affordCount = productionUnits.filter((item) => isUnitUnlocked(item.unit) && bank >= item.cost).length;
  const state = used < capacity ? `${capacity - used} open · ${affordCount} affordable` : "queue full";
  return `<div class="build-queue"><strong>Production <span>${state}</span></strong>${rows}</div>`;
}

function escapePanelText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[ch]));
}

function lanLobbyHtml() {
  const players = lan.players.map((p, i) => {
    const cls = p.bot || p.ready ? "ready" : p.connected ? "connected" : "open";
    const state = p.bot ? "Bot" : p.connected ? "Connected" : "Open";
    const ready = p.ready ? "Ready" : "Waiting";
    return `<span class="lan-player ${cls}"><b>P${i}</b>${state}<em>${ready}</em></span>`;
  }).join("") || "waiting for relay";
  const desync = lan.desyncs?.length ? ` · desync ${lan.desyncs.at(-1).tick}` : "";
  const buffered = [...lan.packets.values()].reduce((total, commands) => total + commands.length, 0);
  const net = lan.netError
    ? `<div class="lan-net bad">Net ${escapePanelText(lan.netError)}</div>`
    : `<div class="lan-net">Net OK · buffered ${buffered} · api ${escapePanelText(lan.apiOrigin || "local")}</div>`;
  const inviteRows = (lan.inviteUrls || [])
    .filter((entry) => entry && !entry.bot && entry.url)
    .map((entry) => `<a class="lan-invite" href="${entry.url}" target="_blank" rel="noreferrer">P${entry.id} link</a>`)
    .join("");
  const capture = lan.captureDir ? `<div class="muted lan-capture">${lan.captureDir}</div>` : "";
  const rematch = lan.pendingSeatUrl ? `<a class="lan-rematch" href="${lan.pendingSeatUrl}">Rematch ready</a>` : "";
  return `<div class="scenario-summary lan-summary">
    <strong>LAN Lobby · You are P${controlledPlayer()}</strong>
    <div class="lan-player-row">${players}</div>
    <div class="objective">${lan.started ? "Match live" : "Ready up to start"} · input ${lan.inputDelay} · visual ${lan.visualDelay} · relay ${lan.serverTick}${desync}</div>
    ${net}
    ${rematch}
    ${inviteRows ? `<div class="lan-invites">${inviteRows}</div>` : ""}
    ${capture}
  </div>`;
}

function shortPlan(reason = "") {
  return reason.replace(/^cc_/, "").replace(/^command_center_/, "").replaceAll("_", " ");
}

function updateProductionAffordability() {
  const me = (snap.players || []).find((p) => p.id === controlledPlayer());
  const mana = me?.mana ?? 0;
  const queueUsed = Number(me?.construction_queue_used ?? (me?.production_queue || []).length);
  const queueCapacity = Number(me?.construction_queue_capacity ?? 3);
  const readyQueueSlot = queueUsed < queueCapacity;
  for (const item of productionUnits) {
    const button = productionBar.querySelector(`[data-unit="${item.unit}"]`);
    if (!button) continue;
    const noMana = mana + 1e-6 < item.cost;
    button.disabled = !readyQueueSlot || noMana;
    const stateLabel = button.querySelector(".build-time");
    if (stateLabel) {
      stateLabel.textContent = readyQueueSlot ? (noMana ? `need $${Math.ceil(item.cost - mana)}` : "ready") : "queue full";
    }
    button.classList.toggle("unaffordable", button.disabled);
    button.classList.toggle("affordable", readyQueueSlot && !noMana);
    button.classList.toggle("no-slot", !readyQueueSlot);
    button.classList.toggle("no-money", readyQueueSlot && noMana);
    button.classList.toggle("no-materials", false);
  }
}

function updateResultBanner() {
  const own = controlledPlayer();
  const ownAlive = (snap.buildings || []).some((b) => b.owner === own && b.alive);
  const enemyAlive = (snap.buildings || []).some((b) => b.owner >= 0 && b.owner !== own && b.alive);
  if (ownAlive && enemyAlive) {
    resultBanner.classList.add("hidden");
    return;
  }
  const won = ownAlive && !enemyAlive;
  const lost = !ownAlive && enemyAlive;
  resultBanner.classList.remove("hidden", "win", "loss");
  resultBanner.classList.add(won ? "win" : lost ? "loss" : "draw");
  const rematchText = lanMode ? " Rematch starts shortly." : "";
  resultBanner.innerHTML = `<strong>${won ? "Victory" : lost ? "Defeat" : "Base Trade"}</strong><span>${won ? "All enemy buildings destroyed." : lost ? "All owned buildings destroyed." : "No owned buildings remain."}${rematchText}</span>`;
  if (lanMode && lan.started && controlledPlayer() === 0 && !lan.autoRematchScheduled) {
    lan.autoRematchScheduled = true;
    setTimeout(() => resetLiveGame(), 4500);
  }
}

function unitLegendHtml() {
  const keys = ["worker", "soldier", "archer", "bomber", "siege", "vulture", "healer", "matrix_caster", "storm_caster", "skirmisher"];
  return `<div class="unit-legend">${keys.map((k) => {
    return `<span title="${unitTooltip(k)}">${unitIconHtml(k, 28)}<b>${k.replace("_", " ")}</b></span>`;
  }).join("")}</div>`;
}

function countBy(items, key) {
  const out = {};
  for (const item of items) out[item[key]] = (out[item[key]] || 0) + 1;
  return out;
}

function clientPoint(evt) {
  const rect = canvas.getBoundingClientRect();
  const ratioX = canvas.width / rect.width;
  const ratioY = canvas.height / rect.height;
  return { x: (evt.clientX - rect.left) * ratioX, y: (evt.clientY - rect.top) * ratioY };
}

function unitAt(point, owner = null) {
  if (!snap) return null;
  let best = null;
  let bestD = 1e9;
  for (const u of snap.units || []) {
    if (owner !== null && u.owner !== owner) continue;
    const visual = unitVisualPosition(u);
    const p = worldToScreen(visual.x, visual.y, 2);
    const d = Math.hypot(point.x - p.x, point.y - p.y);
    const radius = Math.max(20, unitRadius(u) + 5);
    if (d < radius && d < bestD) {
      best = u;
      bestD = d;
    }
  }
  return best;
}

function buildingAt(point) {
  if (!snap) return null;
  let best = null;
  let bestD = 1e9;
  for (const b of snap.buildings || []) {
    if (!b.alive) continue;
    const base = worldToScreen(b.x, b.y, 0);
    const top = worldToScreen(b.x, b.y, b.kind === "main" ? 5 : 3);
    const world = screenToWorld(point.x, point.y);
    const screenD = Math.min(Math.hypot(point.x - base.x, point.y - base.y), Math.hypot(point.x - top.x, point.y - top.y));
    const worldD = Math.hypot(world.x - b.x, world.y - b.y);
    const threshold = b.kind === "main" ? 54 : 48;
    if ((screenD < threshold || worldD < 10.5) && screenD < bestD) {
      best = b;
      bestD = screenD;
    }
  }
  return best;
}

function mineralAt(point) {
  if (!snap) return null;
  let best = null;
  let bestD = 1e9;
  for (const m of snap.minerals || []) {
    if ((m.amount ?? 0) <= 0) continue;
    const p = worldToScreen(m.x, m.y, 1.3);
    const d = Math.hypot(point.x - p.x, point.y - p.y);
    if (d < 26 && d < bestD) {
      best = m;
      bestD = d;
    }
  }
  return best;
}

canvas.addEventListener("pointerdown", (evt) => {
  canvas.setPointerCapture(evt.pointerId);
  const p = clientPoint(evt);
  if (evt.pointerType === "touch") {
    activePointers.set(evt.pointerId, p);
    if (beginPinchIfNeeded()) {
      evt.preventDefault();
      return;
    }
  }
  p.pureMove = evt.ctrlKey || evt.metaKey;
  if (evt.button === 2) {
    evt.preventDefault();
    rightClick = { x: p.x, y: p.y, pureMove: p.pureMove, pointerId: evt.pointerId };
    drag = null;
    return;
  }
  const canPanMap = !attackMode && !expandMode && !evt.shiftKey;
  drag = {
    x: p.x,
    y: p.y,
    cx: p.x,
    cy: p.y,
    box: false,
    mode: canPanMap ? "pan-candidate" : "box",
    camera: { ...camera },
  };
});

canvas.addEventListener("pointermove", (evt) => {
  const p = clientPoint(evt);
  if (evt.pointerType === "touch" && activePointers.has(evt.pointerId)) {
    activePointers.set(evt.pointerId, p);
    if (activePointers.size >= 2) {
      if (!pinchStart) beginPinchIfNeeded();
      const [a, b] = [...activePointers.values()].slice(0, 2);
      const distance = Math.max(1, pointerDistance(a, b));
      const midpoint = pointerMidpoint(a, b);
      setZoomAroundScreenPoint(pinchStart.zoom * (distance / pinchStart.distance), midpoint);
      suppressPointerUntil = performance.now() + 280;
      evt.preventDefault();
      return;
    }
  }
  const hovered = buildingAt(p);
  hoverBuildingId = hovered && hovered.owner < 0 ? hovered.id : -1;
  if (!drag) return;
  drag.cx = p.x;
  drag.cy = p.y;
  const moved = Math.hypot(drag.cx - drag.x, drag.cy - drag.y);
  if (drag.mode === "pan-candidate" && moved > 8) {
    drag.mode = "pan";
    canvas.classList.add("dragging");
  }
  if (drag.mode === "pan") {
    panCameraFromDrag(drag, p);
    evt.preventDefault();
    return;
  }
  drag.box = moved > 8;
});

canvas.addEventListener("dblclick", (evt) => {
  const p = clientPoint(evt);
  const building = buildingAt(p) || nearestNeutralExpansion(p);
  if (!building || building.owner >= 0) return;
  evt.preventDefault();
  if (!canAffordExpansion()) {
    statusEl.textContent = "Need $100 to expand";
    return;
  }
  send({ type: "expand", player: controlledPlayer(), building_id: building.id, x: building.x, y: building.y });
  setCommandMarker(building.x, building.y, "expand");
  playCommandSound("expand", []);
  expandMode = false;
  attackMode = false;
  drag = null;
});

canvas.addEventListener("pointerup", (evt) => {
  const p = clientPoint(evt);
  if (evt.pointerType === "touch" && activePointers.has(evt.pointerId)) {
    activePointers.delete(evt.pointerId);
    if (pinchStart) {
      suppressPointerUntil = performance.now() + 280;
      if (activePointers.size < 2) pinchStart = null;
      drag = null;
      rightClick = null;
      evt.preventDefault();
      return;
    }
  }
  if (performance.now() < suppressPointerUntil) {
    drag = null;
    canvas.classList.remove("dragging");
    rightClick = null;
    evt.preventDefault();
    return;
  }
  p.pureMove = evt.ctrlKey || evt.metaKey;
  if (evt.button === 2 || rightClick) {
    evt.preventDefault();
    if (performance.now() - lastContextMenuOrderAt < 120) {
      rightClick = null;
      drag = null;
      canvas.classList.remove("dragging");
      return;
    }
    const orderPoint = rightClick
      ? { x: rightClick.x, y: rightClick.y, pureMove: rightClick.pureMove || p.pureMove, rightClick: true }
      : { ...p, rightClick: true };
    issueOrder(orderPoint);
    lastContextMenuOrderAt = performance.now();
    rightClick = null;
    drag = null;
    canvas.classList.remove("dragging");
    return;
  }
  if (!drag) return;
  if (drag.mode === "pan") {
    drag = null;
    canvas.classList.remove("dragging");
    evt.preventDefault();
    return;
  }
  const hadSelectedWorkers = selectedWorkers().length > 0;
  if (drag.box) {
    const x0 = Math.min(drag.x, drag.cx);
    const x1 = Math.max(drag.x, drag.cx);
    const y0 = Math.min(drag.y, drag.cy);
    const y1 = Math.max(drag.y, drag.cy);
    selected.clear();
    for (const u of snap.units || []) {
      if (u.owner !== controlledPlayer()) continue;
      const visual = unitVisualPosition(u);
      const sp = worldToScreen(visual.x, visual.y, 2);
      if (sp.x >= x0 && sp.x <= x1 && sp.y >= y0 && sp.y <= y1) selected.add(u.id);
    }
  } else if (attackMode || expandMode) {
    issueOrder(p);
  } else {
    const u = unitAt(p, controlledPlayer());
    if (u) {
      if (!evt.shiftKey) selected.clear();
      selected.add(u.id);
    } else {
      const building = buildingAt(p);
      const mineral = mineralAt(p);
      if (hadSelectedWorkers && (mineral || building)) {
        issueOrder(p);
      } else {
        if (!evt.shiftKey) selected.clear();
        if (building && building.owner < 0) issueOrder(p);
      }
    }
  }
  drag = null;
  canvas.classList.remove("dragging");
});

canvas.addEventListener("pointercancel", (evt) => {
  activePointers.delete(evt.pointerId);
  if (activePointers.size < 2) pinchStart = null;
  drag = null;
  canvas.classList.remove("dragging");
  rightClick = null;
});

canvas.addEventListener("contextmenu", (evt) => {
  evt.preventDefault();
  if (performance.now() < suppressPointerUntil) return;
  const p = clientPoint(evt);
  p.pureMove = evt.ctrlKey || evt.metaKey;
  p.rightClick = true;
  issueOrder(p);
  lastContextMenuOrderAt = performance.now();
  rightClick = null;
  drag = null;
  canvas.classList.remove("dragging");
});
canvas.addEventListener("wheel", (evt) => {
  if (!(evt.ctrlKey || evt.metaKey)) return;
  evt.preventDefault();
  const p = clientPoint(evt);
  const factor = Math.exp(-evt.deltaY * 0.0022);
  setZoomAroundScreenPoint(camera.zoom * factor, p);
}, { passive: false });

function setCommandMarker(x, y, kind, owner = controlledPlayer()) {
  commandMarker = {
    x,
    y,
    kind,
    color: kind === "move" ? "#f5dd80" : teamColors[owner] || "#f5dd80",
    time: performance.now(),
  };
}

function issueOrder(point) {
  if (!snap) return;
  const world = screenToWorld(point.x, point.y);
  const pureMove = Boolean(point.pureMove);
  const targetUnit = unitAt(point);
  const targetBuilding = buildingAt(point) || (expandMode ? nearestNeutralExpansion(point) : null);
  const targetMineral = mineralAt(point);
  const workerIds = selectedWorkers().map((u) => u.id);
  const ids = selected.size ? [...selected] : (point.rightClick || attackMode ? ownedCombatUnitIds() : []);
  if (targetBuilding && targetBuilding.owner < 0) {
    if (!canAffordExpansion()) {
      statusEl.textContent = "Need $100 to expand";
      expandMode = false;
      attackMode = false;
      return;
    }
    send({ type: "expand", player: controlledPlayer(), building_id: targetBuilding?.id ?? -1, x: targetBuilding.x, y: targetBuilding.y });
    setCommandMarker(targetBuilding.x, targetBuilding.y, "expand");
    playCommandSound("expand", workerIds);
    expandMode = false;
    attackMode = false;
    return;
  }
  if (expandMode) {
    if (!canAffordExpansion()) {
      statusEl.textContent = "Need $100 to expand";
      expandMode = false;
      attackMode = false;
      return;
    }
    send({ type: "expand", player: controlledPlayer(), building_id: -1, x: world.x, y: world.y });
    setCommandMarker(world.x, world.y, "expand");
    playCommandSound("expand", workerIds);
    expandMode = false;
    attackMode = false;
    return;
  }
  if (workerIds.length && targetMineral) {
    send({
      type: "gather",
      player: controlledPlayer(),
      unit_ids: workerIds,
      mineral_id: targetMineral.id,
      building_id: targetMineral.dropoff_building_id ?? -1,
      x: targetMineral.x,
      y: targetMineral.y,
    });
    setCommandMarker(targetMineral.x, targetMineral.y, "gather");
    playCommandSound("gather", workerIds);
    attackMode = false;
    return;
  }
  if (!pureMove && targetBuilding && targetBuilding.owner === controlledPlayer()) {
    send({ type: "deploy", player: controlledPlayer(), building_id: targetBuilding.id, release: true });
    setCommandMarker(targetBuilding.x, targetBuilding.y, "deploy");
    playCommandSound("deploy", []);
    if (!selected.size) {
      attackMode = false;
      return;
    }
  }
  if (workerIds.length && targetBuilding && targetBuilding.owner === controlledPlayer() && !pureMove) {
    // Only route workers to gather when the click is squarely on the
    // building, not just within buildingAt()'s generous near-radius.
    // Otherwise a click anywhere within ~10 units of any friendly base
    // sucks all workers in (the "autosplit" complaint). Pure-move (Ctrl)
    // always bypasses this so the click coordinate IS the destination.
    const onBuilding = Math.hypot(world.x - targetBuilding.x, world.y - targetBuilding.y) < 4.0;
    if (onBuilding) {
      send({
        type: "gather",
        player: controlledPlayer(),
        unit_ids: workerIds,
        building_id: targetBuilding.id,
        x: targetBuilding.x,
        y: targetBuilding.y,
      });
      setCommandMarker(targetBuilding.x, targetBuilding.y, "gather");
      playCommandSound("gather", workerIds);
      attackMode = false;
      return;
    }
  }
  if (!ids.length) return;
  if (!pureMove && targetUnit && targetUnit.owner !== controlledPlayer()) {
    send({ type: "attack", player: controlledPlayer(), unit_ids: ids, target_unit_id: targetUnit.id, x: targetUnit.x, y: targetUnit.y });
    setCommandMarker(targetUnit.x, targetUnit.y, "attack");
    playCommandSound("attack", ids);
  } else if (!pureMove && targetBuilding && targetBuilding.owner !== controlledPlayer()) {
    send({ type: "attack", player: controlledPlayer(), unit_ids: ids, target_building_id: targetBuilding.id, x: targetBuilding.x, y: targetBuilding.y });
    setCommandMarker(targetBuilding.x, targetBuilding.y, "attack");
    playCommandSound("attack", ids);
  } else {
    const type = pureMove ? "move" : "attack_move";
    send({ type, player: controlledPlayer(), unit_ids: ids, x: world.x, y: world.y });
    setCommandMarker(world.x, world.y, type);
    playCommandSound(type, ids);
  }
  attackMode = false;
}

function nearestNeutralExpansion(point) {
  if (!snap) return null;
  const world = screenToWorld(point.x, point.y);
  let best = null;
  let bestScore = 1e9;
  for (const b of snap.buildings || []) {
    if (!b.alive || b.owner >= 0 || b.kind === "main") continue;
    const sp = worldToScreen(b.x, b.y, 0);
    const screenD = Math.hypot(point.x - sp.x, point.y - sp.y);
    const worldD = Math.hypot(world.x - b.x, world.y - b.y);
    const score = Math.min(screenD / 5.0, worldD);
    if ((screenD < 86 || worldD < 16) && score < bestScore) {
      best = b;
      bestScore = score;
    }
  }
  return best;
}

function unitVisualPosition(u) {
  const existing = unitVisuals.get(u.id);
  if (!existing) return { x: u.x, y: u.y };
  return existing;
}

function selectedWorkers() {
  const ids = new Set(selected);
  return (snap?.units || []).filter((u) => ids.has(u.id) && u.owner === controlledPlayer() && u.class === "worker");
}

function ownedCombatUnitIds() {
  return (snap?.units || [])
    .filter((u) => u.alive !== false && u.owner === controlledPlayer() && u.class !== "worker")
    .map((u) => u.id);
}

function selectAllArmy() {
  selected.clear();
  for (const id of ownedCombatUnitIds()) selected.add(id);
  attackMode = false;
  expandMode = false;
  lastPanelKey = "";
}

function selectUnitsByClass(classKey) {
  selected.clear();
  for (const u of snap?.units || []) {
    if (u.alive !== false && u.owner === controlledPlayer() && u.class === classKey) selected.add(u.id);
  }
  attackMode = false;
  expandMode = false;
  lastPanelKey = "";
}

document.querySelector("#attackMove").onclick = () => { attackMode = true; expandMode = false; };
document.querySelector("#expand").onclick = () => { expandMode = true; attackMode = false; };
document.querySelector("#reset").onclick = resetLiveGame;
readyButton.addEventListener("click", () => setLanReady(!lan.ready));
soundButton?.addEventListener("click", toggleSound);
exportPlayLogButton?.addEventListener("click", exportPlayLog);
scenarioSelect.addEventListener("change", () => resetGame({ randomSeed: true, scenario: Number(scenarioSelect.value) }));
difficultySelect.addEventListener("change", () => resetGame({ randomSeed: true, scenario: currentScenario }));
speedSelect.addEventListener("change", () => {
  playSpeed = Number(speedSelect.value || 0.5);
  simAccumulator = 0;
});
randomScenarioButton.addEventListener("click", () => {
  const scenario = Math.floor(Math.random() * scenarios.length);
  resetGame({ randomSeed: true, scenario });
});
tutorialNext?.addEventListener("click", () => {
  tutorialStep = Math.min(tutorialSteps.length - 1, tutorialStep + 1);
  tutorialVisible = true;
  updateTutorial(true);
});
tutorialHide?.addEventListener("click", () => {
  tutorialVisible = false;
  localStorage.setItem("simsystem_tutorial_hidden", "1");
  updateTutorial(true);
});

window.addEventListener("keydown", (evt) => {
  if (evt.repeat) return;
  const target = evt.target;
  if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" || target.isContentEditable)) {
    return;
  }
  const key = evt.key.toLowerCase();
  const production = productionUnits.find((item) => item.key === key);
  if (evt.shiftKey && key === "a") {
    selectAllArmy();
    evt.preventDefault();
    return;
  }
  if (evt.shiftKey && production) {
    selectUnitsByClass(production.classKey);
    evt.preventDefault();
    return;
  }
  if (production) {
    produce(production.unit);
    evt.preventDefault();
    return;
  }
  if (key === "a") { attackMode = true; expandMode = false; evt.preventDefault(); }
  if (key === "x") { expandMode = true; attackMode = false; evt.preventDefault(); }
  if (key === "escape") { attackMode = false; expandMode = false; selected.clear(); evt.preventDefault(); }
  if (/^[0-9]$/.test(key)) {
    const idx = Number(key);
    if (evt.ctrlKey || evt.metaKey) controlGroups[idx] = new Set(selected);
    else selected = new Set([...controlGroups[idx]].filter((id) => (snap?.units || []).some((u) => u.id === id && u.alive !== false)));
    evt.preventDefault();
  }
});

function loop(t) {
  const dt = lastFrame ? (t - lastFrame) / 1000 : 1 / 60;
  fps = fps * 0.9 + (1 / Math.max(0.001, dt)) * 0.1;
  animTime = t / 1000;
  lastFrame = t;
  if (lanMode) {
    pollLan();
    pollLanLobby();
    stepLanToServer();
  } else if (Module && snap) {
    simAccumulator += dt * 60 * playSpeed;
    const ticks = Math.min(8, Math.floor(simAccumulator));
    if (ticks > 0) {
      stepEngine(ticks);
      simAccumulator -= ticks;
    }
  }
  playLiveAudio();
  draw();
  requestAnimationFrame(loop);
}

async function boot() {
  resizeCanvas();
  renderProductionButtons();
  renderScenarioOptions();
  scenarioSelect.value = String(currentScenario);
  difficultySelect.value = String(botDifficulty);
  speedSelect.value = String(playSpeed);
  if (typeof createSimsystemModule !== "function") {
    statusEl.textContent = "WASM build missing";
    draw();
    return;
  }
  Module = await createSimsystemModule();
  wasm = {
    init: Module.cwrap("simsystem_init", "number", ["number", "number"]),
    initScenario: Module.cwrap("simsystem_init_scenario", "number", ["number", "number", "number"]),
    initScenarioDifficulty: Module.cwrap("simsystem_init_scenario_difficulty", "number", ["number", "number", "number", "number"]),
    initMultiplayer: Module.cwrap("simsystem_init_multiplayer", "number", ["number", "number", "number"]),
    initLan: Module.cwrap("simsystem_init_lan", "number", ["number", "number", "number", "number"]),
    initLanDifficulty: Module.cwrap("simsystem_init_lan_difficulty", "number", ["number", "number", "number", "number", "number"]),
    initLanPlayers: Module.cwrap("simsystem_init_lan_players", "number", ["number", "number", "number", "number", "number", "number"]),
    step: Module.cwrap("simsystem_step", "number", ["number"]),
    snapshot: Module.cwrap("simsystem_snapshot", "number", []),
    command: Module.cwrap("simsystem_command", "number", ["number"]),
    free: Module.cwrap("simsystem_free", null, ["number"]),
  };
  initPlayLog();
  if (lanMode) {
    await pollLan(true);
    await pollLanLobby(true);
    seed = lan.seed;
    currentScenario = lan.scenario;
    botDifficulty = lan.botDifficulty || botDifficulty;
    snap = ptrJson(wasm.initLanPlayers(seed, 240000, currentScenario, lan.botMask, botDifficulty, lan.playerCount || 2));
    lastLiveAudioTick = snap?.tick ?? -1;
    updateLanChrome();
    appendPlayLog("engine_init", { mode: "lan", seed, scenario: currentScenario, botDifficulty, snapshot: compactSnapshot() });
  } else {
    snap = ptrJson(wasm.initScenarioDifficulty(seed, 240000, currentScenario, botDifficulty));
    applyBotAdminConfig();
    lastLiveAudioTick = snap?.tick ?? -1;
    appendPlayLog("engine_init", { mode: "local", seed, scenario: currentScenario, botDifficulty, snapshot: compactSnapshot() });
  }
  lastLoggedSnapshotTick = snap?.tick ?? -1;
  updateTutorial(true);
}

function decodeBase64Json(value) {
  if (!value) return null;
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
}

function applyBotAdminConfig() {
  const config = botAdminConfig || decodeBase64Json(urlParams.get("botAdmin"));
  const policy = urlParams.get("botPolicy") || config?.policy || "";
  if (policy) send({ type: "set_policy", player: 1, policy });
  const buildTimeScale = Number(config?.buildTimeScale ?? 1.0);
  if (Number.isFinite(buildTimeScale) && buildTimeScale > 0) {
    send({
      type: "set_bot_config",
      player: 1,
      build_time_scale: buildTimeScale,
      worker_target: Number(config?.targetWorkers ?? config?.workerTarget ?? 30),
    });
  }
  if (config) {
    statusEl.title = `Bot admin: workers ${config.targetWorkers ?? config.workerTarget}, build-time ${Math.round((Number(config.buildTimeScale) || 1) * 100)}%, expand ${config.expansionAggression ?? config.expandBias}, attack ${config.aggressionThreshold ?? config.attackThreshold}`;
  }
}

function updateTutorial(force = false) {
  if (!tutorialCard || !tutorialTitle || !tutorialBody || !tutorialNext) return;
  if (!tutorialVisible || !snap) {
    tutorialCard.classList.add("hidden");
    return;
  }
  while (tutorialStep < tutorialSteps.length - 1 && tutorialSteps[tutorialStep].done()) tutorialStep++;
  const step = tutorialSteps[tutorialStep];
  tutorialCard.classList.remove("hidden");
  tutorialTitle.textContent = step.title;
  tutorialBody.textContent = step.body;
  tutorialNext.textContent = tutorialStep >= tutorialSteps.length - 1 ? "Done" : "Next";
  if (force) tutorialCard.classList.add("pulse");
  setTimeout(() => tutorialCard.classList.remove("pulse"), 240);
}

window.simsystemDebug = {
  snapshot: () => snap,
  controlledPlayer,
  lan: () => ({ ...lan, packets: [...lan.packets.entries()] }),
  produce,
  send,
  setLanReady,
};

window.simsystemPlayLog = {
  current: () => playLog,
  archived: playLogArchive,
  export: exportPlayLog,
  append: appendPlayLog,
};

boot();
requestAnimationFrame(loop);
