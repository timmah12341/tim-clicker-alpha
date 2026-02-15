import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getDatabase, ref, get, set, update 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDleRW-O4yP9FJhuqQtMTVT0c_Dd1PPA98",
  authDomain: "tim-clicker-alpha.firebaseapp.com",
  databaseURL: "https://tim-clicker-alpha-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tim-clicker-alpha",
  storageBucket: "tim-clicker-alpha.firebasestorage.app",
  messagingSenderId: "40617780569",
  appId: "1:40617780569:web:1a82146a3554ab1e365848"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
const auth = getAuth(app);

export let currentUID = null;

signInAnonymously(auth);

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUID = user.uid;
    console.log("Signed in:", currentUID);
  }
});

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
