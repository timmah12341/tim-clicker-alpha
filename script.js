/******** FIREBASE ********/
const firebaseConfig = {
  apiKey: "AIzaSyDleRW-O4yP9FJhuqQtMTVT0c_Dd1PPA98",
  authDomain: "tim-clicker-alpha.firebaseapp.com",
  databaseURL: "https://tim-clicker-alpha-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tim-clicker-alpha",
  storageBucket: "tim-clicker-alpha.firebasestorage.app",
  messagingSenderId: "40617780569",
  appId: "1:40617780569:web:1a82146a3554ab1e365848"
};

let auth;
let db;
let uid;
let firebaseReady = false;

try {
  firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.database();
  firebaseReady = true;
} catch (err) {
  firebaseReady = false;
}

/******** DATA ********/
const UPGRADES = {
  cursor: { label: "Cursor", base: 10, cps: 1 },
  factory: { label: "Factory", base: 120, cps: 7 },
  lab: { label: "Lab", base: 1100, cps: 55 },
  portal: { label: "Portal", base: 9000, cps: 430 },
  quantumCore: { label: "Quantum Core", base: 50000, cps: 2500 },
  drivingCar: { label: "Driving in my car", base: 125000, cps: 6500 }
};

const CPS_UPGRADES = {
  leBeterClick: { label: "Le Beter Click (+88% click)", cost: 4000, type: "click", value: 0.88 },
  goldenRatio: { label: "Golden ratio (x1.618 cps)", cost: 22000, type: "cps", value: 1.61803398875 },
  clone: { label: "Clone (x2 cps, one time)", cost: 85000, type: "cps", value: 2 }
};

const SKIN_FILES = ["assets/skins/default.png", "assets/skins/gold.png", "skin_tim.png", "skin_galaxy.png"];
const SKIN_NAMES = [
  "Philips stofzuiger D380", "Mr. Timmah", "Kirbtim", "ScoutTim", "Kartonnen doos", "Nyan cat",
  "Blueprint", "Tima Cola™", "Hologram", "Marble", "Misprint", "Reverse", "Solar", "TIM",
  "Tim driving in his car", "Joker of Tims", "Spambot Tim", "JOHAN", "Assassin's Tim", "BTS Tim",
  "Tim Of War", "AMONG US", "G.O.A.T.", "Le Puffervis", "TimTim", "Baby Tim", "SuperTim",
  "NeutronenTim", "Obama", "rat king tim", "Tim The Plague Serpent", "Blooket Tim", "Terminal Tim"
];

const SKINS = SKIN_NAMES.map((name, i) => ({
  id: `skin_${i + 1}`,
  name,
  file: SKIN_FILES[i % SKIN_FILES.length],
  mult: 1 + i * 0.04,
  cost: i === 0 ? 0 : 550 + i * 450
}));

const MUSIC = {
  lofi1: { label: "Lofi 1", cost: 1200, file: "assets/music/lofi1.wav" },
  lofi2: { label: "Lofi 2", cost: 2400, file: "assets/music/lofi2.wav" },
  mariah247: { label: "24/7 Mariah Loop", cost: 10000, file: "assets/music/lofi2.wav" }
};

const BACKGROUNDS = {
  dark: { label: "Dark", cost: 0, file: null, color: "#0a0a11" },
  snuffels: { label: "SNUFFELS", cost: 2200, file: "BgBg.png", color: "#0f1222" },
  ballGuys: { label: "Ball Guys", cost: 2800, file: "Ball Guys Background.png", color: "#111" },
  davdd: { label: "DAVDD", cost: 3400, file: "assets/backgrounds/DAVDD.png", color: "#000" }
};

const EVENTS = {
  NONE: { label: "none", mult: 1 },
  RAIN: { label: "Rain x1.5", mult: 1.5 },
  THUNDER: { label: "Thunder x2", mult: 2 },
  DISCO: { label: "DISCO x2.4", mult: 2.4 },
  NOORDERLICHT: { label: "Noorder licht x1.75", mult: 1.75 }
};

