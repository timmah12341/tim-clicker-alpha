import { loadPlayer, savePlayer, updatePlayer } from "./firebase.js";

/* ---------- CONFIG ---------- */

const UID = "SINGLE_TEST_USER"; // replace with auth later

const UPGRADES = {
  { id:"u001", key:"bacteriophage", name:"Bacteriophage", cost:1, cps:0.1, icon:"upgrade0.1.png", tier:1, category:"generator" },
  { id:"u002", key:"tim_ema", name:"Tim-ema", cost:100, cps:2, icon:"upgrade1.png", tier:1, category:"generator" },
  { id:"u003", key:"chezburger", name:"Chezburger", cost:250, cps:4, icon:"upgrade1.5.png", tier:1, category:"generator" },
  { id:"u004", key:"floatie", name:"Floatie", cost:500, cps:8, icon:"upgrade2.png", tier:1, category:"generator" },
  { id:"u005", key:"mier", name:"Mier", cost:1000, cps:15, icon:"upgrade2.5.png", tier:1, category:"generator" },
  { id:"u006", key:"smile", name:":3", cost:2000, cps:25, icon:"upgrade3.png", tier:1, category:"generator" },
  { id:"u007", key:"shoarma", name:"Shoarma Broodje", cost:4000, cps:40, icon:"upgrade3.5.png", tier:1, category:"generator" },
  { id:"u008", key:"tim", name:"Tim", cost:6000, cps:70, icon:"upgrade4.png", tier:1, category:"generator" },
  { id:"u009", key:"epic_tim", name:"Teh Epic Tim is comming!!!", cost:10000, cps:120, icon:"upgrade4.5.png", tier:2, category:"generator" },
  { id:"u010", key:"depression", name:"Depression Upgrade", cost:15000, cps:180, icon:"upgrade5.png", tier:2, category:"generator" },
  { id:"u011", key:"biertje", name:"Une petite Biertje", cost:25000, cps:350, icon:"upgrade5.5.png", tier:2, category:"generator" },
  { id:"u012", key:"ball_guy", name:"Ball Guy Tim", cost:40000, cps:450, icon:"upgrade6.png", tier:2, category:"generator" },
  { id:"u013", key:"stofzuiger", name:"Philips Stofzuiger D380", cost:70000, cps:700, icon:"upgrade6.5.png", tier:2, category:"generator" },
  { id:"u014", key:"johan", name:"Johan", cost:120000, cps:1200, icon:"upgrade7.png", tier:2, category:"generator" },
  { id:"u015", key:"tequilla", name:"Tequilla", cost:300000, cps:2500, icon:"upgrade8.png", tier:3, category:"generator" },
  { id:"u016", key:"golden_tim", name:"Golden Tim", cost:1_000_000, cps:50000, icon:"upgrade9.png", tier:3, category:"generator" },
  { id:"u017", key:"steve", name:"Minecraft Steve", cost:5_000_000, cps:100000, icon:"upgrade10.png", tier:3, category:"generator" },
  { id:"u018", key:"admin_tim", name:"ADMIN ABUSE TIM", cost:10_000_000, cps:500000, icon:"upgrade11.png", tier:4, category:"generator" },
  { id:"u019", key:"nuclear", name:"Nuclear Power Plant", cost:50_000_000, cps:1_000_000, icon:"upgrade12.png", tier:4, category:"generator" },
  { id:"u020", key:"vip", name:"Tim Clicker™ VIP Edition", cost:100_000_000, cps:5_000_000, icon:"upgrade13.png", tier:4, category:"generator" },
  { id:"u021", key:"monke", name:"Engineer Monke", cost:500_000_000, cps:10_000_000, icon:"upgrade14.png", tier:4, category:"generator" },
  { id:"u022", key:"hamster", name:"Hamster Vuurpijl", cost:1_000_000_000, cps:50_000_000, icon:"upgrade15.png", tier:5, category:"generator" },
  { id:"u023", key:"hatsune", name:"Hatsune Timu", cost:5_000_000_000, cps:100_000_000, icon:"upgrade16.png", tier:5, category:"generator" },
  { id:"u024", key:"timtimmer", name:"TimTimmer", cost:10_000_000_000, cps:500_000_000, icon:"upgrade17.png", tier:5, category:"generator" },
  { id:"u025", key:"blackhole", name:"Blackhole", cost:50_000_000_000, cps:1_000_000_000, icon:"upgrade18.png", tier:5, category:"generator" },
  { id:"u026", key:"waves", name:"Wave Tim", cost:100_000_000_000, cps:5_000_000_000, icon:"upgrade19.png", tier:6, category:"generator" },
  { id:"u027", key:"timco", name:"Tim Co™", cost:500_000_000_000, cps:10_000_000_000, icon:"upgrade20.png", tier:6, category:"generator" },
  { id:"u028", key:"whitehole", name:"White Hole", cost:1_000_000_000_000, cps:50_000_000_000, icon:"upgrade21.png", tier:6, category:"generator" },
  { id:"u029", key:"deathstare", name:"Death Stare Tim", cost:5_000_000_000_000, cps:100_000_000_000, icon:"upgrade22.png", tier:6, category:"generator" },
  { id:"u030", key:"blooket", name:"Blooket Tim", cost:10_000_000_000_000, cps:500_000_000_000, icon:"upgrade23.png", tier:7, category:"generator" },
  { id:"u031", key:"bordspel", name:"Bordspel Geuzen", cost:50_000_000_000_000, cps:1_000_000_000_000, icon:"upgrade24.png", tier:7, category:"generator" },
  { id:"u032", key:"magnus", name:"Magnus Carlsen", cost:100_000_000_000_000, cps:5_000_000_000_000, icon:"upgrade25.png", tier:7, category:"generator" },
  { id:"u033", key:"neutron", name:"Neutronenster", cost:500_000_000_000_000, cps:10_000_000_000_000, icon:"upgrade26.png", tier:7, category:"generator" },
  { id:"u034", key:"supernova", name:"Supernova", cost:1_000_000_000_000_000, cps:50_000_000_000_000, icon:"upgrade27.png", tier:8, category:"generator" },
  { id:"u035", key:"polonium", name:"Polonium-210", cost:5_000_000_000_000_000, cps:100_000_000_000_000, icon:"upgrade28.png", tier:8, category:"generator" },
  { id:"u036", key:"dyson", name:"Dyson Shell", cost:10_000_000_000_000_000, cps:500_000_000_000_000, icon:"upgrade29.png", tier:8, category:"generator" },
  { id:"u037", key:"accelerator", name:"Particle Accelerator", cost:50_000_000_000_000_000, cps:1_000_000_000_000_000, icon:"upgrade30.png", tier:8, category:"generator" },
  { id:"u038", key:"heatdeath", name:"Heat Death of the Timiverse", cost:100_000_000_000_000_000, cps:5_000_000_000_000_000, icon:"upgrade31.png", tier:9, category:"generator" },
  { id:"u039", key:"quark", name:"Strange Quark", cost:500_000_000_000_000_000, cps:10_000_000_000_000_000, icon:"upgrade32.png", tier:9, category:"generator" },
  { id:"u040", key:"attractor", name:"The Great Attractor", cost:1_000_000_000_000_000_000, cps:50_000_000_000_000_000, icon:"upgrade33.png", tier:9, category:"generator" },
  { id:"u041", key:"doughnut", name:"Universe Doughnut Theory", cost:5_000_000_000_000_000_000, cps:100_000_000_000_000_000, icon:"upgrade34.png", tier:9, category:"generator" },
  { id:"u042", key:"mosquito", name:"Weapon of Mosquito Destruction", cost:100_000_000_000_000_000_000, cps:500_000_000_000_000_000, icon:"upgrade41.png", tier:10, category:"generator" }
];

};

