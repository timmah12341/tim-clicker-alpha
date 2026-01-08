/************ FIREBASE ************/
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

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

/************ HELPERS ************/
const el = id => document.getElementById(id);
const fmt = n => Math.floor(n).toLocaleString();

/************ DATA ************/
const SAVE_VERSION = 2;

const UPGRADES = {
  cursor: { base: 10, cps: 1 },
  factory: { base: 100, cps: 10 },
  lab: { base: 1000, cps: 100 }
};

const SKINS = {
  default: { mult: 1, file: "default.png", cost: 0 },
  gold: { mult: 1.5, file: "gold.png", cost: 5000 },
  void: { mult: 2.5, file: "void.png", cost: 25000 }
};

const MUSIC = {
  chill: { cost: 3000, file: "chill.mp3" },
  epic: { cost: 15000, file: "epic.mp3" }
};

const CRYPTO = {
  TIM: { price: 10, vol: 0.15 },
  COOKIE: { price: 1, vol: 0.3 }
};

/************ STATE ************/
let state = {
  saveVersion: SAVE_VERSION,
  cookies: 0,
  rebirths: 0,
  upgrades: {},
  skinsOwned: ["default"],
  activeSkin: "default",
  musicOwned: [],
  activeMusic: null,
  crypto: { balance: 0, coins: {} }
};

let uid = null;
let audio = null;
let adminBoost = 1;

/************ MIGRATION ************/
function migrate(s) {
  if (!s || s.saveVersion < 2) {
    s ||= {};
    s.saveVersion = 2;
    s.upgrades ||= {};
    s.skinsOwned ||= ["default"];
    s.activeSkin ||= "default";
    s.musicOwned ||= [];
    s.crypto ||= { balance: 0, coins: {} };
  }
  return s;
}

/************ CALC ************/
function rebirthMult() {
  return 1 + state.rebirths * 0.25;
}

function totalCPS() {
  let cps = 0;
  for (let id in state.upgrades) {
    cps += UPGRADES[id].cps * state.upgrades[id];
  }
  return cps * rebirthMult() * SKINS[state.activeSkin].mult * adminBoost;
}

/************ UI ************/
function updateUI() {
  el("cookies").textContent = fmt(state.cookies);
  el("cps").textContent = totalCPS().toFixed(1);
  el("rebirths").textContent = state.rebirths;
}

/************ GAME ************/
el("clickBtn").onclick = () => state.cookies++;

el("rebirthBtn").onclick = () => {
  const cost = 1e6 * Math.pow(3, state.rebirths);
  if (state.cookies < cost) return;
  state.cookies = 0;
  state.upgrades = {};
  state.rebirths++;
};

function renderUpgrades() {
  const box = el("upgrades");
  box.innerHTML = "";
  for (let id in UPGRADES) {
    const owned = state.upgrades[id] || 0;
    const cost = Math.floor(UPGRADES[id].base * Math.pow(1.15, owned));
    const b = document.createElement("button");
    b.textContent = `${id} (${owned}) – ${fmt(cost)}`;
    b.onclick = () => {
      if (state.cookies >= cost) {
        state.cookies -= cost;
        state.upgrades[id] = owned + 1;
      }
    };
    box.appendChild(b);
  }
}

function renderSkins() {
  const box = el("skins");
  box.innerHTML = "";
  for (let id in SKINS) {
    const s = SKINS[id];
    const b = document.createElement("button");
    b.textContent = id;
    b.onclick = () => {
      if (!state.skinsOwned.includes(id)) {
        if (state.cookies < s.cost) return;
        state.cookies -= s.cost;
        state.skinsOwned.push(id);
      }
      state.activeSkin = id;
      el("mainImage").src = `assets/skins/${s.file}`;
    };
    box.appendChild(b);
  }
}

function renderMusic() {
  const box = el("music");
  box.innerHTML = "";
  for (let id in MUSIC) {
    const m = MUSIC[id];
    const b = document.createElement("button");
    b.textContent = id;
    b.onclick = () => {
      if (!state.musicOwned.includes(id)) {
        if (state.cookies < m.cost) return;
        state.cookies -= m.cost;
        state.musicOwned.push(id);
      }
      if (audio) audio.pause();
      audio = new Audio(`assets/music/${m.file}`);
      audio.loop = true;
      audio.play();
    };
    box.appendChild(b);
  }
}

function renderCrypto() {
  const box = el("crypto");
  box.innerHTML = "";
  for (let id in CRYPTO) {
    const c = CRYPTO[id];
    const d = document.createElement("div");
    d.textContent = `${id}: ${c.price.toFixed(2)}`;
    box.appendChild(d);
  }
}

/************ LOOP ************/
setInterval(() => {
  state.cookies += totalCPS() / 10;
  for (let id in CRYPTO) {
    const c = CRYPTO[id];
    c.price = Math.max(0.01, c.price * (1 + (Math.random() - 0.5) * c.vol));
  }
  updateUI();
  renderUpgrades();
  renderSkins();
  renderMusic();
  renderCrypto();
  if (uid) db.ref("users/" + uid).set(state);
}, 100);

/************ AUTH ************/
auth.signInAnonymously().then(r => {
  uid = r.user.uid;
  db.ref("users/" + uid).once("value").then(s => {
    state = migrate(s.val());
    el("mainImage").src = `assets/skins/${SKINS[state.activeSkin].file}`;
  });
});

/************ ADMIN EVENTS ************/
db.ref("admin/event").on("value", s => {
  const e = s.val();
  if (!e) return;
  if (e.type === "doubleCPS") {
    adminBoost = 2;
    setTimeout(() => adminBoost = 1, e.duration);
  }
});
