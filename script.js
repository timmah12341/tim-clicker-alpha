// script.js v2.1 (updated - lofi1.wav background)
import { ensureAuth, writePlayer, readPlayersOnce, readPlayer, onPlayers } from './firebase.js';

/* DOM refs */
const playerPanel = document.getElementById('playerPanel');
const nameInput = document.getElementById('nameInput');
const saveNameBtn = document.getElementById('saveNameBtn');
const gamePanel = document.getElementById('gamePanel');
const playerNameLabel = document.getElementById('playerNameLabel');
const timImg = document.getElementById('timImg');
const orbitContainer = document.getElementById('orbitContainer');
const timsEl = document.getElementById('tims');
const cpsEl = document.getElementById('cps');
const openShopBtn = document.getElementById('openShop');
const shopPanel = document.getElementById('shopPanel');
const shopList = document.getElementById('shopList');
const openSkinsBtn = document.getElementById('openSkins');
const minigamePanel = document.getElementById('minigamePanel');
const playClickRush = document.getElementById('playClickRush');
const minigameArea = document.getElementById('minigameArea');
const leaderboardEl = document.getElementById('leaderboard');
const musicToggle = document.getElementById('musicToggle');
const dailyBtn = document.getElementById('dailyBtn');
const siteTitle = document.getElementById('siteTitle');

/* canvas particles */
const canvas = document.getElementById('bgParticles');
const ctx = canvas.getContext('2d');
function resize(){ canvas.width = innerWidth; canvas.height = innerHeight; }
resize(); addEventListener('resize', resize);

/* state */
let uid = null;
let playerName = localStorage.getItem('tim_name') || '';
let tims = Number(localStorage.getItem('tim_tims') || 0);
let cps = Number(localStorage.getItem('tim_cps') || 0);
let owned = JSON.parse(localStorage.getItem('tim_owned') || '[]');
let selectedSkin = localStorage.getItem('tim_skin') || 'cookie.png';

