import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBVU233P7wyAPTggdpocQtRZc_ucJmASx8",
  authDomain: "note-taking-cd0dc.firebaseapp.com",
  projectId: "note-taking-cd0dc",
  storageBucket: "note-taking-cd0dc.firebasestorage.app",
  messagingSenderId: "565476867929",
  appId: "1:565476867929:web:edf912657158e05e3d1648",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