const CRYPTO = {
  JOHAN: { label: "Johan coin", vol: 11 },
  CHATGPT: { label: "ChatcoinGPT", vol: 8 },
  KIRB: { label: "Kirbcoin", vol: 16 }
};

const MINIGAMES = {
  slot: { label: "Slot machine (cost 200)", cost: 200, reward: 900 },
  fish: { label: "FISH MINIGAME (cost 300)", cost: 300, reward: 1200 },
  timtris: { label: "Timtris (cost 500)", cost: 500, reward: 1800 },
  candy: { label: "C-C-C-CANDY CRUSH (cost 650)", cost: 650, reward: 2400 }
};

const ADMIN_CODES = {
  TIMADMIN: "panel",
  RAIN: "RAIN",
  THUNDER: "THUNDER",
  DISCO: "DISCO",
  NOORDERLICHT: "NOORDERLICHT",
  RESET: "NONE"
};

/******** STATE ********/
const defaultState = {
  name: "",
  tims: 0,
  rebirths: 0,
  upgrades: {},
  cpsUpgradesOwned: [],
  skinsOwned: ["skin_1"],
  activeSkin: "skin_1",
  musicOwned: [],
  activeMusic: "",
  backgroundsOwned: ["dark"],
  activeBackground: "dark",
  activeEvent: "NONE",
  activeCoin: "JOHAN",
  coinPrices: { JOHAN: 120, CHATGPT: 80, KIRB: 210 },
  coinWallet: { JOHAN: 0, CHATGPT: 0, KIRB: 0 }
};

let state = { ...defaultState };
let musicPlayer;

/******** HELPERS ********/
const el = (id) => document.getElementById(id);
const cost = (base, owned) => Math.floor(base * Math.pow(1.15, owned));
const hasCpsUpgrade = (id) => state.cpsUpgradesOwned.includes(id);
const getSkin = (id) => SKINS.find((s) => s.id === id) || SKINS[0];

function saveLocal() {
  try {
    localStorage.setItem("tim_clicker_save", JSON.stringify(state));
  } catch (err) {
    // Some browsers/private modes can block localStorage writes.
  }
}

function loadLocal() {
  let raw;
  try {
    raw = localStorage.getItem("tim_clicker_save");
  } catch (err) {
    raw = null;
  }
  if (!raw) return;
  try {
    state = { ...defaultState, ...JSON.parse(raw) };
  } catch (err) {
    state = { ...defaultState };
  }
}

function saveNow() {
  saveLocal();
  if (firebaseReady && uid) db.ref("users/" + uid).set(state).catch(() => {});
}

function showFirebaseStatus() {
  const status = el("firebaseStatus");
  status.textContent = firebaseReady ? "Firebase connected" : "Firebase offline - local save enabled";
  status.className = firebaseReady ? "ok" : "warning";
}

function applyBackground() {
  const bg = BACKGROUNDS[state.activeBackground] || BACKGROUNDS.dark;
  document.body.style.backgroundColor = bg.color;
  document.body.style.backgroundImage = bg.file ? `linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)),url("${bg.file}")` : "none";
}

function clickPower() {
  return hasCpsUpgrade("leBeterClick") ? 1.88 : 1;
}

function cps() {
  let total = 0;
  for (const id in state.upgrades) {
    const up = UPGRADES[id];
    if (up) total += up.cps * state.upgrades[id];
  }

  if (hasCpsUpgrade("goldenRatio")) total *= CPS_UPGRADES.goldenRatio.value;
  if (hasCpsUpgrade("clone")) total *= CPS_UPGRADES.clone.value;

  total *= getSkin(state.activeSkin).mult;
  total *= (1 + state.rebirths * 0.25);
  const activeEvent = EVENTS[state.activeEvent] || EVENTS.NONE;
  total *= activeEvent.mult;
  return total;
}

