(function () {
  'use strict';

  // Legacy shim: keep app.js for old bookmarks/caches, but run the canonical runtime.
  if (document.querySelector('script[data-tim-clicker-runtime="script-js"]')) return;

  var firebaseReady = false;
  var auth = null;
  var db = null;
  var uid = null;
  var saveAllowed = false;

  try {
    if (window.firebase && !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    if (window.firebase) {
      auth = firebase.auth();
      db = firebase.database();
      if (
        firebase.database &&
        firebase.database.INTERNAL &&
        typeof firebase.database.INTERNAL.forceLongPolling === 'function'
      ) {
        firebase.database.INTERNAL.forceLongPolling();
      }
      firebaseReady = true;
    }
  } catch (err) {
    firebaseReady = false;
  }

  // ---------- Data ----------
  var upgrades = [
    { id: 'u05', name: 'bacteriophage', baseCost: 1, add: 0.1, icon: 'upgrade0.1.png' },
    { id: 'u1', name: 'Tim-ema', baseCost: 100, add: 2, icon: 'upgrade1.png' },
    { id: 'u015', name: 'chezburger', baseCost: 250, add: 4, icon: 'upgrade1.5.png' },
    { id: 'u2', name: 'Floatie', baseCost: 500, add: 8, icon: 'upgrade2.png' },
    { id: 'u025', name: 'mier', baseCost: 1000, add: 15, icon: 'upgrade2.5.png' },
    { id: 'u3', name: ':3', baseCost: 2000, add: 25, icon: 'upgrade3.png' },
    { id: 'u035', name: 'Shoarma Broodje', baseCost: 4000, add: 40, icon: 'upgrade3.5.png' },
    { id: 'u4', name: 'Tim', baseCost: 6000, add: 70, icon: 'upgrade4.png' },
    { id: 'u045', name: 'Teh Epic Tim is comming!!!', baseCost: 10000, add: 120, icon: 'upgrade4.5.png' },
    { id: 'u5', name: 'Depression Upgrade', baseCost: 15000, add: 180, icon: 'upgrade5.png' },
    { id: 'u055', name: 'Une petite Biertje', baseCost: 25000, add: 350, icon: 'upgrade5.5.png' },
    { id: 'u6', name: 'Ball Guy Tim', baseCost: 40000, add: 450, icon: 'upgrade6.png' },
    { id: 'u065', name: 'Philips stofzuiger D380', baseCost: 70000, add: 700, icon: 'upgrade6.5.png' },
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
    { id: 'u38', name: 'Who is the inventor of cheese???', baseCost: 1000000000000000000000, add: 5000000000000000000, icon: 'upgradecheese.png' },
    { id: 'u39', name: 'The fabric of space and Tim', baseCost: 5000000000000000000000, add: 10000000000000000000, icon: 'upgrade36.png' },
    { id: 'u40', name: 'Deep Brain stimulation', baseCost: 10000000000000000000000, add: 50000000000000000000, icon: 'upgrade38.png' },
    { id: 'u41', name: '6 laws of quantum physics', baseCost: 50000000000000000000000, add: 100000000000000000000, icon: 'upgrade40.png' },
    { id: 'u42', name: 'Weapon of Mosquito Destruction', baseCost: 100000000000000000000000, add: 500000000000000000000, icon: 'upgrade41.png' },
    { id: 'u43', name: 'P-A', baseCost: 500000000000000000000000, add: 1000000000000000000000, icon: 'assets/upgrades/P-A.png' },
    { id: 'u44', name: 'G-T', baseCost: 1000000000000000000000000, add: 5000000000000000000000, icon: 'assets/upgrades/G-T.png' }
  ];
  var UPGRADES = upgrades;


  var SKINS = [];
  var skinCandidates = [
    'assets/skins/default.png',
    'assets/skins/Gold.png',
    'assets/skins/AMONG_US.png',
    'assets/skins/Assasin_Tim.png',
    'assets/skins/B.T.S._Tim.png',
    'assets/skins/Baby_Tim.png',
    'assets/skins/Blooket_Tim.png',
    'assets/skins/Blueprint_Tim.png',
    'assets/skins/G.O.A.T..jpg',
    'assets/skins/Hologram_Tim.png',
    'assets/skins/Inverted_Tim.png',
    'assets/skins/JOHAN.png',
    'assets/skins/Joker_Of_Tims.png',
    'assets/skins/Kartonnen_Doos.png',
    'assets/skins/Marble_Tim.png',
    'assets/skins/Mr._Timmah.png',
    'assets/skins/Neutronen_Tim.png',
    'assets/skins/Nyan_Tim.png',
    'assets/skins/Plague_Serpent.png',
    'assets/skins/Planet_Tim.gif',
    'assets/skins/Pufferfish_Tim.png',
    'assets/skins/Rat_Wizard_Tim.png',
    'assets/skins/Scout_Tim.png',
    'assets/skins/Solar_Tim.png',
    'assets/skins/TIM.png',
    'assets/skins/Terminal_Tim.png',
    'assets/skins/Tim_Driving_In_Car_Right_After_A_Beer.png',
    'assets/skins/TimTim.png',
    'assets/skins/Tim_Missprinttttttttt.png',
    'assets/skins/Tim_Of_War.png',
    'assets/skins/TimaCola.png',
    'assets/skins/TimoBama.png',
    'assets/skins/Timtoday.png',
    'assets/skins/Timton_G_Timton.png'
  ];

  var skinFallbackPool = [
    'assets/skins/default.png',
  ];

  function skinNameFromFile(path) {
    var file = path.split('/').pop() || '';
    var base = file.replace(/\.[^.]+$/, '');
    base = base.replace(/[_-]+/g, ' ').trim();
    if (!base) return 'Skin';
    return base.replace(/\b\w/g, function (m) { return m.toUpperCase(); });
  }

  function loadSkinCatalog(done) {
    var entries = [];
    var remaining = skinCandidates.length;
    var completed = false;

    function finalize() {
      if (completed) return;
      completed = true;
      if (entries.length === 0) {
        entries.push({ idx: 0, name: 'Default', file: 'assets/skins/default.png' });
      }

      entries.sort(function (a, b) { return a.idx - b.idx; });

      SKINS = [];
      for (var i = 0; i < entries.length; i++) {
        SKINS.push({
          id: 'skin_' + (i + 1),
          name: entries[i].name,
          file: entries[i].file,
          mult: 1 + i * 0.03,
          cost: i === 0 ? 0 : 500 + i * 400
        });
      }

      if (state.skinsOwned.indexOf('skin_1') < 0) state.skinsOwned = ['skin_1'];
      if (!SKINS.some(function (x) { return x.id === state.activeSkin; })) state.activeSkin = 'skin_1';
      done();
    }

    function pushEntryIfMissing(entry) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].name === entry.name) return;
      }
      entries.push(entry);
    }

    function resolveCandidate(candidate, idx) {
      var displayName = skinNameFromFile(candidate);
      var img = new Image();
      img.onload = function () {
        pushEntryIfMissing({ idx: idx, name: displayName, file: candidate });
        remaining -= 1;
        if (remaining === 0) finalize();
      };
      img.onerror = function () {
        var fallback = skinFallbackPool[idx % skinFallbackPool.length];
        var fallbackImg = new Image();
        fallbackImg.onload = function () {
          pushEntryIfMissing({ idx: idx, name: displayName, file: fallback });
          remaining -= 1;
          if (remaining === 0) finalize();
        };
        fallbackImg.onerror = function () {
          remaining -= 1;
          if (remaining === 0) finalize();
        };
        fallbackImg.src = fallback;
      };
      img.src = candidate;
    }

    if (!remaining) {
      finalize();
      return;
    }

    for (var i = 0; i < skinCandidates.length; i++) {
      resolveCandidate(skinCandidates[i], i);
    }

    setTimeout(finalize, 2200);
  }
  var MUSIC = {
    lofi1: { name: 'Bossa Nova', cost: 1200, file: 'assets/music/lofi1.wav' },
    lofi2: { name: 'Tetration (BFDI/TPOT medley)', cost: 2500, file: 'assets/music/lofi2.mp3' }
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
    if (!saveAllowed) return;
    try {
      localStorage.setItem('tim_clicker_save_v2', JSON.stringify(state));
    } catch (err) {}
  }

  function loadLocal() {
    if (!saveAllowed) return;
    try {
      var raw = localStorage.getItem('tim_clicker_save_v2');
      if (raw) state = Object.assign(clone(defaultState), JSON.parse(raw));
    } catch (err) {
      state = clone(defaultState);
    }
  }

  var lastStatus = '';
  var lastRemoteSaveAt = 0;

  function saveRemote(force) {
    if (!saveAllowed) return;
    if (!firebaseReady || !uid || !db) return;
    var now = Date.now();
    if (!force && now - lastRemoteSaveAt < 4000) return;
    lastRemoteSaveAt = now;
    db.ref('users/' + uid).set(state).catch(function () {
      setStatus('Firebase write failed.');
    });
  }

  function saveNow(forceRemote) {
    saveLocal();
    saveRemote(!!forceRemote);
  }

  function setStatus(text) {
    if (text === lastStatus) return;
    lastStatus = text;
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
        btn.className = 'upgrade-item';
        btn.innerHTML = '<img src="' + up.icon + '" alt="" data-icon="' + up.icon.replace('assets/upgrades/', '') + '" onerror="if(!this.dataset.f){this.dataset.f=1;this.src=\'assets/upgrades/\'+this.dataset.icon;}else{this.style.display=\'none\';}">' +
          '<span>' + up.name + ' (' + owned + ') - ' + price + '</span>';
        btn.onclick = function () {
          if (state.tims < price) return;
          state.tims -= price;
          state.upgrades[up.id] = owned + 1;
          saveNow(true);
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
        btn.className = 'skin-item';
        btn.innerHTML = '<img src="' + skin.file + '" alt="" onerror="this.style.display=\'none\'">' +
          '<span>' + skin.name + (owned ? ' (owned)' : ' - ' + skin.cost) + '</span>';
        btn.onclick = function () {
          if (!owned) {
            if (state.tims < skin.cost) return;
            state.tims -= skin.cost;
            state.skinsOwned.push(skin.id);
          }
          state.activeSkin = skin.id;
          saveNow(true);
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
          saveNow(true);
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
          saveNow(true);
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
          saveNow(true);
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
      saveNow(true);
      renderAll();
    };

    el('sellCoinBtn').onclick = function () {
      var coin = state.activeCoin;
      if (state.coinWallet[coin] < 1) return;
      state.coinWallet[coin] -= 1;
      state.tims += state.coinPrice[coin];
      saveNow(true);
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
    state.tims += (1 + state.rebirths * 0.25);
    saveNow();
    renderAll();
  };

  el('rebirthBtn').onclick = function () {
    var needed = 1
    if (state.tims < needed) return;
    state.tims = 0;
    state.upgrades = {};
    state.rebirths += 1;
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
    saveNow(false);
    updateStats();
  }, 100);

  // ---------- Boot ----------
  function initFirebaseAuth() {
    if (!saveAllowed) {
      setStatus('Saving declined. Nothing will be saved.');
      return Promise.resolve();
    }

    if (!firebaseReady || !auth || !db) {
      setStatus('Firebase offline, local save enabled.');
      return Promise.resolve();
    }

    uid = null;
    var persistenceBlocked = false;

    function syncForUser(user) {
      if (!user) return Promise.resolve();
      uid = user.uid;
      setStatus('Firebase connected.');
      return db.ref('users/' + uid).once('value').then(function (snap) {
        if (snap && snap.exists()) state = Object.assign(clone(defaultState), snap.val());
      });
    }

    return auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .catch(function () {
        persistenceBlocked = true;
        return auth.setPersistence(firebase.auth.Auth.Persistence.NONE).catch(function () {
          return Promise.resolve();
        });
      })
      .then(function () {
        return new Promise(function (resolve) {
          var done = false;
          function finish() {
            if (done) return;
            done = true;
            resolve();
          }

          var unsubscribe = auth.onAuthStateChanged(function (user) {
            unsubscribe();

            if (user || auth.currentUser) {
              syncForUser(user || auth.currentUser)
                .then(finish)
                .catch(function () {
                  setStatus('Firebase sync failed. Using local save only.');
                  finish();
                });
              return;
            }

            if (persistenceBlocked) {
              setStatus('Firebase persistence blocked. Using local save only to avoid account churn.');
              finish();
              return;
            }

            auth.signInAnonymously()
              .then(function (res) {
                return syncForUser(res.user);
              })
              .then(finish)
              .catch(function () {
                setStatus('Firebase auth blocked. Playing without cloud save.');
                finish();
              });
          }, function () {
            setStatus('Firebase auth blocked. Playing without cloud save.');
            finish();
          });
        });
      });
  }

  function boot() {
    applyBackground();
    document.body.classList.add('cookie-lock');

    function openIfNamed() {
      if (!state.name) return;
      el('namePanel').classList.add('hidden');
      el('gamePanel').classList.remove('hidden');
      renderAll();
    }

    el('acceptCookiesBtn').onclick = function () {
      saveAllowed = true;
      el('cookiePopup').classList.add('hidden');
      document.body.classList.remove('cookie-lock');
      loadLocal();
      initFirebaseAuth().then(function () {
        openIfNamed();
        renderAll();
      });
    };

    el('declineCookiesBtn').onclick = function () {
      saveAllowed = false;
      uid = null;
      el('cookiePopup').classList.add('hidden');
      document.body.classList.remove('cookie-lock');
      setStatus('Saving declined. Nothing will be saved (risk accepted).');
      openIfNamed();
      renderAll();
    };

    setStatus('Please accept or decline saving cookies.');
  }

  loadSkinCatalog(function () {
    boot();
  });
})();
