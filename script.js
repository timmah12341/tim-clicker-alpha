/******** FIREBASE ********/
const firebaseConfig = {
  apiKey: "AIzaSyDleRW-O4yP9FJhuqQtMTVT0c_Dd1PPA98",
  authDomain: "tim-clicker-alpha.firebaseapp.com",
  databaseURL: "https://tim-clicker-alpha-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tim-clicker-alpha",
  storageBucket: "tim-clicker-alpha.firebasestorage.app",
  messagingSenderId: "40617780569",
  appId: "1:40617780569:web:1a82146a3554ab1e365848",
  measurementId: "G-H73TX7JNVP"
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
} catch {
  firebaseReady = false;
}

/******** DATA ********/
const UPGRADES = {
  cursor: { base: 10, cps: 1 },
  factory: { base: 120, cps: 7 },
  lab: { base: 1100, cps: 55 },
  portal: { base: 9000, cps: 430 },
  quantumCore: { base: 50000, cps: 2500 } // requested 1 extra upgrade
};

const skinFiles = [
  "assets/skins/default.png",
  "assets/skins/gold.png",
  "skin_tim.png",
  "skin_galaxy.png"
];

const SKINS = Array.from({ length: 33 }, (_, i) => {
  const id = `skin_${i + 1}`;
  return {
    id,
    mult: 1 + i * 0.04,
    file: skinFiles[i % skinFiles.length],
    cost: i === 0 ? 0 : 350 * (i + 1)
  };
});

const MUSIC = {
  lofi1: { cost: 1200, file: "assets/music/lofi1.wav" },
  lofi2: { cost: 2500, file: "assets/music/lofi2.wav" }
};

const BACKGROUNDS = {
  dark: { cost: 0, file: null, color: "#111" },
  vapor: { cost: 1700, file: "BgBg.png", color: "#111" },
  ballGuys: { cost: 2800, file: "Ball Guys Background.png", color: "#111" },
  poster: { cost: 3500, file: "assets/backgrounds/DAVDD.png", color: "#000" }
};

const ADMIN_EVENTS = {
  TIMRAIN: { label: "Tim Rain x2", mult: 2 },
  SUPERBOOST: { label: "Super Boost x3", mult: 3 },
  CALM: { label: "Calm Mode x1", mult: 1 }
};

/******** STATE ********/
const defaultState = {
  name: null,
  tims: 0,
  rebirths: 0,
  upgrades: {},
  skinsOwned: ["skin_1"],
  activeSkin: "skin_1",
  musicOwned: [],
  activeMusic: null,
  backgroundsOwned: ["dark"],
  activeBackground: "dark",
  cryptoWallet: 0,
  cryptoPrice: 120,
  activeEvent: "none"
};

let state = { ...defaultState };
let musicPlayer;

/******** HELPERS ********/
const el = (id) => document.getElementById(id);
const cost = (b, n) => Math.floor(b * Math.pow(1.15, n));
const getSkin = (id) => SKINS.find((s) => s.id === id) || SKINS[0];

function saveLocal() {
  localStorage.setItem("tim_clicker_save", JSON.stringify(state));
}

function loadLocal() {
  const raw = localStorage.getItem("tim_clicker_save");
  if (!raw) return;
  try {
    state = { ...defaultState, ...JSON.parse(raw) };
  } catch {
    state = { ...defaultState };
  }
}

function showFirebaseStatus() {
  const status = el("firebaseStatus");
  if (!firebaseReady) {
    status.textContent = "Firebase offline: using local save.";
    status.className = "warning";
    return;
  }
  status.textContent = "Firebase connected.";
  status.className = "ok";
}

/******** GAME ********/
function cps() {
  let v = 0;
  for (const id in state.upgrades) {
    const upgrade = UPGRADES[id];
    if (upgrade) v += upgrade.cps * state.upgrades[id];
  }

  const skinMult = getSkin(state.activeSkin).mult;
  const rebirthMult = 1 + state.rebirths * 0.25;
  const eventMult = ADMIN_EVENTS[state.activeEvent]?.mult || 1;
  return v * skinMult * rebirthMult * eventMult;
}

function applyBackground() {
  const bg = BACKGROUNDS[state.activeBackground] || BACKGROUNDS.dark;
  document.body.style.backgroundColor = bg.color;
  document.body.style.backgroundImage = bg.file ? `url("${bg.file}")` : "none";
  document.body.style.backgroundSize = "cover";
}

function updateUI() {
  el("playerName").textContent = state.name || "";
  el("tims").textContent = Math.floor(state.tims);
  el("cps").textContent = cps().toFixed(1);
  el("rebirths").textContent = state.rebirths;
  el("cryptoWallet").textContent = state.cryptoWallet.toFixed(2);
  el("cryptoPrice").textContent = state.cryptoPrice.toFixed(1);
  el("eventLabel").textContent = ADMIN_EVENTS[state.activeEvent]?.label || "none";
}

