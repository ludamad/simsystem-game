const canvas = document.querySelector("#arena");
let ctx = canvas.getContext("2d");
const file = document.querySelector("#file");
const play = document.querySelector("#play");
const prev = document.querySelector("#prev");
const next = document.querySelector("#next");
const exportVideo = document.querySelector("#exportVideo");
const sound = document.querySelector("#sound");
const speed = document.querySelector("#speed");
const eventSlow = document.querySelector("#eventSlow");
const scrub = document.querySelector("#scrub");
const tick = document.querySelector("#tick");
const rate = document.querySelector("#rate");
const exportStatus = document.querySelector("#exportStatus");
const offer = document.querySelector("#offer");
const players = document.querySelector("#players");
const metrics = document.querySelector("#metrics");

const defaultColors = ["#ff4f55", "#3ba7ff", "#f2cf48", "#62c878"];
const defaultTeamNames = ["RED", "BLUE", "GOLD", "GREEN"];
const exportVideoFps = 60;
const colors = [...defaultColors];
const teamNames = [...defaultTeamNames];
const classPalette = {
  soldier: { base: "#e64b36", hi: "#ff9a6f", lo: "#741b14", stroke: "#ffd3bf", mark: "#260704", label: "W" },
  archer: { base: "#f1cf34", hi: "#fff08c", lo: "#76580a", stroke: "#fff4a8", mark: "#281b03", label: "A" },
  worker: { base: "#1fc971", hi: "#8df0ae", lo: "#0b5b33", stroke: "#c9ffda", mark: "#062112", label: "$" },
  bomber: { base: "#ff2f86", hi: "#ff92c0", lo: "#7b0b40", stroke: "#ffd0e4", mark: "#fff2f7", label: "B" },
  siege: { base: "#6f89a8", hi: "#dcecff", lo: "#253447", stroke: "#e7f2ff", mark: "#071019", label: "S" },
  vulture: { base: "#18d6e8", hi: "#a9fbff", lo: "#075867", stroke: "#cfffff", mark: "#031a1d", label: "V" },
  healer: { base: "#f7f2d8", hi: "#ffffff", lo: "#7d9f76", stroke: "#fffbe7", mark: "#17683a", label: "+" },
  turret: { base: "#ff9324", hi: "#ffd17e", lo: "#7b3a02", stroke: "#ffdfaa", mark: "#251000", label: "T" },
  matrix_caster: { base: "#28e0b2", hi: "#b9fff0", lo: "#075c4d", stroke: "#d2fff7", mark: "#06251f", label: "◇" },
  storm_caster: { base: "#8c68ff", hi: "#dfd6ff", lo: "#261a82", stroke: "#ede8ff", mark: "#10082f", label: "Ψ" },
  skirmisher: { base: "#b7f04a", hi: "#e7ff9b", lo: "#42640d", stroke: "#efffba", mark: "#172306", label: "K" },
};
const classOrder = ["soldier", "archer", "worker", "bomber", "siege", "vulture", "healer", "turret", "matrix_caster", "storm_caster", "skirmisher"];
const ink = "#101316";
const terrain = {
  bg0: "#19201c",
  bg1: "#0e1211",
  grid: "rgba(205, 220, 190, 0.075)",
  ring: "rgba(226, 232, 210, 0.12)",
};
const iso = {
  x: 0.92,
  y: 0.48,
  z: 0.58,
};
let replay = null;
let index = 0;
let playing = false;
let markers = [];
let animTime = 0;
let currentView = { focusX: 0, focusY: 0, zoom: 1 };
let targetView = { focusX: 0, focusY: 0, zoom: 1 };
let lastFrameTime = 0;
let playbackAccumulator = 0;
let forceCameraCut = true;
let lastPanelIndex = -1;
let currentUnitTextAngle = 0;
let cameraDrag = null;
let smoothedFps = 60;
let exportingVideo = false;
let replaySourceName = "replay";
let soundEnabled = false;
let audioUnlocked = false;
let audioContext = null;
let musicTrack = null;
let lastAudioSnapshot = -1;
let soundError = "";
const soundCooldowns = new Map();
const unitSpriteCache = new Map();
const UNIT_SPRITE_DPR = 2;
let unitDamageFlashCacheIndex = -1;
let unitDamageFlashCache = new Map();
const soundFiles = {
  melee: ["assets/audio/rts_fps_pack/hit_1.wav", "assets/audio/rts_fps_pack/hit_2.wav", "assets/audio/rts_fps_pack/hit_3.wav"],
  hit: ["assets/audio/rts_fps_pack/hit_4.wav", "assets/audio/rts_fps_pack/hit_5.wav", "assets/audio/rts_fps_pack/hit_1a.wav"],
  shot: ["assets/audio/rts_fps_pack/shot_2.wav", "assets/audio/rts_fps_pack/shot_3.wav", "assets/audio/rts_fps_pack/shot_7.wav", "assets/audio/rts_fps_pack/shot_10.wav"],
  ability: ["assets/audio/rts_fps_pack/explosion_4.wav", "assets/audio/rts_fps_pack/explosion_5.wav", "assets/audio/rts_fps_pack/explosion_9.wav", "assets/audio/rts_fps_pack/explosion_11.wav"],
  economy: ["assets/audio/rts_fps_pack/misc_1.wav", "assets/audio/rts_fps_pack/misc_2.wav"],
  spawn: ["assets/audio/rts_fps_pack/shot_11.wav", "assets/audio/rts_fps_pack/misc_2.wav"],
  power: ["assets/audio/rts_fps_pack/rocket-engine_1.wav", "assets/audio/rts_fps_pack/explosion_1.wav"],
};
const musicSources = ["assets/audio/rts_theme.ogg", "assets/audio/theme.ogg", "assets/audio/theme.wav"];
const probeAudio = document.createElement("audio");
const chosenSoundFiles = Object.fromEntries(Object.entries(soundFiles).map(([key, sources]) => [key, playableAudioSources(sources)]));
const chosenMusicFile = playableAudioSource(musicSources);
const soundPools = new Map(Object.entries(chosenSoundFiles).map(([key, sources]) => [
  key,
  sources.flatMap((path) => Array.from({ length: key === "hit" || key === "shot" ? 2 : 1 }, () => {
    const audio = new Audio(path);
    audio.preload = "auto";
    return audio;
  })),
]));

function playableAudioSource(sources) {
  for (const source of sources) {
    if (source.endsWith(".ogg") && probeAudio.canPlayType("audio/ogg; codecs=vorbis")) return source;
    if (source.endsWith(".wav") && probeAudio.canPlayType("audio/wav")) return source;
  }
  return sources[sources.length - 1];
}

function playableAudioSources(sources) {
  return sources.filter((source) => {
    if (source.endsWith(".ogg")) return Boolean(probeAudio.canPlayType("audio/ogg; codecs=vorbis"));
    if (source.endsWith(".wav")) return Boolean(probeAudio.canPlayType("audio/wav"));
    return true;
  });
}

