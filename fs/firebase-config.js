// ============================================================
// 🔥 FIREBASE CONFIGURATION — BloodLink
// ============================================================
//
// HOW TO SET UP:
// 1. Go to https://console.firebase.google.com
// 2. Click "Add Project" → name it (e.g. "bloodlink") → Continue
// 3. Disable Google Analytics (not needed) → Create Project
// 4. Click the Web icon (</>) to add a web app
// 5. Register app name (e.g. "bloodlink-web") → Register
// 6. Copy the firebaseConfig object and paste it below
// 7. Go to Firestore Database → Create Database → Start in TEST mode
// 8. Done! Your app now has a real database.
//
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, updateDoc, query, where, orderBy, serverTimestamp, onSnapshot, deleteDoc }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ⬇️ PASTE YOUR FIREBASE CONFIG HERE ⬇️
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export everything modules need
export {
    db,
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    onSnapshot,
    deleteDoc
};