function renderUpgrades() {
  const box = el("upgradeShop");
  box.innerHTML = "";
  for (const id in UPGRADES) {
    const owned = state.upgrades[id] || 0;
    const c = cost(UPGRADES[id].base, owned);
    const b = document.createElement("button");
    b.textContent = `${id} (${owned}) – ${c}`;
    b.onclick = () => {
      if (state.tims < c) return;
      state.tims -= c;
      state.upgrades[id] = owned + 1;
      saveNow();
    };
    box.appendChild(b);
  }
}

function renderSkins() {
  const box = el("skinShop");
  box.innerHTML = "";
  SKINS.forEach((s) => {
    const owned = state.skinsOwned.includes(s.id);
    const b = document.createElement("button");
    b.textContent = `${s.id} ${owned ? "(owned)" : `- ${s.cost}`}`;
    b.onclick = () => {
      if (!owned) {
        if (state.tims < s.cost) return;
        state.tims -= s.cost;
        state.skinsOwned.push(s.id);
      }
      state.activeSkin = s.id;
      el("timImage").src = s.file;
      saveNow();
    };
    box.appendChild(b);
  });
}

function renderMusic() {
  const box = el("musicShop");
  box.innerHTML = "";
  for (const id in MUSIC) {
    const m = MUSIC[id];
    const owned = state.musicOwned.includes(id);
    const b = document.createElement("button");
    b.textContent = `${id} ${owned ? "(owned/play)" : `- ${m.cost}`}`;
    b.onclick = () => {
      if (!owned) {
        if (state.tims < m.cost) return;
        state.tims -= m.cost;
        state.musicOwned.push(id);
      }

      if (musicPlayer) {
        musicPlayer.pause();
        musicPlayer.currentTime = 0;
      }
      musicPlayer = new Audio(m.file);
      musicPlayer.loop = true;
      musicPlayer.play();
      state.activeMusic = id;
      saveNow();
    };
    box.appendChild(b);
  }
}

function renderBackgrounds() {
  const box = el("backgroundShop");
  box.innerHTML = "";
  for (const id in BACKGROUNDS) {
    const item = BACKGROUNDS[id];
    const owned = state.backgroundsOwned.includes(id);
    const b = document.createElement("button");
    b.textContent = `${id} ${owned ? "(owned)" : `- ${item.cost}`}`;
    b.onclick = () => {
      if (!owned) {
        if (state.tims < item.cost) return;
        state.tims -= item.cost;
        state.backgroundsOwned.push(id);
      }
      state.activeBackground = id;
      applyBackground();
      saveNow();
    };
    box.appendChild(b);
  }
}

function tickCrypto() {
  const swing = (Math.random() - 0.5) * 12;
  state.cryptoPrice = Math.max(20, state.cryptoPrice + swing);
}

function saveNow() {
  saveLocal();
  if (firebaseReady && uid) {
    db.ref("users/" + uid).set(state).catch(() => {});
  }
}

/******** EVENTS ********/
el("timImage").onclick = () => {
  const clickBonus = 1 + state.rebirths * 0.1;
  state.tims += clickBonus;
};

el("rebirthBtn").onclick = () => {
  const req = 1e6 * Math.pow(3, state.rebirths);
  if (state.tims < req) return;

  state.tims = 0;
  state.upgrades = {};
  state.rebirths += 1;
  saveNow();
};

el("coinFlipBtn").onclick = () => {
  if (state.tims < 100) return;
  state.tims -= 100;
  const win = Math.random() < 0.5;
  if (win) state.tims += 220;
  el("miniResult").textContent = win ? "Coin Flip: WIN" : "Coin Flip: LOSE";
  saveNow();
};

el("guessBtn").onclick = () => {
  if (state.tims < 250) return;
  state.tims -= 250;
  const lucky = Math.floor(Math.random() * 5) === 0;
  if (lucky) state.tims += 750;
  el("miniResult").textContent = lucky ? "Lucky Guess: JACKPOT" : "Lucky Guess: Nope";
  saveNow();
};

el("buyCryptoBtn").onclick = () => {
  if (state.tims < state.cryptoPrice) return;
  state.tims -= state.cryptoPrice;
  state.cryptoWallet += 1;
  saveNow();
};

el("sellCryptoBtn").onclick = () => {
  if (state.cryptoWallet < 1) return;
  state.cryptoWallet -= 1;
  state.tims += state.cryptoPrice;
  saveNow();
};

el("activateEventBtn").onclick = () => {
  const code = el("adminCodeInput").value.trim().toUpperCase();
  if (!ADMIN_EVENTS[code]) return;
  state.activeEvent = code;
  el("adminCodeInput").value = "";
  saveNow();
};

/******** LOOPS ********/
setInterval(() => {
  state.tims += cps() / 10;
  tickCrypto();
  updateUI();
  renderUpgrades();
  renderSkins();
  renderMusic();
  renderBackgrounds();
  saveNow();
}, 100);

/******** LOGIN ********/
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
    .then((r) => {
      uid = r.user.uid;
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
  const n = el("nameInput").value.trim();
  if (!n) return;
  state.name = n;
  startGame();
  saveNow();
};

boot();