function teamLabel(id) {
  return `${teamNames[id] ?? `P${id}`} P${id}`;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const width = Math.max(640, Math.floor(rect.width * ratio));
  const height = Math.max(420, Math.floor(rect.height * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

window.addEventListener("resize", () => {
  resizeCanvas();
});

canvas.addEventListener("pointerdown", (event) => {
  canvas.setPointerCapture(event.pointerId);
  cameraDrag = {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    focusX: currentView.focusX,
    focusY: currentView.focusY,
  };
  canvas.classList.add("dragging");
});

canvas.addEventListener("pointermove", (event) => {
  if (!cameraDrag || cameraDrag.pointerId !== event.pointerId) return;
  const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const dx = (event.clientX - cameraDrag.x) * ratio;
  const dy = (event.clientY - cameraDrag.y) * ratio;
  const scale = mapScale();
  const sx = dx / Math.max(1, scale * iso.x);
  const sy = dy / Math.max(1, scale * iso.y);
  currentView.focusX = cameraDrag.focusX - (sx + sy) * 0.5;
  currentView.focusY = cameraDrag.focusY - (sy - sx) * 0.5;
  clampCamera();
  targetView = { ...currentView };
});

canvas.addEventListener("pointerup", endCameraDrag);
canvas.addEventListener("pointercancel", endCameraDrag);
canvas.addEventListener("wheel", (event) => {
  if (!replay) return;
  event.preventDefault();
  resizeCanvas();
  const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const rect = canvas.getBoundingClientRect();
  const sx = (event.clientX - rect.left) * ratio;
  const sy = (event.clientY - rect.top) * ratio;
  const before = screenToWorld(sx, sy);
  const factor = Math.exp(-event.deltaY * 0.0014);
  currentView.zoom = clamp(currentView.zoom * factor, 0.62, 2.45);
  const center = cameraCenter();
  const scale = mapScale();
  currentView.focusX = before.x - (sx - center.x) / scale;
  currentView.focusY = before.y - (sy - center.y) / scale;
  clampCamera();
  targetView = { ...currentView };
}, { passive: false });

canvas.addEventListener("dblclick", () => {
  resetCamera();
});

function renderLoop(time) {
  const dt = lastFrameTime ? Math.min(0.05, (time - lastFrameTime) / 1000) : 0;
  lastFrameTime = time;
  animTime = time / 1000;
  if (dt > 0) smoothedFps = lerp(smoothedFps, 1 / dt, 0.08);
  if (replay) {
    if (playing) advancePlayback(dt);
    draw();
  }
  requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);

async function loadReplayUrl(url) {
  const response = await fetch(url);
  replay = await response.json();
  replaySourceName = replayNameFromUrl(url);
  resetReplay();
}

file.addEventListener("change", async (event) => {
  const selected = event.target.files[0];
  if (!selected) return;
  replay = JSON.parse(await selected.text());
  replaySourceName = selected.name.replace(/\.json$/i, "") || "replay";
  resetReplay();
});

function resetReplay() {
  syncDisplayTeams();
  index = 0;
  markers = buildMarkers();
  lastPanelIndex = -1;
  lastAudioSnapshot = -1;
  soundCooldowns.clear();
  scrub.max = Math.max(0, replay.snapshots.length - 1);
  scrub.value = "0";
  resizeCanvas();
  resetCamera();
  draw();
}

function syncDisplayTeams() {
  for (let i = 0; i < defaultColors.length; ++i) {
    colors[i] = defaultColors[i];
    teamNames[i] = defaultTeamNames[i];
  }
  const bases = replay?.map?.bases ?? [];
  const playersInReplay = replay?.snapshots?.[0]?.players ?? [];
  if (playersInReplay.length !== 2 || bases.length < 2) return;
  const sorted = bases
    .filter((base) => base.player === 0 || base.player === 1)
    .sort((a, b) => a.x - b.x);
  if (sorted.length !== 2) return;
  const leftPlayer = sorted[0].player;
  const rightPlayer = sorted[1].player;
  colors[leftPlayer] = defaultColors[0];
  teamNames[leftPlayer] = defaultTeamNames[0];
  colors[rightPlayer] = defaultColors[1];
  teamNames[rightPlayer] = defaultTeamNames[1];
}

play.addEventListener("click", () => {
  playing = !playing;
  play.textContent = playing ? "⏸" : "▶";
  startPlayback();
});

speed.addEventListener("change", () => {
  playbackAccumulator = 0;
});

function startPlayback() {
  playbackAccumulator = 0;
  if (soundEnabled) startMusic();
}

async function toggleSound() {
  soundEnabled = !soundEnabled;
  sound?.classList.toggle("enabled", soundEnabled);
  if (sound) sound.textContent = soundEnabled ? "Audio on" : "Enable audio";
  if (soundEnabled) {
    const unlocked = await unlockAudioFromGesture();
    if (!unlocked) {
      soundEnabled = false;
      sound?.classList.remove("enabled");
      if (sound) sound.textContent = "Enable audio";
      return;
    }
    primeSounds();
    startMusic();
    playSound("power", 0.78, true);
    lastAudioSnapshot = index;
    setAudioStatus(`audio on · click unlocked`);
  } else {
    stopMusic();
    setAudioStatus("");
  }
}

async function unlockAudioFromGesture() {
  if (audioUnlocked) return true;
  const source = chosenSoundFiles.power?.[0] || chosenMusicFile;
  if (!source) {
    setAudioStatus("audio missing");
    return false;
  }
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
    unlock.preload = "auto";
    unlock.volume = 0.001;
    await unlock.play();
    unlock.pause();
    unlock.currentTime = 0;
    audioUnlocked = true;
    soundError = "";
    return true;
  } catch (error) {
    soundError = `${error?.name || "audio blocked"} · click Enable audio`;
    setAudioStatus(soundError);
    return false;
  }
}

function primeSounds() {
  for (const pool of soundPools.values()) {
    for (const audio of pool) audio.load();
  }
}

function startMusic() {
  if (!soundEnabled || !audioUnlocked) return;
  if (!musicTrack) {
    musicTrack = new Audio(chosenMusicFile);
    musicTrack.loop = true;
    musicTrack.volume = 0.18;
  }
  musicTrack.play()
    .then(() => {
      soundError = "";
      setAudioStatus("audio on");
    })
    .catch((error) => {
      soundError = error?.name || "audio blocked";
      setAudioStatus(soundError);
    });
}

function stopMusic() {
  if (!musicTrack) return;
  musicTrack.pause();
}

function playSnapshotAudio(prevIndex, nextIndex) {
  if (!soundEnabled || !audioUnlocked || !playing || !replay?.snapshots?.length) return;
  if (nextIndex === lastAudioSnapshot) return;
  lastAudioSnapshot = nextIndex;
  const snap = replay.snapshots[nextIndex];
  if (!snap) return;
  const tickNow = snap.tick ?? nextIndex;
  let played = 0;
  for (const effect of snap.effects ?? []) {
    if (played >= 5) break;
    const key = soundForEffect(effect.kind);
    if (!key || !canPlaySound(key, tickNow)) continue;
    playSound(key, volumeForEffect(effect.kind));
    played++;
  }
  for (const event of snap.events ?? []) {
    if (played >= 7) break;
    const key = soundForEvent(event.kind);
    if (!key || !canPlaySound(key, tickNow)) continue;
    playSound(key, key === "melee" ? 0.44 : 0.34);
    played++;
  }
}

function soundForEffect(kind) {
  if (kind === "explode" || kind === "siege_blast" || kind === "psionic_storm" || kind === "disrupt") return "ability";
  if (kind === "volley") return "shot";
  if (kind === "charge" || kind === "damage" || kind === "building_damage") return "hit";
  if (kind === "claim" || kind === "repair") return "economy";
  if (kind === "deploy_turret" || kind === "base_upgrade" || kind === "defense_matrix") return "power";
  if (kind === "collapse") return "ability";
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
  if (kind === "claim" || kind === "repair") return 0.22;
  if (kind === "damage" || kind === "building_damage") return 0.18;
  return 0.32;
}

function canPlaySound(key, tickNow) {
  const minGap = key === "hit" || key === "shot" ? 30 : key === "economy" ? 95 : 52;
  const last = soundCooldowns.get(key) ?? -1e9;
  if (tickNow - last < minGap) return false;
  soundCooldowns.set(key, tickNow);
  return true;
}

function playSound(key, volume = 0.38, force = false) {
  if (!audioUnlocked) return;
  const pool = soundPools.get(key);
  if (!pool) return;
  const audio = pool.find((candidate) => candidate.paused || candidate.ended) ?? pool[0];
  audio.pause();
  audio.currentTime = 0;
  audio.volume = volume;
  audio.play()
    .then(() => {
      if (force) setAudioStatus("audio on");
    })
    .catch((error) => {
      soundError = error?.name || "audio blocked";
      setAudioStatus(soundError);
    });
}

function setAudioStatus(message) {
  if (!exportStatus || exportingVideo) return;
  exportStatus.textContent = message || soundError || "";
}

function advancePlayback(dt) {
  if (!replay?.snapshots?.length) return;
  playbackAccumulator += dt * 1000;
  let guard = 0;
  while (playbackAccumulator >= playbackDelay() && guard++ < 4) {
    playbackAccumulator -= playbackDelay();
    const nextIndex = (index + 1) % replay.snapshots.length;
    playSnapshotAudio(index, nextIndex);
    index = nextIndex;
    scrub.value = String(index);
  }
}

function playbackDelay() {
  const base = Number(speed.value);
  if (!eventSlow?.checked) return base;
  return nearMajorMarker(index, 3) ? Math.max(base, 180) : base;
}

scrub.addEventListener("input", () => {
  index = Number(scrub.value);
  playbackAccumulator = 0;
});

prev.addEventListener("click", () => jumpMarker(-1));
next.addEventListener("click", () => jumpMarker(1));
exportVideo?.addEventListener("click", exportReplayVideo);
sound?.addEventListener("click", toggleSound);

function jumpMarker(direction) {
  if (!replay || markers.length === 0) return;
  const sorted = direction < 0 ? [...markers].reverse() : markers;
  const target = sorted.find((m) => direction < 0 ? m.index < index : m.index > index) ?? sorted[0];
  index = target.index;
  scrub.value = String(index);
  playbackAccumulator = 0;
}

function endCameraDrag(event) {
  if (!cameraDrag || cameraDrag.pointerId !== event.pointerId) return;
  cameraDrag = null;
  canvas.classList.remove("dragging");
}

function card(id) {
  return replay?.cards?.find((c) => c.id === id) ?? { icon: "?", name: "Unknown" };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function playerPolicy(player, snap) {
  return snap?.players?.find((p) => p.id === player)?.policy ?? replay?.policies?.[player] ?? "unknown";
}

function playerStrategy(player, snap) {
  return snap?.players?.find((p) => p.id === player)?.bot_strategy ?? "unknown";
}

function scriptKind(strategy) {
  if (strategy === "deep_kite" || strategy === "wide_kite" || strategy === "anti_anti_kite") return "deep_kite";
  if (strategy === "kite" || strategy === "ranged_kite") return "kite";
  if (strategy === "anti_kite" || strategy === "surround") return "anti_kite";
  if (strategy === "attack" || strategy === "attack_move" || strategy === "standard") return "attack_move";
  return strategy || "unknown";
}

function scriptLabel(kind) {
  return {
    anti_kite: "anti-kite",
    attack_move: "attack move",
    deep_kite: "deep kite",
    kite: "kite",
    defend: "defend",
    hold: "hold",
  }[kind] ?? String(kind).replaceAll("_", " ");
}

function playerScript(player, snap) {
  return scriptKind(playerStrategy(player, snap));
}

function buildMarkers() {
  if (!replay?.snapshots?.length) return [];
  const out = [];
  const firstMainDamage = new Set();
  let firstClaimSeen = false;
  for (let i = 1; i < replay.snapshots.length; ++i) {
    const prevSnap = replay.snapshots[i - 1];
    const snap = replay.snapshots[i];
    const prevBuildings = new Map((prevSnap.buildings ?? []).map((b) => [b.id, b]));
    for (const building of snap.buildings ?? []) {
      const before = prevBuildings.get(building.id);
      if (!before) continue;
      const isExpansion = building.kind === "expansion";
      if (isExpansion && before.owner !== building.owner && building.owner >= 0 && building.alive !== false) {
        out.push(marker(i, snap.tick, firstClaimSeen ? "claim" : "first_claim", building, building.owner, firstClaimSeen ? `P${building.owner} claim` : `first claim P${building.owner}`, true));
        firstClaimSeen = true;
      }
      if (isExpansion && before.alive !== false && building.alive === false) {
        out.push(marker(i, snap.tick, "destroyed", building, before.owner, "expansion down", true));
      }
      if (building.kind === "main" && !firstMainDamage.has(building.id) && building.hp < building.max_hp - 0.1) {
        firstMainDamage.add(building.id);
        out.push(marker(i, snap.tick, "main_damage", building, before.owner, `P${before.owner} main hit`, true));
      }
      if (building.owner >= 0 && before.hp + 1.0 < building.hp && building.alive !== false) {
        out.push(marker(i, snap.tick, "repair", building, building.owner, "repair", false));
      }
    }
  }
  return out;
}

function marker(index, tick, type, building, owner, label, major) {
  return { index, tick, type, owner, label, major, x: building.x, y: building.y, building_id: building.id };
}

function nearMajorMarker(snapshotIndex, radius) {
  return markers.some((m) => m.major && Math.abs(m.index - snapshotIndex) <= radius);
}

function mapScale() {
  const bounds = replay?.map?.bounds ?? 34;
  return Math.min(canvas.width * 0.92, canvas.height * 0.96) * 0.46 * currentView.zoom / Math.max(1, bounds);
}

function worldToScreenPoint(x, y, z = 0) {
  const center = cameraCenter();
  const scale = mapScale();
  const dx = x - currentView.focusX;
  const dy = y - currentView.focusY;
  return {
    x: center.x + (dx - dy) * scale * iso.x,
    y: center.y + (dx + dy) * scale * iso.y - z * scale * iso.z,
  };
}

function mapX(x) {
  return worldToScreenPoint(x, 0).x;
}

function mapY(y) {
  return worldToScreenPoint(0, y).y;
}

function screenX(x, y, z = 0) {
  return worldToScreenPoint(x, y, z).x;
}

function screenY(x, y, z = 0) {
  return worldToScreenPoint(x, y, z).y;
}

function mapPoint(entity, z = 0) {
  return worldToScreenPoint(entity.x, entity.y, z);
}

function cameraCenter() {
  const hasWideHud = canvas.width > 1050;
  return {
    x: canvas.width * (hasWideHud ? 0.44 : 0.50),
    y: canvas.height * 0.54,
  };
}

function screenToWorld(x, y) {
  const center = cameraCenter();
  const scale = mapScale();
  const sx = (x - center.x) / Math.max(1, scale * iso.x);
  const sy = (y - center.y) / Math.max(1, scale * iso.y);
  return {
    x: currentView.focusX + (sx + sy) * 0.5,
    y: currentView.focusY + (sy - sx) * 0.5,
  };
}

function resetCamera() {
  currentView = { focusX: 0, focusY: 0, zoom: 1 };
  targetView = { ...currentView };
  forceCameraCut = false;
}

function clampCamera() {
  const bounds = replay?.map?.bounds ?? 72;
  currentView.focusX = clamp(currentView.focusX, -bounds, bounds);
  currentView.focusY = clamp(currentView.focusY, -bounds, bounds);
}

function computeView(snap) {
  const points = [];
  for (const event of snap.events ?? []) {
    if (event.to_x !== undefined) points.push({ x: event.to_x, y: event.to_y, w: 3 });
    if (event.from_x !== undefined) points.push({ x: event.from_x, y: event.from_y, w: 1 });
  }
  for (const effect of snap.effects ?? []) {
    points.push({ x: effect.x, y: effect.y, w: effect.kind === "repair" ? 0.25 : 2 });
  }
  if (points.length < 5) return { focusX: 0, focusY: 0, zoom: 1 };
  let wx = 0;
  let wy = 0;
  let total = 0;
  for (const p of points) {
    wx += p.x * p.w;
    wy += p.y * p.w;
    total += p.w;
  }
  const focusX = clamp(wx / total, -36, 36);
  const focusY = clamp(wy / total, -36, 36);
  const intensity = Math.min(1, points.length / 28);
  return { focusX, focusY, zoom: 1.0 + intensity * 0.34 };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function crispLine(width = 1) {
  const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  return Math.max(1 / ratio, width);
}

function updateCamera(dt) {
  const snap = replay?.snapshots?.[index];
  if (!snap) return;
  targetView = computeView(snap);
  if (forceCameraCut) {
    currentView = { ...targetView };
    forceCameraCut = false;
    return;
  }
  const trackingSpeed = targetView.zoom > currentView.zoom ? 5.8 : 3.2;
  const t = 1 - Math.exp(-trackingSpeed * dt);
  currentView = {
    focusX: lerp(currentView.focusX, targetView.focusX, t),
    focusY: lerp(currentView.focusY, targetView.focusY, t),
    zoom: lerp(currentView.zoom, targetView.zoom, t),
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function renderAlpha() {
  if (!playing || !replay?.snapshots?.length) return 0;
  return clamp(playbackAccumulator / Math.max(1, playbackDelay()), 0, 1);
}

function renderSnapshot() {
  const snapshots = replay?.snapshots ?? [];
  const snap = snapshots[index];
  if (!snap) return null;
  const next = snapshots[index + 1];
  const alpha = next ? renderAlpha() : 0;
  if (!next || alpha <= 0) return snap;
  return {
    ...snap,
    tick: lerp(snap.tick, next.tick, alpha),
    players: interpolateById(snap.players, next.players, alpha),
    buildings: interpolateById(snap.buildings, next.buildings, alpha),
    minerals: interpolateById(snap.minerals, next.minerals, alpha),
    units: interpolateUnits(snap.units, next.units, alpha),
    effects: alpha < 0.62 ? snap.effects : next.effects,
    events: alpha < 0.62 ? snap.events : next.events,
  };
}

function interpolateById(current = [], next = [], alpha) {
  const nextById = new Map(next.map((item) => [item.id, item]));
  return current.map((item) => interpolateObject(item, nextById.get(item.id), alpha));
}

function interpolateUnits(current = [], next = [], alpha) {
  const out = [];
  const nextById = new Map(next.map((unit) => [unit.id, unit]));
  const currentIds = new Set();
  for (const unit of current) {
    currentIds.add(unit.id);
    const after = nextById.get(unit.id);
    if (!after && alpha > 0.82) continue;
    out.push(interpolateObject(unit, after, alpha));
  }
  if (alpha > 0.55) {
    for (const unit of next) {
      if (!currentIds.has(unit.id)) out.push(unit);
    }
  }
  return out;
}

function interpolateObject(before, after, alpha) {
  if (!after) return before;
  const out = { ...before };
  for (const key of ["x", "y", "hp", "building_hp", "building_damage", "mana", "amount", "claim_progress", "static_defense_level", "worker_cargo", "repair_done", "target_x", "target_y"]) {
    if (typeof before[key] === "number" && typeof after[key] === "number") {
      out[key] = lerp(before[key], after[key], alpha);
    }
  }
  if (alpha > 0.72) {
    for (const key of ["owner", "alive", "intent", "intent_building", "worker_mineral_id", "cooldown", "next_produce_tick", "claim_owner", "claim_worker_id", "target_reason", "production_reason", "posture"]) {
      if (after[key] !== undefined) out[key] = after[key];
    }
  }
  return out;
}

function draw() {
  resizeCanvas();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawArena();
  drawMap();
  if (!replay) return;
  const baseSnap = replay.snapshots[index];
  const snap = renderSnapshot();
  tick.textContent = `tick ${Math.round(snap.tick)}`;
  drawRateReadout(snap);
  drawMinerals(snap);
  drawBuildings(snap);
  drawBuildingProgress(snap);
  drawSoftFog(snap);
  drawWatchMarkers();
  drawPersistentCombatVfx();
  drawEconomyCallouts(snap);
  drawUnits(snap);
  drawCrisisOverlays(snap);
  drawPostProcessOverlay(snap);
  drawObserverConsole(snap);
  drawClassLegend();
  drawWinnerBanner(snap);
  if (lastPanelIndex !== index) {
    drawPanel(baseSnap);
    lastPanelIndex = index;
  }
}

async function exportReplayVideo() {
  if (!replay?.snapshots?.length || exportingVideo) return;
  if (!canvas.captureStream || typeof MediaRecorder === "undefined") {
    if (exportStatus) exportStatus.textContent = "video unsupported";
    return;
  }

  exportingVideo = true;
  exportVideo?.classList.add("recording");
  exportVideo.disabled = true;
  const wasPlaying = playing;
  playing = false;
  play.textContent = "▶";
  playbackAccumulator = 0;

  const startIndex = index;
  const startView = { ...currentView };
  const startTargetView = { ...targetView };
  const chunks = [];
  const stream = canvas.captureStream(exportVideoFps);
  const mimeType = preferredVideoMimeType();
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 14_000_000 } : { videoBitsPerSecond: 14_000_000 });
  recorder.ondataavailable = (event) => {
    if (event.data?.size) chunks.push(event.data);
  };

  const done = new Promise((resolve) => {
    recorder.onstop = resolve;
  });

  recorder.start(1000);
  resizeCanvas();
  resetCamera();
  for (let frame = 0; frame < replay.snapshots.length; ++frame) {
    index = frame;
    scrub.value = String(frame);
    forceCameraCut = frame === 0;
    draw();
    if (exportStatus) {
      const pct = Math.round(((frame + 1) / replay.snapshots.length) * 100);
      exportStatus.textContent = `video ${pct}%`;
    }
    await sleep(1000 / exportVideoFps);
  }
  recorder.stop();
  await done;
  for (const track of stream.getTracks()) track.stop();

  const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeFileStem(replaySourceName)}-${exportVideoFps}fps.webm`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);

  index = startIndex;
  scrub.value = String(index);
  currentView = startView;
  targetView = startTargetView;
  playing = wasPlaying;
  play.textContent = playing ? "⏸" : "▶";
  exportingVideo = false;
  exportVideo.disabled = false;
  exportVideo?.classList.remove("recording");
  if (exportStatus) exportStatus.textContent = "video ready";
  draw();
}

function preferredVideoMimeType() {
  const options = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  return options.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function replayNameFromUrl(url) {
  const parts = String(url).split(/[/?#]/).filter(Boolean);
  const file = parts.at(-1) ?? "replay";
  if (file === "replay.json" && parts.length >= 2) return parts.at(-2);
  return file.replace(/\.json$/i, "") || "replay";
}

function safeFileStem(name) {
  return String(name || "replay").replace(/[^a-z0-9._-]+/gi, "_").replace(/^_+|_+$/g, "") || "replay";
}

function drawRateReadout(snap) {
  if (!rate) return;
  const snapshots = replay?.snapshots ?? [];
  const before = snapshots[index];
  const after = snapshots[Math.min(index + 1, snapshots.length - 1)];
  const stride = Math.max(1, (after?.tick ?? before?.tick ?? snap.tick) - (before?.tick ?? snap.tick));
  const tps = playing ? stride * 1000 / Math.max(1, playbackDelay()) : 0;
  rate.textContent = `${Math.round(smoothedFps)} fps · ${Math.round(tps)} tps`;
}

function drawArena() {
  const center = cameraCenter();
  const g = ctx.createRadialGradient(center.x, center.y, 80, center.x, center.y, Math.max(canvas.width, canvas.height) * 0.74);
  g.addColorStop(0, "#26342b");
  g.addColorStop(0.58, terrain.bg0);
  g.addColorStop(1, terrain.bg1);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGroundGrid();
  ctx.strokeStyle = terrain.ring;
  ctx.lineWidth = 1;
  const bounds = replay?.map?.bounds ?? 72;
  drawIsoWorldRect(-bounds, -bounds, bounds, bounds, "rgba(226,232,210,0.055)", terrain.ring);
}

function drawGroundGrid() {
  const scale = mapScale();
  const bounds = replay?.map?.bounds ?? 72;
  const worldStep = 8;
  ctx.save();
  ctx.strokeStyle = terrain.grid;
  ctx.globalAlpha = currentView.zoom > 1.15 ? 0.62 : 1;
  ctx.lineWidth = currentView.zoom > 1.15 ? crispLine(0.85) : crispLine(1);
  const start = Math.ceil(-bounds / worldStep) * worldStep;
  for (let v = start; v <= bounds; v += worldStep) {
    const a = worldToScreenPoint(v, -bounds);
    const b = worldToScreenPoint(v, bounds);
    const c = worldToScreenPoint(-bounds, v);
    const d = worldToScreenPoint(bounds, v);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(d.x, d.y);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.06;
  for (let r = worldStep * 3; r < bounds; r += worldStep * 3) {
    drawIsoWorldRect(-r, -r, r, r, "transparent", "rgba(226,232,210,0.12)");
  }
  ctx.restore();
}

function drawIsoWorldRect(x0, y0, x1, y1, fill, stroke) {
  SimIsoRenderer.drawIsoWorldRect(replayIsoEnv(), x0, y0, x1, y1, fill, stroke);
}

function drawMap() {
  if (!replay?.map) return;
  ctx.fillStyle = "#303a31";
  ctx.strokeStyle = "rgba(169, 181, 151, 0.32)";
  ctx.lineWidth = 2;
  for (const [index, polygon] of (replay.map.obstacles ?? []).entries()) {
    if (index === 0) continue;
    if (!polygon.length) continue;
    const first = worldToScreenPoint(polygon[0].x, polygon[0].y);
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    for (const point of polygon.slice(1)) {
      const p = worldToScreenPoint(point.x, point.y);
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    if (index !== 0) ctx.fill();
    ctx.stroke();
  }
  for (const base of replay.map.bases ?? []) {
    const { x, y } = worldToScreenPoint(base.x, base.y);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const g = ctx.createRadialGradient(x, y, 0, x, y, 46);
    g.addColorStop(0, hexToRgba(colors[base.player], 0.22));
    g.addColorStop(1, hexToRgba(colors[base.player], 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawTeamPlate(x - 34, y - 58, 68, colors[base.player], teamNames[base.player] ?? `P${base.player}`);
  }
}

function drawMinerals(snap) {
  const minerals = snap.minerals ?? replay?.map?.minerals ?? [];
  for (const mineral of minerals) {
    if ((mineral.amount ?? 0) <= 0) continue;
    const { x, y } = worldToScreenPoint(mineral.x, mineral.y);
    const richness = Math.max(0.28, Math.min(1, (mineral.amount ?? 0) / 1800));
    ctx.save();
    drawShadow(x, y + 4, 8, 0.18);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.46 + richness * 0.24;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 18);
    g.addColorStop(0, "rgba(255,226,126,0.55)");
    g.addColorStop(0.55, "rgba(199,164,71,0.22)");
    g.addColorStop(1, "rgba(199,164,71,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#b7933e";
    ctx.strokeStyle = "#ddc06c";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - 7);
    ctx.lineTo(x + 8, y - 1);
    ctx.lineTo(x + 3, y + 8);
    ctx.lineTo(x - 8, y + 5);
    ctx.lineTo(x - 6, y - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawPersistentCombatVfx() {
  if (!replay?.snapshots?.length) return;
  ctx.save();
  const snap = replay.snapshots[index];
  if (snap) {
    drawEffects(snap, 1);
    drawReplayEvents(snap, 1);
  }
  ctx.restore();
}

function drawEffects(snap, intensity = 1) {
  let drawnLowImpact = 0;
  const effects = [...(snap.effects ?? [])].sort((a, b) => effectImportance(b) - effectImportance(a));
  for (const effect of effects) {
    const lowImpact = effect.kind === "damage" || effect.kind === "building_damage" || effect.kind === "matrix_absorb";
    if (lowImpact && drawnLowImpact++ > 18) continue;
    const { x, y } = worldToScreenPoint(effect.x, effect.y);
    const radius = effect.radius * mapScale();
    const isVolley = effect.kind === "volley";
    const isCharge = effect.kind === "charge";
    const isTurret = effect.kind === "deploy_turret";
    const isHeal = effect.kind === "heal";
    const isExplode = effect.kind === "explode";
    const isSiege = effect.kind === "siege_blast";
    const isRepair = effect.kind === "repair";
    const isCollapse = effect.kind === "collapse";
    const isDamage = effect.kind === "damage";
    const isBuildingDamage = effect.kind === "building_damage";
    const isStorm = effect.kind === "psionic_storm";
    const isMatrix = effect.kind === "defense_matrix" || effect.kind === "matrix_absorb";
    const isDisrupt = effect.kind === "disrupt";
    ctx.save();
    ctx.globalAlpha *= intensity;
    if (isCollapse) {
      drawCollapseShader(x, y, radius, colors[effect.owner], intensity);
    } else if (isExplode) {
      drawExplosionShader(x, y, radius, colors[effect.owner], intensity);
    } else if (isSiege) {
      drawSiegeShader(x, y, radius, colors[effect.owner], intensity);
    } else if (isStorm) {
      drawStormShader(x, y, radius, colors[effect.owner], intensity);
    } else if (isMatrix) {
      drawMatrixShader(x, y, radius, colors[effect.owner], intensity * 0.82);
    } else if (isDisrupt) {
      drawDisruptShader(x, y, radius, colors[effect.owner], intensity);
    } else if (isDamage || isBuildingDamage) {
      drawDamagePing(x, y, radius, isBuildingDamage ? "#f7d36d" : "#f3efe6", isBuildingDamage ? 0.34 : 0.28);
    } else if (isVolley) {
      drawVolleyShader(x, y, radius, colors[effect.owner], intensity);
    } else if (isCharge) {
      drawChargeShader(x, y, radius, colors[effect.owner], intensity);
    } else if (isTurret) {
      drawTurretShader(x, y, radius, colors[effect.owner], intensity);
    } else if (isHeal) {
      drawHealShader(x, y, radius, colors[effect.owner], intensity);
    } else if (isRepair) {
      if (intensity > 0.9) drawRepairShader(x, y, radius, colors[effect.owner], 0.26);
    } else {
      drawPulseDisc(x, y, radius, colors[effect.owner], 0.10 * intensity);
    }
    ctx.restore();
  }
}

function effectImportance(effect) {
  if (effect.kind === "collapse" || effect.kind === "explode" || effect.kind === "psionic_storm") return 6;
  if (effect.kind === "siege_blast" || effect.kind === "defense_matrix" || effect.kind === "disrupt") return 5;
  if (effect.kind === "building_damage") return 3;
  if (effect.kind === "damage" || effect.kind === "matrix_absorb") return 1;
  return 2;
}

function drawCollapseShader(x, y, radius, color, intensity = 1) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const pulse = 0.5 + 0.5 * Math.sin(animTime * 6.5 + x * 0.02);
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.6);
  g.addColorStop(0, `rgba(255,236,176,${0.20 * intensity})`);
  g.addColorStop(0.34, hexToRgba(color, 0.30 * intensity));
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius * (2.2 + pulse * 0.18), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(255,236,176,${0.58 * intensity})`;
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 5; i++) {
    const a = animTime * 0.7 + i * Math.PI * 0.4;
    ctx.beginPath();
    ctx.arc(x, y, radius * (0.65 + i * 0.26 + pulse * 0.08), a, a + Math.PI * 0.7);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPulseDisc(x, y, radius, color, alpha = 0.22) {
  const pulse = 0.5 + 0.5 * Math.sin(animTime * 8 + x * 0.01 + y * 0.01);
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius * (1.15 + pulse * 0.10));
  g.addColorStop(0, hexToRgba(color, alpha * 0.55));
  g.addColorStop(0.48, hexToRgba(color, alpha * 0.22));
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(color, Math.min(0.46, alpha * 2.1) + pulse * 0.08);
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(x, y, radius * (0.78 + pulse * 0.16), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawExplosionShader(x, y, radius, color, intensity = 1) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const pulse = 0.5 + 0.5 * Math.sin(animTime * 13 + x * 0.01);
  const core = radius * (1.15 + pulse * 0.18);
  const bloom = radius * 4.3;
  const g = ctx.createRadialGradient(x, y, 0, x, y, bloom);
  g.addColorStop(0, `rgba(255,252,218,${0.70 * intensity})`);
  g.addColorStop(0.10, `rgba(255,214,112,${0.62 * intensity})`);
  g.addColorStop(0.26, `rgba(255,112,42,${0.46 * intensity})`);
  g.addColorStop(0.58, hexToRgba(color, 0.18 * intensity));
  g.addColorStop(1, "rgba(255,85,35,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, bloom, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(255,245,198,${0.86 * intensity})`;
  ctx.beginPath();
  ctx.arc(x, y, core, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(255,210,110,${0.88 * intensity + pulse * 0.12})`;
  ctx.lineWidth = 5.8;
  ctx.beginPath();
  ctx.arc(x, y, radius * (1.75 + pulse * 0.35), 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = `rgba(255,128,62,${0.55 * intensity})`;
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 3; ++i) {
    ctx.beginPath();
    ctx.arc(x, y, radius * (2.2 + i * 0.52 + pulse * 0.22), 0, Math.PI * 2);
    ctx.stroke();
  }
  drawExplosionDebris(x, y, radius, color, intensity);
  ctx.restore();
}

function drawSiegeShader(x, y, radius, color, intensity = 1) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const pulse = 0.5 + 0.5 * Math.sin(animTime * 9 + x * 0.02);
  drawPulseDisc(x, y, radius * 2.10, "#d7d1bf", 0.36 * intensity);
  ctx.strokeStyle = `rgba(236,229,205,${0.82 * intensity})`;
  ctx.lineWidth = 4.2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(x, y, radius * (0.62 + i * 0.34 + pulse * 0.12), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = hexToRgba(color, 0.76 * intensity);
  for (let i = 0; i < 6; i++) {
    const a = animTime * 0.8 + i * Math.PI / 3;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * radius * 0.25, y + Math.sin(a) * radius * 0.25);
    ctx.lineTo(x + Math.cos(a) * radius * 1.05, y + Math.sin(a) * radius * 1.05);
    ctx.stroke();
  }
  drawExplosionDebris(x, y, radius * 0.85, "#efe5c8", intensity * 0.58);
  ctx.restore();
}

function drawExplosionDebris(x, y, radius, color, intensity = 1) {
  const count = 30;
  ctx.save();
  ctx.lineCap = "round";
  for (let i = 0; i < count; ++i) {
    const seed = i * 12.9898 + x * 0.017 + y * 0.013;
    const a = i * 2.399963 + Math.sin(seed) * 0.35;
    const near = radius * (0.65 + ((i * 17) % 31) / 40);
    const far = radius * (1.75 + ((i * 29) % 47) / 28);
    const spark = i % 3 === 0 ? "#fff0ac" : i % 3 === 1 ? "#ff9349" : color;
    ctx.strokeStyle = hexToRgba(spark, (0.38 + (i % 4) * 0.09) * intensity);
    ctx.lineWidth = 1.4 + (i % 4) * 0.5;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * near, y + Math.sin(a) * near);
    ctx.lineTo(x + Math.cos(a) * far, y + Math.sin(a) * far);
    ctx.stroke();
  }
  ctx.fillStyle = `rgba(90,64,44,${0.12 * intensity})`;
  for (let i = 0; i < 8; ++i) {
    const a = i * Math.PI * 0.25 + animTime * 0.12;
    const px = x + Math.cos(a) * radius * (1.0 + (i % 3) * 0.34);
    const py = y + Math.sin(a) * radius * (0.75 + (i % 2) * 0.24);
    ctx.beginPath();
    ctx.arc(px, py, radius * (0.18 + (i % 3) * 0.05), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawStormShader(x, y, radius, color, intensity = 1) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  drawPulseDisc(x, y, radius * 1.18, "#9b8cff", 0.18 * intensity);
  ctx.strokeStyle = hexToRgba("#d8d0ff", 0.48 * intensity);
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 4; ++i) {
    const a = animTime * 1.5 + i * Math.PI * 0.5;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * radius * 0.18, y + Math.sin(a) * radius * 0.18, radius * (0.34 + i * 0.10), a, a + Math.PI * 1.15);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMatrixShader(x, y, radius, color, intensity = 1) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = hexToRgba("#73ffd8", 0.46 * intensity);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, radius * 1.15, radius * 0.74, animTime * 0.8, 0, Math.PI * 2);
  ctx.stroke();
  drawPulseDisc(x, y, radius * 0.95, "#73ffd8", 0.08 * intensity);
  ctx.restore();
}

function drawDisruptShader(x, y, radius, color, intensity = 1) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = hexToRgba("#ff87cf", 0.48 * intensity);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - radius, y);
  ctx.lineTo(x - radius * 0.28, y - radius * 0.18);
  ctx.lineTo(x + radius * 0.18, y + radius * 0.18);
  ctx.lineTo(x + radius, y);
  ctx.stroke();
  ctx.restore();
}

function drawDamagePing(x, y, radius, color, alpha = 0.28) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = hexToRgba(color, alpha);
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(4, radius * 1.8), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawVolleyShader(x, y, radius, color, intensity = 1) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  drawPulseDisc(x, y, radius * 1.25, "#f2d35c", 0.24 * intensity);
  ctx.strokeStyle = `rgba(255,222,92,${0.78 * intensity})`;
  ctx.lineWidth = 2.3;
  for (let i = 0; i < 10; i++) {
    const a = -0.8 + i * 0.17 + Math.sin(animTime * 3 + i) * 0.03;
    const ox = Math.cos(a) * radius * 0.18;
    const oy = Math.sin(a) * radius * 0.18;
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.95 + ox, y + (i - 5) * 2.3 + oy);
    ctx.lineTo(x + radius * 0.85 + ox, y + (i - 5) * 2.3 + oy);
    ctx.stroke();
  }
  drawSparks(x, y, radius * 1.25, 14, "#f2d35c", 0.74 * intensity);
  ctx.restore();
}

function drawChargeShader(x, y, radius, color, intensity = 1) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const pulse = 0.5 + 0.5 * Math.sin(animTime * 10);
  drawPulseDisc(x, y, radius * 1.2, color, 0.28 * intensity);
  ctx.strokeStyle = `rgba(243,239,230,${0.84 * intensity})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, radius * (0.45 + pulse * 0.20), -0.6, Math.PI * 1.35);
  ctx.stroke();
  drawSparks(x, y, radius * 0.75, 8, "#f3efe6", 0.62);
  ctx.restore();
}

function drawTurretShader(x, y, radius, color, intensity = 1) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  drawPulseDisc(x, y, radius * 1.1, "#9ec7ff", 0.24 * intensity);
  ctx.strokeStyle = `rgba(158,199,255,${0.78 * intensity})`;
  ctx.lineWidth = 2.2;
  const spin = animTime * 1.8;
  for (let i = 0; i < 4; i++) {
    const a = spin + i * Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * radius, y + Math.sin(a) * radius);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHealShader(x, y, radius, color, intensity = 1) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  drawPulseDisc(x, y, radius * 1.1, "#8ee3b0", 0.26 * intensity);
  ctx.strokeStyle = `rgba(142,227,176,${0.82 * intensity})`;
  ctx.lineWidth = 2.4;
  const s = radius * 0.25;
  ctx.beginPath();
  ctx.moveTo(x - s, y);
  ctx.lineTo(x + s, y);
  ctx.moveTo(x, y - s);
  ctx.lineTo(x, y + s);
  ctx.stroke();
  ctx.restore();
}

function drawRepairShader(x, y, radius, color, intensity = 1) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const pulse = 0.5 + 0.5 * Math.sin(animTime * 5 + x * 0.03);
  ctx.strokeStyle = `rgba(142,227,176,${0.30 * intensity})`;
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 3; i++) {
    const a = animTime * 1.2 + i * 2.094;
    const r = radius * (0.45 + i * 0.16 + pulse * 0.05);
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * 2.5, y + Math.sin(a) * 2.5, r, a, a + Math.PI * 0.75);
    ctx.stroke();
  }
  ctx.restore();
}

function drawReplayEvents(snap, intensity = 1) {
  const events = [...(snap.events ?? [])]
    .filter((event) => event.kind !== "bolt" || ((event.expires_tick ?? 0) % 2 === 0))
    .slice(-26);
  for (const event of events) {
    const from = worldToScreenPoint(event.from_x, event.from_y);
    const to = worldToScreenPoint(event.to_x, event.to_y);
    const x1 = from.x;
    const y1 = from.y;
    const x2 = to.x;
    const y2 = to.y;
    const team = colors[event.owner] ?? "#f3efe6";
    const teamHot = mixColor(team, "#ffffff", 0.44);
    if (event.kind === "arrow") {
      drawBeamShader(x1, y1, x2, y2, teamHot, { width: 3.2, glow: 18, particle: true, arrow: true, impact: "#fff0a0", intensity });
    } else if (event.kind === "tower") {
      drawBeamShader(x1, y1, x2, y2, teamHot, { width: 4.0, glow: 24, particle: false, fork: true, impact: "#dcecff", intensity });
    } else if (event.kind === "raid") {
      drawBeamShader(x1, y1, x2, y2, team, { width: 5.0, glow: 26, particle: true, impact: "#ffb05c", intensity });
    } else if (event.kind === "siege_shell" || event.kind === "tank_shot") {
      drawBeamShader(x1, y1, x2, y2, "#f3d17a", { width: event.kind === "siege_shell" ? 5.8 : 4.2, glow: 26, particle: false, impact: "#ff6c35", intensity });
    } else if (event.kind === "bolt") {
      drawBeamShader(x1, y1, x2, y2, teamHot, { width: 3.4, glow: 18, particle: true, impact: "#ffb6de", intensity });
    } else if (event.kind === "matrix_beam") {
      drawBeamShader(x1, y1, x2, y2, "#73ffd8", { width: 3.5, glow: 22, particle: false, fork: true, intensity });
    } else if (event.kind === "storm_bolt") {
      drawBeamShader(x1, y1, x2, y2, "#b6a6ff", { width: 4.2, glow: 28, particle: false, fork: true, impact: "#d8d0ff", intensity });
    } else if (event.kind === "money_gain" || event.kind === "money_spend") {
      continue;
    } else {
      drawSlashShader(x1, y1, x2, y2, teamHot, intensity);
    }
  }
}

function drawEconomyCallouts(snap) {
  const events = [...(snap.events ?? [])]
    .filter((event) => event.kind === "money_gain" || event.kind === "money_spend")
    .slice(-34);
  if (!events.length) return;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const event of events) {
    const life = clamp(((event.expires_tick ?? snap.tick) - snap.tick) / 42, 0, 1);
    const amount = Math.max(0, event.amount ?? 0);
    if (amount <= 0) continue;
    const gain = event.kind === "money_gain";
    const p = worldToScreenPoint(gain ? event.to_x : event.from_x, gain ? event.to_y : event.from_y, 3);
    const x = p.x;
    const y = p.y - (1 - life) * 22 - 18;
    const label = `${gain ? "+" : "-"}${amount.toFixed(amount >= 10 ? 0 : 1)}`;
    const color = gain ? "#f0d66a" : "#7fc7ff";
    ctx.globalAlpha = 0.22 + life * 0.78;
    ctx.font = "900 13px Inter, sans-serif";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(4,7,8,0.82)";
    ctx.strokeText(label, x, y);
    ctx.fillStyle = color;
    ctx.fillText(label, x, y);
  }
  ctx.restore();
}