const SKINS = {
  default: { name: "Default", file: "assets/skins/default.png", cost: 0 },
  golden: { name: "Golden Tim", file: "assets/skins/golden.png", cost: 500 }
};

const BACKGROUNDS = {
  default: { file: "assets/backgrounds/default.png", cost: 0 },
  space: { file: "assets/backgrounds/space.png", cost: 300 }
};

/* ---------- STATE ---------- */

let player;

/* ---------- INIT ---------- */

async function init() {
  player = await loadPlayer(UID);

  if (!player) {
    player = {
      tims: 0,
      cps: 0,
      rebirths: 0,
      ownedUpgrades: {},
      skinsOwned: ["default"],
      activeSkin: "default",
      backgroundsOwned: ["default"],
      activeBackground: "default",
      crypto: { balance: 0 }
    };
    await savePlayer(UID, player);
  }

  applySkin();
  applyBackground();
  updateUI();
  buildShop();
  buildSkins();
  buildRebirth();
}

init();

/* ---------- CLICKING ---------- */

document.getElementById("timImg").onclick = () => {
  player.tims += 1;
  updateUI();
  save();
};

/* ---------- UPGRADES ---------- */

function buyUpgrade(id) {
  const u = UPGRADES[id];
  const count = player.ownedUpgrades[id] || 0;
  const price = Math.floor(u.cost * Math.pow(1.25, count));

  if (player.tims < price) return;

  player.tims -= price;
  player.cps += u.cps;
  player.ownedUpgrades[id] = count + 1;
  updateUI();
  buildShop();
  save();
}

