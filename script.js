/******** FIREBASE ********/
firebase.initializeApp({
  apiKey: "AIzaSyDleRW-O4yP9FJhuqQtMTVT0c_Dd1PPA98",
  authDomain: "tim-clicker-alpha.firebaseapp.com",
  databaseURL: "https://tim-clicker-alpha-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tim-clicker-alpha",
  storageBucket: "tim-clicker-alpha.firebasestorage.app",
  messagingSenderId: "40617780569",
  appId: "1:40617780569:web:1a82146a3554ab1e365848",
  measurementId: "G-H73TX7JNVP"
});

const auth = firebase.auth();
const db = firebase.database();

/******** DATA ********/
const UPGRADES = {
  cursor: { base: 10, cps: 1 },
  factory: { base: 100, cps: 10 },
  lab: { base: 1000, cps: 100 }
};

const SKINS = {
  default: { mult: 1, file: "default.png", cost: 0 },
  gold: { mult: 2, file: "gold.png", cost: 5000 }
};

const MUSIC = {
  chill: { cost: 3000, file: "chill.mp3" }
};

/******** STATE ********/
let uid;
let state = {
  name: null,
  tims: 0,
  rebirths: 0,
  upgrades: {},
  skinsOwned: ["default"],
  activeSkin: "default",
  musicOwned: []
};

/******** HELPERS ********/
const el = id => document.getElementById(id);
const cost = (b, n) => Math.floor(b * Math.pow(1.15, n));

/******** GAME ********/
function cps() {
  let v = 0;
  for (let id in state.upgrades) {
    v += UPGRADES[id].cps * state.upgrades[id];
  }
  return v * (1 + state.rebirths * 0.25) * SKINS[state.activeSkin].mult;
}

function updateUI() {
  el("playerName").textContent = state.name;
  el("tims").textContent = Math.floor(state.tims);
  el("cps").textContent = cps().toFixed(1);
  el("rebirths").textContent = state.rebirths;
}

function renderUpgrades() {
  const box = el("upgradeShop");
  box.innerHTML = "";
  for (let id in UPGRADES) {
    const owned = state.upgrades[id] || 0;
    const c = cost(UPGRADES[id].base, owned);
    const b = document.createElement("button");
    b.textContent = `${id} (${owned}) – ${c}`;
    b.onclick = () => {
      if (state.tims >= c) {
        state.tims -= c;
        state.upgrades[id] = owned + 1;
      }
    };
    box.appendChild(b);
  }
}

function renderSkins() {
  const box = el("skinShop");
  box.innerHTML = "";
  for (let id in SKINS) {
    const s = SKINS[id];
    const b = document.createElement("button");
    b.textContent = id;
    b.onclick = () => {
      if (!state.skinsOwned.includes(id)) {
        if (state.tims < s.cost) return;
        state.tims -= s.cost;
        state.skinsOwned.push(id);
      }
      state.activeSkin = id;
      el("timImage").src = `assets/skins/${s.file}`;
    };
    box.appendChild(b);
  }
}

function renderMusic() {
  const box = el("musicShop");
  box.innerHTML = "";
  for (let id in MUSIC) {
    const m = MUSIC[id];
    const b = document.createElement("button");
    b.textContent = id;
    b.onclick = () => {
      if (state.tims >= m.cost) {
        state.tims -= m.cost;
        new Audio(`assets/music/${m.file}`).play();
      }
    };
    box.appendChild(b);
  }
}

/******** EVENTS ********/
el("timImage").onclick = () => state.tims++;

el("rebirthBtn").onclick = () => {
  const req = 1e6 * Math.pow(3, state.rebirths);
  if (state.tims >= req) {
    state.tims = 0;
    state.upgrades = {};
    state.rebirths++;
  }
};

/******** SAVE LOOP ********/
setInterval(() => {
  state.tims += cps() / 10;
  updateUI();
  renderUpgrades();
  renderSkins();
  renderMusic();
  if (uid) db.ref("users/" + uid).set(state);
}, 100);

/******** LOGIN ********/
auth.signInAnonymously().then(r => {
  uid = r.user.uid;
  db.ref("users/" + uid).once("value").then(s => {
    if (s.exists()) state = s.val();
    if (state.name) {
      el("namePanel").classList.add("hidden");
      el("game").classList.remove("hidden");
      el("timImage").src = `assets/skins/${SKINS[state.activeSkin].file}`;
    }
  });
});

el("saveName").onclick = () => {
  const n = el("nameInput").value.trim();
  if (!n) return;
  state.name = n;
  el("namePanel").classList.add("hidden");
  el("game").classList.remove("hidden");
};
