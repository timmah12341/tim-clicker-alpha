// firebase.js (v2.1) - prefilled with your config, uses Firebase Web v11 modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set, get, onValue } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBZDGbuenDWIE8O0hjCa8h98n1os-8MZNs",
  authDomain: "tim-clicker.firebaseapp.com",
  databaseURL: "https://tim-clicker-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tim-clicker",
  storageBucket: "tim-clicker.firebasedatabase.app",
  messagingSenderId: "493561136507",
  appId: "1:493561136507:web:0a842da88e6a764624e9de",
  measurementId: "G-FTKCVMZH0Z"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

let _uid = null;
export function ensureAuth(){
  return new Promise((resolve, reject) => {
    if (auth.currentUser){ _uid = auth.currentUser.uid; resolve(_uid); return; }
    signInAnonymously(auth).catch(()=>{});
    onAuthStateChanged(auth, (user) => {
      if (user){ _uid = user.uid; resolve(_uid); } else reject(new Error('auth failed'));
    });
  });
}

export async function writePlayer(uid, data){
  try { await set(ref(db, 'players/' + uid), data); } catch(e){ console.warn('writePlayer failed', e); }
}

export async function readPlayersOnce(){
  try { const s = await get(ref(db, 'players')); return s.exists() ? s.val() : {}; } catch(e){ console.warn('readPlayersOnce failed', e); return {}; }
}

export async function readPlayer(uid){
  try { const s = await get(ref(db, 'players/' + uid)); return s.exists() ? s.val() : null; } catch(e){ console.warn(e); return null; }
}

export function onPlayers(cb){ return onValue(ref(db, 'players'), snapshot => cb(snapshot.exists() ? snapshot.val() : {})); }

export { db };