function updateUI() {
  const coin = state.activeCoin;
  el("playerName").textContent = state.name;
  el("tims").textContent = Math.floor(state.tims);
  el("cps").textContent = cps().toFixed(1);
  el("rebirths").textContent = state.rebirths;
  const activeEvent = EVENTS[state.activeEvent] || EVENTS.NONE;
  el("eventLabel").textContent = activeEvent.label;
  el("activeCoinLabel").textContent = CRYPTO[coin].label;
  el("cryptoPrice").textContent = state.coinPrices[coin].toFixed(1);
  el("cryptoWallet").textContent = state.coinWallet[coin].toFixed(2);
}

function renderUpgrades() {
  const box = el("upgradeShop");
  box.innerHTML = "";
  Object.entries(UPGRADES).forEach(([id, up]) => {
    const owned = state.upgrades[id] || 0;
    const c = cost(up.base, owned);
    const b = document.createElement("button");
    b.className = "shop-item";
    b.textContent = `${up.label} (${owned}) — ${c}`;
    b.onclick = () => {
      if (state.tims < c) return;
      state.tims -= c;
      state.upgrades[id] = owned + 1;
      saveNow();
    };
    box.appendChild(b);
  });
}

function renderCpsUpgrades() {
  const box = el("cpsUpgradeShop");
  box.innerHTML = "";
  Object.entries(CPS_UPGRADES).forEach(([id, up]) => {
    const owned = hasCpsUpgrade(id);
    const b = document.createElement("button");
    b.className = "shop-item";
    b.textContent = owned ? `${up.label} (owned)` : `${up.label} — ${up.cost}`;
    b.onclick = () => {
      if (owned || state.tims < up.cost) return;
      state.tims -= up.cost;
      state.cpsUpgradesOwned.push(id);
      saveNow();
    };
    box.appendChild(b);
  });
}

function renderSkins() {
  const box = el("skinShop");
  box.innerHTML = "";
  SKINS.forEach((skin) => {
    const owned = state.skinsOwned.includes(skin.id);
    const b = document.createElement("button");
    b.className = "shop-item";
    b.textContent = `${skin.name} ${owned ? "(owned)" : `— ${skin.cost}`}`;
    b.onclick = () => {
      if (!owned) {
        if (state.tims < skin.cost) return;
        state.tims -= skin.cost;
        state.skinsOwned.push(skin.id);
      }
      state.activeSkin = skin.id;
      el("timImage").src = skin.file;
      saveNow();
    };
    box.appendChild(b);
  });
}

function renderMusic() {
  const box = el("musicShop");
  box.innerHTML = "";
  Object.entries(MUSIC).forEach(([id, music]) => {
    const owned = state.musicOwned.includes(id);
    const b = document.createElement("button");
    b.className = "shop-item";
    b.textContent = owned ? `${music.label} (play)` : `${music.label} — ${music.cost}`;
    b.onclick = () => {
      if (!owned) {
        if (state.tims < music.cost) return;
        state.tims -= music.cost;
        state.musicOwned.push(id);
      }
      if (musicPlayer) {
        musicPlayer.pause();
        musicPlayer.currentTime = 0;
      }
      musicPlayer = new Audio(music.file);
      musicPlayer.loop = true;
      musicPlayer.play().catch(() => {});
      state.activeMusic = id;
      saveNow();
    };
    box.appendChild(b);
  });
}

function renderBackgrounds() {
  const box = el("backgroundShop");
  box.innerHTML = "";
  Object.entries(BACKGROUNDS).forEach(([id, bg]) => {
    const owned = state.backgroundsOwned.includes(id);
    const b = document.createElement("button");
    b.className = "shop-item";
    b.textContent = owned ? `${bg.label} (owned)` : `${bg.label} — ${bg.cost}`;
    b.onclick = () => {
      if (!owned) {
        if (state.tims < bg.cost) return;
        state.tims -= bg.cost;
        state.backgroundsOwned.push(id);
      }
      state.activeBackground = id;
      applyBackground();
      saveNow();
    };
    box.appendChild(b);
  });
}

function runMinigame(id) {
  const game = MINIGAMES[id];
  if (!game || state.tims < game.cost) return;
  state.tims -= game.cost;
  const winChance = id === "slot" ? 0.22 : 0.35;
  const won = Math.random() < winChance;
  if (won) state.tims += game.reward;
  el("miniResult").textContent = won ? `${game.label}: WIN +${game.reward}` : `${game.label}: lose`;
  saveNow();
}