/* upgrades */
const upgrades = [
  { id: 'u0.5', name: 'bacteriophage', baseCost: 1, add: 0.1, icon: 'upgrade0.1.png' },
  { id: 'u1', name: 'Tim-ema', baseCost: 100, add: 2, icon: 'upgrade1.png' },
  { id: 'u1.5', name: 'chezburger', baseCost: 250, add: 4, icon: 'upgrade1.5.png' },
  { id: 'u2', name: 'Floatie', baseCost: 500, add: 8, icon: 'upgrade2.png' },
  { id: 'u2.5', name: 'mier', baseCost: 1000, add: 15, icon: 'upgrade2.5.png' },
  { id: 'u3', name: ':3', baseCost: 2000, add: 25, icon: 'upgrade3.png' },
  { id: 'u3.5', name: 'Shoarma Broodje', baseCost: 4000, add: 40, icon: 'upgrade3.5.png' },
  { id: 'u4', name: 'Tim', baseCost: 6000, add: 70, icon: 'upgrade4.png' },
  { id: 'u4.5', name: 'Teh Epic Tim is comming!!!', baseCost: 10000, add: 120, icon: 'upgrade4.5.png' },
  { id: 'u5', name: 'Depression Upgrade', baseCost: 15000, add: 180, icon: 'upgrade5.png' },
  { id: 'u5.5', name: 'Une petite Biertje', baseCost: 25000, add: 350, icon: 'upgrade5.5.png' },
  { id: 'u6', name: 'Ball Guy Tim', baseCost: 40000, add: 450, icon: 'upgrade6.png' },
  { id: 'u6.5', name: 'Philips stofzuiger D380', baseCost: 70000, add: 700, icon: 'upgrade6.5.png' },
  { id: 'u7', name: 'Johan', baseCost: 120000, add: 1200, icon: 'upgrade7.png' },
  { id: 'u8', name: 'Tequilla', baseCost: 300000, add: 2500, icon: 'upgrade8.png' },
  { id: 'u9', name: 'Golden Tim', baseCost: 1000000, add: 50000, icon: 'upgrade9.png' },
  { id: 'u10', name: 'Minecraft Steve', baseCost: 5000000, add: 100000, icon: 'upgrade10.png' },
  { id: 'u11', name: 'ADMIN ABUSE TIM', baseCost: 10000000, add: 500000, icon: 'upgrade11.png' },
  { id: 'u12', name: 'Nuclear Power Plant', baseCost: 50000000, add: 1000000, icon: 'upgrade12.png' },
  { id: 'u13', name: 'Tim Clicker™: Ultimate Clicker V.I.P. Edition Deluxe 4.2 free', baseCost: 100000000, add: 5000000, icon: 'upgrade13.png' },
  { id: 'u14', name: 'Engineer monke', baseCost: 500000000, add: 10000000, icon: 'upgrade14.png' },
  { id: 'u15', name: 'Hamster Vuurpijl', baseCost: 1000000000, add: 50000000, icon: 'upgrade15.png' },
  { id: 'u16', name: 'Hatsune Timu', baseCost: 5000000000, add: 100000000, icon: 'upgrade16.png' },
  { id: 'u17', name: 'TimTimmer', baseCost: 10000000000, add: 500000000, icon: 'upgrade17.png' },
  { id: 'u18', name: 'Blackhole', baseCost: 50000000000, add: 1000000000, icon: 'upgrade18.png' },
  { id: 'u19', name: ':wave1: :wave2: :wave3: :wave4:', baseCost: 100000000000, add: 5000000000, icon: 'upgrade19.png' },
  { id: 'u20', name: 'Tim co.™', baseCost: 500000000000, add: 10000000000, icon: 'upgrade20.png' },
  { id: 'u21', name: 'White Hole', baseCost: 1000000000000, add: 50000000000, icon: 'upgrade21.png' },
  { id: 'u22', name: 'DEATH STARE TIM', baseCost: 5000000000000, add: 100000000000, icon: 'upgrade22.png' },
  { id: 'u23', name: 'Blooket Tim', baseCost: 10000000000000, add: 500000000000, icon: 'upgrade23.png' },
  { id: 'u24', name: 'Bordspel Geuzen', baseCost: 50000000000000, add: 1000000000000, icon: 'upgrade24.png' },
  { id: 'u25', name: 'Magnus Carlsen', baseCost: 100000000000000, add: 500000000000, icon: 'upgrade25.png' },
  { id: 'u26', name: 'Neutronenster', baseCost: 500000000000000, add: 1000000000000, icon: 'upgrade26.png' },
  { id: 'u27', name: 'Supernova', baseCost: 1000000000000000, add: 5000000000000, icon: 'upgrade27.png' },
  { id: 'u28', name: 'Polonium-210', baseCost: 5000000000000000, add: 10000000000000, icon: 'upgrade28.png' },
  { id: 'u29', name: 'Dyson Shell', baseCost: 10000000000000000, add: 50000000000000, icon: 'upgrade29.png' },
  { id: 'u30', name: 'Particle Accelerator', baseCost: 50000000000000000, add: 100000000000000, icon: 'upgrade30.png' },
  { id: 'u31', name: 'The heat death of the timiverse', baseCost: 100000000000000000, add: 500000000000000, icon: 'upgrade31.png' },
  { id: 'u32', name: 'Strange Quark', baseCost: 500000000000000000, add: 1000000000000000, icon: 'upgrade32.png' },
  { id: 'u33', name: 'The Great Attractor', baseCost: 1000000000000000000, add: 5000000000000000, icon: 'upgrade33.png' },
  { id: 'u34', name: 'The universe is a doughnut theory', baseCost: 5000000000000000000, add: 10000000000000000, icon: 'upgrade34.png' },
  { id: 'u35', name: 'Lobotomy', baseCost: 50000000000000000000, add: 100000000000000000, icon: 'upgrade37.png' },
  { id: 'u36', name: 'Dafthusky', baseCost: 100000000000000000000, add: 500000000000000000, icon: 'upgrade39.png' },
  { id: 'u37', name: 'Quasar', baseCost: 500000000000000000000, add: 1000000000000000000, icon: 'upgrade35.png' },
  { id: 'u38', name: 'Who is the inventor of cheese???', baseCost: 1000000000000000000000, add: 5000000000000000000, icon: 'upgrad.png' },
  { id: 'u39', name: 'The fabric of space and Tim', baseCost: 5000000000000000000000, add: 10000000000000000000, icon: 'upgrade36.png' },
  { id: 'u40', name: 'Deep Brain stimulation', baseCost: 10000000000000000000000, add: 50000000000000000000, icon: 'upgrade38.png' },
  { id: 'u41', name: '6 laws of quantum physics', baseCost: 50000000000000000000000, add: 100000000000000000000, icon: 'upgrade40.png' },
  { id: 'u42', name: 'Weapon of Mosquito Destruction', baseCost: 100000000000000000000000, add: 500000000000000000000, icon: 'upgrade41.png' }
];

