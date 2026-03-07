(function () {
  'use strict';

  // ---------- Firebase ----------
  var firebaseConfig = {};
  firebaseConfig.apiKey = 'AIzaSyBZDGbuenDWIE8O0hjCa8h98n1os-8MZNs';
  firebaseConfig.authDomain = 'tim-clicker.web.app';
  firebaseConfig.databaseURL = 'https://tim-clicker-default-rtdb.europe-west1.firebasedatabase.app';
  firebaseConfig.projectId = 'tim-clicker';
  firebaseConfig.messagingSenderId = '493561136507';
  firebaseConfig.appId = '1:493561136507:web:0a842da88e6a764624e9de';
  firebaseConfig.measurementId = 'G-FTKCVMZH0Z';

  var firebaseReady = false;
  var auth = null;
  var db = null;
  var uid = null;
  var saveAllowed = false;
  var CONSENT_KEY = 'tim_cookie_consent_v1';
  var LOCAL_SAVE_KEY = 'tim_local_state_v1';
  var authStateUnsubscribe = null;
  var firebaseReferrerBlocked = false;
  var firebaseReferrerUnknown = false;
  var firebaseReferrerChecked = false;
  var SESSION_KEY = 'tim_presence_session_id_v1';
  var LAST_LOGIN_EMAIL_KEY = 'tim_last_login_email_v1';
  var sessionId = null;
  var presenceRef = null;
  var presenceUserRef = null;
  var presenceListener = null;
  var presenceHeartbeatTimer = null;
  var presenceVisibleHandlerBound = false;
  var presenceTrackingFailed = false;
  var presenceDisabledByPolicy = false;
  var lastPresenceStatus = '';
  var leaderboardRef = null;
  var leaderboardListener = null;
  var leaderboardEntries = [];
  var activeLeaderboardBoard = 'tims';
  var leaderboardWritesBlockedByPolicy = false;
  var leaderboardWriteInFlight = false;
  var userGestureCaptured = false;

  function buildSessionId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2);
  }

  function captureUserGesture() {
    if (userGestureCaptured) return;
    userGestureCaptured = true;
    document.removeEventListener('pointerdown', captureUserGesture);
    document.removeEventListener('keydown', captureUserGesture);
    document.removeEventListener('touchstart', captureUserGesture);
  }

  document.addEventListener('pointerdown', captureUserGesture);
  document.addEventListener('keydown', captureUserGesture);
  document.addEventListener('touchstart', captureUserGesture);

  function ensureSessionId() {
    if (sessionId) return sessionId;
    try {
      var stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        sessionId = stored;
        return sessionId;
      }
    } catch (err) {}

    sessionId = buildSessionId();
    try {
      sessionStorage.setItem(SESSION_KEY, sessionId);
    } catch (err) {}
    return sessionId;
  }

  function hasOauthRedirectParams() {
    var haystack = ((window.location.search || '') + '&' + (window.location.hash || '')).toLowerCase();
    return (
      haystack.indexOf('code=') >= 0 ||
      haystack.indexOf('oauth') >= 0 ||
      haystack.indexOf('access_token=') >= 0 ||
      haystack.indexOf('id_token=') >= 0 ||
      haystack.indexOf('firebaseerror=') >= 0
    );
  }

  function isApiKeyReferrerBlockedError(err) {
    var msg = (err && err.message ? err.message : '').toLowerCase();
    return msg.indexOf('api_key_http_referrer_blocked') >= 0 || msg.indexOf('requests from referer') >= 0;
  }

  function normalizeFirebaseAuthError(err) {
    if (!err) return { code: '', backendMessage: '', message: '' };

    var code = err.code ? String(err.code) : '';
    var message = err.message ? String(err.message) : '';
    var backendMessage = err.backendMessage ? String(err.backendMessage).toUpperCase() : '';

    if (!backendMessage && message) {
      var jsonStart = message.indexOf('{');
      if (jsonStart >= 0) {
        try {
          var parsed = JSON.parse(message.slice(jsonStart));
          backendMessage = (parsed && parsed.error && parsed.error.message ? String(parsed.error.message) : '').toUpperCase();
        } catch (parseErr) {}
      }
    }

    if (!backendMessage && message) {
      var messageMatch = message.match(/\b[A-Z][A-Z0-9_]{2,}\b/g);
      if (messageMatch && messageMatch.length) {
        backendMessage = messageMatch[messageMatch.length - 1].toUpperCase();
      }
    }

    if (!code && backendMessage) {
      var codeMap = {
        EMAIL_EXISTS: 'auth/email-already-in-use',
        EMAIL_NOT_FOUND: 'auth/user-not-found',
        USER_NOT_FOUND: 'auth/user-not-found',
        INVALID_EMAIL: 'auth/invalid-email',
        INVALID_PASSWORD: 'auth/wrong-password',
        USER_DISABLED: 'auth/user-disabled',
        OPERATION_NOT_ALLOWED: 'auth/operation-not-allowed',
        TOO_MANY_ATTEMPTS_TRY_LATER: 'auth/too-many-requests',
        MISSING_CONTINUE_URI: 'auth/missing-continue-uri',
        INVALID_CONTINUE_URI: 'auth/invalid-continue-uri',
        UNAUTHORIZED_CONTINUE_URI: 'auth/unauthorized-continue-uri',
        UNAUTHORIZED_DOMAIN: 'auth/unauthorized-domain',
        DOMAIN_NOT_WHITELISTED: 'auth/domain-not-whitelisted',
        PROJECT_NOT_FOUND: 'auth/project-not-found',
        CONFIGURATION_NOT_FOUND: 'auth/configuration-not-found',
        INVALID_API_KEY: 'auth/invalid-api-key'
      };
      if (codeMap[backendMessage]) code = codeMap[backendMessage];
    }

    return {
      code: code,
      backendMessage: backendMessage,
      message: message,
      original: err
    };
  }

  function isPermissionDeniedError(err) {
    var code = err && err.code ? String(err.code).toLowerCase() : '';
    var msg = err && err.message ? String(err.message).toLowerCase() : '';
    return code.indexOf('permission-denied') >= 0 || code.indexOf('permission_denied') >= 0 || msg.indexOf('permission_denied') >= 0;
  }

  function isWriteAuthorizedForUid(targetUid) {
    if (!auth || !targetUid) return false;
    var currentUser = auth.currentUser;
    if (!currentUser || !currentUser.uid) return false;
    return currentUser.uid === targetUid;
  }

  function safeFiniteNumber(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function getHostSpecificReferrerGuidance() {
    var host = (window.location && window.location.hostname ? window.location.hostname.toLowerCase() : '') || 'unknown-host';
    var canonicalReferrers = [
      'https://tim-clicker.firebaseapp.com/*',
      'https://tim-clicker.web.app/*',
      'https://timmah12341.github.io/*',
      'https://timmah12341.github.io/tim-clicker/*'
    ];
    var canonicalAuthDomains = [
      'tim-clicker.firebaseapp.com',
      'tim-clicker.web.app',
      'timmah12341.github.io'
    ];
    var tips = [];

    if (host === 'tim-clicker.web.app' || host === 'tim-clicker.firebaseapp.com') {
      tips.push('Google Cloud API key HTTP referrers: add ' + canonicalReferrers.join(', '));
      tips.push('Firebase Auth Authorized Domains: add ' + canonicalAuthDomains.join(', '));
    } else if (host.indexOf('github.io') >= 0) {
      var owner = host.replace(/\.github\.io$/, '');
      tips.push('Google Cloud API key HTTP referrers: add https://' + owner + '.github.io/* and, if you use a project path, https://' + owner + '.github.io/<repo>/*');
      tips.push('If Firebase Hosting is also used, add https://tim-clicker.web.app/* and https://tim-clicker.firebaseapp.com/*');
      tips.push('Firebase Auth Authorized Domains: add ' + owner + '.github.io, tim-clicker.web.app, and tim-clicker.firebaseapp.com');
      tips.push('For tim-clicker production specifically, keep this baseline list: ' + canonicalReferrers.join(', '));
    } else {
      tips.push('Google Cloud API key HTTP referrers: add https://' + host + '/*');
      tips.push('If GitHub Pages is used, also add https://<owner>.github.io/* and https://<owner>.github.io/<repo>/*');
      tips.push('If Firebase Hosting is used, also add https://tim-clicker.web.app/* and https://tim-clicker.firebaseapp.com/*');
      tips.push('Firebase Auth Authorized Domains: add ' + host + ' (plus any GitHub/Firebase hosting domains used in production)');
    }

    tips.push('Identity Toolkit API must be enabled in the same Google Cloud project as this API key.');

    return 'Current host: ' + host + '. ' + tips.join(' | ');
  }

  function checkApiKeyReferrerAccess() {
    if (firebaseReferrerChecked) {
      if (firebaseReferrerBlocked) return Promise.resolve('blocked');
      if (firebaseReferrerUnknown) return Promise.resolve('unknown');
      return Promise.resolve('allowed');
    }
    firebaseReferrerChecked = true;
    firebaseReferrerBlocked = false;
    firebaseReferrerUnknown = false;

    var url = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=' + encodeURIComponent(firebaseConfig.apiKey);
    return fetch(url, { method: 'GET', mode: 'cors', cache: 'no-store' })
      .then(function (resp) {
        if (resp.ok) return 'allowed';
        return resp.text().then(function (txt) {
          var lower = (txt || '').toLowerCase();
          if (resp.status === 403 && (lower.indexOf('api_key_http_referrer_blocked') >= 0 || lower.indexOf('requests from referer') >= 0)) {
            firebaseReferrerBlocked = true;
            return 'blocked';
          }
          firebaseReferrerUnknown = true;
          return 'unknown';
        }).catch(function () {
          firebaseReferrerUnknown = true;
          return 'unknown';
        });
      })
      .catch(function () {
        firebaseReferrerUnknown = true;
        return 'unknown';
      });
  }

  function getPasswordResetFallbackMessage(email) {
    var host = (window.location && window.location.hostname ? window.location.hostname.toLowerCase() : '') || '';
    if (host === 'tim-clicker.firebaseapp.com') {
      var target = 'https://tim-clicker.web.app' + window.location.pathname + '?resetEmail=' + encodeURIComponent(email || '');
      return 'Password reset is blocked on firebaseapp.com by API-key referrer policy. Open this mirror and retry: ' + target;
    }
    return '';
  }

  function maybeRedirectFirebaseAppHost(reason) {
    var host = (window.location && window.location.hostname ? window.location.hostname.toLowerCase() : '') || '';
    if (host !== 'tim-clicker.firebaseapp.com') return false;

    var target = 'https://tim-clicker.web.app' + window.location.pathname + window.location.search + window.location.hash;
    setStatus((reason || 'Firebase API key policy blocks this host.') + ' Redirecting to ' + target + ' ...');
    window.location.replace(target);
    return true;
  }

  function getFirebaseReferrerStatusMessage() {
    if (firebaseReferrerBlocked) {
      return 'Firebase API key blocked for this host. ' + getHostSpecificReferrerGuidance();
    }
    if (firebaseReferrerUnknown) {
      return 'Firebase preflight verification unavailable. Auth-sensitive actions are blocked until API key access can be verified. ' + getHostSpecificReferrerGuidance();
    }
    return '';
  }

  function ensureFirebaseReady() {
    if (firebaseReady && auth && db) return Promise.resolve(true);

    return checkApiKeyReferrerAccess().then(function (referrerAccessState) {
      if (referrerAccessState !== 'allowed' || firebaseReferrerBlocked || firebaseReferrerUnknown) {
        if (firebaseReferrerBlocked) {
          maybeRedirectFirebaseAppHost('Firebase API key blocked on firebaseapp.com.');
        }
        firebaseReady = false;
        auth = null;
        db = null;
        return false;
      }

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
    { id: 'u45', name: 'Le Beter Click', baseCost: 1000000000000000000000, add: 0, bonusPerOwned: 0.2, icon: 'assets/upgrades/Le_Beter_Click.png' },
    { id: 'u46', name: 'golden ratio', baseCost: 2000000000000000000000, add: 0, bonusPerOwned: 0.61803398875, icon: 'assets/upgrades/Golden_Ratio.png' },
    { id: 'u47', name: 'Clone', baseCost: 5000000000000000000000, add: 0, mult: 2, maxOwned: 1, icon: 'assets/upgrades/Clone.png' }
  ];
  var UPGRADES = upgrades;
  var DEFAULT_SKIN_FILE = 'assets/skins/default.png';
  var CLONE_DVD_SKIN_FILE = 'assets/skins/default.png';


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
    'assets/skins/GlitchTim.png',
    'assets/skins/Gold.png',
    'assets/skins/G.O.A.T..jpg',
    'assets/skins/Hologram_Tim.png',
    'assets/skins/Inverted_Tim.png',
    'assets/skins/JOHAN.png',
    'assets/skins/Johnny_Tims.png',
    'assets/skins/Joker_Of_Tims.png',
    'assets/skins/Kartonnen_Doos.png',
    'assets/skins/KirbTim.png',
    'assets/skins/Kyoto.png',
    'assets/skins/Marble_Tim.png',
    'assets/skins/Mexicaanse_Tim.png',
    'assets/skins/Mr._Timmah.png',
    'assets/skins/Neutronen_Tim.png',
    'assets/skins/Nyan_Tim.png',
    'assets/skins/PixelTim.png',
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
    var retried = false;

    function finalize() {
      if (completed) return;

      if (!retried && entries.length <= 1 && validatedSkinCandidates.length > 1) {
        retried = true;
        remaining = validatedSkinCandidates.length;
        for (var i = 0; i < validatedSkinCandidates.length; i++) {
          resolveCandidate(validatedSkinCandidates[i], i, true);
        }
        setTimeout(finalize, 1800);
        return;
      }

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

    function resolveCandidate(candidate, idx, forceRefresh) {
      var displayName = skinNameFromFile(candidate);
      var source = forceRefresh ? (candidate + (candidate.indexOf('?') > -1 ? '&' : '?') + 'r=' + Date.now() + '_' + idx) : candidate;
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
      img.src = source;
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
    davdd: { name: 'DAVDD', cost: 3500, file: 'DAVDD.png' }
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

  var BATTLE_PASS_SKIN_FILES = {};
  for (var battlePassRewardIndex = 0; battlePassRewardIndex < BATTLE_PASS.rewards.length; battlePassRewardIndex++) {
    var battlePassReward = BATTLE_PASS.rewards[battlePassRewardIndex];
    if (battlePassReward && battlePassReward.type === 'skin' && battlePassReward.skinFile) {
      BATTLE_PASS_SKIN_FILES[battlePassReward.skinFile] = true;
    }
  }

  var defaultState = {
    name: '',
    tims: 0,
    rebirths: 0,
    highestMulti: 1,
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
    questResetKey: '',
    updatedAt: 0,
    updatedBySession: ''
  };

  var state = clone(defaultState);
  var musicPlayer = null;
  var sessionId = 'sess_' + Math.random().toString(36).slice(2) + '_' + Date.now().toString(36);
  var dirtyDomains = {};
  var pendingCounterDeltas = {};

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
    if (typeof state.updatedAt !== 'number') state.updatedAt = 0;
    if (typeof state.updatedBySession !== 'string') state.updatedBySession = '';
    if (typeof state.highestMulti !== 'number' || !isFinite(state.highestMulti)) state.highestMulti = 1;
    if (state.highestMulti < 1) state.highestMulti = 1;

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
    markDirty('questResetKey');
    state.questProgress = { clicks: 0, upgradesBought: 0, minigamesPlayed: 0 };
    markDirty('questProgress');
    state.battlePassClaimed = state.battlePassClaimed.filter(function (entry) {
      return entry.indexOf('quest_') !== 0;
    });
    markDirty('battlePassClaimed');
    return true;
  }

  function isBattlePassSkin(skin) {
    if (!skin) return false;
    if (typeof skin.id === 'string' && skin.id.indexOf('bp_skin_') === 0) return true;
    return !!BATTLE_PASS_SKIN_FILES[skin.file];
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
      var skin = SKINS[i];
      if (!skin) continue;
      if (skin.id === state.activeSkin) return skin;
    }

    for (var j = 0; j < SKINS.length; j++) {
      if (SKINS[j]) return SKINS[j];
    }

    return fallbackSkin;
  }

  function effectiveSkinFile(skin) {
    var file = skin && skin.file ? String(skin.file) : '';
    if (!file) return DEFAULT_SKIN_FILE;
    if ((state.upgrades.u47 || 0) > 0 && file === DEFAULT_SKIN_FILE) {
      return CLONE_DVD_SKIN_FILE;
    }
    return file;
  }

  var cloneDvdAnimator = null;
  var cloneDvdNode = null;
  var cloneDvdConfettiNodes = [];
  var cloneDvdAudioCtx = null;

  function triggerScreenBarrelRoll() {
    var body = document.body;
    if (!body) return;
    body.classList.remove('screen-barrel-roll');
    void body.offsetWidth;
    body.classList.add('screen-barrel-roll');
    setTimeout(function () {
      body.classList.remove('screen-barrel-roll');
    }, 950);
  }

  function stopCloneDvdBounce() {
    if (cloneDvdAnimator && cloneDvdAnimator.rafId) cancelAnimationFrame(cloneDvdAnimator.rafId);
    cloneDvdAnimator = null;
    for (var i = 0; i < cloneDvdConfettiNodes.length; i++) {
      var confetti = cloneDvdConfettiNodes[i];
      if (confetti && confetti.parentNode) confetti.parentNode.removeChild(confetti);
    }
    cloneDvdConfettiNodes = [];
    if (cloneDvdNode && cloneDvdNode.parentNode) cloneDvdNode.parentNode.removeChild(cloneDvdNode);
    cloneDvdNode = null;
  }

  function recolorCloneDvd() {
    if (!cloneDvdNode) return;
    var hue = Math.floor(Math.random() * 360);
    cloneDvdNode.style.filter = 'hue-rotate(' + hue + 'deg) saturate(1.45) brightness(1.08) drop-shadow(0 6px 10px rgba(0, 0, 0, 0.45))';
  }

  function spawnCornerConfetti(x, y) {
    var amount = 24;
    for (var i = 0; i < amount; i++) {
      var piece = document.createElement('span');
      piece.className = 'dvd-confetti';
      piece.style.left = Math.round(x) + 'px';
      piece.style.top = Math.round(y) + 'px';
      piece.style.backgroundColor = 'hsl(' + Math.floor(Math.random() * 360) + 'deg 95% 58%)';
      piece.style.setProperty('--dx', ((Math.random() - 0.5) * 150).toFixed(2) + 'px');
      piece.style.setProperty('--dy', ((Math.random() * -170) - 30).toFixed(2) + 'px');
      piece.style.setProperty('--rot', Math.floor(Math.random() * 720 - 360) + 'deg');
      piece.style.animationDelay = (Math.random() * 0.05).toFixed(3) + 's';
      document.body.appendChild(piece);
      cloneDvdConfettiNodes.push(piece);
      (function (node) {
        setTimeout(function () {
          var idx = cloneDvdConfettiNodes.indexOf(node);
          if (idx >= 0) cloneDvdConfettiNodes.splice(idx, 1);
          if (node.parentNode) node.parentNode.removeChild(node);
        }, 950);
      })(piece);
    }
  }

  function playCloneCornerSound() {
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!userGestureCaptured) return;
    if (!cloneDvdAudioCtx) cloneDvdAudioCtx = new AudioCtx();
    if (cloneDvdAudioCtx.state === 'suspended') {
      cloneDvdAudioCtx.resume().catch(function () {});
      if (cloneDvdAudioCtx.state === 'suspended') return;
    }

    var ctx = cloneDvdAudioCtx;
    var start = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(660, start);
    osc.frequency.exponentialRampToValueAtTime(980, start + 0.08);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.075, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.17);
    osc.onended = function () {
      osc.disconnect();
      gain.disconnect();
    };
  }

  function startCloneDvdBounce() {
    if (cloneDvdAnimator && cloneDvdNode) return;

    cloneDvdNode = document.createElement('img');
    cloneDvdNode.id = 'cloneDvdLogo';
    cloneDvdNode.src = CLONE_DVD_SKIN_FILE;
    cloneDvdNode.alt = 'Tim Video';
    cloneDvdNode.draggable = false;
    document.body.appendChild(cloneDvdNode);
    recolorCloneDvd();

    var w = 110;
    var h = 110;
    var x = Math.max(8, Math.floor((window.innerWidth - w) / 2));
    var y = Math.max(8, Math.floor((window.innerHeight - h) / 2));
    var vx = 2.4;
    var vy = 1.9;

    cloneDvdAnimator = { rafId: 0 };

    function tick() {
      var maxX = Math.max(8, window.innerWidth - w - 8);
      var maxY = Math.max(8, window.innerHeight - h - 8);

      x += vx;
      y += vy;

      var sideHit = false;
      var horizontalHit = false;
      var verticalHit = false;

      if (x <= 8 || x >= maxX) {
        vx *= -1;
        x = Math.min(Math.max(x, 8), maxX);
        sideHit = true;
        horizontalHit = true;
      }
      if (y <= 8 || y >= maxY) {
        vy *= -1;
        y = Math.min(Math.max(y, 8), maxY);
        sideHit = true;
        verticalHit = true;
      }

      if (sideHit) {
        recolorCloneDvd();
        var bounceCount = 0;
        if (horizontalHit) bounceCount += 1;
        if (verticalHit) bounceCount += 1;
        if (bounceCount <= 0) bounceCount = 1;
        for (var i = 0; i < bounceCount; i += 1) {
          playCloneCornerSound();
        }
      }
      if (horizontalHit && verticalHit) {
        spawnCornerConfetti(x + w / 2, y + h / 2);
      }

      if (cloneDvdNode) cloneDvdNode.style.transform = 'translate(' + Math.round(x) + 'px, ' + Math.round(y) + 'px)';
      if (cloneDvdAnimator) cloneDvdAnimator.rafId = requestAnimationFrame(tick);
    }

    cloneDvdAnimator.rafId = requestAnimationFrame(tick);
  }

  function syncCloneDvdEffect() {
    var cloneOwned = (state.upgrades.u47 || 0) > 0;
    if (cloneOwned) startCloneDvdBounce();
    else stopCloneDvdBounce();
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
      if (up.bonusPerOwned) multiplier += up.bonusPerOwned * owned;
    }
    var skin = currentSkin();
    var skinMultiplier = skin && typeof skin.mult === 'number' ? skin.mult : 1;
    multiplier *= skinMultiplier;
    multiplier *= (1 + state.rebirths * 0.25);
    return multiplier;
  }

  function rebirthCost() {
    return 1000000 * Math.pow(3, state.rebirths);
  }

  function shortNumber(value) {
    if (!isFinite(value)) return '0';
    var sign = value < 0 ? '-' : '';
    var abs = Math.abs(value);
    if (abs < 1000) return sign + Math.floor(abs);
    var units = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];
    var unitIndex = Math.floor(Math.log(abs) / Math.log(1000)) - 1;
    var safeIndex = Math.max(0, Math.min(unitIndex, units.length - 1));
    var scaled = abs / Math.pow(1000, safeIndex + 1);
    var decimals = scaled >= 100 ? 0 : (scaled >= 10 ? 1 : 2);
    return sign + scaled.toFixed(decimals) + units[safeIndex];
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
      addTims(reward.amount, false);
      return;
    }
    if (reward.type === 'rebirth') {
      state.rebirths += reward.amount;
      markDirty('rebirths');
      return;
    }
    if (reward.type === 'coin') {
      var coinIds = Object.keys(COINS);
      for (var i = 0; i < reward.amount; i++) {
        var randomCoin = coinIds[Math.floor(Math.random() * coinIds.length)];
        state.coinWallet[randomCoin] += 1;
        markDirty('coinWallet');
      }
      return;
    }
    if (reward.type === 'skin') {
      var skinId = ensureBattlePassSkin(reward);
      if (skinId && state.skinsOwned.indexOf(skinId) < 0) {
        state.skinsOwned.push(skinId);
        markDirty('skinsOwned');
      }
    }
  }

  function addQuestProgress(metric, amount) {
    resetDailyQuestsIfNeeded();
    if (!state.questProgress[metric]) state.questProgress[metric] = 0;
    state.questProgress[metric] += amount;
    queueCounterDelta('questProgress/' + metric, amount);
    var grantedXp = 0;
    for (var i = 0; i < BATTLE_PASS.quests.length; i++) {
      var quest = BATTLE_PASS.quests[i];
      var claimedKey = 'quest_' + quest.id;
      if (quest.metric !== metric) continue;
      if (state.questProgress[metric] >= quest.goal && state.battlePassClaimed.indexOf(claimedKey) < 0) {
        state.battlePassClaimed.push(claimedKey);
        markDirty('battlePassClaimed');
        grantedXp += quest.xp;
      }
    }
    if (grantedXp > 0) {
      state.battlePassXp = Math.min(BATTLE_PASS.maxLevel * BATTLE_PASS.xpPerLevel, state.battlePassXp + grantedXp);
      queueCounterDelta('battlePassXp', grantedXp);
    }
  }


  var lastStatus = '';
  var lastRemoteSaveAt = 0;
  var userRef = null;
  var userRefListener = null;
  var saveInFlight = false;

  function touchMetadata() {
    state.updatedAt = Date.now();
    state.updatedBySession = sessionId;
  }

  function markDirty(domain) {
    dirtyDomains[domain] = true;
    touchMetadata();
  }

  function queueCounterDelta(path, delta) {
    if (!delta) return;
    pendingCounterDeltas[path] = (pendingCounterDeltas[path] || 0) + delta;
    touchMetadata();
  }

  function pendingDelta(path) {
    return pendingCounterDeltas[path] || 0;
  }

  function hasPendingChanges() {
    return Object.keys(dirtyDomains).length > 0 || Object.keys(pendingCounterDeltas).length > 0;
  }

  function setTims(value) {
    state.tims = value;
    markDirty('tims');
  }

  function addTims(delta, conflictSafe) {
    if (!delta) return;
    state.tims += delta;
    if (conflictSafe) queueCounterDelta('tims', delta);
    else markDirty('tims');
  }

  function setPresencePopupVisible(show) {
    var popup = el('presencePopup');
    if (!popup) return;
    if (show) popup.classList.remove('hidden');
    else popup.classList.add('hidden');
  }


  function setPresenceStatus(text) {
    if (text === lastPresenceStatus) return;
    lastPresenceStatus = text;
    var statusEl = el('presenceStatus');
    if (statusEl) statusEl.textContent = text;
  }

  function updatePresenceHeartbeat() {
    if (!presenceRef || presenceTrackingFailed) return;
    if (!isWriteAuthorizedForUid(uid)) {
      stopPresenceTracking();
      return;
    }
    if (document.visibilityState === 'hidden') return;
    presenceRef.update({
      active: true,
      lastSeenAt: Date.now()
    }).catch(function () {
      presenceTrackingFailed = true;
      stopPresenceTracking();
    });
  }

  function stopPresenceTracking() {
    if (presenceHeartbeatTimer) {
      clearInterval(presenceHeartbeatTimer);
      presenceHeartbeatTimer = null;
    }

    if (presenceVisibleHandlerBound) {
      document.removeEventListener('visibilitychange', updatePresenceHeartbeat);
      presenceVisibleHandlerBound = false;
    }

    if (presenceUserRef && presenceListener) {
      presenceUserRef.off('value', presenceListener);
    }

    if (presenceRef) {
      presenceRef.onDisconnect().cancel().catch(function () {});
      presenceRef.remove().catch(function () {});
    }

    presenceRef = null;
    presenceUserRef = null;
    presenceListener = null;
    presenceTrackingFailed = false;
    setPresencePopupVisible(false);
  }

  function startPresenceTracking(currentUid) {
    if (!firebaseReady || !db || !currentUid) return;
    if (!isWriteAuthorizedForUid(currentUid)) return;
    if (presenceDisabledByPolicy) return;
    stopPresenceTracking();
    setPresenceStatus('');

    var sid = ensureSessionId();
    presenceRef = db.ref('presence/' + currentUid + '/' + sid);
    presenceUserRef = db.ref('presence/' + currentUid);

    var now = Date.now();
    var payload = {
      sessionId: sid,
      startedAt: now,
      lastSeenAt: now,
      active: true,
      userAgent: navigator.userAgent || ''
    };

    presenceRef.set(payload)
      .then(function () {
        return presenceRef.onDisconnect().remove();
      })
      .then(function () {
        presenceListener = function (snap) {
          var othersActive = 0;
          if (snap && snap.exists()) {
            snap.forEach(function (child) {
              if (child.key === sid) return false;
              var val = child.val() || {};
              if (val.active) othersActive += 1;
              return false;
            });
          }
          setPresencePopupVisible(othersActive > 0);
        };
        presenceUserRef.on('value', presenceListener, function () {});

        presenceHeartbeatTimer = setInterval(updatePresenceHeartbeat, 5000);
        if (!presenceVisibleHandlerBound) {
          document.addEventListener('visibilitychange', updatePresenceHeartbeat);
          presenceVisibleHandlerBound = true;
        }
      })
      .catch(function (err) {
        if (isPermissionDeniedError(err)) {
          setPresencePopupVisible(false);
          setPresenceStatus('Presence disabled: Realtime Database rules deny access to presence/' + currentUid + '.');
          presenceDisabledByPolicy = true;
          presenceRef = null;
          presenceUserRef = null;
          presenceListener = null;
          return;
        }
        presenceTrackingFailed = true;
        stopPresenceTracking();
      });
  }

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

  function saveLocalSnapshot() {
    if (!saveAllowed) return;
    try {
      localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(state));
    } catch (err) {}
  }

  function readLocalSnapshot() {
    try {
      var raw = localStorage.getItem(LOCAL_SAVE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed;
    } catch (err) {
      return null;
    }
  }

  function stopRealtimeSync() {
    if (!userRef || !userRefListener) return;
    userRef.off('value', userRefListener);
    userRef = null;
    userRefListener = null;
  }

  function stopLeaderboardSync() {
    if (!leaderboardRef || !leaderboardListener) return;
    leaderboardRef.off('value', leaderboardListener);
    leaderboardRef = null;
    leaderboardListener = null;
    leaderboardEntries = [];
  }

  function leaderboardValueFor(entry, board) {
    if (!entry) return 0;
    if (board === 'rebirths') return Number(entry.rebirths || 0);
    if (board === 'highestMulti') return Number(entry.highestMulti || 0);
    return Number(entry.tims || 0);
  }

  function leaderboardValueLabel(value, board) {
    if (board === 'highestMulti') return 'x' + Number(value || 0).toFixed(2);
    return shortNumber(Number(value || 0));
  }

  function renderLeaderboard() {
    var listEl = el('leaderboardList');
    var statusEl = el('leaderboardStatus');
    if (!listEl || !statusEl) return;

    var entries = leaderboardEntries.slice();
    entries.sort(function (a, b) {
      return leaderboardValueFor(b, activeLeaderboardBoard) - leaderboardValueFor(a, activeLeaderboardBoard);
    });

    listEl.innerHTML = '';
    if (!entries.length) {
      statusEl.textContent = 'No players on the board yet.';
      return;
    }

    statusEl.textContent = 'Showing top players by ' + (activeLeaderboardBoard === 'highestMulti' ? 'highest multiplier' : activeLeaderboardBoard) + '.';
    for (var i = 0; i < Math.min(entries.length, 25); i++) {
      var entry = entries[i] || {};
      var value = leaderboardValueFor(entry, activeLeaderboardBoard);
      var item = document.createElement('li');
      item.innerHTML = '<span class="leaderboard-rank">#' + (i + 1) + '</span>' +
        '<span class="leaderboard-player">' + (entry.name || 'Anonymous Tim') + '</span>' +
        '<span class="leaderboard-value">' + leaderboardValueLabel(value, activeLeaderboardBoard) + '</span>';
      listEl.appendChild(item);
    }
  }

  function startLeaderboardSync() {
    if (!firebaseReady || !db) return;
    stopLeaderboardSync();
    leaderboardRef = db.ref('leaderboard');
    leaderboardListener = function (snap) {
      var next = [];
      if (snap && snap.exists()) {
        snap.forEach(function (child) {
          var value = child.val() || {};
          next.push({
            uid: child.key,
            name: value.name || 'Anonymous Tim',
            tims: Number(value.tims || 0),
            rebirths: Number(value.rebirths || 0),
            highestMulti: Number(value.highestMulti || 1),
            updatedAt: Number(value.updatedAt || 0)
          });
          return false;
        });
      }
      leaderboardEntries = next;
      renderLeaderboard();
    };
    leaderboardRef.on('value', leaderboardListener, function (err) {
      var statusEl = el('leaderboardStatus');
      if (isPermissionDeniedError(err)) {
        leaderboardWritesBlockedByPolicy = true;
        if (statusEl) statusEl.textContent = 'Leaderboard unavailable: Realtime Database rules deny access.';
        stopLeaderboardSync();
        return;
      }
      if (statusEl) statusEl.textContent = 'Leaderboard unavailable right now.';
    });
  }

  function pushLeaderboardEntry() {
    if (!firebaseReady || !db || !uid) return;
    if (!isWriteAuthorizedForUid(uid)) return;
    if (leaderboardWritesBlockedByPolicy) return;
    if (leaderboardWriteInFlight) return;
    var playerName = typeof state.name === 'string' ? state.name.trim() : '';
    if (playerName.length > 40) playerName = playerName.slice(0, 40);
    var payload = {
      name: playerName || 'Anonymous Tim',
      tims: safeFiniteNumber(state.tims, 0),
      rebirths: safeFiniteNumber(state.rebirths, 0),
      highestMulti: safeFiniteNumber(state.highestMulti, 1),
      updatedAt: Date.now()
    };
    leaderboardWriteInFlight = true;
    db.ref('leaderboard/' + uid).update(payload)
      .catch(function (err) {
        if (!isPermissionDeniedError(err)) return;
        leaderboardWritesBlockedByPolicy = true;
        var statusEl = el('leaderboardStatus');
        if (statusEl) statusEl.textContent = 'Leaderboard write disabled: Realtime Database rules deny access.';
      })
      .finally(function () {
        leaderboardWriteInFlight = false;
      });
  }

  function animateTimClick() {
    var timImage = el('timImage');
    if (!timImage) return;
    timImage.classList.remove('tim-click-anim');
    void timImage.offsetWidth;
    timImage.classList.add('tim-click-anim');
  }

  function startRealtimeSync() {
    if (!firebaseReady || !db || !uid) return;
    stopRealtimeSync();
    userRef = db.ref('users/' + uid);
    userRefListener = function (snap) {
      if (!snap || !snap.exists()) return;
      var remoteState = Object.assign(clone(defaultState), snap.val());
      if (!hasPendingChanges()) {
        state = remoteState;
      } else {
        var merged = clone(remoteState);
        if (dirtyDomains.tims) merged.tims = state.tims;
        else merged.tims = (remoteState.tims || 0) + pendingDelta('tims');
        if (dirtyDomains.upgrades) merged.upgrades = clone(state.upgrades);
        if (dirtyDomains.rebirths) merged.rebirths = state.rebirths;
        if (dirtyDomains.battlePassXp) merged.battlePassXp = state.battlePassXp;
        else merged.battlePassXp = (remoteState.battlePassXp || 0) + pendingDelta('battlePassXp');
        merged.questProgress = dirtyDomains.questProgress ? clone(state.questProgress) : Object.assign({}, remoteState.questProgress || {});
        var qMetrics = ['clicks', 'upgradesBought', 'minigamesPlayed'];
        for (var i = 0; i < qMetrics.length; i++) {
          var metric = qMetrics[i];
          var path = 'questProgress/' + metric;
          if (!dirtyDomains.questProgress) merged.questProgress[metric] = (remoteState.questProgress && remoteState.questProgress[metric] || 0) + pendingDelta(path);
        }
        if (dirtyDomains.name) merged.name = state.name;
        if (dirtyDomains.musicOwned) merged.musicOwned = clone(state.musicOwned);
        if (dirtyDomains.bgOwned) merged.bgOwned = clone(state.bgOwned);
        if (dirtyDomains.activeBg) merged.activeBg = state.activeBg;
        if (dirtyDomains.activeCoin) merged.activeCoin = state.activeCoin;
        if (dirtyDomains.coinWallet) merged.coinWallet = clone(state.coinWallet);
        if (dirtyDomains.coinPrice) merged.coinPrice = clone(state.coinPrice);
        if (dirtyDomains.questResetKey) merged.questResetKey = state.questResetKey;
        if (dirtyDomains.battlePassClaimed) merged.battlePassClaimed = clone(state.battlePassClaimed);
        if (dirtyDomains.skinsOwned) merged.skinsOwned = clone(state.skinsOwned);
        if (dirtyDomains.activeSkin) merged.activeSkin = state.activeSkin;
        state = merged;
      }
      normalizeState();
      saveLocalSnapshot();
      try {
        applyActiveSkin();
      } catch (err) {}
      renderAll();
    };
    userRef.on('value', userRefListener, function () {
      setStatus('Firebase live sync unavailable.');
    });
  }

  function saveRemote(force) {
    if (!saveAllowed) return;
    if (!firebaseReady || !uid || !db) return;
    if (!isWriteAuthorizedForUid(uid)) return;
    var activeUid = uid;
    var now = Date.now();
    if (now - lastRemoteSaveAt < 5000) return;
    if (saveInFlight) return;
    if (!hasPendingChanges() && !force) return;
    lastRemoteSaveAt = now;
    saveInFlight = true;

    var counterEntries = Object.keys(pendingCounterDeltas);
    var domainEntries = Object.keys(dirtyDomains);
    var chain = Promise.resolve();

    var supportsServerIncrement = !!(
      firebase &&
      firebase.database &&
      firebase.database.ServerValue &&
      typeof firebase.database.ServerValue.increment === 'function'
    );

    for (var i = 0; i < counterEntries.length; i++) {
      (function (path, delta) {
        chain = chain.then(function () {
          var counterRef = db.ref('users/' + activeUid + '/' + path);
          if (supportsServerIncrement) {
            return counterRef.set(firebase.database.ServerValue.increment(delta));
          }
          return counterRef.transaction(function (current) {
            var base = typeof current === 'number' ? current : 0;
            return base + delta;
          });
        });
      })(counterEntries[i], pendingCounterDeltas[counterEntries[i]]);
    }

    chain = chain.then(function () {
      if (domainEntries.length === 0 && !force) return;
      var payload = {
        updatedAt: Date.now(),
        updatedBySession: sessionId
      };
      for (var j = 0; j < domainEntries.length; j++) {
        var domain = domainEntries[j];
        payload[domain] = clone(state[domain]);
      }
      return db.ref('users/' + activeUid).update(payload);
    }).then(function () {
      pendingCounterDeltas = {};
      dirtyDomains = {};
      pushLeaderboardEntry();
    }).catch(function () {
      setStatus('Firebase write failed.');
    }).finally(function () {
      saveInFlight = false;
    });
  }

  function saveNow(forceRemote) {
    saveLocalSnapshot();
    saveRemote(!!forceRemote);
  }

  function setStatus(text) {
    if (text === lastStatus) return;
    lastStatus = text;
    var statusTargets = ['firebaseStatus', 'authStatus', 'resetStatus'];
    for (var i = 0; i < statusTargets.length; i += 1) {
      var statusEl = el(statusTargets[i]);
      if (statusEl) statusEl.textContent = text;
    }
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
    try {
      var skinFile = typeof effectiveSkinFile === 'function'
        ? effectiveSkinFile(skin)
        : (skin && skin.file ? skin.file : DEFAULT_SKIN_FILE);
      if (timImage.getAttribute('src') !== skinFile) {
        timImage.src = skinFile;
      }
    } catch (err) {
      if (timImage.getAttribute('src') !== DEFAULT_SKIN_FILE) timImage.src = DEFAULT_SKIN_FILE;
    }
  }

  function toggleNamePopup(show) {
    var popup = el('namePopup');
    if (!popup) return;
    popup.classList.toggle('hidden', !show);
    if (!show) return;
    var input = el('popupNameInput');
    if (!input) return;
    input.value = state.name || '';
    setTimeout(function () { input.focus(); }, 10);
  }

  function ensureNamedSession() {
    if (state.name) {
      el('authPanel').classList.add('hidden');
      el('gamePanel').classList.remove('hidden');
      toggleNamePopup(false);
      applyActiveSkin();
      renderAll();
      return;
    }
    el('gamePanel').classList.add('hidden');
    toggleNamePopup(true);
  }

  // ---------- Render ----------
  function updateStats() {
    var coinId = state.activeCoin;
    var needed = rebirthCost();
    var liveMulti = totalMultiplier();
    if (liveMulti > (state.highestMulti || 1)) {
      state.highestMulti = liveMulti;
      markDirty('highestMulti');
    }
    el('playerName').textContent = state.name;
    el('tims').textContent = shortNumber(state.tims);
    el('cps').textContent = shortNumber(cps());
    el('multi').textContent = 'x' + liveMulti.toFixed(2);
    el('rebirths').textContent = state.rebirths;
    el('rebirthBtn').textContent = 'Rebirth (' + shortNumber(needed) + ')';
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
          '<span>' + up.name + ' (' + owned + ')' + (soldOut ? ' - SOLD OUT' : ' - ' + shortNumber(price)) + '</span>';
        btn.disabled = soldOut;
        btn.onclick = function () {
          if (soldOut) return;
          if (state.tims < price) return;
          addTims(-price, false);
          state.upgrades[up.id] = owned + 1;
          markDirty('upgrades');
          addQuestProgress('upgradesBought', 1);
          if (up.id === 'u7') triggerScreenBarrelRoll();
          if (up.id === 'u47') syncCloneDvdEffect();
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
        var skinFile = effectiveSkinFile(skin);
        btn.innerHTML = '<img src="' + skinFile + '" alt="" onerror="this.style.display=\'none\'">' +
          '<span>' + skin.name + (owned ? ' (owned)' : battlePassOnly ? ' (battle pass reward)' : ' - ' + skin.cost) + '</span>';
        btn.disabled = battlePassOnly;
        btn.onclick = function () {
          if (battlePassOnly) return;
          if (!owned) {
            if (state.tims < skin.cost) return;
            addTims(-skin.cost, false);
            state.skinsOwned.push(skin.id);
            markDirty('skinsOwned');
          }
          state.activeSkin = skin.id;
          markDirty('activeSkin');
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
            addTims(-m.cost, false);
            state.musicOwned.push(musicId);
            markDirty('musicOwned');
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
            addTims(-bg.cost, false);
            state.bgOwned.push(bgId);
            markDirty('bgOwned');
          }
          state.activeBg = bgId;
          markDirty('activeBg');
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
          addTims(-game.cost, false);
          var win = Math.random() < game.winChance;
          if (win) addTims(game.reward, false);
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
          markDirty('battlePassClaimed');
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
        markDirty('activeCoin');
        saveNow();
        renderAll();
      };
    }
    select.value = state.activeCoin;

    el('buyCoinBtn').onclick = function () {
      var coin = state.activeCoin;
      var price = state.coinPrice[coin];
      if (state.tims < price) return;
      addTims(-price, false);
      state.coinWallet[coin] += 1;
      markDirty('coinWallet');
      saveNow(true);
      renderAll();
    };

    el('sellCoinBtn').onclick = function () {
      var coin = state.activeCoin;
      if (state.coinWallet[coin] < 1) return;
      state.coinWallet[coin] -= 1;
      addTims(state.coinPrice[coin], false);
      markDirty('coinWallet');
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
    renderLeaderboard();
    syncCloneDvdEffect();
  }

  // ---------- Events ----------
  function setLeaderboardBoard(board) {
    activeLeaderboardBoard = board;
    var tabs = ['tims', 'rebirths', 'highestMulti'];
    for (var i = 0; i < tabs.length; i++) {
      var tab = el('leaderboardTab' + (tabs[i] === 'tims' ? 'Tims' : tabs[i] === 'rebirths' ? 'Rebirths' : 'HighestMulti'));
      if (!tab) continue;
      tab.classList.toggle('active', tabs[i] === board);
    }
    renderLeaderboard();
  }

  el('leaderboardTabTims').onclick = function () { setLeaderboardBoard('tims'); };
  el('leaderboardTabRebirths').onclick = function () { setLeaderboardBoard('rebirths'); };
  el('leaderboardTabHighestMulti').onclick = function () { setLeaderboardBoard('highestMulti'); };

  el('timImage').onerror = function () {
    if (this.dataset.fallbackApplied) return;
    this.dataset.fallbackApplied = '1';
    this.src = DEFAULT_SKIN_FILE;
  };
  el('timImage').onclick = function () {
    var clickBonus = 1 + state.rebirths * 0.25;
    var beterOwned = state.upgrades.u45 || 0;
    if (beterOwned > 0) clickBonus += cps() * 0.2 * beterOwned;
    animateTimClick();
    addTims(clickBonus, true);
    addQuestProgress('clicks', 1);
    saveNow();
    renderAll();
  };

  el('rebirthBtn').onclick = function () {
    var needed = rebirthCost();
    if (state.tims < needed) return;
    setTims(0);
    state.upgrades = {};
    markDirty('upgrades');
    state.rebirths += 1;
    markDirty('rebirths');
    saveNow(true);
    renderAll();
  };

  // ---------- Loop ----------
  setInterval(function () {
    if (resetDailyQuestsIfNeeded()) {
      saveNow(true);
      renderAll();
      return;
    }
    addTims(cps() / 10, true);
    for (var id in COINS) {
      var swing = (Math.random() - 0.5) * COINS[id].vol;
      state.coinPrice[id] = Math.max(15, state.coinPrice[id] + swing);
      markDirty('coinPrice');
    }
    saveNow(false);
    updateStats();
  }, 100);

  // ---------- Boot ----------
  function syncForUser(user) {
    if (!user) return Promise.resolve();
    uid = user.uid;
    window.timClickerUid = uid;
    startPresenceTracking(uid);
    setStatus('Firebase connected. UID: ' + uid);
    return db.ref('users/' + uid).once('value').then(function (snap) {
      var remoteState = snap && snap.exists() ? Object.assign(clone(defaultState), snap.val()) : null;
      var localState = readLocalSnapshot();
      var localUpdatedAt = localState && typeof localState.updatedAt === 'number' ? localState.updatedAt : 0;
      var remoteUpdatedAt = remoteState && typeof remoteState.updatedAt === 'number' ? remoteState.updatedAt : 0;

      if (localState && localUpdatedAt > remoteUpdatedAt) {
        state = Object.assign(clone(defaultState), localState);
        normalizeState();
        saveNow(true);
      } else if (remoteState) {
        state = remoteState;
      }

      normalizeState();
      saveLocalSnapshot();
      startRealtimeSync();
      startLeaderboardSync();
      pushLeaderboardEntry();
      applyBackground();
      applyActiveSkin();
      renderAll();
      openGameIfNamed();
    });
  }

  function openGameIfNamed() {
    ensureNamedSession();
  }

  function updateAuthUi(user) {
    var authStatus = el('authStatus');
    var logoutBtn = el('logoutBtn');
    if (user) {
      authStatus.textContent = 'Logged in as ' + (user.displayName || user.email || 'Guest');
      logoutBtn.classList.remove('hidden');
      el('renameInput').value = state.name || '';
    } else {
      authStatus.textContent = 'Not logged in. Use email/password or continue as guest.';
      logoutBtn.classList.add('hidden');
      toggleNamePopup(false);
      el('gamePanel').classList.add('hidden');
      el('authPanel').classList.remove('hidden');
    }
  }

  function bindAuthButtons() {
    function buildPasswordResetSettings() {
      var isHttpOrigin = window.location.protocol === 'http:' || window.location.protocol === 'https:';
      if (!isHttpOrigin) {
        return null;
      }

      var cleanUrl = window.location.origin + window.location.pathname;
      return {
        url: cleanUrl,
        handleCodeInApp: true
      };
    }

    function clearAuthQueryFromUrl() {
      if (!window.history || !window.history.replaceState) return;
      var cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    function readAuthActionParams() {
      var params = new URLSearchParams(window.location.search || '');
      var mode = params.get('mode');
      var oobCode = params.get('oobCode');
      if (!mode || !oobCode) return null;
      return {
        mode: mode,
        oobCode: oobCode
      };
    }

    function setConfirmResetStatus(message) {
      var statusEl = el('confirmResetStatus');
      if (!statusEl) return;
      statusEl.textContent = message || '';
    }

    function toggleConfirmResetPopup(show) {
      var popup = el('confirmResetPopup');
      if (!popup) return;
      popup.classList.toggle('hidden', !show);
      if (!show) return;
      var passwordInput = el('newPasswordInput');
      passwordInput.value = '';
      setConfirmResetStatus('');
      passwordInput.focus();
    }

    function handlePasswordResetAction(oobCode) {
      if (!auth || typeof auth.verifyPasswordResetCode !== 'function' || typeof auth.confirmPasswordReset !== 'function') {
        setStatus('Password reset link opened, but Firebase Auth is not ready on this page.');
        return;
      }

      auth.verifyPasswordResetCode(oobCode).then(function (email) {
        toggleConfirmResetPopup(true);
        setStatus('Reset link verified for ' + email + '. Choose a new password.');
      }).catch(function (err) {
        showEmailAuthError(err, 'reset');
        clearAuthQueryFromUrl();
      });

      el('confirmResetBtn').onclick = function () {
        var newPassword = el('newPasswordInput').value || '';
        if (newPassword.length < 6) {
          setConfirmResetStatus('Password must be at least 6 characters.');
          return;
        }

        auth.confirmPasswordReset(oobCode, newPassword).then(function () {
          toggleConfirmResetPopup(false);
          clearAuthQueryFromUrl();
          setStatus('Password updated. You can now log in with your new password.');
        }).catch(function (err) {
          showEmailAuthError(err, 'reset');
        });
      };

      el('newPasswordInput').onkeydown = function (ev) {
        if (ev.key !== 'Enter') return;
        ev.preventDefault();
        el('confirmResetBtn').click();
      };
    }

    function processAuthActionFromUrl() {
      var action = readAuthActionParams();
      if (!action) return;

      if (action.mode === 'resetPassword') {
        handlePasswordResetAction(action.oobCode);
        return;
      }

      clearAuthQueryFromUrl();
    }

    function sendPasswordReset(email) {
      if (firebaseReferrerBlocked || firebaseReferrerUnknown) {
        return Promise.reject(Object.assign(new Error('API_KEY_HTTP_REFERRER_BLOCKED'), {
          code: firebaseReferrerUnknown ? 'auth/api-key-referrer-verification-unavailable' : 'auth/api-key-http-referrer-blocked'
        }));
      }

      return checkApiKeyReferrerAccess().then(function (referrerAccessState) {
        if (referrerAccessState !== 'allowed' || firebaseReferrerBlocked || firebaseReferrerUnknown) {
          throw Object.assign(new Error('API_KEY_HTTP_REFERRER_BLOCKED'), {
            code: firebaseReferrerUnknown ? 'auth/api-key-referrer-verification-unavailable' : 'auth/api-key-http-referrer-blocked'
          });
        }

        if (auth && typeof auth.sendPasswordResetEmail === 'function') {
          var actionSettings = buildPasswordResetSettings();
          var sendResetRequest = actionSettings ? auth.sendPasswordResetEmail(email, actionSettings) : auth.sendPasswordResetEmail(email);
          return sendResetRequest.catch(function (err) {
            var normalizedError = normalizeFirebaseAuthError(err);

            if (actionSettings && (normalizedError.code === 'auth/missing-continue-uri' || normalizedError.code === 'auth/invalid-continue-uri' || normalizedError.code === 'auth/unauthorized-continue-uri' || normalizedError.code === 'auth/unauthorized-domain' || normalizedError.code === 'auth/domain-not-whitelisted' || normalizedError.backendMessage === 'UNAUTHORIZED_DOMAIN')) {
              return auth.sendPasswordResetEmail(email);
            }

            if (isApiKeyReferrerBlockedError(err)) {
              firebaseReferrerBlocked = true;
              throw Object.assign(new Error('API_KEY_HTTP_REFERRER_BLOCKED'), {
                code: 'auth/api-key-http-referrer-blocked'
              });
            }
            if (normalizedError.code && normalizedError.code !== 'auth/internal-error') throw normalizedError;
            throw normalizedError;
          });
        }

        return Promise.reject(Object.assign(new Error('FIREBASE_AUTH_NOT_READY'), {
          code: 'auth/internal-error'
        }));
      });
    }

    function showApiKeyReferrerBlockedMessage(err) {
      var resetEmail = el('resetEmailInput') ? el('resetEmailInput').value.trim() : '';
      var fallback = getPasswordResetFallbackMessage(resetEmail);
      if (firebaseReferrerUnknown || (err && err.code === 'auth/api-key-referrer-verification-unavailable')) {
        setStatus(fallback || getFirebaseReferrerStatusMessage());
        maybeRedirectFirebaseAppHost('Firebase auth verification is unavailable on firebaseapp.com.');
        return true;
      }
      if (isApiKeyReferrerBlockedError(err)) {
        setStatus(fallback || getFirebaseReferrerStatusMessage());
        maybeRedirectFirebaseAppHost('Firebase API key blocked on firebaseapp.com.');
        return true;
      }
      return false;
    }

    function showEmailAuthError(err, mode) {
      var normalizedError = normalizeFirebaseAuthError(err);
      var code = normalizedError.code;
      var backendMessage = normalizedError.backendMessage;
      var action = mode === 'signup' ? 'Sign up' : 'Login';

      if (mode === 'reset') action = 'Password reset';

      if (showApiKeyReferrerBlockedMessage(err)) {
        return;
      }

      if (code === 'auth/operation-not-allowed') {
        setStatus(action + ' failed. Email/Password provider is disabled in Firebase Authentication > Sign-in method.');
        return;
      }

      if (code === 'auth/invalid-email') {
        setStatus(action + ' failed. Enter a valid email address.');
        return;
      }

      if (code === 'auth/missing-password' || code === 'auth/weak-password') {
        setStatus(action + ' failed. Password must be at least 6 characters.');
        return;
      }

      if (mode === 'reset') {
        if (code === 'auth/user-not-found') {
          setStatus('Password reset failed. No account found for this email.');
          return;
        }

        if (code === 'auth/missing-continue-uri' || code === 'auth/invalid-continue-uri') {
          setStatus('Password reset failed. Password reset link configuration is invalid. Check your Firebase Auth email action settings.');
          return;
        }

        if (code === 'auth/unauthorized-continue-uri' || code === 'auth/unauthorized-domain' || code === 'auth/domain-not-whitelisted') {
          setStatus('Password reset failed. This site domain is not authorized for password reset in Firebase Auth settings.');
          return;
        }

        if (code === 'auth/project-not-found' || code === 'auth/configuration-not-found') {
          setStatus('Password reset failed. Firebase Auth email action configuration is missing for this project.');
          return;
        }

        if (code === 'auth/invalid-api-key') {
          setStatus('Password reset failed. Firebase API key is invalid for this project configuration.');
          return;
        }

        if (backendMessage === 'UNAUTHORIZED_DOMAIN') {
          setStatus('Password reset failed. This site domain is not authorized for password reset in Firebase Auth settings.');
          return;
        }
      }

      if (code === 'auth/email-already-in-use') {
        setStatus('Sign up failed. This email is already registered. Use Login instead.');
        return;
      }

      if (code === 'auth/user-not-found') {
        setStatus('Login failed. No account found for this email. Use Sign Up first.');
        return;
      }

      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setStatus('Login failed. Incorrect email or password.');
        return;
      }

      if (code === 'auth/user-disabled') {
        setStatus(action + ' failed. This account has been disabled.');
        return;
      }

      if (code === 'auth/missing-email') {
        setStatus(action + ' failed. Enter your email address first.');
        return;
      }

      if (code === 'auth/too-many-requests') {
        setStatus(action + ' failed. Too many attempts. Please wait and try again.');
        return;
      }

      setStatus(action + ' failed.' + (code ? ' (Error: ' + code + ')' : ''));
    }

    function readEmailPasswordInput() {
      var email = el('emailLoginInput').value.trim();
      var password = el('passwordLoginInput').value;
      if (!email || !password) {
        setStatus('Enter both email and password.');
        return null;
      }
      try {
        localStorage.setItem(LAST_LOGIN_EMAIL_KEY, email);
      } catch (err) {}
      return { email: email, password: password };
    }

    function toggleResetPopup(show) {
      var popup = el('resetPopup');
      if (!popup) return;
      popup.classList.toggle('hidden', !show);
      if (!show) return;

      var loginEmail = el('emailLoginInput').value.trim();
      var resetEmail = el('resetEmailInput');
      resetEmail.value = loginEmail;
      resetEmail.focus();
    }

    function readResetEmailInput() {
      var email = el('resetEmailInput').value.trim();
      if (!email) {
        setStatus('Enter your email address in the reset pop-up.');
        return null;
      }
      return email;
    }

    var resetEmailParam = (function () {
      var params = new URLSearchParams(window.location.search || '');
      return params.get('resetEmail') || '';
    })();
    if (resetEmailParam) {
      el('emailLoginInput').value = resetEmailParam;
      el('resetEmailInput').value = resetEmailParam;
    }

    el('emailLoginBtn').onclick = function () {
      if (!auth) return;
      var credentials = readEmailPasswordInput();
      if (!credentials) return;
      auth.signInWithEmailAndPassword(credentials.email, credentials.password).catch(function (err) {
        showEmailAuthError(err, 'login');
      });
    };

    el('emailSignupBtn').onclick = function () {
      if (!auth) return;
      var credentials = readEmailPasswordInput();
      if (!credentials) return;
      auth.createUserWithEmailAndPassword(credentials.email, credentials.password).catch(function (err) {
        showEmailAuthError(err, 'signup');
      });
    };

    el('resetPasswordBtn').onclick = function () {
      toggleResetPopup(true);
    };

    el('closeResetPopupBtn').onclick = function () {
      toggleResetPopup(false);
    };

    el('sendResetEmailBtn').onclick = function () {
      var email = readResetEmailInput();
      if (!email) return;
      sendPasswordReset(email).then(function () {
        el('emailLoginInput').value = email;
        try {
          localStorage.setItem(LAST_LOGIN_EMAIL_KEY, email);
        } catch (err) {}
        toggleResetPopup(false);
        setStatus('Password reset email sent. Check your inbox.');
      }).catch(function (err) {
        showEmailAuthError(err, 'reset');
      });
    };

    el('resetEmailInput').addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter') return;
      ev.preventDefault();
      el('sendResetEmailBtn').click();
    });

    processAuthActionFromUrl();

    el('guestLoginBtn').onclick = function () {
      if (!auth) return;
      auth.signInAnonymously().catch(function (err) {
        if (showApiKeyReferrerBlockedMessage(err)) return;
        setStatus('Guest login failed.');
      });
    };

    el('logoutBtn').onclick = function () {
      if (!auth) return;
      saveNow(true);
      stopRealtimeSync();
      stopLeaderboardSync();
      stopPresenceTracking();
      auth.signOut().then(function () {
        uid = null;
        window.timClickerUid = null;
        state = clone(defaultState);
        normalizeState();
        el('gamePanel').classList.add('hidden');
        el('authPanel').classList.remove('hidden');
        toggleNamePopup(false);
        renderAll();
      });
    };

    el('renameBtn').onclick = function () {
      var newName = el('renameInput').value.trim();
      if (!newName) return;
      state.name = newName;
      markDirty('name');
      saveNow(true);
      renderAll();
    };

    el('savePopupNameBtn').onclick = function () {
      var name = el('popupNameInput').value.trim();
      if (!name) return;
      state.name = name;
      markDirty('name');
      el('renameInput').value = name;
      saveNow(true);
      ensureNamedSession();
    };

    el('popupNameInput').addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter') return;
      ev.preventDefault();
      el('savePopupNameBtn').click();
    });
  }

  function initFirebaseAuth() {
    if (!saveAllowed) {
      setStatus('Saving declined. Nothing will be saved.');
      return Promise.resolve();
    }

    return ensureFirebaseReady().then(function (ready) {
      if (!ready) {
        if (firebaseReferrerBlocked || firebaseReferrerUnknown) {
          setStatus(getFirebaseReferrerStatusMessage());
        } else {
          setStatus('Firebase offline. Guest save requires Firebase login.');
        }
        return;
      }

      stopRealtimeSync();
      stopLeaderboardSync();
      stopPresenceTracking();
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
        if (!hasOauthRedirectParams()) return null;
        return auth.getRedirectResult().catch(function (err) {
          if (isApiKeyReferrerBlockedError(err)) {
            firebaseReferrerBlocked = true;
          }
          setStatus('Login failed while restoring previous session.');
          return null;
        });
      })
      .then(function () {
        authStateUnsubscribe = auth.onAuthStateChanged(function (user) {
          updateAuthUi(user);
          if (!user) {
            stopRealtimeSync();
            stopLeaderboardSync();
            stopPresenceTracking();
            uid = null;
            window.timClickerUid = null;
            setStatus('Login required. Guest save is stored in Firebase by UID only.');
            return;
          }
          syncForUser(user).then(function () {
            el('authPanel').classList.add('hidden');
            ensureNamedSession();
          }).catch(function () {
            setStatus('Firebase sync failed. Progress could not be saved.');
          });
        }, function () {
          setStatus('Firebase auth blocked.');
        });
      });
    });
  }

  function boot() {
    var popup = el('cookiePopup');

    if (window.location && window.location.hostname && window.location.hostname.toLowerCase() === 'tim-clicker.firebaseapp.com') {
      maybeRedirectFirebaseAppHost('firebaseapp.com is blocked by current API key restrictions.');
      return;
    }

    try {
      var lastEmail = localStorage.getItem(LAST_LOGIN_EMAIL_KEY);
      if (lastEmail) el('emailLoginInput').value = lastEmail;
    } catch (err) {}

    function continueAfterConsent(consent) {
      if (consent === 'accepted') {
        saveAllowed = true;
        var localState = readLocalSnapshot();
        if (localState) {
          state = Object.assign(clone(defaultState), localState);
          normalizeState();
        }
        popup.classList.add('hidden');
        document.body.classList.remove('cookie-lock');
        el('authPanel').classList.remove('hidden');
        initFirebaseAuth().then(function () {
          try {
            applyActiveSkin();
          } catch (err) {}
          renderAll();
        }).catch(function () {
          setStatus('Firebase init failed. Progress could not be saved.');
          try {
            applyActiveSkin();
          } catch (err) {}
          renderAll();
        });
        return;
      }

      if (consent === 'declined') {
        saveAllowed = false;
        stopRealtimeSync();
        stopPresenceTracking();
        uid = null;
        window.timClickerUid = null;
        popup.classList.add('hidden');
        document.body.classList.remove('cookie-lock');
        el('authPanel').classList.add('hidden');
        el('gamePanel').classList.add('hidden');
        setStatus('Saving declined. Nothing will be saved (risk accepted).');
        try {
          applyActiveSkin();
        } catch (err) {}
        renderAll();
        return;
      }

      saveAllowed = false;
      stopRealtimeSync();
      stopLeaderboardSync();
      stopPresenceTracking();
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

  var loadingOverlayTimeout = setTimeout(function () {
    var forcedOverlay = el('skinLoadingOverlay');
    if (forcedOverlay) forcedOverlay.classList.add('hidden');
  }, 4500);

  loadSkinCatalog(function () {
    var overlay = el('skinLoadingOverlay');
    if (overlay) overlay.classList.add('hidden');
    clearTimeout(loadingOverlayTimeout);
    boot();
  });
})();
