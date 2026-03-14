import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCUyKQXSVSy5jyQS4QdzEZ4IILuxy487Qk",
  authDomain: "capy-notes.firebaseapp.com",
  projectId: "capy-notes",
  storageBucket: "capy-notes.firebasestorage.app",
  messagingSenderId: "837527248210",
  appId: "1:837527248210:web:a948b5d2a2ca40ba1d6e8b",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
