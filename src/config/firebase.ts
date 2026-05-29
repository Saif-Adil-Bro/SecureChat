import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // ডাটাবেজ ইমপোর্ট
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyC4P9yRHULZPhAZLtbdrxn_nneSiGl4Vjw",
  authDomain: "chat-6076a.firebaseapp.com",
  projectId: "chat-6076a",
  storageBucket: "chat-6076a.firebasestorage.app",
  messagingSenderId: "635272578175",
  appId: "1:635272578175:web:73521116895c5cce436b4a",
  measurementId: "G-YG64D15EHB"
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const db = getFirestore(app); // ডাটাবেজ ইনিশিয়ালাইজ

export { auth, db };