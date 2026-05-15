const form = document.querySelector("#botAdminForm");
const scenarioEl = document.querySelector("#scenario");
const difficultyEl = document.querySelector("#difficulty");
const policyEl = document.querySelector("#policy");
const workerTargetEl = document.querySelector("#workerTarget");
const buildTimeScaleEl = document.querySelector("#buildTimeScale");
const expandBiasEl = document.querySelector("#expandBias");
const attackThresholdEl = document.querySelector("#attackThreshold");
const rulesList = document.querySelector("#rulesList");
const summaryEl = document.querySelector("#summary");
const deeplinkEl = document.querySelector("#deeplink");
const launchButton = document.querySelector("#launchGame");
const addRuleButton = document.querySelector("#addRule");
const resetButton = document.querySelector("#resetConfig");
const counterPreferenceEls = [...document.querySelectorAll("[name='counterPreference']")];

const storageKey = "simsystem_bot_admin_config";
const defaultConfig = {
  scenario: 2,
  difficulty: 8,
  policy: "command_center_danger_human_killer",
  workerTarget: 30,
  buildTimeScale: 1.0,
  expandBias: 82,
  attackThreshold: 62,
  counterPreferences: ["archers", "storm", "static_defense"],
  rules: [
    { when: "enemy_mass_warriors", prefer: "archer_storm_static", weight: 90 },
    { when: "enemy_mass_siege", prefer: "bomber_skirmisher_flank", weight: 78 },
    { when: "enemy_greedy_expand", prefer: "vulture_worker_harass", weight: 74 },
  ],
};

function loadConfig() {
  try {
    return { ...defaultConfig, ...JSON.parse(localStorage.getItem(storageKey) || "{}") };
  } catch {
    return { ...defaultConfig };
  }
}

function saveConfig(config) {
  localStorage.setItem(storageKey, JSON.stringify(config));
}

function configFromForm() {
  const workerTarget = Number(workerTargetEl.value);
  const buildTimeScale = Number(buildTimeScaleEl.value) / 100;
  const expandBias = Number(expandBiasEl.value);
  const attackThreshold = Number(attackThresholdEl.value);
  const rules = [...rulesList.querySelectorAll(".admin-rule-row")].map((row) => ({
    when: row.querySelector("[data-field='when']").value,
    prefer: row.querySelector("[data-field='prefer']").value,
    weight: Number(row.querySelector("[data-field='weight']").value),
  }));
  return {
    scenario: Number(scenarioEl.value),
    difficulty: Number(difficultyEl.value),
    policy: policyEl.value,
    workerTarget,
    buildTimeScale,
    targetWorkers: workerTarget,
    buildTimeScalePercent: Number(buildTimeScaleEl.value),
    expandBias,
    expansionAggression: expandBias,
    attackThreshold,
    aggressionThreshold: attackThreshold,
    counterPreferences: counterPreferenceEls.filter((input) => input.checked).map((input) => input.value),
    rules,
    reactionRules: rules.map((rule) => ({ trigger: rule.when, threshold: rule.weight, prefer: rule.prefer })),
  };
}

function applyConfig(config) {
  scenarioEl.value = String(config.scenario);
  difficultyEl.value = String(config.difficulty);
  policyEl.value = config.policy;
  workerTargetEl.value = String(config.workerTarget);
  buildTimeScaleEl.value = String(Math.round((config.buildTimeScale ?? 1.0) * 100));
  expandBiasEl.value = String(config.expandBias);
  attackThresholdEl.value = String(config.attackThreshold);
  counterPreferenceEls.forEach((input) => {
    input.checked = (config.counterPreferences || defaultConfig.counterPreferences).includes(input.value);
  });
  rulesList.innerHTML = "";
  for (const rule of config.rules) addRuleRow(rule);
  refresh();
}

function addRuleRow(rule = { when: "enemy_mass_warriors", prefer: "archer_storm_static", weight: 70 }) {
  const row = document.createElement("div");
  row.className = "admin-rule-row";
  row.innerHTML = `
    <select data-field="when">
      <option value="enemy_mass_warriors">Enemy mass warriors</option>
      <option value="enemy_mass_archers">Enemy mass archers</option>
      <option value="enemy_mass_siege">Enemy mass siege</option>
      <option value="enemy_greedy_expand">Enemy greedy expands</option>
      <option value="home_under_attack">Home under attack</option>
      <option value="floating_money">Bot floating money</option>
    </select>
    <select data-field="prefer">
      <option value="archer_storm_static">Archers, storm, static defense</option>
      <option value="warrior_vulture_close">Warriors and vultures</option>
      <option value="bomber_skirmisher_flank">Bombers and skirmishers</option>
      <option value="vulture_worker_harass">Vulture worker harass</option>
      <option value="siege_matrix_break">Siege plus matrix</option>
      <option value="workers_until_30">Workers until 30</option>
    </select>
    <input data-field="weight" type="range" min="0" max="100" value="${rule.weight}">
    <button type="button" data-remove>Remove</button>`;
  row.querySelector("[data-field='when']").value = rule.when;
  row.querySelector("[data-field='prefer']").value = rule.prefer;
  row.querySelector("[data-remove]").addEventListener("click", () => {
    row.remove();
    refresh();
  });
  row.querySelectorAll("select,input").forEach((el) => el.addEventListener("input", refresh));
  rulesList.appendChild(row);
}

function encodeConfig(config) {
  return btoa(JSON.stringify(config)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function battleUrl(config) {
  const params = new URLSearchParams({
    scenario: String(config.scenario),
    difficulty: String(config.difficulty),
    botPolicy: config.policy,
    botAdmin: encodeConfig(config),
    botConfig: JSON.stringify(config),
    seed: String(Math.floor(Math.random() * 1000000) + 1),
  });
  return `${window.location.origin}/play.html?${params.toString()}`;
}

function refresh() {
  const config = configFromForm();
  document.querySelector("#difficultyValue").textContent = config.difficulty;
  document.querySelector("#workerTargetValue").textContent = config.workerTarget;
  document.querySelector("#buildTimeScaleValue").textContent = `${Math.round(config.buildTimeScale * 100)}%`;
  document.querySelector("#expandBiasValue").textContent = config.expandBias;
  document.querySelector("#attackThresholdValue").textContent = config.attackThreshold;
  const url = battleUrl(config);
  summaryEl.innerHTML = `
    <div><strong>${config.policy}</strong></div>
    <div>Bot ${config.difficulty} · ${config.workerTarget} workers · build time ${Math.round(config.buildTimeScale * 100)}% · expansion ${config.expandBias} · attack ${config.attackThreshold}</div>
    <div>${config.counterPreferences.join(", ") || "default counters"} · ${config.rules.length} reaction rules saved into the launch payload.</div>
    <div class="muted">Current engine consumes difficulty and policy now. Economy targets, expansion/aggression weights, counter preferences, and reaction rules are persisted so the C++ bot hooks can read the same contract next.</div>`;
  deeplinkEl.textContent = url;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const config = configFromForm();
  saveConfig(config);
  refresh();
});

launchButton.addEventListener("click", () => {
  const config = configFromForm();
  saveConfig(config);
  window.location.href = battleUrl(config);
});

addRuleButton.addEventListener("click", () => {
  addRuleRow();
  refresh();
});

resetButton.addEventListener("click", () => {
  applyConfig({ ...defaultConfig });
  saveConfig(defaultConfig);
});

form.querySelectorAll("input,select").forEach((el) => el.addEventListener("input", refresh));
counterPreferenceEls.forEach((el) => el.addEventListener("change", refresh));
applyConfig(loadConfig());
