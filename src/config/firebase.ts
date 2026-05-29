import { initializeApp } from "firebase/app"; // এখানে ছোট হাতের i হবে
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ফায়ারবেজ কনসোল থেকে পাওয়া আপনার নিজস্ব ক্রেডেনশিয়াল
const firebaseConfig = {
  apiKey: "AIzaSyC4P9yRHULZPhAZLtbdrxn_nneSiGl4Vjw",
  authDomain: "chat-6076a.firebaseapp.com",
  projectId: "chat-6076a",
  storageBucket: "chat-6076a.firebasestorage.app",
  messagingSenderId: "635272578175",
  appId: "1:635272578175:web:73521116895c5cce436b4a",
  measurementId: "G-YG64D15EHB"
};

// ফায়ারবেজ ইনিশিয়ালাইজ করা
const app = initializeApp(firebaseConfig);

// রিঅ্যাক্ট নেটিভের জন্য সিকিউর পারসিস্টেন্স-সহ অথ সেটআপ
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { auth };