(function () {
  'use strict';

  // ---------- Firebase ----------
  var firebaseConfig = {};
  firebaseConfig.apiKey = 'AIzaSyBZDGbuenDWIE8O0hjCa8h98n1os-8MZNs';
  firebaseConfig.authDomain = 'tim-clicker.firebaseapp.com';
  firebaseConfig.databaseURL = 'https://tim-clicker-default-rtdb.europe-west1.firebasedatabase.app';
  firebaseConfig.projectId = 'tim-clicker';
  firebaseConfig.storageBucket = 'tim-clicker.firebasestorage.app';
  firebaseConfig.messagingSenderId = '493561136507';
  firebaseConfig.appId = '1:493561136507:web:0a842da88e6a764624e9de';
  firebaseConfig.measurementId = 'G-FTKCVMZH0Z';

  var firebaseReady = false;
  var auth = null;
  var db = null;
  var uid = null;
  var saveAllowed = false;
  var CONSENT_KEY = 'tim_cookie_consent_v1';
  var authStateUnsubscribe = null;
  var firebaseReferrerBlocked = false;
  var firebaseReferrerChecked = false;

  function checkApiKeyReferrerAccess() {
    if (firebaseReferrerChecked) return Promise.resolve(!firebaseReferrerBlocked);
    firebaseReferrerChecked = true;

    var url = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=' + encodeURIComponent(firebaseConfig.apiKey);
    return fetch(url, { method: 'GET', mode: 'cors', cache: 'no-store' })
      .then(function (resp) {
        if (resp.ok) return true;
        return resp.text().then(function (txt) {
          var lower = (txt || '').toLowerCase();
          if (resp.status === 403 && (lower.indexOf('api_key_http_referrer_blocked') >= 0 || lower.indexOf('requests from referer') >= 0)) {
            firebaseReferrerBlocked = true;
            return false;
          }
          return true;
        }).catch(function () {
          return resp.status !== 403;
        });
      })
      .catch(function () {
        return true;
      });
  }

  function ensureFirebaseReady() {
    if (firebaseReady && auth && db) return Promise.resolve(true);

    return checkApiKeyReferrerAccess().then(function (allowed) {
      if (!allowed) return false;
      try {
        if (window.firebase && !firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        if (window.firebase) {
          auth = firebase.auth();
          db = firebase.database();
          auth.useDeviceLanguage();
          firebaseReady = true;
        }
      } catch (err) {
        firebaseReady = false;
      }
      return firebaseReady && !!auth && !!db;
    });
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
    { id: 'u44', name: 'G-T', baseCost: 1000000000000000000000000, add: 5000000000000000000000, icon: 'assets/upgrades/G-T.png' },
    { id: 'u45', name: 'Le Beter Click', baseCost: 2200000, add: 0, mult: 1.2, icon: 'upgrade7.png' },
    { id: 'u46', name: 'golden ratio', baseCost: 9100000, add: 0, mult: 1.61803398875, icon: 'golden.png' },
    { id: 'u47', name: 'Clone', baseCost: 45000000, add: 0, mult: 2, maxOwned: 1, icon: 'upgrade41.png' }
  ];
  var UPGRADES = upgrades;


  var SKINS = [];
  var skinCandidates = [
    'assets/skins/default.png',
    'assets/skins/AMONG_US.png',
    'assets/skins/Absolute_Tim-ema.png',
    'assets/skins/Assasin_Tim.png',
    'assets/skins/B.T.S._Tim.png',
    'assets/skins/Baby_Tim.png',
    'assets/skins/Blooket_Tim.png',
    'assets/skins/Blueprint_Tim.png',
    'assets/skins/Bongo_Tim.png',
    'assets/skins/Gold.png',
    'assets/skins/G.O.A.T..jpg',
    'assets/skins/Hologram_Tim.png',
    'assets/skins/Inverted_Tim.png',
    'assets/skins/JOHAN.png',
    'assets/skins/Johnny_Tims.png',
    'assets/skins/Joker_Of_Tims.png',
    'assets/skins/Kartonnen_Doos.png',
    'assets/skins/KirbTim.png',
    'assets/skins/Marble_Tim.png',
    'assets/skins/Mr._Timmah.png',
    'assets/skins/Neutronen_Tim.png',
    'assets/skins/Nyan_Tim.png',
    'assets/skins/Plague_Serpent.png',
    'assets/skins/Planet_Tim.gif',
    'assets/skins/Pufferfish_Tim.png',
    'assets/skins/Rat_Wizard_Tim.png',
    'assets/skins/Scout_Tim.png',
    'assets/skins/SisyTim.png',
    'assets/skins/Solar_Tim.png',
    'assets/skins/SuperTim.png',
    'assets/skins/Tomer_Timsens.png',
    'assets/skins/TIM.png',
    'assets/skins/Terminal_Tim.png',
    'assets/skins/Tim_Driving_In_Car_Right_After_A_Beer.png',
    'assets/skins/TimTim.png',
    'assets/skins/Tim_Missprinttttttttt.png',
    'assets/skins/Tim_Of_War.png',
    'assets/skins/TimaCola.png',
    'assets/skins/TimoBama.png',
    'assets/skins/Timpy.png',
    'assets/skins/Timtoday.png',
    'assets/skins/Timton_G_Timton.png',
    'assets/skins/Tomer_Timsens.png'
  ];

  function prepareSkinCandidates(candidates) {
    var validExt = /\.(png|gif|jpe?g|webp)$/i;
    var seen = {};
    var normalized = [];
    for (var i = 0; i < candidates.length; i++) {
      var candidate = (candidates[i] || '').trim();
      if (!candidate || seen[candidate]) continue;
      seen[candidate] = true;
      if (!validExt.test(candidate)) continue;
      normalized.push(candidate);
    }
    return normalized;
  }

  var validatedSkinCandidates = prepareSkinCandidates(skinCandidates);

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
    var remaining = validatedSkinCandidates.length;
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

    for (var i = 0; i < validatedSkinCandidates.length; i++) {
      resolveCandidate(validatedSkinCandidates[i], i);
    }

    setTimeout(finalize, 2200);
  }
  var MUSIC = {
    lofi1: { name: 'Bossa Nova', cost: 1200, file: 'assets/music/lofi1.wav' },
    lofi2: { name: 'Tetration (BFDI/TPOT medley)', cost: 2500, file: 'assets/music/lofi2.mp3' }
  };

  var BACKGROUNDS = {
    dark: { name: 'Dark', cost: 0, file: '' },
    ball: { name: 'Ball Guys', cost: 3000, file: 'Ball Guys Background.png' },
    davdd: { name: 'DAVDD', cost: 3500, file: 'assets/backgrounds/DAVDD.png' }
  };

  var MINIGAMES = {
    coinflip: { name: 'Coin Flip', cost: 100, reward: 220, winChance: 0.5 },
    fish: { name: 'Fish Minigame', cost: 300, reward: 900, winChance: 0.38 },
    timtris: { name: 'Timtris (Tim Tetris)', cost: 600, reward: 2100, winChance: 0.36 },
    candycrush: { name: 'C-C-C-CANDY CRUSH', cost: 800, reward: 2600, winChance: 0.34 },
    basketball: { name: '🏀 Hoop Shot', cost: 500, reward: 1700, winChance: 0.4 },
    koopacrunch: { name: 'Koopa Crunch', cost: 1200, reward: 4200, winChance: 0.3 },
    subway: { name: 'Subway Surfers mode', cost: 1600, reward: 5600, winChance: 0.27 },
    slotmachine: { name: 'Slot machine', cost: 1000, reward: 3500, winChance: 0.32 }
  };

  var COINS = {
    JOHAN: { name: 'Johan coin', vol: 11 },
    CHATGPT: { name: 'ChatcoinGPT', vol: 8 },
    KIRB: { name: 'Kirbcoin', vol: 16 }
  };

  var BATTLE_PASS = {
    xpPerLevel: 100,
    maxLevel: 8,
    rewards: [
      { level: 1, type: 'tims', amount: 600, label: '+600 Tims' },
      { level: 2, type: 'skin', skinFile: 'assets/skins/Planet_Tim.gif', skinName: 'Planet Tim', label: 'Skin: Planet Tim' },
      { level: 3, type: 'rebirth', amount: 1, label: '+1 Rebirth' },
      { level: 4, type: 'tims', amount: 5000, label: '+5,000 Tims' },
      { level: 5, type: 'skin', skinFile: 'assets/skins/Hologram_Tim.png', skinName: 'Hologram Tim', label: 'Skin: Hologram Tim' },
      { level: 6, type: 'rebirth', amount: 2, label: '+2 Rebirths' },
      { level: 7, type: 'coin', amount: 4, label: '+4 Random Fake Crypto' },
      { level: 8, type: 'rebirth', amount: 3, label: '+3 Rebirths' }
    ],
    quests: [
      { id: 'clicker', name: 'Click Sprint', description: 'Click Tim 40 times.', goal: 40, xp: 40, metric: 'clicks' },
      { id: 'spender', name: 'Go Shopping', description: 'Buy 5 upgrades.', goal: 5, xp: 55, metric: 'upgradesBought' },
      { id: 'mini', name: 'Minigame Mania', description: 'Play 3 minigames.', goal: 3, xp: 35, metric: 'minigamesPlayed' }
    ]
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
    activeCoin: 'JOHAN',
    coinPrice: { JOHAN: 120, CHATGPT: 90, KIRB: 200 },
    coinWallet: { JOHAN: 5, CHATGPT: 0, KIRB: 0 },
    battlePassXp: 0,
    battlePassClaimed: [],
    questProgress: { clicks: 0, upgradesBought: 0, minigamesPlayed: 0 },
    questResetKey: ''
  };

  var state = clone(defaultState);
  var musicPlayer = null;

  // ---------- Helpers ----------
  function el(id) { return document.getElementById(id); }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function normalizeState() {
    if (!state.battlePassClaimed || !Array.isArray(state.battlePassClaimed)) state.battlePassClaimed = [];
    if (typeof state.battlePassXp !== 'number') state.battlePassXp = 0;
    if (!state.questProgress || typeof state.questProgress !== 'object') {
      state.questProgress = { clicks: 0, upgradesBought: 0, minigamesPlayed: 0 };
    }
    if (typeof state.questProgress.clicks !== 'number') state.questProgress.clicks = 0;
    if (typeof state.questProgress.upgradesBought !== 'number') state.questProgress.upgradesBought = 0;
    if (typeof state.questProgress.minigamesPlayed !== 'number') state.questProgress.minigamesPlayed = 0;
    if (typeof state.questResetKey !== 'string') state.questResetKey = '';

    for (var i = 0; i < BATTLE_PASS.rewards.length; i++) {
      var reward = BATTLE_PASS.rewards[i];
      if (reward.type !== 'skin') continue;
      var skinId = ensureBattlePassSkin(reward);
      if (state.battlePassClaimed.indexOf('bp_level_' + reward.level) >= 0 && state.skinsOwned.indexOf(skinId) < 0) {
        state.skinsOwned.push(skinId);
      }
    }

    var bpCap = BATTLE_PASS.maxLevel * BATTLE_PASS.xpPerLevel;
    state.battlePassXp = Math.max(0, Math.min(bpCap, state.battlePassXp));
    if (!state.questResetKey) state.questResetKey = amsterdamDateKey();
  }

  function amsterdamDateKey() {
    var parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Amsterdam',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());
    var year = '';
    var month = '';
    var day = '';
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].type === 'year') year = parts[i].value;
      if (parts[i].type === 'month') month = parts[i].value;
      if (parts[i].type === 'day') day = parts[i].value;
    }
    return year + '-' + month + '-' + day;
  }

  function resetDailyQuestsIfNeeded() {
    var todayKey = amsterdamDateKey();
    if (state.questResetKey === todayKey) return false;
    state.questResetKey = todayKey;
    state.questProgress = { clicks: 0, upgradesBought: 0, minigamesPlayed: 0 };
    state.battlePassClaimed = state.battlePassClaimed.filter(function (entry) {
      return entry.indexOf('quest_') !== 0;
    });
    return true;
  }

  function isBattlePassSkin(skin) {
    return !!skin && skin.id.indexOf('bp_skin_') === 0;
  }

  function upgradeCost(base, owned) {
    return Math.floor(base * Math.pow(1.15, owned));
  }

  function currentSkin() {
    var fallbackSkin = {
      id: 'skin_1',
      name: 'Default',
      file: skinFallbackPool[0] || 'assets/skins/default.png',
      mult: 1,
      cost: 0
    };

    if (!SKINS || SKINS.length === 0) return fallbackSkin;

    for (var i = 0; i < SKINS.length; i++) {
      if (SKINS[i].id === state.activeSkin) return SKINS[i];
    }
    return SKINS[0] || fallbackSkin;
  }

  function cps() {
    var total = 0;
    for (var i = 0; i < UPGRADES.length; i++) {
      var up = UPGRADES[i];
      var owned = state.upgrades[up.id] || 0;
      total += owned * (up.add || 0);
    }
    total *= totalMultiplier();
    total *= 1;
    return total;
  }

  function totalMultiplier() {
    var multiplier = 1;
    for (var i = 0; i < UPGRADES.length; i++) {
      var up = UPGRADES[i];
      var owned = state.upgrades[up.id] || 0;
      if (up.mult) multiplier *= Math.pow(up.mult, owned);
    }
    multiplier *= currentSkin().mult;
    multiplier *= (1 + state.rebirths * 0.25);
    return multiplier;
  }

  function rebirthCost() {
    return 1000000 * Math.pow(3, state.rebirths);
  }

  function battlePassLevel() {
    return Math.min(BATTLE_PASS.maxLevel, Math.floor(state.battlePassXp / BATTLE_PASS.xpPerLevel));
  }

  function ensureBattlePassSkin(reward) {
    if (!reward || !reward.skinFile) return null;
    for (var i = 0; i < SKINS.length; i++) {
      if (SKINS[i].file === reward.skinFile) return SKINS[i].id;
    }
    var id = 'bp_skin_' + reward.level;
    SKINS.push({ id: id, name: reward.skinName || ('Battle Pass Skin ' + reward.level), file: reward.skinFile, mult: 1.12 + reward.level * 0.015, cost: 0 });
    return id;
  }

  function claimBattlePassReward(reward) {
    if (!reward) return;
    if (reward.type === 'tims') {
      state.tims += reward.amount;
      return;
    }
    if (reward.type === 'rebirth') {
      state.rebirths += reward.amount;
      return;
    }
    if (reward.type === 'coin') {
      var coinIds = Object.keys(COINS);
      for (var i = 0; i < reward.amount; i++) {
        var randomCoin = coinIds[Math.floor(Math.random() * coinIds.length)];
        state.coinWallet[randomCoin] += 1;
      }
      return;
    }
    if (reward.type === 'skin') {
      var skinId = ensureBattlePassSkin(reward);
      if (skinId && state.skinsOwned.indexOf(skinId) < 0) state.skinsOwned.push(skinId);
    }
  }

  function addQuestProgress(metric, amount) {
    resetDailyQuestsIfNeeded();
    if (!state.questProgress[metric]) state.questProgress[metric] = 0;
    state.questProgress[metric] += amount;
    var grantedXp = 0;
    for (var i = 0; i < BATTLE_PASS.quests.length; i++) {
      var quest = BATTLE_PASS.quests[i];
      var claimedKey = 'quest_' + quest.id;
      if (quest.metric !== metric) continue;
      if (state.questProgress[metric] >= quest.goal && state.battlePassClaimed.indexOf(claimedKey) < 0) {
        state.battlePassClaimed.push(claimedKey);
        grantedXp += quest.xp;
      }
    }
    if (grantedXp > 0) state.battlePassXp = Math.min(BATTLE_PASS.maxLevel * BATTLE_PASS.xpPerLevel, state.battlePassXp + grantedXp);
  }


  var lastStatus = '';
  var lastRemoteSaveAt = 0;
  var userRef = null;
  var userRefListener = null;

  function storeConsent(value) {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch (err) {}
  }

  function readConsent() {
    var value = null;
    try {
      value = localStorage.getItem(CONSENT_KEY);
    } catch (err) {}

    if (value === 'accepted' || value === 'declined') return value;
    return null;
  }

  function stopRealtimeSync() {
    if (!userRef || !userRefListener) return;
    userRef.off('value', userRefListener);
    userRef = null;
    userRefListener = null;
  }

  function startRealtimeSync() {
    if (!firebaseReady || !db || !uid) return;
    stopRealtimeSync();
    userRef = db.ref('users/' + uid);
    userRefListener = function (snap) {
      if (!snap || !snap.exists()) return;
      state = Object.assign(clone(defaultState), snap.val());
      normalizeState();
      applyActiveSkin();
      renderAll();
    };
    userRef.on('value', userRefListener, function () {
      setStatus('Firebase live sync unavailable.');
    });
  }

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

  function applyActiveSkin() {
    var timImage = el('timImage');
    if (!timImage) return;
    var skin = currentSkin();
    if (!skin || !skin.file) return;
    if (timImage.getAttribute('src') !== skin.file) {
      timImage.src = skin.file;
    }
  }

  // ---------- Render ----------
  function updateStats() {
    var coinId = state.activeCoin;
    var needed = rebirthCost();
    el('playerName').textContent = state.name;
    el('tims').textContent = Math.floor(state.tims);
    el('cps').textContent = cps().toFixed(1);
    el('multi').textContent = 'x' + totalMultiplier().toFixed(2);
    el('rebirths').textContent = state.rebirths;
    el('rebirthBtn').textContent = 'Rebirth (' + Math.floor(needed) + ')';
    el('coinPrice').textContent = state.coinPrice[coinId].toFixed(1);
    el('coinWallet').textContent = state.coinWallet[coinId].toFixed(2);
  }

  function renderUpgrades() {
    var box = el('upgradeShop');
    box.innerHTML = '';
    for (var i = 0; i < UPGRADES.length; i++) {
      (function (up) {
        var owned = state.upgrades[up.id] || 0;
        var price = upgradeCost(up.baseCost, owned);
        var soldOut = typeof up.maxOwned === 'number' && owned >= up.maxOwned;
        var btn = document.createElement('button');
        btn.className = 'upgrade-item';
        btn.innerHTML = '<img src="' + up.icon + '" alt="" data-icon="' + up.icon.replace('assets/upgrades/', '') + '" onerror="if(!this.dataset.f){this.dataset.f=1;this.src=\'assets/upgrades/\'+this.dataset.icon;}else{this.style.display=\'none\';}">' +
          '<span>' + up.name + ' (' + owned + ')' + (soldOut ? ' - SOLD OUT' : ' - ' + price) + '</span>';
        btn.disabled = soldOut;
        btn.onclick = function () {
          if (soldOut) return;
          if (state.tims < price) return;
          state.tims -= price;
          state.upgrades[up.id] = owned + 1;
          addQuestProgress('upgradesBought', 1);
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
        var battlePassOnly = isBattlePassSkin(skin) && !owned;
        var btn = document.createElement('button');
        btn.className = 'skin-item';
        btn.innerHTML = '<img src="' + skin.file + '" alt="" onerror="this.style.display=\'none\'">' +
          '<span>' + skin.name + (owned ? ' (owned)' : battlePassOnly ? ' (battle pass reward)' : ' - ' + skin.cost) + '</span>';
        btn.disabled = battlePassOnly;
        btn.onclick = function () {
          if (battlePassOnly) return;
          if (!owned) {
            if (state.tims < skin.cost) return;
            state.tims -= skin.cost;
            state.skinsOwned.push(skin.id);
          }
          state.activeSkin = skin.id;
          applyActiveSkin();
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
          addQuestProgress('minigamesPlayed', 1);
          el('miniResult').textContent = win ? ('WIN +' + game.reward) : 'LOSE';
          saveNow(true);
          renderAll();
        };
        box.appendChild(btn);
      })(id);
    }
  }


  function renderBattlePass() {
    var summary = el('battlePassSummary');
    var progressBar = el('battlePassProgress');
    var rewardsBox = el('battlePassRewards');
    var questBox = el('questList');
    if (!summary || !progressBar || !rewardsBox || !questBox) return;

    var level = battlePassLevel();
    var xpInLevel = state.battlePassXp % BATTLE_PASS.xpPerLevel;
    var width = level >= BATTLE_PASS.maxLevel ? 100 : Math.floor((xpInLevel / BATTLE_PASS.xpPerLevel) * 100);
    summary.textContent = 'Level ' + level + ' / ' + BATTLE_PASS.maxLevel + ' • XP ' + state.battlePassXp + ' / ' + (BATTLE_PASS.maxLevel * BATTLE_PASS.xpPerLevel);
    progressBar.style.width = width + '%';

    rewardsBox.innerHTML = '';
    for (var i = 0; i < BATTLE_PASS.rewards.length; i++) {
      (function (reward) {
        var key = 'bp_level_' + reward.level;
        var claimed = state.battlePassClaimed.indexOf(key) >= 0;
        var unlocked = level >= reward.level;
        var btn = document.createElement('button');
        btn.textContent = 'Lvl ' + reward.level + ': ' + reward.label + (claimed ? ' (claimed)' : unlocked ? ' (claim)' : ' (locked)');
        btn.disabled = !unlocked || claimed;
        btn.onclick = function () {
          claimBattlePassReward(reward);
          state.battlePassClaimed.push(key);
          normalizeState();
          saveNow(true);
          renderAll();
        };
        rewardsBox.appendChild(btn);
      })(BATTLE_PASS.rewards[i]);
    }

    questBox.innerHTML = '';
    for (var j = 0; j < BATTLE_PASS.quests.length; j++) {
      var quest = BATTLE_PASS.quests[j];
      var questKey = 'quest_' + quest.id;
      var progress = state.questProgress[quest.metric] || 0;
      var questClaimed = state.battlePassClaimed.indexOf(questKey) >= 0;
      var card = document.createElement('div');
      card.className = 'quest-item';
      card.innerHTML = '<b>' + quest.name + '</b><span>' + quest.description + '</span><span>' + Math.min(progress, quest.goal) + ' / ' + quest.goal + ' • ' + (questClaimed ? 'XP claimed' : '+' + quest.xp + ' XP') + '</span>';
      questBox.appendChild(card);
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
    if (resetDailyQuestsIfNeeded()) saveNow(true);
    updateStats();
    renderUpgrades();
    renderSkins();
    renderMusic();
    renderBackgrounds();
    renderMinigames();
    renderCrypto();
    renderBattlePass();
  }

  // ---------- Events ----------
  el('timImage').onclick = function () {
    var clickBonus = 1 + state.rebirths * 0.25;
    var beterOwned = state.upgrades.u45 || 0;
    if (beterOwned > 0) clickBonus += cps() * 0.2 * beterOwned;
    state.tims += clickBonus;
    addQuestProgress('clicks', 1);
    saveNow();
    renderAll();
  };

  el('rebirthBtn').onclick = function () {
    var needed = rebirthCost();
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
    if (resetDailyQuestsIfNeeded()) {
      saveNow(true);
      renderAll();
      return;
    }
    state.tims += cps() / 10;
    for (var id in COINS) {
      var swing = (Math.random() - 0.5) * COINS[id].vol;
      state.coinPrice[id] = Math.max(15, state.coinPrice[id] + swing);
    }
    saveNow(false);
    updateStats();
  }, 100);

  // ---------- Boot ----------
  function syncForUser(user) {
    if (!user) return Promise.resolve();
    uid = user.uid;
    window.timClickerUid = uid;
    setStatus('Firebase connected. UID: ' + uid);
    return db.ref('users/' + uid).once('value').then(function (snap) {
      if (snap && snap.exists()) state = Object.assign(clone(defaultState), snap.val());
      normalizeState();
      startRealtimeSync();
      applyBackground();
      applyActiveSkin();
      renderAll();
    });
  }

  function updateAuthUi(user) {
    var authStatus = el('authStatus');
    var logoutBtn = el('logoutBtn');
    var renamePanel = el('renamePanel');
    if (user) {
      authStatus.textContent = 'Logged in as ' + (user.displayName || user.email || 'Guest');
      logoutBtn.classList.remove('hidden');
      renamePanel.classList.remove('hidden');
      el('renameInput').value = state.name || '';
    } else {
      authStatus.textContent = 'Not logged in. Use Google or continue as guest.';
      logoutBtn.classList.add('hidden');
      renamePanel.classList.add('hidden');
    }
  }

  function bindAuthButtons() {
    function showApiKeyReferrerBlockedMessage(err) {
      var msg = (err && err.message ? err.message : '').toLowerCase();
      if (msg.indexOf('api_key_http_referrer_blocked') >= 0 || msg.indexOf('requests from referer') >= 0) {
        setStatus('Firebase API key blocked for this host. In Google Cloud Console, allow this site URL under API key HTTP referrers.');
        return true;
      }
      return false;
    }

    function showGoogleAuthError(err) {
      var code = err && err.code ? err.code : '';
      var msg = err && err.message ? err.message.toLowerCase() : '';
      var base = 'Google login failed.';

      if (showApiKeyReferrerBlockedMessage(err)) {
        return;
      }

      if (code === 'auth/operation-not-allowed') {
        setStatus(base + ' Google provider is disabled in Firebase Authentication > Sign-in method.');
        return;
      }

      if (
        code === 'auth/invalid-action-code' ||
        msg.indexOf('requested action is invalid') >= 0 ||
        msg.indexOf('request is invalid') >= 0
      ) {
        setStatus(base + ' Firebase rejected this OAuth request as invalid. In Firebase Authentication > Sign-in method > Google, verify the Web SDK configuration uses this same Firebase project and re-save the Google provider settings.');
        return;
      }

      if (code === 'auth/unauthorized-domain') {
        setStatus(base + ' Add this host to Firebase Authentication > Settings > Authorized domains.');
        return;
      }

      if (code === 'auth/invalid-credential' || code === 'auth/invalid-oauth-client-id') {
        setStatus(base + ' OAuth client setup looks invalid. Check Google provider config and OAuth consent screen in Google Cloud.');
        return;
      }

      if (code === 'auth/internal-error' && msg.indexOf('invalid') >= 0) {
        setStatus(base + ' Google OAuth settings appear mismatched. Confirm this site is using the Firebase config from the same project where Google sign-in is enabled.');
        return;
      }

      if (code === 'auth/account-exists-with-different-credential') {
        setStatus(base + ' This email already uses another sign-in method. Sign in with that provider first, then link Google.');
        return;
      }

      setStatus(base + ' In Firebase Console: enable Authentication > Sign-in method > Google, add your site in Authentication > Settings > Authorized domains, and in Google Cloud Console enable Identity Toolkit API.' + (code ? ' (Error: ' + code + ')' : ''));
    }

    el('googleLoginBtn').onclick = function () {
      if (!auth) return;
      var provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      var currentUser = auth.currentUser;
      var attempt = currentUser && currentUser.isAnonymous
        ? currentUser.linkWithPopup(provider)
        : auth.signInWithPopup(provider);

      attempt.catch(function (err) {
        var popupBlocked = err && (
          err.code === 'auth/popup-blocked' ||
          err.code === 'auth/popup-closed-by-user' ||
          err.code === 'auth/cancelled-popup-request'
        );

        if (popupBlocked) {
          var redirectAttempt = currentUser && currentUser.isAnonymous
            ? currentUser.linkWithRedirect(provider)
            : auth.signInWithRedirect(provider);
          return redirectAttempt.catch(function (redirectErr) {
            showGoogleAuthError(redirectErr);
          });
        }

        showGoogleAuthError(err);
      });
    };

    el('guestLoginBtn').onclick = function () {
      if (!auth) return;
      auth.signInAnonymously().catch(function (err) {
        if (showApiKeyReferrerBlockedMessage(err)) return;
        setStatus('Guest login failed.');
      });
    };

    el('logoutBtn').onclick = function () {
      if (!auth) return;
      stopRealtimeSync();
      auth.signOut().then(function () {
        uid = null;
        window.timClickerUid = null;
        state = clone(defaultState);
        normalizeState();
        renderAll();
      });
    };

    el('renameBtn').onclick = function () {
      var newName = el('renameInput').value.trim();
      if (!newName) return;
      state.name = newName;
      el('nameInput').value = newName;
      saveNow(true);
      renderAll();
    };
  }

  function initFirebaseAuth() {
    if (!saveAllowed) {
      setStatus('Saving declined. Nothing will be saved.');
      return Promise.resolve();
    }

    return ensureFirebaseReady().then(function (ready) {
      if (!ready) {
        if (firebaseReferrerBlocked) {
          setStatus('Firebase API key blocked for this host. Update Google Cloud API key HTTP referrer allowlist.');
        } else {
          setStatus('Firebase offline. Guest save requires Firebase login.');
        }
        return;
      }

      stopRealtimeSync();
    uid = null;
    window.timClickerUid = null;
    bindAuthButtons();

    if (authStateUnsubscribe) {
      authStateUnsubscribe();
      authStateUnsubscribe = null;
    }

      return auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .catch(function () {
        return auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).catch(function () { return Promise.resolve(); });
      })
      .then(function () {
        return auth.getRedirectResult().catch(function (err) {
          showGoogleAuthError(err);
          return null;
        });
      })
      .then(function () {
        authStateUnsubscribe = auth.onAuthStateChanged(function (user) {
          updateAuthUi(user);
          if (!user) {
            uid = null;
            window.timClickerUid = null;
            setStatus('Login required. Guest save is stored in Firebase by UID only.');
            return;
          }
          syncForUser(user).catch(function () {
            setStatus('Firebase sync failed. Progress could not be saved.');
          });
        }, function () {
          setStatus('Firebase auth blocked.');
        });
      });
    });
  }

  function boot() {
    applyBackground();
    applyActiveSkin();
    normalizeState();
    var popup = el('cookiePopup');

    function openIfNamed() {
      if (!state.name) return;
      el('namePanel').classList.add('hidden');
      el('gamePanel').classList.remove('hidden');
      applyActiveSkin();
      renderAll();
    }

    function continueAfterConsent(consent) {
      if (consent === 'accepted') {
        saveAllowed = true;
        popup.classList.add('hidden');
        document.body.classList.remove('cookie-lock');
        el('authPanel').classList.remove('hidden');
        initFirebaseAuth().then(function () {
          applyActiveSkin();
          openIfNamed();
          renderAll();
        }).catch(function () {
          setStatus('Firebase init failed. Progress could not be saved.');
          applyActiveSkin();
          openIfNamed();
          renderAll();
        });
        return;
      }

      if (consent === 'declined') {
        saveAllowed = false;
        stopRealtimeSync();
        uid = null;
        window.timClickerUid = null;
        popup.classList.add('hidden');
        document.body.classList.remove('cookie-lock');
        el('authPanel').classList.add('hidden');
        setStatus('Saving declined. Nothing will be saved (risk accepted).');
        applyActiveSkin();
        openIfNamed();
        renderAll();
        return;
      }

      saveAllowed = false;
      stopRealtimeSync();
      uid = null;
      window.timClickerUid = null;
      document.body.classList.add('cookie-lock');
      popup.classList.remove('hidden');
      setStatus('Please accept or decline saving cookies.');
    }

    el('acceptCookiesBtn').onclick = function () {
      storeConsent('accepted');
      continueAfterConsent('accepted');
    };

    el('declineCookiesBtn').onclick = function () {
      storeConsent('declined');
      continueAfterConsent('declined');
    };

    continueAfterConsent(readConsent());
  }

  loadSkinCatalog(function () {
    boot();
  });
})();
