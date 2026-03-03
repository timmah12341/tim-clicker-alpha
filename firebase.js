import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  update
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBZDGbuenDWIE8O0hjCa8h98n1os-8MZNs",
  authDomain: "tim-clicker.firebaseapp.com",
  databaseURL: "https://tim-clicker-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tim-clicker",
  messagingSenderId: "493561136507",
  appId: "1:493561136507:web:0a842da88e6a764624e9de",
  measurementId: "G-FTKCVMZH0Z"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
const auth = getAuth(app);

export let currentUID = null;

export function initAuth(callback) {
  signInAnonymously(auth);

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    currentUID = user.uid;
    callback(user.uid);
  });
}

export async function loadUser(uid) {
  const snapshot = await get(ref(db, "users/" + uid));
  return snapshot.exists() ? snapshot.val() : null;
}

export async function saveUser(uid, data) {
  await set(ref(db, "users/" + uid), data);
}
