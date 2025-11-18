// src/lib/firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuration Firebase - REMPLACEZ avec vos vraies valeurs
const firebaseConfig = {
  apiKey: "AIzaSyA8S9DPEh8l3bQpQUwsmhodWsFIuyUagm0",
  authDomain: "distribution-zakat.firebaseapp.com",
  projectId: "distribution-zakat",
  storageBucket: "distribution-zakat.firebasestorage.app",
  messagingSenderId: "718517669416",
  appId: "1:718517669416:web:5bca6e38b5068fe6fd6f1d",
  measurementId: "G-WQC0LZ4RDR"
};

// Initialiser Firebase (évite les doublons)
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Exporter les services
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;