function buildShop() {
  const el = document.getElementById("shop");
  el.innerHTML = "<h3>Shop</h3>";

  for (const id in UPGRADES) {
    const u = UPGRADES[id];
    const count = player.ownedUpgrades[id] || 0;
    const price = Math.floor(u.cost * Math.pow(1.25, count));

    el.innerHTML += `
      <div class="shop-item">
        <span>${u.name} (${count})</span>
        <button onclick="buyUpgrade('${id}')">${price}</button>
      </div>
    `;
  }
}

/* ---------- SKINS ---------- */

function applySkin() {
  document.getElementById("timImg").src =
    SKINS[player.activeSkin].file;
}

function buildSkins() {
  const el = document.getElementById("skins");
  el.innerHTML = "<h3>Skins</h3>";

  for (const id in SKINS) {
    const s = SKINS[id];
    const owned = player.skinsOwned.includes(id);

    el.innerHTML += `
      <div class="skin-item">
        <span>${s.name}</span>
        <button onclick="selectSkin('${id}')">
          ${owned ? "Select" : s.cost}
        </button>
      </div>
    `;
  }
}

window.selectSkin = (id) => {
  if (!player.skinsOwned.includes(id)) {
    if (player.tims < SKINS[id].cost) return;
    player.tims -= SKINS[id].cost;
    player.skinsOwned.push(id);
  }
  player.activeSkin = id;
  applySkin();
  updateUI();
  save();
};

/* ---------- BACKGROUNDS ---------- */

function applyBackground() {
  document.getElementById("bg").style.backgroundImage =
    `url(${BACKGROUNDS[player.activeBackground].file})`;
}

/* ---------- REBIRTH ---------- */

function buildRebirth() {
  const el = document.getElementById("rebirthPanel");
  const cost = 1000 * Math.pow(3, player.rebirths);

  el.innerHTML = `
    <h3>Rebirth</h3>
    <p>Cost: ${cost}</p>
    <button onclick="doRebirth()">Rebirth</button>
  `;
}

window.doRebirth = () => {
  const cost = 1000 * Math.pow(3, player.rebirths);
  if (player.tims < cost) return;

  player.tims = 0;
  player.cps = 0;
  player.ownedUpgrades = {};
  player.rebirths += 1;
  updateUI();
  buildShop();
  buildRebirth();
  save();
};

/* ---------- TICK ---------- */

setInterval(() => {
  player.tims += player.cps * (1 + player.rebirths * 0.25);
  updateUI();
  save();
}, 1000);

/* ---------- UI ---------- */

function updateUI() {
  document.getElementById("tims").textContent = Math.floor(player.tims);
  document.getElementById("cps").textContent = player.cps;
  document.getElementById("rebirths").textContent = player.rebirths;
}

function save() {
  updatePlayer(UID, player);
}