function ownedCount(id){ const o = owned.find(x=>x.id===id); return o? o.count : 0; }
function increaseOwned(id){ let o = owned.find(x=>x.id===id); if(!o) owned.push({id, count:1}); else o.count++; localStorage.setItem('tim_owned', JSON.stringify(owned)); }

function calcCost(base, count){ return Math.max(1, Math.round(base * Math.pow(1.25, count))); }

// Safety: ensure saved owned entries only refer to known upgrade IDs
owned = (owned || []).filter(o => upgrades.some(u => u.id === o.id));


/* UI init */
if (playerName){ initAfterName(); } else { playerPanel.classList.remove('hidden'); gamePanel.classList.add('hidden'); }

saveNameBtn.addEventListener('click', async ()=>{
  const n = nameInput.value.trim(); if(!n) return alert('Enter a name'); playerName = n; localStorage.setItem('tim_name', playerName);
  uid = await ensureAuth(); // create or sync
  // try to read existing player by uid; if empty, write initial
  const remote = await readPlayer(uid);
  if (remote){
    // merge remote and local (take higher values)
    tims = Math.max(tims, remote.tims || 0);
    cps = Math.max(cps, remote.cps || 0);
    owned = remote.owned || owned;
    selectedSkin = remote.skin || selectedSkin;
  }
  await writePlayer(uid, { name: playerName, tims, cps, owned, skin: selectedSkin, lastDaily: localStorage.getItem('tim_daily')||null });
  initAfterName();
});

async function initAfterName(){
  playerPanel.classList.add('hidden'); gamePanel.classList.remove('hidden');
  playerNameLabel.textContent = playerName;
  buildShop(); renderOrbit(); buildLeaderboardInitial();
  // listen for leaderboard updates
  try{ uid = await ensureAuth(); onPlayers(obj=>renderLeaderboard(obj)); }catch(e){ console.warn(e); }
  checkDailyOnLoad();
}

/* clicking tim */
timImg.addEventListener('click', ()=>{
  tims += 1; spawnClickFx(); playClickTone(); updateUI(); saveLocalAndRemote();
  timImg.animate([{transform:'scale(1)'},{transform:'scale(1.06)'},{transform:'scale(1)'}],{duration:140});
});

/* shop toggles and building */
document.getElementById('openShop').addEventListener('click', ()=> shopPanel.classList.toggle('hidden'));

function buildShop(){
  shopList.innerHTML = '';
  upgrades.forEach(u=>{
    const cnt = ownedCount(u.id);
    const cost = calcCost(u.baseCost, cnt);
    const item = document.createElement('div'); item.className='shop-item';
    item.innerHTML = `<div class="meta"><img src="${u.icon}" alt="${u.name}"/><div><div class="u-name">${u.name}</div><div class="u-desc">${u.add} CPS</div></div></div><div class="buy"><div class="cost">${formatNumber(cost)} Tims</div><button class="buy-btn">Buy</button></div>`;
    item.querySelector('.buy-btn').addEventListener('click', ()=> buyUpgrade(u.id));
    shopList.appendChild(item);
  });
}

function buyUpgrade(id){
  const u = upgrades.find(x=>x.id===id);
  const cnt = ownedCount(id);
  const cost = calcCost(u.baseCost, cnt);
  if (tims < cost){ shopList.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}],{duration:220}); return; }
  tims -= cost; cps += u.add; increaseOwned(id); buildShop(); renderOrbit(); updateUI(); saveLocalAndRemote();
}