function previousSnapshot(steps = 20) {
  if (!replay?.snapshots?.length) return null;
  return replay.snapshots[Math.max(0, index - steps)] ?? null;
}

function playerById(snap, id) {
  return snap?.players?.find((p) => p.id === id) ?? null;
}

function aliveUnits(snap, owner, kind = null) {
  return (snap?.units ?? []).filter((u) => u.alive !== false && u.owner === owner && (!kind || u.class === kind));
}

function combatUnits(snap, owner) {
  return (snap?.units ?? []).filter((u) => u.alive !== false && u.owner === owner && u.class !== "worker");
}

function ownerBuildingHp(snap, owner) {
  return (snap?.buildings ?? [])
    .filter((b) => b.owner === owner && b.alive !== false)
    .reduce((sum, b) => sum + (b.hp ?? 0), 0);
}

function macroDelta(playerId, snap, steps = 20) {
  const prev = previousSnapshot(steps) ?? snap;
  const nowPlayer = playerById(snap, playerId) ?? {};
  const prevPlayer = playerById(prev, playerId) ?? {};
  const nowWorkers = aliveUnits(snap, playerId, "worker").length;
  const prevWorkers = aliveUnits(prev, playerId, "worker").length;
  const nowCombat = combatUnits(snap, playerId).length;
  const prevCombat = combatUnits(prev, playerId).length;
  return {
    income: (nowPlayer.income_total ?? 0) - (prevPlayer.income_total ?? 0),
    spent: (nowPlayer.spent_total ?? 0) - (prevPlayer.spent_total ?? 0),
    deaths: (nowPlayer.deaths ?? 0) - (prevPlayer.deaths ?? 0),
    buildingHp: ownerBuildingHp(snap, playerId) - ownerBuildingHp(prev, playerId),
    workers: nowWorkers,
    workerDelta: nowWorkers - prevWorkers,
    combat: nowCombat,
    combatDelta: nowCombat - prevCombat,
  };
}

