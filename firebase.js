// firebase.js (v2.1) - prefilled with your config, uses Firebase Web v11 modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set, get, onValue } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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