/* orbit rendering */
function renderOrbit(){
  orbitContainer.innerHTML = '';
  const items = [];
  owned.forEach(o=>{ const u = upgrades.find(x=>x.id===o.id); if(u) for(let i=0;i<o.count;i++) items.push(u); });
  if (items.length === 0) return;
  const radius = 130;
  items.forEach((u,i)=>{
    const angle = (i/items.length) * Math.PI * 2;
    const el = document.createElement('div'); el.className='orbit-item';
    el.style.animationDuration = `${8 + (i%5)*0.7}s`;
    const x = Math.cos(angle)*radius; const y = Math.sin(angle)*radius;
    el.style.left = `calc(50% + ${x}px - 28px)`; el.style.top = `calc(50% + ${y}px - 28px)`;
    el.innerHTML = `<img src="${u.icon}" alt="${u.name}" title="${u.name}">`;
    el.addEventListener('click', e=>{ e.stopPropagation(); buyUpgrade(u.id); });
    orbitContainer.appendChild(el);
  });
}

/* skins (left minimal) */
const skins = [ {id:'cookie.png',name:'Default'},{id:'skin_tim.png',name:'Tim-ema'},{id:'skin_galaxy.png',name:'Galaxy'} ];
function buildSkins(){ /* minimal for v2.1 - toggled via minigames for now */ }

/* minigame click rush */
playClickRush.addEventListener('click', ()=>{
  minigameArea.innerHTML = '';
  const info = document.createElement('div'); info.innerHTML = '<p>Click fast for 10s!</p>';
  const score = document.createElement('div'); score.className = 'mg-score'; score.textContent='0';
  const btn = document.createElement('button'); btn.textContent='Start';
  minigameArea.appendChild(info); minigameArea.appendChild(score); minigameArea.appendChild(btn);
  btn.addEventListener('click', ()=>{
    btn.disabled = true; let clicks=0;
    const clickBtn = document.createElement('button'); clickBtn.textContent='Click!'; minigameArea.appendChild(clickBtn);
    clickBtn.addEventListener('click', ()=>{ clicks++; score.textContent = clicks; spawnClickFx(); });
    setTimeout(()=>{ clickBtn.disabled = true; btn.disabled = false; tims += clicks; updateUI(); saveLocalAndRemote(); alert('Click Rush ended! +' + clicks + ' Tims'); minigameArea.innerHTML=''; }, 10000);
  });
});

/* leaderboard */
function renderLeaderboard(obj){
  const arr = Object.values(obj || {});
  arr.sort((a,b)=> (b.tims || 0) - (a.tims || 0));
  leaderboardEl.innerHTML = '';
  arr.slice(0,15).forEach((p,i)=>{ const li=document.createElement('li'); li.textContent = `${i+1}. ${p.name} — ${Math.floor(p.tims||0)} Tims`; leaderboardEl.appendChild(li); });
}
async function buildLeaderboardInitial(){ try{ const obj = await readPlayersOnce(); renderLeaderboard(obj); }catch(e){ console.warn(e); } }

/* main loop */
setInterval(()=>{ tims += cps; updateUI(); saveLocalAndRemote(); }, 1000);

/* persistence */
function updateUI(){ timsEl.textContent = formatNumber(Math.floor(tims)); cpsEl.textContent = cps; timImg.src = selectedSkin; }
function saveLocal(){ localStorage.setItem('tim_tims', Math.floor(tims)); localStorage.setItem('tim_cps', cps); localStorage.setItem('tim_owned', JSON.stringify(owned)); localStorage.setItem('tim_skin', selectedSkin); }
async function saveLocalAndRemote(){ saveLocal(); if(!uid){ try{ uid = await ensureAuth(); }catch(e){ console.warn(e); return; } } if(uid){ await writePlayer(uid, { name: playerName, tims: Math.floor(tims), cps, owned, skin: selectedSkin, lastDaily: localStorage.getItem('tim_daily')||null }); } }