function renderMinigames() {
  const box = el("minigameShop");
  box.innerHTML = "";
  Object.entries(MINIGAMES).forEach(([id, game]) => {
    const b = document.createElement("button");
    b.className = "shop-item";
    b.textContent = game.label;
    b.onclick = () => runMinigame(id);
    box.appendChild(b);
  });
}

function renderCrypto() {
  const box = el("cryptoShop");
  box.innerHTML = "";

  Object.entries(CRYPTO).forEach(([id, coin]) => {
    const select = document.createElement("button");
    select.className = "shop-item";
    select.textContent = `Use ${coin.label}`;
    select.onclick = () => {
      state.activeCoin = id;
      saveNow();
    };
    box.appendChild(select);
  });

  const buy = document.createElement("button");
  buy.className = "shop-item";
  buy.textContent = "Buy 1 coin";
  buy.onclick = () => {
    const coin = state.activeCoin;
    const price = state.coinPrices[coin];
    if (state.tims < price) return;
    state.tims -= price;
    state.coinWallet[coin] += 1;
    saveNow();
  };

  const sell = document.createElement("button");
  sell.className = "shop-item";
  sell.textContent = "Sell 1 coin";
  sell.onclick = () => {
    const coin = state.activeCoin;
    if (state.coinWallet[coin] < 1) return;
    state.coinWallet[coin] -= 1;
    state.tims += state.coinPrices[coin];
    saveNow();
  };

  box.appendChild(buy);
  box.appendChild(sell);
}

function tickCrypto() {
  Object.keys(CRYPTO).forEach((id) => {
    const swing = (Math.random() - 0.5) * CRYPTO[id].vol;
    state.coinPrices[id] = Math.max(15, state.coinPrices[id] + swing);
  });
}

/******** EVENTS ********/
el("timImage").onclick = () => {
  state.tims += clickPower() * (1 + state.rebirths * 0.1);
};

el("rebirthBtn").onclick = () => {
  const req = 1e6 * Math.pow(3, state.rebirths);
  if (state.tims < req) return;
  state.tims = 0;
  state.upgrades = {};
  state.rebirths += 1;
  saveNow();
};

el("activateEventBtn").onclick = () => {
  const input = el("adminCodeInput").value.trim().toUpperCase();
  const command = ADMIN_CODES[input];
  if (!command) {
    el("adminResult").textContent = "Unknown code";
    return;
  }

  if (command === "panel") {
    state.tims += 5000;
    el("adminResult").textContent = "Admin panel unlocked: +5000 Tims";
  } else {
    state.activeEvent = command;
    el("adminResult").textContent = `Event set: ${EVENTS[command].label}`;
  }

  el("adminCodeInput").value = "";
  saveNow();
};

/******** LOOP ********/
setInterval(() => {
  state.tims += cps() / 10;
  tickCrypto();
  updateUI();
  renderUpgrades();
  renderCpsUpgrades();
  renderSkins();
  renderMusic();
  renderBackgrounds();
  renderMinigames();
  renderCrypto();
  saveNow();
}, 100);

/******** BOOT ********/
function startGame() {
  el("namePanel").classList.add("hidden");
  el("game").classList.remove("hidden");
  el("timImage").src = getSkin(state.activeSkin).file;
  applyBackground();
  updateUI();
}

function boot() {
  showFirebaseStatus();
  loadLocal();

  if (!firebaseReady) {
    if (state.name) startGame();
    return;
  }

  auth.signInAnonymously()
    .then((result) => {
      uid = result.user.uid;
      return db.ref("users/" + uid).once("value");
    })
    .then((snap) => {
      if (snap.exists()) state = { ...defaultState, ...snap.val() };
      if (state.name) startGame();
    })
    .catch(() => {
      if (state.name) startGame();
    });
}

el("saveName").onclick = () => {
  const name = el("nameInput").value.trim();
  if (!name) return;
  state.name = name;
  startGame();
  saveNow();
};

boot();
