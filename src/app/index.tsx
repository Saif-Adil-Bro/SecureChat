import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { Svg, Path, Circle, Rect } from "react-native-svg";

// Firebase
import { auth, db } from "../config/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInAnonymously, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore";

// Types
interface Contact { id: string; name: string; avatar: string; email: string; lastMessage: string; time: string; }
interface Message { id: number; text: string; sent: boolean; time: string; }

// Icons Helper
const Icons = {
  Shield: () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#128C7E" strokeWidth="2.5"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Svg>,
  Plus: () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><Path d="M12 5v14M5 12h14" /></Svg>,
  Back: () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2"><Path d="M19 12H5M12 19l-7-7 7-7" /></Svg>
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);

  // Inputs & Search
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inputText, setInputText] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false); // Add Contact Modal Toggle

  // Chat Data States
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<ScrollView>(null);

  // ১. ইউজার সেশন ও রিয়েলটাইম কন্টাক্ট লিস্ট লোড করা
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // ফায়ারস্টোর থেকে ইউজারের নিজস্ব কন্টাক্ট লিস্ট রিয়েলটাইম ট্র্যাক করা
        const userDocRef = doc(db, "users", currentUser.uid);
        const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists() && docSnap.data().contacts) {
            setContacts(docSnap.data().contacts);
          }
        });
        return () => unsubDoc();
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // চ্যাট ওপেন হলে মেসেজ রিয়েলটাইম লোড করার হুক
  useEffect(() => {
    if (!user || !activeContact) return;
    // চ্যাট রুম আইডি তৈরি (দুই ইউজারের আইডি ক্রমানুসারে সাজিয়ে ইউনিক আইডি)
    const roomId = [user.uid, activeContact.id].sort().join("_");
    const roomRef = doc(db, "chats", roomId);
    
    const unsubChats = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().messages) {
        setMessages(docSnap.data().messages);
      } else {
        setMessages([]);
      }
      setLoading(false);
    });
    return () => unsubChats();
  }, [activeContact]);

  // ২. সাইনআপ (নতুন ইউজার তৈরি ও ডাটাবেজে প্রোফাইল সেভ)
  const handleSignUp = async () => {
    if (!email || !password) return Alert.alert("ভুল", "সব ঘর পূরণ করুন।");
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const newUser = userCredential.user;
      
      // ফায়ারস্টোরে ইউজারের একটি প্রোফাইল ডকুমেন্ট তৈরি করা
      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        email: newUser.email,
        name: email.split('@')[0], // ইমেইলের প্রথম অংশকে নাম হিসেবে ধরা হলো
        contacts: [] // শুরুতে কন্টাক্ট লিস্ট খালি থাকবে
      });
      Alert.alert("সফল", "অ্যাকাউন্ট তৈরি সম্পূর্ণ!");
    } catch (e: any) { Alert.alert("সাইনআপ ব্যর্থ", e.message); }
    finally { setLoading(false); }
  };

  const handleSignIn = async () => {
    if (!email || !password) return Alert.alert("ভুল", "ইমেইল এবং পাসওয়ার্ড দিন।");
    setLoading(true);
    try { await signInWithEmailAndPassword(auth, email.trim(), password); } 
    catch (e: any) { Alert.alert("লগইন ব্যর্থ", "ইমেইল বা পাসওয়ার্ড ভুল।"); }
    finally { setLoading(false); }
  };

  // ৩. হোয়াটসঅ্যাপের মতো কন্টাক্ট খুঁজে অ্যাড করার মেইন ফাংশন (BACKEND & FRONTEND)
  const handleAddContact = async () => {
    if (!searchEmail.trim()) return Alert.alert("ভুল", "ইমেইল টাইপ করুন।");
    if (searchEmail.trim() === user.email) return Alert.alert("ভুল", "নিজের ইমেইল অ্যাড করা যাবে না।");
    
    setLoading(true);
    try {
      // ক) সার্চ করা ইমেইলটি ডাটাবেজে আছে কি না তা খুঁজে বের করা
      const q = query(collection(db, "users"), where("email", "==", searchEmail.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert("পাওয়া যায়নি", "এই ইমেইল দিয়ে কোনো SecureChat অ্যাকাউন্ট খোলা নেই।");
        setLoading(false);
        return;
      }

      // খ) ইউজার পাওয়া গেলে তার ডাটা নেওয়া
      const targetUserDoc = querySnapshot.docs[0];
      const targetUserData = targetUserDoc.data();

      // গ) আপনার বর্তমান কন্টাক্ট লিস্টে চেক করা যে অলরেডি অ্যাড আছে কি না
      const isAlreadyAdded = contacts.some(c => c.id === targetUserData.uid);
      if (isAlreadyAdded) {
        Alert.alert("দুঃখিত", "এই কন্টাক্টটি অলরেডি আপনার লিস্টে আছে।");
        setLoading(false);
        return;
      }

      const newContactObj: Contact = {
        id: targetUserData.uid,
        name: targetUserData.name,
        avatar: targetUserData.name.substring(0,2).toUpperCase(),
        email: targetUserData.email,
        lastMessage: "No messages yet",
        time: "Now"
      };

      // ঘ) ব্যাকএন্ড ফায়ারস্টোরে আপনার অ্যাকাউন্ট ডকুমেন্টের ভিতর কন্টাক্টটি পুশ করা
      const myDocRef = doc(db, "users", user.uid);
      await updateDoc(myDocRef, {
        contacts: arrayUnion(newContactObj)
      });

      Alert.alert("সফল", `${targetUserData.name} আপনার চ্যাট লিস্টে যুক্ত হয়েছে!`);
      setIsModalVisible(false);
      setSearchEmail("");
    } catch (error: any) {
      Alert.alert("ত্রুটি", "কন্টাক্ট যুক্ত করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  // ৪. রিয়েলটাইম মেসেজ পাঠানো (Firestore database sync)
  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeContact) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const roomId = [user.uid, activeContact.id].sort().join("_");
    const chatRoomRef = doc(db, "chats", roomId);

    const newMsg: Message = { id: Date.now(), text: inputText, sent: true, time: timeStr };

    try {
      const roomSnap = await getDoc(chatRoomRef);
      if (!roomSnap.exists()) {
        await setDoc(chatRoomRef, { messages: [newMsg] });
      } else {
        await updateDoc(chatRoomRef, { messages: arrayUnion(newMsg) });
      }
      setInputText("");
    } catch (e) {
      console.log("Error sending message:", e);
    }
  };

  if (loading && !user) {
    return <View style={[styles.container, { justifyContent: "center" }]}><ActivityIndicator size="large" color="#00a884" /></View>;
  }

  // Auth Screen 
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authCentered}>
          <View style={styles.authCard}>
            <View style={{ alignItems: "center", marginBottom: 20 }}><Icons.Shield /><Text style={styles.authTitle}>SecureChat</Text></View>
            <TextInput style={styles.inputField} placeholder="ইমেইল" placeholderTextColor="#8696a0" value={email} onChangeText={setEmail} autoCapitalize="none" />
            <TextInput style={styles.inputField} placeholder="পাসওয়ার্ড" placeholderTextColor="#8696a0" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
            <TouchableOpacity style={styles.waButton} onPress={isSignUp ? handleSignUp : handleSignIn}><Text style={styles.waButtonText}>{isSignUp ? "সাইন আপ" : "লগইন"}</Text></TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 20 }} onPress={() => setIsSignUp(!isSignUp)}><Text style={{ color: '#00a884', textAlign: 'center' }}>{isSignUp ? "আগে অ্যাকাউন্ট আছে? লগইন করুন" : "নতুন অ্যাকাউন্ট তৈরি করুন"}</Text></TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // WhatsApp Home Screen
  return (
    <SafeAreaView style={styles.container}>
      {!activeContact ? (
        <>
          <View style={styles.waHeader}>
            <Text style={styles.waHeaderTitle}>SecureChat</Text>
            <TouchableOpacity onPress={() => auth.signOut()}><Text style={{ color: '#ff3d00', fontWeight: 'bold' }}>Logout</Text></TouchableOpacity>
          </View>

          {/* চ্যাট লিস্ট বডি */}
          <ScrollView style={{ flex: 1 }}>
            {contacts.length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center' }}><Text style={{ color: '#8696a0', textAlign: 'center' }}>নিচের (+) বাটনে ক্লিক করে ইমেইল দিয়ে আপনার বন্ধুদের চ্যাট লিস্টে যোগ করুন!</Text></View>
            ) : (
              contacts.map((item) => (
                <TouchableOpacity key={item.id} style={styles.waChatRow} onPress={() => setActiveContact(item)}>
                  <View style={styles.waAvatar}><Text style={styles.waAvatarText}>{item.avatar}</Text></View>
                  <View style={styles.waChatRowDetails}>
                    <View style={styles.waRowTopLine}><Text style={styles.waProfileName}>{item.name}</Text><Text style={styles.waRowTime}>{item.time}</Text></View>
                    <Text style={styles.waRowPreview} numberOfLines={1}>{item.lastMessage}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* হোয়াটসঅ্যাপ স্টাইল ফ্লোটিং 'Add Contact' (+) বাটন */}
          <TouchableOpacity style={styles.floatingButton} onPress={() => setIsModalVisible(true)}>
            <Icons.Plus />
          </TouchableOpacity>

          {/* Add Contact Popup Modal */}
          <Modal visible={isModalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Add Contact (নতুন বন্ধু যোগ করুন)</Text>
                <TextInput style={styles.inputField} placeholder="বন্ধুর SecureChat ইমেইলটি লিখুন" placeholderTextColor="#8696a0" value={searchEmail} onChangeText={setSearchEmail} autoCapitalize="none" />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                  <TouchableOpacity style={[styles.waButton, { flex: 1, backgroundColor: '#202c33', marginRight: 8 }]} onPress={() => setIsModalVisible(false)}><Text style={{ color: '#fff' }}>বাতিল</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.waButton, { flex: 1 }]} onPress={handleAddContact}><Text style={styles.waButtonText}>যোগ করুন</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      ) : (
        // Realtime Chat View Inside
        <View style={{ flex: 1 }}>
          <View style={styles.waChatHeader}>
            <TouchableOpacity onPress={() => setActiveContact(null)} style={{ flexDirection: 'row', alignItems: 'center' }}><Icons.Back /><View style={[styles.waAvatar, { width: 36, height: 36, marginLeft: 4, marginRight: 8 }]}><Text style={{ color: '#fff', fontWeight: 'bold' }}>{activeContact.avatar}</Text></View></TouchableOpacity>
            <Text style={styles.waProfileName}>{activeContact.name}</Text>
          </View>
          <ScrollView ref={messagesEndRef} style={{ flex: 1, padding: 12, backgroundColor: '#0b141a' }} onContentSizeChange={() => messagesEndRef.current?.scrollToEnd({ animated: true })}>
            {messages.map((msg) => (
              <View key={msg.id} style={[styles.waMsgBubble, msg.sent ? styles.waSentBubble : styles.waReceivedBubble]}><Text style={{ color: '#e9edef', fontSize: 15 }}>{msg.text}</Text><Text style={styles.waMsgTime}>{msg.time}</Text></View>
            ))}
          </ScrollView>
          <View style={styles.waInputBar}>
            <View style={styles.waInputMainBox}><TextInput style={styles.waTextInput} value={inputText} onChangeText={setInputText} placeholder="Message" placeholderTextColor="#8696a0" /></View>
            <TouchableOpacity style={styles.waSendCircle} onPress={handleSendMessage}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text></TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111b21" },
  authCentered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  authCard: { width: "100%", maxWidth: 350, backgroundColor: "#222e35", padding: 24, borderRadius: 12 },
  authTitle: { color: "#e9edef", fontSize: 20, fontWeight: "bold", marginTop: 12 },
  inputField: { width: "100%", backgroundColor: "#2a3942", color: "#fff", padding: 14, borderRadius: 8, marginBottom: 16 },
  waButton: { backgroundColor: "#00a884", padding: 12, borderRadius: 24, alignItems: "center" },
  waButtonText: { color: "#111b21", fontSize: 15, fontWeight: "bold" },
  waHeader: { height: 60, flexDirection: 'row', backgroundColor: '#202c33', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  waHeaderTitle: { color: '#e9edef', fontSize: 21, fontWeight: '600' },
  waChatRow: { flexDirection: 'row', height: 72, paddingHorizontal: 16, alignItems: 'center' },
  waAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#687c87', justifyContent: 'center', alignItems: 'center' },
  waAvatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  waChatRowDetails: { flex: 1, marginLeft: 14, justifyContent: 'center' },
  waRowTopLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  waProfileName: { color: '#e9edef', fontSize: 16, fontWeight: '500' },
  waRowTime: { color: '#8696a0', fontSize: 12 },
  waRowPreview: { color: '#8696a0', fontSize: 14 },
  floatingButton: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#00a884', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 340, backgroundColor: '#222e35', padding: 20, borderRadius: 12 },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  waChatHeader: { height: 60, backgroundColor: '#202c33', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  waMsgBubble: { padding: 10, borderRadius: 10, marginBottom: 6, maxWidth: '85%' },
  waSentBubble: { backgroundColor: '#005c4b', alignSelf: 'flex-end' },
  waReceivedBubble: { backgroundColor: '#202c33', alignSelf: 'flex-start' },
  waMsgTime: { color: '#8696a0', fontSize: 10, alignSelf: 'flex-end', marginTop: 2 },
  waInputBar: { flexDirection: 'row', padding: 8, alignItems: 'center', backgroundColor: '#111b21' },
  waInputMainBox: { flex: 1, backgroundColor: '#202c33', borderRadius: 24, paddingHorizontal: 16, height: 44, justifyContent: 'center' },
  waTextInput: { color: '#fff', fontSize: 16 },
  waSendCircle: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#00a884', justifyContent: 'center', alignItems: 'center', marginLeft: 6 }
});