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
  var UPGRADES = {
    cursor: { name: 'Cursor', base: 10, cps: 1 },
    factory: { name: 'Factory', base: 120, cps: 7 },
    lab: { name: 'Lab', base: 1100, cps: 55 },
    portal: { name: 'Portal', base: 9000, cps: 430 }
  };

  var SKINS = [];
  // Includes all current skin art files (assets/skins + root legacy skins), duplicated on purpose.
  var skinFiles = [
    'assets/skins/default.png',
    'assets/skins/gold.png',
    'skin_tim.png',
    'skin_galaxy.png',
    'golden.png',
    'somtoday1.png',
    'somtoday2.png',
    'somtoday3.png',
    'cookie.png',
    'DAVDD.png',
    'assets/skins/default.png',
    'assets/skins/gold.png',
    'skin_tim.png',
    'skin_galaxy.png',
    'golden.png',
    'somtoday1.png',
    'somtoday2.png',
    'somtoday3.png',
    'cookie.png',
    'DAVDD.png'
  ];

  function skinNameFromFile(file) {
    var base = file.split('/').pop().replace(/\.[^.]+$/i, '');
    return base.replace(/[_-]/g, ' ');
  }

  for (var i = 0; i < skinFiles.length; i++) {
    SKINS.push({
      id: 'skin_' + (i + 1),
      name: skinNameFromFile(skinFiles[i]),
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
    for (var id in state.upgrades) {
      if (UPGRADES[id]) total += UPGRADES[id].cps * state.upgrades[id];
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
    db.ref('users/' + uid).set(state).catch(function () {});
  }

  function saveNow() {
    saveLocal();
    saveRemote();
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
    for (var id in UPGRADES) {
      (function (upgradeId) {
        var owned = state.upgrades[upgradeId] || 0;
        var price = upgradeCost(UPGRADES[upgradeId].base, owned);
        var btn = document.createElement('button');
        btn.textContent = UPGRADES[upgradeId].name + ' (' + owned + ') - ' + price;
        btn.onclick = function () {
          if (state.tims < price) return;
          state.tims -= price;
          state.upgrades[upgradeId] = owned + 1;
          saveNow();
          renderAll();
        };
        box.appendChild(btn);
      })(id);
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
      openIfNamed();
    });
  }

  boot();
})();
