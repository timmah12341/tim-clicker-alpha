(function () {
  'use strict';

  // ---------- Firebase ----------
  var firebaseConfig = {};
  firebaseConfig.apiKey = 'AIzaSyDleRW-O4yP9FJhuqQtMTVT0c_Dd1PPA98';
  firebaseConfig.authDomain = 'tim-clicker-alpha.firebaseapp.com';
  firebaseConfig.databaseURL = 'https://tim-clicker-alpha-default-rtdb.europe-west1.firebasedatabase.app';
  firebaseConfig.projectId = 'tim-clicker-alpha';
  firebaseConfig.storageBucket = 'tim-clicker-alpha.firebasestorage.app';
  firebaseConfig.messagingSenderId = '40617780569';
  firebaseConfig.appId = '1:40617780569:web:1a82146a3554ab1e365848';

  var firebaseReady = false;
  var auth = null;
  var db = null;
  var uid = null;
  var sessionKey = 'session_' + Math.random().toString(36).slice(2, 10);
  var lastPublicSaveAt = 0;

  try {
    if (window.firebase && !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    if (window.firebase) {
      auth = firebase.auth();
      db = firebase.database();
      firebaseReady = true;
    }
  } catch (err) {
    firebaseReady = false;
  }

  // ---------- Data ----------
  var upgrades = [
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
  var UPGRADES = upgrades;


  var SKINS = [];
  // Includes all current skin art files (assets/skins + root legacy skins), duplicated on purpose.
  var skinFiles = [
    'assets/skins/default.png',
    'assets/skins/gold.png',
    'assets/skins/Blueprint_Tim.png',
    'assets/skins/HologramTim.png',
    'assets/skins/KartonnenDoos.png',
    'assets/skins/Plague_Serpent.png',
    'assets/skins/PufferfishTim.png',
    'assets/skins/ScoutTim.png',
    'assets/skins/TimJoker.png',
    'assets/skins/TimOfWar.png',
    'assets/skins/TimTim.png',
    'assets/skins/TimaCola.png',
    'assets/skins/TimoBama.png',
    'assets/skins/TimtonGTimton.png',
    'assets/skins/Gold.png'
  ];

  var skinNames = [
    'Default',
    'Timtoday :3',
    'Blueprint Tim',
    'Hologram Tim',
    'Kartonnen Doos',
    'Tim The Plague Serpent',
    'Le Pufferfish Tim',
    'Scout Tim',
    'Joker of Tims',
    'Tim Of War',
    'TimTim',
    'Tima Cola™',
    'TimoBama',
    'Timton G Timton'
    'Goud'
  ];

  for (var i = 0; i < skinFiles.length; i++) {
    SKINS.push({
      id: 'skin_' + (i + 1),
      name: skinNames[i] || ('Skin ' + (i + 1)),
      file: skinFiles[i],
      mult: 1 + i * 0.03,
      cost: i === 0 ? 0 : 500 + i * 400
    });
  }
  var MUSIC = {
    lofi1: { name: 'Lofi 1', cost: 1200, file: 'assets/music/lofi1.wav' },
    lofi2: { name: 'Lofi 2', cost: 2500, file: 'assets/music/lofi2.wav' }
  };

  var BACKGROUNDS = {
    dark: { name: 'Dark', cost: 0, file: '' },
    snuffels: { name: 'Snuffels', cost: 2200, file: 'BgBg.png' },
    ball: { name: 'Ball Guys', cost: 3000, file: 'Ball Guys Background.png' },
    davdd: { name: 'DAVDD', cost: 3500, file: 'assets/backgrounds/DAVDD.png' }
  };

  var MINIGAMES = {
    coinflip: { name: 'Coin Flip', cost: 100, reward: 220, winChance: 0.5 },
    fish: { name: 'Fish Minigame', cost: 300, reward: 900, winChance: 0.38 }
  };

  var EVENTS = {
    NONE: { name: 'None', mult: 1 },
    RAIN: { name: 'Rain', mult: 1.5 },
    THUNDER: { name: 'Thunder', mult: 2 },
    DISCO: { name: 'Disco', mult: 2.4 }
  };

  var COINS = {
    JOHAN: { name: 'Johan coin', vol: 11 },
    CHATGPT: { name: 'ChatcoinGPT', vol: 8 },
    KIRB: { name: 'Kirbcoin', vol: 16 }
  };

  var defaultState = {
    name: '',
    tims: 0,
    rebirths: 0,
    upgrades: {},
    skinsOwned: ['skin_1'],
    activeSkin: 'skin_1',
    musicOwned: [],
    bgOwned: ['dark'],
    activeBg: 'dark',
    activeEvent: 'NONE',
    activeCoin: 'JOHAN',
    coinPrice: { JOHAN: 120, CHATGPT: 90, KIRB: 200 },
    coinWallet: { JOHAN: 0, CHATGPT: 0, KIRB: 0 }
  };

  var state = clone(defaultState);
  var musicPlayer = null;

  // ---------- Helpers ----------
  function el(id) { return document.getElementById(id); }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function upgradeCost(base, owned) {
    return Math.floor(base * Math.pow(1.15, owned));
  }

  function currentSkin() {
    for (var i = 0; i < SKINS.length; i++) {
      if (SKINS[i].id === state.activeSkin) return SKINS[i];
    }
    return SKINS[0];
  }

  function cps() {
    var total = 0;
    for (var i = 0; i < UPGRADES.length; i++) {
      var up = UPGRADES[i];
      total += (state.upgrades[up.id] || 0) * up.add;
    }
    total *= currentSkin().mult;
    total *= (1 + state.rebirths * 0.25);
    total *= (EVENTS[state.activeEvent] || EVENTS.NONE).mult;
    return total;
  }

  function saveLocal() {
    try {
      localStorage.setItem('tim_clicker_save_v2', JSON.stringify(state));
    } catch (err) {}
  }

  function loadLocal() {
    try {
      var raw = localStorage.getItem('tim_clicker_save_v2');
      if (raw) state = Object.assign(clone(defaultState), JSON.parse(raw));
    } catch (err) {
      state = clone(defaultState);
    }
  }

  function saveRemote() {
    if (!firebaseReady || !uid || !db) return;
    db.ref('users/' + uid).set(state).catch(function (err) {
      setStatus('Firebase write failed, using local/public save.');
    });
  }

  function savePublic() {
    var now = Date.now();
    if (now - lastPublicSaveAt < 5000) return;
    lastPublicSaveAt = now;

    var payload = {
      name: state.name || 'unknown',
      tims: Math.floor(state.tims),
      rebirths: state.rebirths || 0,
      updatedAt: now
    };

    try {
      fetch(firebaseConfig.databaseURL + '/publicSessions/' + sessionKey + '.json', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(function () {});
    } catch (err) {}
  }

  function saveNow() {
    saveLocal();
    saveRemote();
    savePublic();
  }

  function setStatus(text) {
    el('firebaseStatus').textContent = text;
  }

  function applyBackground() {
    var bg = BACKGROUNDS[state.activeBg] || BACKGROUNDS.dark;
    if (bg.file) {
      document.body.classList.add('bg-cover');
      document.body.style.backgroundImage = 'linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)), url("' + bg.file + '")';
    } else {
      document.body.classList.remove('bg-cover');
      document.body.style.backgroundImage = '';
    }
  }

  // ---------- Render ----------
  function updateStats() {
    var coinId = state.activeCoin;
    el('playerName').textContent = state.name;
    el('tims').textContent = Math.floor(state.tims);
    el('cps').textContent = cps().toFixed(1);
    el('rebirths').textContent = state.rebirths;
    el('eventText').textContent = (EVENTS[state.activeEvent] || EVENTS.NONE).name;
    el('coinPrice').textContent = state.coinPrice[coinId].toFixed(1);
    el('coinWallet').textContent = state.coinWallet[coinId].toFixed(2);
    el('timImage').src = currentSkin().file;
  }

  function renderUpgrades() {
    var box = el('upgradeShop');
    box.innerHTML = '';
    for (var i = 0; i < UPGRADES.length; i++) {
      (function (up) {
        var owned = state.upgrades[up.id] || 0;
        var price = upgradeCost(up.baseCost, owned);
        var btn = document.createElement('button');
        btn.textContent = up.name + ' (' + owned + ') - ' + price + ' [' + up.icon + ']';
        btn.onclick = function () {
          if (state.tims < price) return;
          state.tims -= price;
          state.upgrades[up.id] = owned + 1;
          saveNow();
          renderAll();
        };
        box.appendChild(btn);
      })(UPGRADES[i]);
    }
  }

  function renderSkins() {
    var box = el('skinShop');
    box.innerHTML = '';
    for (var i = 0; i < SKINS.length; i++) {
      (function (skin) {
        var owned = state.skinsOwned.indexOf(skin.id) >= 0;
        var btn = document.createElement('button');
        btn.textContent = skin.name + (owned ? ' (owned)' : ' - ' + skin.cost);
        btn.onclick = function () {
          if (!owned) {
            if (state.tims < skin.cost) return;
            state.tims -= skin.cost;
            state.skinsOwned.push(skin.id);
          }
          state.activeSkin = skin.id;
          saveNow();
          renderAll();
        };
        box.appendChild(btn);
      })(SKINS[i]);
    }
  }

  function renderMusic() {
    var box = el('musicShop');
    box.innerHTML = '';
    for (var id in MUSIC) {
      (function (musicId) {
        var m = MUSIC[musicId];
        var owned = state.musicOwned.indexOf(musicId) >= 0;
        var btn = document.createElement('button');
        btn.textContent = m.name + (owned ? ' (play)' : ' - ' + m.cost);
        btn.onclick = function () {
          if (!owned) {
            if (state.tims < m.cost) return;
            state.tims -= m.cost;
            state.musicOwned.push(musicId);
          }
          if (musicPlayer) {
            musicPlayer.pause();
            musicPlayer.currentTime = 0;
          }
          musicPlayer = new Audio(m.file);
          musicPlayer.loop = true;
          musicPlayer.play().catch(function () {});
          saveNow();
          renderAll();
        };
        box.appendChild(btn);
      })(id);
    }
  }

  function renderBackgrounds() {
    var box = el('backgroundShop');
    box.innerHTML = '';
    for (var id in BACKGROUNDS) {
      (function (bgId) {
        var bg = BACKGROUNDS[bgId];
        var owned = state.bgOwned.indexOf(bgId) >= 0;
        var btn = document.createElement('button');
        btn.textContent = bg.name + (owned ? ' (owned)' : ' - ' + bg.cost);
        btn.onclick = function () {
          if (!owned) {
            if (state.tims < bg.cost) return;
            state.tims -= bg.cost;
            state.bgOwned.push(bgId);
          }
          state.activeBg = bgId;
          applyBackground();
          saveNow();
          renderAll();
        };
        box.appendChild(btn);
      })(id);
    }
  }

  function renderMinigames() {
    var box = el('minigameShop');
    box.innerHTML = '';
    for (var id in MINIGAMES) {
      (function (gameId) {
        var game = MINIGAMES[gameId];
        var btn = document.createElement('button');
        btn.textContent = game.name + ' - cost ' + game.cost;
        btn.onclick = function () {
          if (state.tims < game.cost) return;
          state.tims -= game.cost;
          var win = Math.random() < game.winChance;
          if (win) state.tims += game.reward;
          el('miniResult').textContent = win ? ('WIN +' + game.reward) : 'LOSE';
          saveNow();
          renderAll();
        };
        box.appendChild(btn);
      })(id);
    }
  }

  function renderCrypto() {
    var select = el('coinSelect');
    if (select.options.length === 0) {
      for (var id in COINS) {
        var option = document.createElement('option');
        option.value = id;
        option.textContent = COINS[id].name;
        select.appendChild(option);
      }
      select.onchange = function () {
        state.activeCoin = select.value;
        saveNow();
        renderAll();
      };
    }
    select.value = state.activeCoin;

    el('buyCoinBtn').onclick = function () {
      var coin = state.activeCoin;
      var price = state.coinPrice[coin];
      if (state.tims < price) return;
      state.tims -= price;
      state.coinWallet[coin] += 1;
      saveNow();
      renderAll();
    };

    el('sellCoinBtn').onclick = function () {
      var coin = state.activeCoin;
      if (state.coinWallet[coin] < 1) return;
      state.coinWallet[coin] -= 1;
      state.tims += state.coinPrice[coin];
      saveNow();
      renderAll();
    };
  }

  function renderAll() {
    updateStats();
    renderUpgrades();
    renderSkins();
    renderMusic();
    renderBackgrounds();
    renderMinigames();
    renderCrypto();
  }

  // ---------- Events ----------
  el('timImage').onclick = function () {
    state.tims += (1 + state.rebirths * 0.1);
    saveNow();
    renderAll();
  };

  el('rebirthBtn').onclick = function () {
    var needed = 1000000 * Math.pow(3, state.rebirths);
    if (state.tims < needed) return;
    state.tims = 0;
    state.upgrades = {};
    state.rebirths += 1;
    saveNow();
    renderAll();
  };

  el('setEventBtn').onclick = function () {
    var code = el('adminCodeInput').value.trim().toUpperCase();
    if (code === 'CLEAR') code = 'NONE';
    if (!EVENTS[code]) return;
    state.activeEvent = code;
    el('adminCodeInput').value = '';
    saveNow();
    renderAll();
  };

  el('saveNameBtn').onclick = function () {
    var name = el('nameInput').value.trim();
    if (!name) return;
    state.name = name;
    el('namePanel').classList.add('hidden');
    el('gamePanel').classList.remove('hidden');
    saveNow();
    renderAll();
  };

  // ---------- Loop ----------
  setInterval(function () {
    state.tims += cps() / 10;
    for (var id in COINS) {
      var swing = (Math.random() - 0.5) * COINS[id].vol;
      state.coinPrice[id] = Math.max(15, state.coinPrice[id] + swing);
    }
    saveNow();
    updateStats();
  }, 100);

  // ---------- Boot ----------
  function boot() {
    setStatus(firebaseReady ? 'Firebase connected.' : 'Firebase offline, local save enabled.');
    loadLocal();
    applyBackground();

    function openIfNamed() {
      if (!state.name) return;
      el('namePanel').classList.add('hidden');
      el('gamePanel').classList.remove('hidden');
      renderAll();
    }

    if (!firebaseReady || !auth || !db) {
      openIfNamed();
      return;
    }

    auth.signInAnonymously().then(function (res) {
      uid = res.user.uid;
      return db.ref('users/' + uid).once('value');
    }).then(function (snap) {
      if (snap.exists()) state = Object.assign(clone(defaultState), snap.val());
      applyBackground();
      openIfNamed();
    }).catch(function () {
      setStatus('Firebase auth blocked, using local/public save.');
      openIfNamed();
    });
  }

  boot();
})();
