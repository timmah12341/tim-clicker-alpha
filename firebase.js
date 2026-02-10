import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  update
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {};
firebaseConfig.apiKey = "AIzaSyDleRW-O4yP9FJhuqQtMTVT0c_Dd1PPA98";
firebaseConfig.authDomain = "tim-clicker-alpha.firebaseapp.com";
firebaseConfig.databaseURL = "https://tim-clicker-alpha-default-rtdb.europe-west1.firebasedatabase.app";
firebaseConfig.projectId = "tim-clicker-alpha";
firebaseConfig.storageBucket = "tim-clicker-alpha.firebasestorage.app";
firebaseConfig.messagingSenderId = "40617780569";
firebaseConfig.appId = "1:40617780569:web:1a82146a3554ab1e365848";

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export async function loadPlayer(uid) {
  const snap = await get(ref(db, "players/" + uid));
  return snap.exists() ? snap.val() : null;
}

export async function savePlayer(uid, data) {
  await set(ref(db, "players/" + uid), data);
}

export async function updatePlayer(uid, data) {
  await update(ref(db, "players/" + uid), data);
}