/* particles */
let particles = [];
function spawnClickFx(){
  const r = timImg.getBoundingClientRect();
  const x = r.left + r.width/2; const y = r.top + r.height/2;
  for(let i=0;i<16;i++){ particles.push({ x,y, vx:(Math.random()-0.5)*6, vy:(Math.random()-1.5)*6, life:40+Math.random()*30, size:2+Math.random()*4, hue:260+Math.random()*40 }); }
}
function step(){ ctx.clearRect(0,0,canvas.width,canvas.height); for(let i=particles.length-1;i>=0;i--){ const p=particles[i]; p.x+=p.vx; p.y+=p.vy; p.vy+=0.08; p.life--; ctx.beginPath(); ctx.fillStyle = `hsla(${p.hue},80%,60%, ${Math.max(0,p.life/80)})`; ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); if(p.life<=0) particles.splice(i,1); } requestAnimationFrame(step); } step();

/* audio: play click tone via WebAudio; background music via HTMLAudioElement (assets/audio/lofi1.wav) */
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContextClass();
let musicPlaying = false;

// Background audio element (file path: assets/audio/lofi1.wav)
const bgAudio = new Audio('assets/audio/lofi1.wav');
bgAudio.loop = true;
bgAudio.volume = 0.45; // default volume
bgAudio.preload = 'auto';

// Attempt to resume audio context if user gesture required
async function resumeAudioContextIfNeeded(){
  try{
    if (audioCtx.state === 'suspended') await audioCtx.resume();
  }catch(e){}
}

function playClickTone(){ try{ const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type='square'; o.frequency.value=1400; g.gain.value=0.06; o.connect(g); g.connect(audioCtx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12); o.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.12); setTimeout(()=>o.stop(),140); }catch(e){} }

async function startMusic(){
  if (musicPlaying) return;
  // ensure WebAudio context resumed (for click sounds)
  await resumeAudioContextIfNeeded();
  // try to play HTMLAudioElement; browsers often require a user gesture
  bgAudio.play().then(()=> {
    musicPlaying = true;
    musicToggle.textContent = '🔇';
  }).catch((err)=> {
    // if play() fails due to autoplay policy, set flag but do not throw
    console.warn('bgAudio.play() blocked by autoplay policy:', err);
    // try a graceful fallback: set musicPlaying true only after user interacts
    musicPlaying = false;
    musicToggle.textContent = '🔊';
  });
}

function stopMusic(){
  try{
    bgAudio.pause();
    musicPlaying = false;
    musicToggle.textContent = '🔊';
  }catch(e){ console.warn(e); }
}

// wire music toggle - user gesture required on some browsers
musicToggle.addEventListener('click', async ()=>{
  // when toggling, resume context first to allow click tones
  await resumeAudioContextIfNeeded();
  if(!musicPlaying) {
    await startMusic();
  } else {
    stopMusic();
  }
});

/* animated background orbs */
const bg = document.getElementById('bg-animated');
function spawnBgOrbs(){ for(let i=0;i<12;i++){ const el=document.createElement('div'); el.className='orb'; el.style.left = Math.random()*100 + '%'; el.style.top = Math.random()*100 + '%'; el.style.width = (80 + Math.random()*160) + 'px'; el.style.height = el.style.width; el.style.opacity = 0.02 + Math.random()*0.08; bg.appendChild(el); setTimeout(()=>el.remove(), 60000); } } spawnBgOrbs();

/* daily reward (server-aware) */
function todayKey(){ const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
async function checkDailyOnLoad(){
  const lastLocal = localStorage.getItem('tim_daily');
  const today = todayKey();
  if (lastLocal === today) return;
  try{
    if(!uid) uid = await ensureAuth();
    const remote = await readPlayer(uid);
    const remoteLast = remote && remote.lastDaily ? remote.lastDaily : null;
    if (remoteLast === today) { localStorage.setItem('tim_daily', today); return; }
  }catch(e){}
  const reward = 100;
  tims += reward;
  localStorage.setItem('tim_daily', today);
  updateUI(); saveLocalAndRemote();
  alert('Daily reward: +' + reward + ' Tims');
}

/* secret: triple click title */
let titleClicks = 0;
siteTitle.addEventListener('click', ()=>{
  titleClicks++;
  setTimeout(()=>{ titleClicks = 0; }, 800);
  if (titleClicks >= 3){
    titleClicks = 0;
    tims += 500;
    updateUI(); saveLocalAndRemote();
    alert('Secret found! +500 Tims');
  }
});

function formatNumber(n){ return n.toLocaleString(); }