function crisisForBuilding(building, snap) {
  if (building.owner < 0 || building.alive === false) return null;
  const radius = building.kind === "main" ? 22 : 17;
  const enemyCombat = (snap.units ?? []).filter((u) =>
    u.alive !== false && u.owner !== building.owner && u.owner >= 0 && u.class !== "worker" &&
    distWorld(u, building) <= radius
  );
  const ownWorkers = (snap.units ?? []).filter((u) =>
    u.alive !== false && u.owner === building.owner && u.class === "worker" && distWorld(u, building) <= (building.kind === "main" ? 24 : 18)
  );
  const hpRatio = (building.hp ?? 0) / Math.max(1, building.max_hp ?? 1);
  if (enemyCombat.length >= 3 && ownWorkers.length >= 3) return { label: "WORKER RAID", severity: 3, color: "#ffd35d" };
  if (enemyCombat.length >= 3) return { label: "BASE FIRE", severity: 2, color: "#ff795d" };
  if (hpRatio < 0.42) return { label: "LOW HP", severity: 2, color: "#ff795d" };
  if ((building.claim_progress ?? 0) > 0) return { label: "CLAIMING", severity: 1, color: "#8ee3b0" };
  return null;
}

function drawCrisisOverlays(snap) {
  const badges = [];
  for (const building of snap.buildings ?? []) {
    const crisis = crisisForBuilding(building, snap);
    if (!crisis) continue;
    badges.push({ ...crisis, building });
  }
  badges.sort((a, b) => b.severity - a.severity);
  ctx.save();
  for (const badge of badges.slice(0, 8)) {
    const b = badge.building;
    const p = worldToScreenPoint(b.x, b.y, b.kind === "main" ? 7 : 5);
    const x = p.x;
    const y = p.y - (b.kind === "main" ? 48 : 40);
    const pulse = 0.65 + Math.sin(animTime * 7 + b.id) * 0.12;
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = "rgba(8,10,12,0.82)";
    ctx.strokeStyle = hexToRgba(badge.color, 0.72 + pulse * 0.18);
    ctx.lineWidth = crispLine(1.6 + badge.severity * 0.25);
    const w = Math.max(74, ctx.measureText?.(badge.label).width + 22 || 88);
    roundRect(x - w / 2, y - 12, w, 24, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = badge.color;
    ctx.font = "950 11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badge.label, x, y);
    ctx.strokeStyle = hexToRgba(badge.color, 0.30);
    ctx.lineWidth = crispLine(1.2);
    ctx.beginPath();
    ctx.moveTo(x, y + 13);
    const target = worldToScreenPoint(b.x, b.y, 4);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
  }
  ctx.restore();
}

function distWorld(a, b) {
  return Math.hypot((a.x ?? 0) - (b.x ?? 0), (a.y ?? 0) - (b.y ?? 0));
}

function drawBeamShader(x1, y1, x2, y2, color, options = {}) {
  const intensity = options.intensity ?? 1;
  const width = options.width ?? 3;
  const glow = options.glow ?? 16;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / len;
  const ny = dx / len;
  const phase = (animTime * 120) % Math.max(1, len);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.strokeStyle = hexToRgba(color, 0.10 * intensity);
  ctx.lineWidth = Math.max(4, glow * 0.48);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.strokeStyle = hexToRgba(color, 0.44 * intensity);
  ctx.lineWidth = crispLine(width * 1.35);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const core = ctx.createLinearGradient(x1, y1, x2, y2);
  core.addColorStop(0, hexToRgba(color, 0.18 * intensity));
  core.addColorStop(0.45, hexToRgba(color, 0.82 * intensity));
  core.addColorStop(1, hexToRgba(color, 0.28 * intensity));
  ctx.strokeStyle = core;
  ctx.lineWidth = crispLine(width);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  if (options.fork) {
    ctx.strokeStyle = hexToRgba(color, 0.48 * intensity);
    ctx.lineWidth = 1.2;
    for (let i = 0.25; i < 0.85; i += 0.22) {
      const px = x1 + dx * i;
      const py = y1 + dy * i;
      const side = Math.sin(animTime * 9 + i * 21) > 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + nx * glow * side * 0.7, py + ny * glow * side * 0.7);
      ctx.stroke();
    }
  }
  if (options.particle) {
    ctx.fillStyle = hexToRgba(options.impact ?? color, 0.86 * intensity);
    for (let i = 0; i < 3; i++) {
      const t = ((phase + i * len / 5) % len) / len;
      const wobble = Math.sin(animTime * 10 + i * 1.7) * width * 1.9;
      ctx.beginPath();
      ctx.arc(x1 + dx * t + nx * wobble, y1 + dy * t + ny * wobble, Math.max(1.3, width * 0.75), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (options.arrow) drawArrowHead(x2, y2, Math.atan2(dy, dx), color);
  drawMuzzleBloom(x1, y1, color, glow * 0.22, intensity);
  drawImpactBloom(x2, y2, options.impact ?? color, glow * 0.32, intensity);
  ctx.restore();
}

function drawSlashShader(x1, y1, x2, y2, color, intensity = 1) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const cx = (x1 + x2) * 0.5;
  const cy = (y1 + y2) * 0.5;
  const r = Math.min(26, Math.max(10, Math.hypot(x2 - x1, y2 - y1) * 0.35));
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = hexToRgba(color, 0.90 * intensity);
  ctx.lineWidth = 5.0;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, r, angle - 0.95, angle + 0.95);
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,255,255,${0.74 * intensity})`;
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.72, angle - 0.75, angle + 0.45);
  ctx.stroke();
  drawImpactBloom(x2, y2, color, 12, intensity);
  ctx.restore();
}

function drawImpactBloom(x, y, color, radius, intensity = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.2);
  g.addColorStop(0, hexToRgba(color, 0.48 * intensity));
  g.addColorStop(0.34, hexToRgba(color, 0.24 * intensity));
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius * 2.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawMuzzleBloom(x, y, color, radius, intensity = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.6);
  g.addColorStop(0, hexToRgba(color, 0.28 * intensity));
  g.addColorStop(0.45, hexToRgba(color, 0.32 * intensity));
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawSparks(x, y, radius, count, color, alpha) {
  ctx.fillStyle = hexToRgba(color, alpha);
  for (let i = 0; i < count; i++) {
    const a = i * 2.399 + animTime * (0.6 + (i % 3) * 0.11);
    const r = radius * (0.28 + ((i * 37) % 61) / 80);
    const size = 1.4 + (i % 3) * 0.6;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPolicyOverlay(snap) {
  drawWorldHud(snap);
}

function drawTacticalLighting(snap) {
  if (!snap) return;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const owners = new Map();
  for (const unit of snap.units ?? []) {
    if (unit.class === "worker" || unit.alive === false) continue;
    const bucket = owners.get(unit.owner) ?? { x: 0, y: 0, count: 0 };
    bucket.x += unit.x;
    bucket.y += unit.y;
    bucket.count += 1;
    owners.set(unit.owner, bucket);
  }
  for (const [owner, bucket] of owners) {
    if (bucket.count < 3) continue;
    const p = worldToScreenPoint(bucket.x / bucket.count, bucket.y / bucket.count, 2);
    const x = p.x;
    const y = p.y;
    const radius = clamp(42 + Math.sqrt(bucket.count) * 18, 72, 180);
    const color = colors[owner] ?? "#f3efe6";
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, hexToRgba(color, 0.12));
    g.addColorStop(0.44, hexToRgba(color, 0.045));
    g.addColorStop(1, hexToRgba(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  let flashes = 0;
  for (const event of snap.events ?? []) {
    if (flashes++ > 24) break;
    const p = worldToScreenPoint(event.to_x ?? event.from_x ?? 0, event.to_y ?? event.from_y ?? 0, 2);
    const x = p.x;
    const y = p.y;
    const color = colors[event.owner] ?? "#f5df96";
    const radius = event.kind === "siege" || event.kind === "storm" ? 72 : 34;
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, hexToRgba(color, 0.15));
    g.addColorStop(0.5, hexToRgba(color, 0.045));
    g.addColorStop(1, hexToRgba(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPostProcessOverlay(snap) {
  ctx.save();
  const cx = canvas.width * 0.48;
  const cy = canvas.height * 0.48;
  const radius = Math.max(canvas.width, canvas.height) * 0.76;
  const vignette = ctx.createRadialGradient(cx, cy, radius * 0.12, cx, cy, radius);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(0.68, "rgba(0,0,0,0.08)");
  vignette.addColorStop(1, "rgba(0,0,0,0.44)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = 0.36;
  ctx.fillStyle = "rgba(255,255,255,0.018)";
  for (let y = 0; y < canvas.height; y += 6) ctx.fillRect(0, y, canvas.width, 1);
  ctx.globalAlpha = 1;

  const edge = 18;
  ctx.strokeStyle = "rgba(232,218,170,0.18)";
  ctx.lineWidth = crispLine(1.2);
  ctx.beginPath();
  ctx.moveTo(edge, edge + 34);
  ctx.lineTo(edge, edge);
  ctx.lineTo(edge + 34, edge);
  ctx.moveTo(canvas.width - edge - 34, edge);
  ctx.lineTo(canvas.width - edge, edge);
  ctx.lineTo(canvas.width - edge, edge + 34);
  ctx.moveTo(edge, canvas.height - edge - 34);
  ctx.lineTo(edge, canvas.height - edge);
  ctx.lineTo(edge + 34, canvas.height - edge);
  ctx.moveTo(canvas.width - edge - 34, canvas.height - edge);
  ctx.lineTo(canvas.width - edge, canvas.height - edge);
  ctx.lineTo(canvas.width - edge, canvas.height - edge - 34);
  ctx.stroke();
  ctx.restore();
}

function drawObserverConsole(snap) {
  if (!snap?.players?.length) return;
  const h = clamp(canvas.height * 0.22, 168, 220);
  const margin = 16;
  const x = margin;
  const y = canvas.height - h - margin;
  const sidePanelReserve = canvas.width > 1050 ? 360 : 0;
  const w = canvas.width - sidePanelReserve - margin * 2;
  if (w < 640) return;
  ctx.save();
  ctx.fillStyle = "rgba(7, 10, 12, 0.80)";
  ctx.strokeStyle = "rgba(232, 226, 207, 0.18)";
  ctx.lineWidth = crispLine(1.2);
  roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  const top = ctx.createLinearGradient(0, y, 0, y + h);
  top.addColorStop(0, "rgba(255,255,255,0.08)");
  top.addColorStop(0.16, "rgba(255,255,255,0.015)");
  top.addColorStop(1, "rgba(0,0,0,0.12)");
  ctx.fillStyle = top;
  roundRect(x + 1, y + 1, w - 2, h - 2, 7);
  ctx.fill();

  const mini = Math.min(196, h - 24);
  drawMiniMap(x + 12, y + 11, mini, mini, snap);
  const rightW = Math.min(250, w * 0.22);
  const centerX = x + mini + 24;
  const centerW = Math.max(360, w - mini - rightW - 48);
  drawMacroDuelPanel(centerX, y + 12, centerW, h - 24, snap);
  drawCasterPanel(x + w - rightW - 12, y + 12, rightW, h - 24, snap);
  ctx.restore();
}

function drawMiniMap(x, y, w, h, snap) {
  ctx.save();
  ctx.fillStyle = "rgba(14,18,18,0.94)";
  ctx.strokeStyle = "rgba(232,226,207,0.22)";
  roundRect(x, y, w, h, 5);
  ctx.fill();
  ctx.stroke();
  const bounds = replay?.map?.bounds ?? 72;
  const tx = (wx) => x + ((wx + bounds) / (bounds * 2)) * w;
  const ty = (wy) => y + ((wy + bounds) / (bounds * 2)) * h;
  ctx.strokeStyle = "rgba(190,205,174,0.09)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; ++i) {
    const px = x + (w * i) / 4;
    const py = y + (h * i) / 4;
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px, y + h);
    ctx.moveTo(x, py);
    ctx.lineTo(x + w, py);
    ctx.stroke();
  }
  for (const mineral of snap.minerals ?? replay?.map?.minerals ?? []) {
    if ((mineral.amount ?? 0) <= 0) continue;
    ctx.fillStyle = "rgba(229,198,95,0.65)";
    ctx.fillRect(tx(mineral.x) - 1, ty(mineral.y) - 1, 2, 2);
  }
  for (const building of snap.buildings ?? []) {
    if (building.alive === false) continue;
    const color = building.owner >= 0 ? colors[building.owner] : "#8b9489";
    const bx = tx(building.x);
    const by = ty(building.y);
    ctx.fillStyle = color;
    const s = building.kind === "main" ? 5 : 4;
    ctx.fillRect(bx - s / 2, by - s / 2, s, s);
    if ((building.static_defense_level ?? 0) > 0) {
      ctx.strokeStyle = "#fff1ba";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(bx, by, s + 2.4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  for (const unit of snap.units ?? []) {
    if (unit.alive === false) continue;
    ctx.fillStyle = unit.class === "worker" ? hexToRgba(colors[unit.owner], 0.50) : colors[unit.owner];
    const r = unit.class === "worker" ? 1.4 : 2.1;
    ctx.beginPath();
    ctx.arc(tx(unit.x), ty(unit.y), r, 0, Math.PI * 2);
    ctx.fill();
  }
  const topLeft = screenToWorld(0, 0);
  const bottomRight = screenToWorld(canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(243,239,230,0.62)";
  ctx.lineWidth = 1;
  ctx.strokeRect(tx(topLeft.x), ty(topLeft.y), tx(bottomRight.x) - tx(topLeft.x), ty(bottomRight.y) - ty(topLeft.y));
  ctx.restore();
}

function drawMacroDuelPanel(x, y, w, h, snap) {
  const players = bottomDisplayPlayers(snap);
  const cols = Math.min(players.length, 2);
  const gap = 14;
  const colW = (w - gap * (cols - 1)) / Math.max(1, cols);
  for (const [i, player] of players.slice(0, 2).entries()) {
    const px = x + i * (colW + gap);
    const color = colors[player.id] ?? "#f3efe6";
    const macro = macroStats(player.id, snap);
    const units = (snap.units ?? []).filter((u) => u.owner === player.id);
    const comp = classOrder
      .map((kind) => [kind, units.filter((u) => u.class === kind).length])
      .filter(([, count]) => count > 0)
      .slice(0, 5);
    ctx.fillStyle = hexToRgba(color, 0.10);
    ctx.strokeStyle = hexToRgba(color, 0.48);
    roundRect(px, y, colW, h, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = "950 22px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(teamNames[player.id] ?? `P${player.id}`, px + 14, y + 12);
    ctx.fillStyle = "#f2d66a";
    ctx.font = "950 38px Inter, sans-serif";
    ctx.fillText(`$${macro.bank}`, px + 14, y + 44);
    ctx.fillStyle = "#a8dfff";
    ctx.font = "950 24px Inter, sans-serif";
    ctx.fillText(`+${macro.income.toFixed(1)}`, px + Math.min(150, colW * 0.42), y + 54);
    drawMacroMetric(px + 14, y + 92, colW * 0.24, `${macro.bases}`, "bases", "#efe7d5");
    drawMacroMetric(px + colW * 0.34, y + 92, colW * 0.26, `${macro.workers}`, "workers", "#93f0b2");
    drawMacroMetric(px + colW * 0.68, y + 92, colW * 0.24, `${macro.army}`, "army", "#f3efe6");
    drawUnitCompStrip(px + 14, y + h - 28, colW - 28, comp, color);
  }
}

function bottomDisplayPlayers(snap) {
  const visible = [...(snap.players ?? [])].slice(0, 2);
  if (visible.length === 2) visible.reverse();
  return visible;
}

function drawMacroMetric(x, y, w, value, label, color) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.035)";
  roundRect(x, y, w, 26, 4);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.font = "950 17px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(value, x + 7, y + 3);
  ctx.fillStyle = "#aeb8bd";
  ctx.font = "800 9px Inter, sans-serif";
  ctx.fillText(label, x + 7, y + 17);
  ctx.restore();
}

function drawUnitCompStrip(x, y, w, comp, ownerColor = "#d9d2c6") {
  const total = comp.reduce((sum, [, count]) => sum + count, 0);
  if (total <= 0) return;
  let cursor = x;
  for (const [kind, count] of comp) {
    const palette = classPalette[kind] ?? classPalette.soldier;
    const part = Math.max(12, (count / total) * w);
    const right = Math.min(part, x + w - cursor);
    ctx.fillStyle = mixColor(ownerColor, "#ffffff", 0.10);
    ctx.fillRect(cursor, y, right, 15);
    ctx.fillStyle = "rgba(8,10,12,0.82)";
    ctx.font = "950 11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (right > 24) ctx.fillText(palette.label, cursor + right / 2, y + 7.5);
    cursor += right;
    if (cursor >= x + w) break;
  }
}

function drawCasterPanel(x, y, w, h, snap) {
  const marker = nearestRecentMarker(snap);
  const read = casterReadout(snap);
  ctx.fillStyle = "rgba(12,15,17,0.70)";
  ctx.strokeStyle = "rgba(232,226,207,0.12)";
  roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f3efe6";
  ctx.font = "950 18px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(read.headline || (marker ? marker.label.toUpperCase() : "LIVE"), x + 12, y + 12);
  ctx.fillStyle = read.color;
  ctx.font = "950 13px Inter, sans-serif";
  wrapText(read.detail, x + 12, y + 42, w - 24, 16, 2);
  ctx.fillStyle = "#b8c2c4";
  ctx.font = "900 12px Inter, sans-serif";
  ctx.fillText(`tick ${Math.round(snap.tick ?? 0)} · ${Math.round(smoothedFps)} fps`, x + 12, y + h - 48);
  const audioText = soundEnabled && audioUnlocked ? "audio on" : "click Enable audio";
  ctx.fillStyle = soundEnabled && audioUnlocked ? "#9df0ba" : "#aeb8bd";
  ctx.fillText(audioText, x + 12, y + h - 26);
}

function casterReadout(snap) {
  const players = (snap.players ?? []).slice(0, 2);
  if (players.length < 2) return { headline: "LIVE", detail: "waiting for replay data", color: "#b8c2c4" };
  const rows = players.map((p) => ({ player: p, delta: macroDelta(p.id, snap, 20) }));
  const crisis = mostImportantCrisis(snap);
  if (crisis) {
    const ownerName = teamNames[crisis.owner] ?? `P${crisis.owner}`;
    return { headline: crisis.label, detail: `${ownerName} ${crisis.detail}`, color: crisis.color };
  }
  const workerCrash = rows.find((r) => r.delta.workerDelta <= -3 || r.delta.deaths >= 5);
  if (workerCrash) {
    const name = teamNames[workerCrash.player.id] ?? `P${workerCrash.player.id}`;
    return { headline: "ECONOMY HIT", detail: `${name} ${workerCrash.delta.workerDelta} workers over the last beat`, color: "#ffd35d" };
  }
  const lead = rows
    .map((r) => ({ ...r, score: r.delta.income * 1.2 + r.delta.spent * 0.35 + r.delta.combatDelta * 4 - Math.max(0, -r.delta.buildingHp) * 0.12 }))
    .sort((a, b) => b.score - a.score);
  if (lead[0].score > lead[1].score + 8) {
    const name = teamNames[lead[0].player.id] ?? `P${lead[0].player.id}`;
    return {
      headline: "MOMENTUM",
      detail: `${name} is converting income into army: +${lead[0].delta.income.toFixed(0)} mined, ${lead[0].delta.combatDelta >= 0 ? "+" : ""}${lead[0].delta.combatDelta} army`,
      color: colors[lead[0].player.id] ?? "#f3efe6",
    };
  }
  const marker = nearestRecentMarker(snap);
  return { headline: marker ? marker.label.toUpperCase() : "MACRO WAR", detail: "watch bases, worker count, and first clean attack path", color: "#b8c2c4" };
}

function mostImportantCrisis(snap) {
  const all = [];
  for (const building of snap.buildings ?? []) {
    const crisis = crisisForBuilding(building, snap);
    if (!crisis) continue;
    all.push({
      owner: building.owner,
      label: crisis.label,
      detail: building.kind === "main" ? "main is under pressure" : "expansion is under pressure",
      color: crisis.color,
      severity: crisis.severity,
    });
  }
  all.sort((a, b) => b.severity - a.severity);
  return all[0] ?? null;
}

function wrapText(text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const words = String(text ?? "").split(/\s+/).filter(Boolean);
  let line = "";
  let lines = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + lines * lineHeight);
      line = word;
      lines++;
      if (lines >= maxLines - 1) break;
    } else {
      line = test;
    }
  }
  if (line && lines < maxLines) ctx.fillText(line, x, y + lines * lineHeight);
}

function nearestRecentMarker(snap) {
  if (!markers.length) return null;
  let best = null;
  let bestDistance = Infinity;
  for (const marker of markers) {
    const distance = Math.abs((marker.tick ?? 0) - (snap.tick ?? 0));
    if (distance < bestDistance) {
      best = marker;
      bestDistance = distance;
    }
  }
  return bestDistance <= 900 ? best : null;
}

function drawVsBanner(snap) {
  if (!snap?.players?.length) return;
  const intro = snap.tick < 560;
  const y = intro ? Math.max(94, canvas.height * 0.15) : 18;
  const h = intro ? 74 : 38;
  const w = intro ? Math.min(720, canvas.width - 48) : Math.min(500, canvas.width - 36);
  const x = (canvas.width - w) / 2;
  const left = snap.players[0];
  const right = snap.players[1] ?? snap.players[snap.players.length - 1];
  if (!left || !right || left.id === right.id) return;
  const alpha = intro ? clamp(1 - snap.tick / 620, 0.38, 1) : 0.78;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(8, 10, 11, 0.72)";
  ctx.strokeStyle = "rgba(232, 226, 207, 0.18)";
  ctx.lineWidth = 1;
  roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  const mid = x + w / 2;
  drawVsTeamPlate(x + 14, y + 8, (w - 80) / 2, h - 16, left, snap, "left");
  drawVsTeamPlate(mid + 26, y + 8, (w - 80) / 2, h - 16, right, snap, "right");
  ctx.fillStyle = "#f4e7b2";
  ctx.shadowColor = "#f4d56a";
  ctx.shadowBlur = intro ? 24 : 10;
  ctx.font = intro ? "950 34px Inter, sans-serif" : "950 20px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("VS", mid, y + h / 2 - (intro ? 2 : 0));
  ctx.shadowBlur = 0;
  if (intro) {
    ctx.fillStyle = "rgba(238,232,214,0.74)";
    ctx.font = "800 11px Inter, sans-serif";
    ctx.fillText("MACRO WAR", mid, y + h - 14);
  }
  ctx.restore();
}

function drawVsTeamPlate(x, y, w, h, player, snap, align) {
  const color = colors[player.id] ?? "#f3efe6";
  const units = (snap.units ?? []).filter((u) => u.owner === player.id);
  const combat = units.filter((u) => u.class !== "worker").length;
  const workers = units.length - combat;
  const income = rollingIncome(player.id, snap);
  ctx.fillStyle = hexToRgba(color, 0.13);
  ctx.strokeStyle = hexToRgba(color, 0.58);
  roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = h > 48 ? "950 22px Inter, sans-serif" : "900 14px Inter, sans-serif";
  ctx.textAlign = align === "left" ? "left" : "right";
  ctx.textBaseline = "top";
  ctx.fillText(teamNames[player.id] ?? `P${player.id}`, align === "left" ? x + 12 : x + w - 12, y + 7);
  ctx.fillStyle = "#efe7d5";
  ctx.font = h > 48 ? "800 12px Inter, sans-serif" : "800 10px Inter, sans-serif";
  const line = `$${Math.floor(player.mana ?? 0)}  +${income.toFixed(1)}/600t  ${combat} army  ${workers} workers`;
  ctx.fillText(line, align === "left" ? x + 12 : x + w - 12, y + (h > 48 ? 36 : 22));
}

function drawWorldHud(snap) {
  const rowH = 52;
  const w = Math.min(900, canvas.width - 36);
  const x = 18;
  const y = (canvas.width / Math.max(1, canvas.getBoundingClientRect().width)) * (window.innerWidth <= 800 ? 58 : 76);
  ctx.save();
  ctx.fillStyle = "rgba(12, 15, 17, 0.62)";
  ctx.strokeStyle = "rgba(230, 226, 210, 0.12)";
  ctx.lineWidth = 1;
  roundRect(x, y, w, 14 + rowH * (snap.players?.length ?? 0), 7);
  ctx.fill();
  ctx.stroke();
  for (const p of snap.players ?? []) {
    const py = y + 8 + p.id * rowH;
    const maxHp = totalBuildingMax(p.id, snap);
    const hpRatio = Math.max(0, Math.min(1, p.building_hp / Math.max(1, maxHp)));
    const macro = macroStats(p.id, snap);
    ctx.fillStyle = colors[p.id];
    ctx.beginPath();
    roundRect(x + 8, py + 4, 58, 20, 4);
    ctx.fill();
    ctx.fillStyle = "#0b0e10";
    ctx.font = "900 11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(teamNames[p.id] ?? `P${p.id}`, x + 37, py + 14);
    ctx.fillStyle = "rgba(45, 50, 54, 0.85)";
    ctx.fillRect(x + 78, py + 6, w - 360, 9);
    ctx.fillStyle = colors[p.id];
    ctx.fillRect(x + 78, py + 6, (w - 360) * hpRatio, 9);
    ctx.fillStyle = "#d9d2c6";
    ctx.font = "700 11px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const nextCard = card(p.production_intent_card_id);
    const next = nextCard.name ?? "Unit";
    ctx.fillText(`${Math.round(p.building_hp)}/${Math.round(maxHp)} hp`, x + 78, py + 19);
    ctx.fillStyle = "#f2d66a";
    ctx.font = "950 22px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`$${macro.bank}`, x + w - 250, py + 2);
    ctx.fillStyle = "#a8dfff";
    ctx.font = "950 18px Inter, sans-serif";
    ctx.fillText(`+${macro.income.toFixed(1)}`, x + w - 136, py + 4);
    ctx.fillStyle = "#f3efe6";
    ctx.font = "950 18px Inter, sans-serif";
    ctx.fillText(`${macro.army}`, x + w - 78, py + 4);
    ctx.fillStyle = "#93f0b2";
    ctx.fillText(`${macro.workers}`, x + w - 24, py + 4);
    ctx.fillStyle = "#aeb8bd";
    ctx.font = "800 10px Inter, sans-serif";
    ctx.fillText("bank", x + w - 250, py + 29);
    ctx.fillText("income", x + w - 136, py + 29);
    ctx.fillText("army", x + w - 78, py + 29);
    ctx.fillText("workers", x + w - 24, py + 29);
    ctx.textAlign = "left";
    const nextPalette = classPalette[nextCard.class] ?? classPalette.soldier;
    ctx.fillStyle = mixColor(nextPalette.base, "#ffffff", 0.18);
    ctx.font = "850 11px Inter, sans-serif";
    ctx.fillText(`next ${next}`, x + 182, py + 19);
    ctx.fillStyle = "#b8c2c4";
    ctx.fillText(`bases ${macro.bases} · mined ${macro.mined} · spent ${macro.spent}`, x + 182, py + 34);
  }
  ctx.restore();
}

function macroStats(player, snap) {
  const units = (snap.units ?? []).filter((u) => u.owner === player);
  const workers = units.filter((u) => u.class === "worker");
  const army = units.length - workers.length;
  const expansions = (snap.buildings ?? []).filter((b) => b.owner === player && b.kind === "expansion" && b.alive !== false).length;
  const p = (snap.players ?? []).find((candidate) => candidate.id === player) ?? {};
  return {
    bank: Math.floor(p.mana ?? 0),
    income: rollingIncome(player, snap),
    mined: Math.round(p.income_total ?? 0),
    spent: Math.round(p.spent_total ?? 0),
    workers: workers.length,
    army,
    bases: 1 + expansions,
  };
}

function totalBuildingMax(player, snap) {
  return (snap.buildings ?? [])
    .filter((b) => b.owner === player && b.alive !== false)
    .reduce((sum, b) => sum + (b.max_hp ?? 0), 0) || replay?.metrics?.building_max_hp || 1;
}

function rollingIncome(player, snap, windowTicks = 600) {
  if (!replay?.snapshots?.length) return 0;
  const now = snap.tick ?? 0;
  let prior = replay.snapshots[0];
  for (let i = index; i >= 0; i--) {
    const candidate = replay.snapshots[i];
    if ((candidate.tick ?? 0) <= now - windowTicks) {
      prior = candidate;
      break;
    }
    prior = candidate;
  }
  const currentPlayer = (snap.players ?? []).find((p) => p.id === player);
  const priorPlayer = (prior.players ?? []).find((p) => p.id === player);
  const currentIncome = currentPlayer?.income_total ?? 0;
  const priorIncome = priorPlayer?.income_total ?? 0;
  const elapsed = Math.max(1, now - (prior.tick ?? 0));
  return Math.max(0, currentIncome - priorIncome) * (windowTicks / elapsed);
}

function drawBadge(x, y, w, title, subtitle, color) {
  ctx.fillStyle = "rgba(20, 22, 23, 0.72)";
  ctx.strokeStyle = `${color}aa`;
  ctx.lineWidth = 1;
  roundRect(x, y, w, 48, 6);
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = color;
  ctx.font = "700 13px sans-serif";
  ctx.fillText(title, x + 10, y + 8);
  ctx.fillStyle = "#d9d2c6";
  ctx.font = "12px sans-serif";
  ctx.fillText(subtitle, x + 10, y + 27);
}

function drawMarkerStrip() {
  if (!replay?.snapshots?.length || markers.length === 0) return;
  const x = 18;
  const y = canvas.height - 22;
  const w = canvas.width - 36;
  const maxIndex = Math.max(1, replay.snapshots.length - 1);
  ctx.strokeStyle = "rgba(243, 239, 230, 0.24)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  for (const m of markers) {
    if (!m.major) continue;
    const mx = x + (m.index / maxIndex) * w;
    ctx.fillStyle = markerColor(m);
    ctx.beginPath();
    ctx.arc(mx, y, Math.abs(m.index - index) <= 2 ? 5 : 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawClassLegend() {
  const present = replayClassSet();
  if (present.size === 0) return;
  const items = classOrder.filter((kind) => present.has(kind));
  const pad = 10;
  const cell = 132;
  const x = 18;
  const y = (canvas.width / Math.max(1, canvas.getBoundingClientRect().width)) * (window.innerWidth <= 800 ? 96 : 76);
  const compact = canvas.width < 1180;
  const shown = compact ? items.slice(0, 10) : items;
  const columns = compact ? 2 : Math.min(2, shown.length);
  const rows = Math.ceil(shown.length / columns);
  const w = Math.min(canvas.width - 36, pad * 2 + columns * cell);
  const h = pad * 2 + 24 + rows * 34;
  ctx.save();
  ctx.fillStyle = "rgba(8,11,13,0.76)";
  ctx.strokeStyle = "rgba(230,226,210,0.18)";
  ctx.lineWidth = 1;
  roundRect(x, y, w, h, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f3efe6";
  ctx.font = "900 12px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("UNIT LEGEND", x + pad, y + pad);
  for (const [idx, kind] of shown.entries()) {
    const col = idx % columns;
    const row = Math.floor(idx / columns);
    const cx = x + pad + col * cell;
    const cy = y + pad + 28 + row * 34;
    drawUnitSpriteIcon(cx + 13, cy + 15, kind, 0, 24);
    ctx.fillStyle = kind === "worker" ? "#e9f5dc" : "#d9d2c6";
    ctx.font = "800 11px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(className(kind), cx + 30, cy + 15);
  }
  ctx.restore();
}

function replayClassSet() {
  const present = new Set();
  for (const snap of replay?.snapshots ?? []) {
    for (const unit of snap.units ?? []) present.add(unit.class);
  }
  return present;
}

function className(kind) {
  return {
    soldier: "Warrior",
    archer: "Archer",
    worker: "Worker",
    bomber: "Bomber",
    siege: "Siege",
    vulture: "Vulture",
    healer: "Medic",
    turret: "Turret",
    matrix_caster: "Matrix",
    storm_caster: "Storm",
    skirmisher: "Skirmisher",
  }[kind] ?? kind;
}

function drawWinnerBanner(snap) {
  if (!replay?.metrics || index < replay.snapshots.length - 2) return;
  const winner = replay.metrics.winner;
  const draw = replay.metrics.draw;
  const title = draw ? "DRAW" : winner >= 0 ? `PLAYER ${winner} WINS` : "UNRESOLVED";
  const color = draw ? "#f3efe6" : colors[winner] ?? "#f3efe6";
  const w = Math.min(560, canvas.width - 44);
  const h = 86;
  const x = (canvas.width - w) / 2;
  const y = Math.max(116, canvas.height * 0.12);
  ctx.save();
  ctx.fillStyle = "rgba(8,10,11,0.78)";
  ctx.strokeStyle = hexToRgba(color, 0.92);
  ctx.lineWidth = 2;
  roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.shadowColor = color;
  ctx.shadowBlur = 22;
  ctx.fillStyle = color;
  ctx.font = "900 34px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(title, x + w / 2, y + 12);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#d9d2c6";
  ctx.font = "700 13px Inter, sans-serif";
  const damage = replay.metrics.building_damage?.map((v, i) => `P${i} ${Math.round(v)}`).join(" · ") ?? "";
  ctx.fillText(`${Math.round(replay.metrics.dynamic_balance_score ?? 0)} dynamic · ${damage}`, x + w / 2, y + 55);
  ctx.restore();
}

function drawBuildingProgress(snap) {
  for (const building of snap.buildings ?? []) {
    if (building.alive === false || building.kind !== "expansion") continue;
    const { x, y } = worldToScreenPoint(building.x, building.y, 5);
    if (building.claim_progress > 0 && building.claim_required > 0) {
      drawProgressBar(x - 18, y - 28, 36, building.claim_progress / building.claim_required, colors[building.claim_owner] ?? "#f3efe6");
    } else if (building.owner >= 0 && building.next_produce_tick > snap.tick && building.next_produce_tick - snap.tick <= 25) {
      drawProgressBar(x - 16, y - 27, 32, 1 - ((building.next_produce_tick - snap.tick) / 25), colors[building.owner]);
    }
  }
}

function drawProgressBar(x, y, w, value, color) {
  x = Math.round(x);
  y = Math.round(y);
  ctx.fillStyle = "rgba(5, 6, 7, 0.88)";
  ctx.fillRect(x - 1, y - 1, w + 2, 6);
  ctx.fillStyle = "rgba(32, 36, 39, 0.92)";
  ctx.fillRect(x, y, w, 4);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, Math.round(w * Math.max(0, Math.min(1, value))), 4);
}

function drawWatchMarkers() {
  const active = markers.filter((m) => m.index <= index && index - m.index <= 8).slice(-4);
  for (const m of active) {
    const age = index - m.index;
    const { x, y } = worldToScreenPoint(m.x, m.y, 7);
    ctx.globalAlpha = Math.max(0.2, 1 - age / 9);
    ctx.fillStyle = markerColor(m);
    ctx.strokeStyle = "rgba(20, 22, 23, 0.82)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 27);
    ctx.lineTo(x + 7, y - 20);
    ctx.lineTo(x, y - 13);
    ctx.lineTo(x - 7, y - 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawObjectiveLines(snap) {
  const byPlayer = new Map((snap.players ?? []).map((p) => [p.id, p]));
  const units = snap.units ?? [];
  const counts = new Map();
  for (const u of units) {
    if (u.class === "worker" || u.target_x === undefined || u.target_y === undefined) continue;
    const key = `${u.owner}:${Math.round(u.target_x / 8)}:${Math.round(u.target_y / 8)}`;
    const seen = counts.get(key) ?? 0;
    if (seen >= 2) continue;
    counts.set(key, seen + 1);
    if (!byPlayer.has(u.owner)) continue;
    const from = worldToScreenPoint(u.x, u.y, 2.5);
    const to = worldToScreenPoint(u.target_x, u.target_y, 1);
    const x1 = from.x;
    const y1 = from.y;
    const x2 = to.x;
    const y2 = to.y;
    if (Math.hypot(x2 - x1, y2 - y1) < 42) continue;
    ctx.save();
    ctx.strokeStyle = hexToRgba(colors[u.owner], 0.18);
    ctx.lineWidth = 1;
    ctx.setLineDash([7, 10]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + (x2 - x1) * 0.32, y1 + (y2 - y1) * 0.32);
    ctx.stroke();
    ctx.restore();
  }
}

function drawMicroCues(snap) {
  const counts = new Map();
  const labelDrawn = new Set();
  for (const u of snap.units ?? []) {
    if (u.class === "worker" || u.target_x === undefined || u.target_y === undefined) continue;
    const kind = unitScriptKind(u, snap);
    if (!["anti_kite", "kite", "deep_kite", "attack_move"].includes(kind)) continue;
    const key = `${u.owner}:${kind}`;
    const cap = kind === "attack_move" ? 3 : 2;
    const seen = counts.get(key) ?? 0;
    if (seen >= cap) continue;
    const from = worldToScreenPoint(u.x, u.y, 2.5);
    const to = worldToScreenPoint(u.target_x, u.target_y, 1);
    const x1 = from.x;
    const y1 = from.y;
    const x2 = to.x;
    const y2 = to.y;
    const pxDist = Math.hypot(x2 - x1, y2 - y1);
    if (pxDist < 10) continue;
    counts.set(key, seen + 1);
    drawMicroLine(x1, y1, x2, y2, kind, colors[u.owner]);
    if (!labelDrawn.has(key)) {
      const label = kind === "anti_kite" ? "intercept" : scriptLabel(kind);
      drawTag((x1 * 0.65) + (x2 * 0.35), (y1 * 0.65) + (y2 * 0.35) - 12, label, colors[u.owner]);
      labelDrawn.add(key);
    }
  }
}

function drawWorkerEconomyCues(snap) {
  const counts = new Map();
  for (const u of snap.units ?? []) {
    if (u.class !== "worker" || !["mine", "return"].includes(u.intent)) continue;
    const key = `${u.owner}:${u.intent}`;
    const seen = counts.get(key) ?? 0;
    if (seen >= 4) continue;
    counts.set(key, seen + 1);
    const from = worldToScreenPoint(u.x, u.y, 1.2);
    const to = worldToScreenPoint(u.target_x, u.target_y, 0.2);
    const x1 = from.x;
    const y1 = from.y;
    const x2 = to.x;
    const y2 = to.y;
    if (Math.hypot(x2 - x1, y2 - y1) < 8) continue;
    ctx.save();
    ctx.strokeStyle = u.intent === "return" ? `${colors[u.owner]}99` : "rgba(226, 193, 79, 0.68)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash(u.intent === "return" ? [] : [4, 5]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }
}

function unitScriptKind(unit, snap) {
  const playerKind = playerScript(unit.owner, snap);
  if (playerKind === "deep_kite" && unit.class === "archer") return "deep_kite";
  if (playerKind === "kite" && unit.class === "archer") return "kite";
  if (playerKind === "anti_kite" && unit.class === "soldier") return "anti_kite";
  if (playerKind === "attack_move") return "attack_move";
  return playerKind;
}

function drawMicroLine(x1, y1, x2, y2, kind, color) {
  const alpha = kind === "attack_move" ? "66" : "aa";
  ctx.save();
  ctx.strokeStyle = `${color}${alpha}`;
  ctx.fillStyle = `${color}${alpha}`;
  ctx.lineWidth = kind === "anti_kite" ? 2.5 : 1.75;
  ctx.setLineDash(kind === "deep_kite" ? [9, 4, 2, 4] : kind === "kite" ? [6, 5] : kind === "attack_move" ? [2, 5] : []);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  const maxLen = kind === "attack_move" ? 42 : kind === "deep_kite" ? 92 : 74;
  const len = Math.max(1, Math.hypot(x2 - x1, y2 - y1));
  const tx = x1 + ((x2 - x1) / len) * Math.min(maxLen, len);
  const ty = y1 + ((y2 - y1) / len) * Math.min(maxLen, len);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  ctx.setLineDash([]);
  if (kind !== "kite" && kind !== "deep_kite") drawArrowHead(tx, ty, Math.atan2(ty - y1, tx - x1), color);
  if (kind === "anti_kite") {
    ctx.strokeStyle = "#f3efe6aa";
    ctx.beginPath();
    ctx.arc(tx, ty, 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawArrowHead(x, y, angle, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - Math.cos(angle - 0.55) * 9, y - Math.sin(angle - 0.55) * 9);
  ctx.lineTo(x - Math.cos(angle + 0.55) * 9, y - Math.sin(angle + 0.55) * 9);
  ctx.closePath();
  ctx.fill();
}

function hexToRgba(color, alpha) {
  if (!color || !color.startsWith("#")) return `rgba(255,255,255,${alpha})`;
  const raw = color.slice(1);
  const hex = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw.slice(0, 6);
  const value = Number.parseInt(hex, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawTag(x, y, text, color) {
  ctx.save();
  ctx.font = "700 11px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const w = Math.ceil(ctx.measureText(text).width) + 12;
  ctx.fillStyle = "rgba(20, 22, 23, 0.78)";
  ctx.strokeStyle = `${color}bb`;
  ctx.lineWidth = 1;
  roundRect(x, y - 9, w, 18, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f3efe6";
  ctx.fillText(text, x + 6, y);
  ctx.restore();
}

function drawStaticDefenseEmplacement(building, x, y, half, ownerColor) {
  const level = Math.round(building.static_defense_level ?? 0);
  if (building.owner < 0) return;
  const clamped = Math.max(1, Math.min(5, level + 1));
  const isMain = building.kind === "main";
  const rangeWorld = (isMain ? 9.5 : 8.5) + level * 1.25;
  const rangePx = Math.max(36, mapScale() * rangeWorld * 0.78);
  const pulse = 0.55 + Math.sin(performance.now() * 0.005 + building.id) * 0.10;
  const baseAlpha = level > 0 ? 0.24 : 0.12;
  const podAlpha = level > 0 ? 0.82 : 0.52;

  ctx.save();
  ctx.strokeStyle = hexToRgba(ownerColor, baseAlpha + pulse * 0.06);
  ctx.lineWidth = crispLine(level > 0 ? 1.5 : 1.0);
  ctx.setLineDash(level > 0 ? [7, 9] : [4, 10]);
  ctx.beginPath();
  ctx.arc(x, y, rangePx, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.shadowColor = ownerColor;
  ctx.shadowBlur = level > 0 ? 14 : 6;
  ctx.strokeStyle = hexToRgba(ownerColor, podAlpha);
  ctx.lineWidth = crispLine(level > 0 ? 2.0 : 1.3);
  ctx.beginPath();
  ctx.arc(x, y, half + 8, 0, Math.PI * 2);
  ctx.stroke();

  const pods = level > 0 ? Math.min(4, clamped) : (isMain ? 2 : 1);
  for (let i = 0; i < pods; ++i) {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / pods + (isMain ? Math.PI / 4 : 0);
    const px = x + Math.cos(angle) * (half + 10);
    const py = y + Math.sin(angle) * (half + 10);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.globalAlpha = level > 0 ? 1.0 : 0.82;
    ctx.fillStyle = mixColor(ownerColor, "#ffffff", level > 0 ? 0.18 : 0.08);
    ctx.strokeStyle = "rgba(3,5,6,0.92)";
    ctx.lineWidth = crispLine(2.2);
    ctx.beginPath();
    ctx.moveTo(-4, -4);
    ctx.lineTo(4, -4);
    ctx.lineTo(5, 4);
    ctx.lineTo(-5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = level > 0 ? "#fff1ba" : hexToRgba("#fff1ba", 0.72);
    ctx.lineWidth = crispLine(level > 0 ? 2.4 : 1.6);
    ctx.beginPath();
    ctx.moveTo(0, -1);
    ctx.lineTo(0, -12);
    ctx.stroke();
    ctx.restore();
  }

  if (clamped >= 3) {
    ctx.strokeStyle = "#fff1ba";
    ctx.lineWidth = crispLine(1.5);
    ctx.beginPath();
    ctx.arc(x, y, half + 14, -Math.PI * 0.18, Math.PI * 0.18);
    ctx.arc(x, y, half + 14, Math.PI * 0.82, Math.PI * 1.18);
    ctx.stroke();
  }
  ctx.restore();
}

function markerColor(marker) {
  if (marker.type === "destroyed" || marker.type === "main_damage") return "#f07a61";
  if (marker.type === "repair") return "#8ee3b0";
  return colors[marker.owner] ?? "#e2c14f";
}

function drawBuildings(snap) {
  const buildings = [...(snap.buildings ?? [])].sort((a, b) => (a.x + a.y) - (b.x + b.y));
  for (const building of buildings) {
    SimIsoRenderer.drawBuilding(replayIsoEnv(), building, {
      afterBlock: ({ x, y, half, ownerColor, isMain }) => {
        drawStaticDefenseEmplacement(building, x, y - (isMain ? 8 : 5), half, ownerColor);
      },
    });
  }
}

function replayIsoEnv() {
  return {
    ctx,
    crispLine,
    hexToRgba,
    mixColor,
    worldToScreen: worldToScreenPoint,
    drawShadow,
    drawHealthPip,
    drawTeamPlate,
    colors,
    teamNames,
    animTime,
  };
}

function drawTeamPlate(x, y, w, color, label) {
  ctx.save();
  ctx.fillStyle = "rgba(8,10,12,0.72)";
  ctx.strokeStyle = hexToRgba(color, 0.78);
  ctx.lineWidth = crispLine(1.4);
  roundRect(x, y, w, 22, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fillRect(x + 5, y + 5, 11, 12);
  ctx.fillStyle = "#f7f3e8";
  ctx.font = "800 11px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + 21, y + 11);
  ctx.restore();
}

function drawTeamFlag(x, y, color, label) {
  const w = label.length > 2 ? 42 : 28;
  drawTeamPlate(x - w / 2, y, w, color, label);
}

function drawExpansionSiteMarker(x, y, size, progress, color, active) {
  const w = size * 1.72;
  const h = size * 0.82;
  ctx.save();
  ctx.globalAlpha = active ? 1 : 0.74;
  ctx.lineWidth = active ? crispLine(2.8) : crispLine(1.7);
  ctx.strokeStyle = hexToRgba(color, active ? 0.82 : 0.42);
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
    const points = [[x, y - h], [x + w, y], [x, y + h], [x - w, y], [x, y - h]];
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

function drawBuildingFoundation(x, y, size, ownerColor, owned, active, idleReady, pulse) {
  const w = size * 1.42;
  const h = w * 0.46;
  ctx.save();
  ctx.fillStyle = owned
    ? hexToRgba(ownerColor, 0.18)
    : active
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

function drawBuildingUpperTier(x, y, size, height, ownerColor, owned, active, isMain) {
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
  cap.addColorStop(0.6, owned ? ownerColor : active ? "#9a9f8d" : "#6c7367");
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
  const bottom = top.map((p) => ({ x: p.x, y: p.y + height }));
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

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawUnits(snap) {
  const units = [...(snap.units ?? [])].sort((a, b) => ((a.x + a.y) - (b.x + b.y)) || (a.id - b.id));
  const displayUnits = units.map((u) => {
    const offset = renderSeparationOffset(u);
    const p = worldToScreenPoint(u.x, u.y, unitHoverHeight(u));
    return {
      u,
      x: p.x + offset.x,
      y: p.y + offset.y,
      r: unitRadius(u),
      depth: u.x + u.y,
    };
  });
  separateDisplayUnits(displayUnits);
  displayUnits.sort((a, b) => (a.depth - b.depth) || (a.y - b.y) || (a.u.id - b.u.id));
  for (const item of displayUnits) {
    const { u, x, y, r } = item;
    const color = unitBaseColor(u);
    const damageFlash = unitDamageFlashAmount(u.id);
    if (damageFlash > 0) drawUnitDamageFlash(x, y, r, u, damageFlash, true);
    drawUnitAura(x, y, r, u);
    drawUnitBody(x, y, r, u);
    if (damageFlash > 0) drawUnitDamageFlash(x, y, r, u, damageFlash, false);
    const hpRatio = Math.max(0, u.hp / Math.max(1, u.max_hp));
    if (hpRatio < 0.92) drawHealthPip(x, y + r + 8, r * 2.1, hpRatio, color);
  }
}

function unitDamageFlashAmount(unitId) {
  rebuildDamageFlashCache();
  return unitDamageFlashCache.get(unitId) ?? 0;
}

function rebuildDamageFlashCache() {
  if (unitDamageFlashCacheIndex === index) return;
  unitDamageFlashCacheIndex = index;
  unitDamageFlashCache = new Map();
  if (!replay?.snapshots?.length) return;
  const lookback = 5;
  for (let i = Math.max(1, index - lookback + 1); i <= index; ++i) {
    const before = replay.snapshots[i - 1];
    const after = replay.snapshots[i];
    if (!before || !after) continue;
    const beforeById = new Map((before.units ?? []).map((u) => [u.id, u]));
    const age = index - i;
    const ageFade = Math.max(0, 1 - age / lookback);
    for (const unit of after.units ?? []) {
      const prior = beforeById.get(unit.id);
      if (!prior || prior.hp === undefined || unit.hp === undefined) continue;
      const lost = prior.hp - unit.hp;
      if (lost <= 0.01) continue;
      const hpScale = Math.min(1, lost / Math.max(1, unit.max_hp ?? prior.max_hp ?? 1) * 5.5);
      const pulse = 0.72 + 0.28 * Math.sin(animTime * 28 + unit.id);
      const amount = Math.max(0.25, hpScale) * ageFade * pulse;
      unitDamageFlashCache.set(unit.id, Math.max(unitDamageFlashCache.get(unit.id) ?? 0, amount));
    }
  }
}

function drawUnitDamageFlash(x, y, r, u, amount, underlay) {
  const angle = unitAngle(u);
  const alpha = Math.min(1, amount);
  ctx.save();
  ctx.globalCompositeOperation = underlay ? "source-over" : "lighter";
  ctx.translate(Math.round(x), Math.round(y));
  ctx.rotate(angle);
  if (underlay) {
    const radius = r * (1.45 + alpha * 0.22);
    const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, radius);
    glow.addColorStop(0, `rgba(255,232,84,${0.30 * alpha})`);
    glow.addColorStop(0.58, `rgba(255,212,42,${0.18 * alpha})`);
    glow.addColorStop(1, "rgba(255,212,42,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = `rgba(255,236,84,${0.52 * alpha})`;
    unitShapePath(u.class, r + 2.2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,245,128,${0.95 * alpha})`;
    ctx.lineWidth = crispLine(2.4 + alpha * 2.2);
    unitShapePath(u.class, r + 4.0);
    ctx.stroke();
  }
  ctx.restore();
}

