// My Finance: Firebase connection (login + online database with offline copy)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, writeBatch
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAxbl2vqi1TxTaByCeIfEIXSZKShP8ogC0",
  authDomain: "myfinance-738a6.firebaseapp.com",
  projectId: "myfinance-738a6",
  storageBucket: "myfinance-738a6.firebasestorage.app",
  messagingSenderId: "710804168888",
  appId: "1:710804168888:web:10f21d0d0dfa253891144d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let db;
try {
  db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
} catch (e) {
  db = initializeFirestore(app, {});
}
const customers = collection(db, "customers");

window.MFStore = {
  onAuth(cb) { return onAuthStateChanged(auth, cb); },
  signIn(email, password) { return signInWithEmailAndPassword(auth, email, password); },
  signOut() { return signOut(auth); },
  subscribe(cb, onError) {
    return onSnapshot(query(customers, orderBy("createdAt", "desc")), { includeMetadataChanges: true }, function (snap) {
      cb(snap.docs.map(function (d) { return Object.assign({}, d.data(), { id: d.id }); }),
        { pending: snap.metadata.hasPendingWrites, changed: snap.docChanges().length > 0 });
    }, onError);
  },
  add(data) { return setDoc(doc(customers), data); },
  update(id, patch) { return setDoc(doc(customers, id), patch, { merge: true }); },
  remove(id) { return deleteDoc(doc(customers, id)); },
  importAll(list) {
    const jobs = [];
    for (let i = 0; i < list.length; i += 400) {
      const batch = writeBatch(db);
      list.slice(i, i + 400).forEach(function (c) {
        const rest = Object.assign({}, c); delete rest.id;
        batch.set(doc(customers, String(c.id)), rest);
      });
      jobs.push(batch.commit());
    }
    return Promise.all(jobs);
  }
};
window.dispatchEvent(new Event("mfstore"));