function unitHoverHeight(unit) {
  if (unit.class === "vulture" || unit.class === "matrix_caster" || unit.class === "storm_caster") return 2.8;
  if (unit.class === "siege") return 1.4;
  if (unit.class === "turret") return 0.8;
  return 1.8;
}

function unitBaseColor(unit) {
  return colors[unit.owner] ?? "#c8c5bc";
}

function unitSpriteKey(klass, owner) {
  return `${klass}|${owner}`;
}

function buildUnitSprite(klass, owner) {
  const r = unitRadius({ class: klass });
  const palette = classPalette[klass] ?? classPalette.soldier;
  const team = colors[owner] ?? "#c8c5bc";
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
    currentUnitTextAngle = 0;
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

function drawUnitSpriteIcon(x, y, klass, owner, size) {
  const sprite = getUnitSprite(klass, owner);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  const scale = size / sprite.sizeCss;
  ctx.drawImage(sprite.canvas, -sprite.half * scale, -sprite.half * scale, sprite.sizeCss * scale, sprite.sizeCss * scale);
  ctx.restore();
}

function unitFillStyle(kind, r, palette, team) {
  const gradient = ctx.createLinearGradient(-r * 0.65, -r * 0.80, r * 0.78, r * 0.88);
  gradient.addColorStop(0.00, mixColor(team, "#ffffff", 0.46));
  gradient.addColorStop(0.26, mixColor(team, "#ffffff", 0.16));
  gradient.addColorStop(0.76, mixColor(team, "#020607", 0.22));
  gradient.addColorStop(1.00, mixColor(team, "#020607", 0.44));
  return gradient;
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

function unitRadius(unit) {
  if (unit.class === "worker") return 13;
  if (unit.class === "archer") return 19;
  if (unit.class === "bomber") return 18;
  if (unit.class === "siege") return 25;
  if (unit.class === "vulture") return 20;
  if (unit.class === "healer") return 18;
  if (unit.class === "turret") return 18;
  if (unit.class === "matrix_caster") return 19;
  if (unit.class === "storm_caster") return 19;
  if (unit.class === "skirmisher") return 19;
  return 21;
}

function renderSeparationOffset(unit) {
  const scale = Math.min(1.8, Math.max(1, currentView.zoom));
  const ring = 6.0 * scale;
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
    turret: 4.1,
    matrix_caster: 4.7,
    storm_caster: 5.2,
    skirmisher: 5.7,
  }[kind] ?? 0;
}

function drawUnitBody(x, y, r, u) {
  const angle = unitAngle(u);
  const sprite = getUnitSprite(u.class, u.owner);
  ctx.save();
  drawShadow(x, y + r * 0.56, r * 1.04, 0.31);
  x = Math.round(x);
  y = Math.round(y);
  ctx.translate(x, y);
  ctx.rotate(angle);
  currentUnitTextAngle = angle;
  ctx.drawImage(sprite.canvas, -sprite.half, -sprite.half, sprite.sizeCss, sprite.sizeCss);
  ctx.restore();
}

function drawOwnerRing(x, y, r, team, u) {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = hexToRgba(team, 0.46);
  ctx.lineWidth = u.class === "siege" ? 1.8 : 1.4;
  ctx.beginPath();
  ctx.arc(x, y, r + 5.2, -Math.PI * 0.10, Math.PI * 1.16);
  ctx.stroke();
  ctx.strokeStyle = hexToRgba(team, 0.18);
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(x, y, r + 5.3, Math.PI * 1.23, Math.PI * 1.73);
  ctx.stroke();
  ctx.restore();
}

function drawOwnerNotch(r, team) {
  ctx.save();
  ctx.rotate(-currentUnitTextAngle);
  ctx.fillStyle = team;
  ctx.strokeStyle = "rgba(10,12,13,0.82)";
  ctx.lineWidth = crispLine(1.2);
  ctx.beginPath();
  ctx.arc(r * 0.58, -r * 0.78, Math.max(3.2, r * 0.23), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function unitAngle(unit) {
  if (unit.target_x === undefined || unit.target_y === undefined) return 0;
  return Math.atan2(unit.target_y - unit.y, unit.target_x - unit.x);
}

function classStroke(kind) {
  if (kind === "archer") return "#e7ca65";
  if (kind === "worker") return "#8dd7ad";
  if (kind === "bomber") return "#ffad6a";
  if (kind === "siege") return "#d7d1bf";
  if (kind === "vulture") return "#9ec7ff";
  if (kind === "healer") return "#8ee3b0";
  if (kind === "turret") return "#b8d6ff";
  if (kind === "matrix_caster") return "#73ffd8";
  if (kind === "storm_caster") return "#a99cff";
  if (kind === "skirmisher") return "#ff87cf";
  return "#e8edf2";
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
    if (ctx.roundRect) ctx.roundRect(-r * 1.18, -r * 0.78, r * 2.36, r * 1.56, 3);
    else ctx.rect(-r * 1.18, -r * 0.78, r * 2.36, r * 1.56);
  } else if (kind === "turret") {
    ctx.moveTo(0, -r);
    ctx.lineTo(r, 0);
    ctx.lineTo(0, r);
    ctx.lineTo(-r, 0);
    ctx.closePath();
  } else if (kind === "worker") {
    ctx.rect(-r * 0.72, -r * 0.72, r * 1.44, r * 1.44);
  } else if (kind === "matrix_caster") {
    ctx.ellipse(0, 0, r * 1.10, r * 0.72, 0, 0, Math.PI * 2);
  } else if (kind === "storm_caster") {
    ctx.moveTo(0, -r * 1.20);
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
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
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
  } else if (kind === "turret") {
    ctx.strokeStyle = light;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.54, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawClassMark(kind, r, palette, team) {
  const light = "#fff4d8";
  const mid = "#c8bfaa";
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
  } else if (kind === "turret") {
    ctx.fillStyle = dark;
    ctx.fillRect(-r * 0.18, -r * 0.92, r * 0.36, r * 0.70);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.30, 0, Math.PI * 2);
    ctx.stroke();
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

function drawUnitAura(x, y, r, u) {
  if (u.ability === "none") return;
  const ready = u.cooldown === 0;
  const color = mixColor(colors[u.owner] ?? "#f3efe6", "#ffffff", 0.28);
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

function unitIcon(unit) {
  if (unit.class === "archer") return "🏹";
  if (unit.class === "worker") return "⚒";
  if (unit.class === "bomber") return "💥";
  if (unit.class === "siege") return "🛡️";
  if (unit.class === "vulture") return "🏍️";
  if (unit.class === "healer") return "✚";
  if (unit.class === "turret") return "▣";
  if (unit.class === "matrix_caster") return "◇";
  if (unit.class === "storm_caster") return "✦";
  if (unit.class === "skirmisher") return "➤";
  return "⚔️";
}

function drawHealthPip(x, y, width, ratio, color) {
  const h = 5;
  x = Math.round(x);
  y = Math.round(y);
  width = Math.round(width);
  ctx.save();
  ctx.fillStyle = "rgba(4,6,7,0.92)";
  ctx.fillRect(Math.round(x - width / 2) - 1, y - 1, width + 2, h + 2);
  ctx.fillStyle = "rgba(28,32,35,0.92)";
  ctx.fillRect(Math.round(x - width / 2), y, width, h);
  ctx.fillStyle = ratio > 0.45 ? mixColor(color, "#ffffff", 0.12) : "#e95d4f";
  ctx.fillRect(Math.round(x - width / 2), y, Math.round(width * Math.max(0, Math.min(1, ratio))), h);
  ctx.restore();
}

function drawShadow(x, y, radius, alpha) {
  ctx.save();
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.8);
  g.addColorStop(0, `rgba(0,0,0,${alpha})`);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, radius * 1.8, radius * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSoftFog(snap) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const p of snap.players ?? []) {
    const base = replay?.map?.bases?.find((b) => b.player === p.id);
    if (!base) continue;
    const screen = worldToScreenPoint(base.x, base.y);
    const x = screen.x;
    const y = screen.y;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 140);
    g.addColorStop(0, hexToRgba(colors[p.id], 0.035));
    g.addColorStop(1, hexToRgba(colors[p.id], 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 140, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawForegroundVignette() {
  ctx.save();
  const center = cameraCenter();
  const g = ctx.createRadialGradient(center.x, center.y, Math.min(canvas.width, canvas.height) * 0.25,
                                     center.x, center.y, Math.max(canvas.width, canvas.height) * 0.72);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function mixColor(a, b, t) {
  const ca = parseHex(a);
  const cb = parseHex(b);
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function parseHex(color) {
  if (!color || !color.startsWith("#")) return [255, 255, 255];
  const raw = color.slice(1);
  const hex = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw.slice(0, 6);
  const value = Number.parseInt(hex, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function drawPanel(snap) {
  const buildingMaxByPlayer = new Map();
  for (const building of snap.buildings ?? []) {
    if (building.owner < 0 || building.alive === false) continue;
    buildingMaxByPlayer.set(building.owner, (buildingMaxByPlayer.get(building.owner) ?? 0) + building.max_hp);
  }
  if (snap.offer) {
    const c = card(snap.offer.card_id);
    offer.textContent = `${c.name} priority P${snap.offer.priority.join(" / P")} until ${snap.offer.expires_tick}`;
  } else {
    offer.textContent = "Live Match";
  }
  players.innerHTML = snap.players.map((p) => `
    <div class="player" style="--team:${colors[p.id]}">
      <div class="player-title">
        <span class="team-swatch"></span>
        <strong>${escapeHtml(teamLabel(p.id))}</strong>
      </div>
      <span class="money-line">$${Math.floor(p.mana ?? 0)} · +${rollingIncome(p.id, snap).toFixed(1)} income</span>
      ${supplyBarHtml(p)}
      <span>${escapeHtml(shortEconomySummary(p.id, snap))}</span>
      <span>${escapeHtml(shortArmySummary(p.id, snap))}</span>
      ${productionQueueHtml(p, snap)}
      <div class="bar"><div class="fill" style="width:${Math.max(0, p.building_hp / (buildingMaxByPlayer.get(p.id) ?? replay.metrics?.building_max_hp ?? 120) * 100)}%"></div></div>
    </div>
  `).join("");
  renderPanelUnitSprites();
  metrics.textContent = replay.metrics
    ? `${replay.metrics.draw ? "Draw" : replay.metrics.winner >= 0 ? `${teamNames[replay.metrics.winner] ?? `P${replay.metrics.winner}`} wins` : "In progress"}`
    : "";
}

function supplyBarHtml(player) {
  const cap = Math.max(1, Number(player.supply_cap ?? 1));
  const active = Math.max(0, Number(player.active_supply ?? 0));
  const queued = Math.max(0, Number(player.pending_supply ?? 0) + Number(player.queued_supply ?? 0));
  const activePct = clamp(active / cap, 0, 1) * 100;
  const queuedPct = clamp((active + queued) / cap, 0, 1) * 100;
  const capPressure = active + queued >= cap - 0.001 ? " capped" : "";
  return `
    <div class="supply-meter${capPressure}">
      <div class="supply-meter-head">
        <strong>${Math.round(active)} / ${Math.round(cap)}</strong>
        <span>SUPPLY</span>
      </div>
      <div class="supply-track">
        <i class="supply-queued" style="width:${queuedPct}%"></i>
        <i class="supply-active" style="width:${activePct}%"></i>
      </div>
    </div>
  `;
}

function productionQueueHtml(player, snap) {
  const items = productionQueueItems(player, snap);
  const slots = Array.from({ length: 3 }, (_, i) => items[i] ?? null);
  return `
    <div class="production-list${items.length ? "" : " empty"}" aria-label="construction queue">
      ${slots.map((item, slot) => item ? productionQueueItemHtml(item, player.id, slot) : productionQueueEmptySlotHtml(slot)).join("")}
      ${items.length > 3 ? `<span class="queue-more">+${items.length - 3} overflow</span>` : ""}
    </div>
  `;
}

function productionQueueItems(player, snap) {
  const items = [];
  for (const detail of player.production_queue_details ?? []) {
    const c = card(detail.card_id);
    const remaining = Math.max(0, Number(detail.remaining_ticks ?? 0));
    items.push({
      cardId: detail.card_id,
      source: "queue",
      icon: c.icon ?? "?",
      name: c.name ?? "Unknown",
      klass: detail.class ?? c.class ?? "soldier",
      remaining,
      progress: queueProgress(detail.age_ticks, detail.ready_tick - detail.queued_tick),
      label: detail.ready ? "ready" : `${remaining}t`,
      reason: "",
    });
  }

  // Backward compatibility for older replays that only stored card ids.
  if (!items.length) {
    for (const cardId of player.production_queue ?? []) {
      const c = card(cardId);
      items.push({
        cardId,
        source: "queue",
        icon: c.icon ?? "?",
        name: c.name ?? "Unknown",
        klass: c.class ?? "soldier",
        remaining: null,
        progress: 0,
        label: "queued",
        reason: "",
      });
    }
  }

  for (const building of snap.buildings ?? []) {
    if (building.owner !== player.id || building.alive === false || !building.pending_card_id) continue;
    const c = card(building.pending_card_id);
    const total = Math.max(1, (building.pending_finish_tick ?? snap.tick) - (building.pending_start_tick ?? snap.tick));
    const age = Math.max(0, (snap.tick ?? 0) - (building.pending_start_tick ?? snap.tick));
    const remaining = Math.max(0, (building.pending_finish_tick ?? snap.tick) - (snap.tick ?? 0));
    items.push({
      cardId: building.pending_card_id,
      source: building.kind === "main" ? "main" : `base ${building.id}`,
      icon: c.icon ?? "?",
      name: c.name ?? "Unknown",
      klass: c.class ?? "soldier",
      remaining,
      progress: queueProgress(age, total),
      label: `${remaining}t`,
      reason: building.pending_reason ?? "",
    });
  }

  return items.sort((a, b) => {
    const ar = a.remaining ?? 99999;
    const br = b.remaining ?? 99999;
    return ar - br || a.cardId - b.cardId;
  });
}

function queueProgress(age, total) {
  const denominator = Math.max(1, Number(total || 0));
  return clamp(Number(age || 0) / denominator, 0, 1);
}

function productionQueueItemHtml(item, playerId, slot) {
  return `
    <span class="queue-item active" title="${escapeHtml(item.name)} · ${escapeHtml(item.source)}${item.reason ? ` · ${escapeHtml(item.reason)}` : ""}">
      <canvas class="queue-sprite" width="216" height="216" data-class="${escapeHtml(item.klass)}" data-owner="${playerId}"></canvas>
      <b>${escapeHtml(item.name)}</b>
      <em style="width:${Math.round(item.progress * 100)}%"></em>
    </span>
  `;
}

function productionQueueEmptySlotHtml(slot) {
  return `
    <span class="queue-item empty-slot" title="empty construction slot">
      <span class="queue-slot-number">${slot + 1}</span>
      <b>empty</b>
    </span>
  `;
}

function renderPanelUnitSprites() {
  for (const canvasEl of document.querySelectorAll(".queue-sprite")) {
    const klass = canvasEl.dataset.class || "soldier";
    const owner = Number(canvasEl.dataset.owner || 0);
    const sprite = getUnitSprite(klass, owner);
    const panelCtx = canvasEl.getContext("2d");
    const w = canvasEl.width;
    const h = canvasEl.height;
    panelCtx.clearRect(0, 0, w, h);
    const scale = Math.min(w, h) / sprite.sizeCss;
    panelCtx.drawImage(
      sprite.canvas,
      w / 2 - sprite.half * scale,
      h / 2 - sprite.half * scale,
      sprite.sizeCss * scale,
      sprite.sizeCss * scale
    );
  }
}

function shortEconomySummary(player, snap) {
  const workers = (snap.units ?? []).filter((u) => u.owner === player && u.class === "worker").length;
  const bases = 1 + (snap.buildings ?? []).filter((b) => b.owner === player && b.kind === "expansion" && b.alive !== false).length;
  return `${bases} bases · ${workers} workers`;
}

function shortArmySummary(player, snap) {
  const units = (snap.units ?? []).filter((u) => u.owner === player && u.class !== "worker");
  if (!units.length) return "no army";
  const counts = classOrder
    .map((kind) => [kind, units.filter((u) => u.class === kind).length])
    .filter(([, count]) => count > 0)
    .slice(0, 3)
    .map(([kind, count]) => `${(classPalette[kind] ?? {}).label ?? kind[0]} ${count}`);
  return `${units.length} army · ${counts.join(" ")}`;
}

function microSummary(player, snap) {
  const counts = { attack_move: 0, kite: 0, deep_kite: 0, anti_kite: 0 };
  for (const u of snap.units ?? []) {
    if (u.owner !== player || u.class === "worker") continue;
    const kind = unitScriptKind(u, snap);
    if (counts[kind] !== undefined) counts[kind]++;
  }
  const parts = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([kind, count]) => `${scriptLabel(kind)} ${count}`);
  return parts.length ? `control ${parts.join(" · ")}` : "control no army";
}

function economySummary(player, snap) {
  const workers = (snap.units ?? []).filter((u) => u.owner === player && u.class === "worker");
  const mining = workers.filter((u) => u.intent === "mine").length;
  const returning = workers.filter((u) => u.intent === "return").length;
  const claiming = workers.filter((u) => u.intent === "claim").length;
  const harass = workers.filter((u) => u.intent === "harass").length;
  const cargo = workers.reduce((sum, u) => sum + (u.worker_cargo ?? 0), 0);
  const expansions = (snap.buildings ?? []).filter((b) => b.owner === player && b.kind === "expansion" && b.alive !== false).length;
  return `eco ${workers.length} workers · mine ${mining}/${returning} · claim ${claiming} · raid ${harass} · bases ${1 + expansions}`;
}

const params = new URLSearchParams(window.location.search);
if (params.has("replay")) {
  loadReplayUrl(params.get("replay")).catch((error) => {
    offer.textContent = `Replay load failed: ${error.message}`;
  });
} else {
  draw();
}
