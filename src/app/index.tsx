import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView,
  SafeAreaView, ActivityIndicator, Alert, Modal, Image
} from "react-native";
import { Svg, Path, Circle } from "react-native-svg";

// Expo Plugins
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system'; // ফাইল কনভার্ট করার জন্য

// Firebase
import { auth, db } from "../config/firebase";
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore";

// Types
interface Contact { id: string; name: string; avatar: string; email: string; lastMessage: string; time: string; }
interface Message { id: number; text?: string; image?: string; audio?: string; sent: boolean; time: string; type: 'text' | 'image' | 'audio'; }

const Icons = {
  Shield: () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#128C7E" strokeWidth="2.5"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Svg>,
  Plus: () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><Path d="M12 5v14M5 12h14" /></Svg>,
  Back: () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2"><Path d="M19 12H5M12 19l-7-7 7-7" /></Svg>,
  Camera: () => <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="2"><Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><Circle cx="12" cy="13" r="4" /></Svg>,
  Mic: ({ color = "#8696a0" }) => <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><Path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8" /></Svg>,
  Play: () => <Svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><Path d="M8 5v14l11-7z" /></Svg>
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [soundObject, setSoundObject] = useState<Audio.Sound | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inputText, setInputText] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<ScrollView>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists() && docSnap.data().contacts) setContacts(docSnap.data().contacts);
        });
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user || !activeContact) return;
    const roomId = [user.uid, activeContact.id].sort().join("_");
    return onSnapshot(doc(db, "chats", roomId), (docSnap) => {
      if (docSnap.exists() && docSnap.data().messages) setMessages(docSnap.data().messages);
      else setMessages([]);
    });
  }, [activeContact]);

  // ফায়ারবেজ স্টোরেজ ছাড়া ফাইলকে টেক্সট (Base64) এ রূপান্তর করার ফাংশন
  const convertToBase64 = async (uri: string) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      return base64;
    } catch (e) {
      console.log(e);
      return null;
    }
  };

  // ১. ছবি তুলে সরাসরি ডেটাবেজে টেক্সট হিসেবে পাঠানো
  const handleSendImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert("অনুমতি প্রয়োজন");

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.2, // সাইজ ছোট রাখার জন্য কোয়ালিটি কমানো হলো
    });

    if (!result.canceled && result.assets[0].uri) {
      setLoading(true);
      const base64Str = await convertToBase64(result.assets[0].uri);
      if (base64Str) {
        const inlineImage = `data:image/jpeg;base64,${base64Str}`;
        await saveMessageToFirestore({ type: 'image', image: inlineImage });
      }
      setLoading(false);
    }
  };

  // ২. ভয়েস রেকর্ড শুরু
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return Alert.alert("অনুমতি প্রয়োজন");
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.LOW_QUALITY);
      setRecording(recording);
      setIsRecording(true);
    } catch (err) { console.log(err); }
  };

  // ৩. ভয়েস রেকর্ড শেষ করে ডেটাবেজে টেক্সট হিসেবে পাঠানো
  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false); setRecording(null); setLoading(true);
    try {
      await recording.stopAndUnloadAsync();
      const audioUri = recording.getURI();
      if (audioUri) {
        const base64Str = await convertToBase64(audioUri);
        if (base64Str) {
          const inlineAudio = `data:audio/m4a;base64,${base64Str}`;
          await saveMessageToFirestore({ type: 'audio', audio: inlineAudio });
        }
      }
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  // ৪. ভয়েস প্লে করা
  const playAudioMessage = async (base64Audio: string) => {
    try {
      if (soundObject) await soundObject.unloadAsync();
      // Base64 ফাইলকে সাময়িক প্লে করার জন্য এক্সপো ফাইল সিস্টেমে রাইট করা
      const tempUri = FileSystem.cacheDirectory + "temp_voice.m4a";
      await FileSystem.writeAsStringAsync(tempUri, base64Audio.split(',')[1], { encoding: FileSystem.EncodingType.Base64 });
      
      const { sound } = await Audio.Sound.createAsync({ uri: tempUri });
      setSoundObject(sound);
      await sound.playAsync();
    } catch (error) { Alert.alert("ত্রুটি", "প্লে করা সম্ভব হচ্ছে না।"); }
  };

  const handleSendText = async () => {
    if (!inputText.trim()) return;
    await saveMessageToFirestore({ type: 'text', text: inputText });
    setInputText("");
  };

  const saveMessageToFirestore = async (msgData: Partial<Message>) => {
    if (!activeContact) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const roomId = [user.uid, activeContact.id].sort().join("_");
    const chatRoomRef = doc(db, "chats", roomId);

    const newMsg: Message = { id: Date.now(), sent: true, time: timeStr, type: msgData.type || 'text', ...msgData } as Message;
    const roomSnap = await getDoc(chatRoomRef);
    if (!roomSnap.exists()) await setDoc(chatRoomRef, { messages: [newMsg] });
    else await updateDoc(chatRoomRef, { messages: arrayUnion(newMsg) });
  };

  const handleSignUp = async () => {
    if (!email || !password) return Alert.alert("ভুল");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, "users", cred.user.uid), { uid: cred.user.uid, email: cred.user.email, name: email.split('@')[0], contacts: [] });
    } catch (e: any) { Alert.alert("ব্যর্থ", e.message); }
  };

  const handleSignIn = async () => {
    if (!email || !password) return;
    try { await signInWithEmailAndPassword(auth, email.trim(), password); } catch (e) { Alert.alert("লগইন ব্যর্থ"); }
  };

  const handleAddContact = async () => {
    if (!searchEmail.trim() || searchEmail.trim() === user.email) return;
    const q = query(collection(db, "users"), where("email", "==", searchEmail.trim().toLowerCase()));
    const snap = await getDocs(q);
    if (snap.empty) return Alert.alert("পাওয়া যায়নি");
    const targetData = snap.docs[0].data();
    const newContact: Contact = { id: targetData.uid, name: targetData.name, avatar: targetData.name.substring(0,2).toUpperCase(), email: targetData.email, lastMessage: "No messages yet", time: "Now" };
    await updateDoc(doc(db, "users", user.uid), { contacts: arrayUnion(newContact) });
    setIsModalVisible(false); setSearchEmail("");
  };

  if (loading && !user) return <View style={[styles.container, { justifyContent: "center" }]}><ActivityIndicator size="large" color="#00a884" /></View>;

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authCentered}>
          <View style={styles.authCard}>
            <View style={{ alignItems: "center", marginBottom: 20 }}><Icons.Shield /><Text style={styles.authTitle}>SecureChat</Text></View>
            <TextInput style={styles.inputField} placeholder="ইমেইল" placeholderTextColor="#8696a0" value={email} onChangeText={setEmail} autoCapitalize="none" />
            <TextInput style={styles.inputField} placeholder="পাসওয়ার্ড" placeholderTextColor="#8696a0" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
            <TouchableOpacity style={styles.waButton} onPress={isSignUp ? handleSignUp : handleSignIn}><Text style={styles.waButtonText}>{isSignUp ? "সাইন আপ" : "লগইন"}</Text></TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 20 }} onPress={() => setIsSignUp(!isSignUp)}><Text style={{ color: '#00a884', textAlign: 'center' }}>{isSignUp ? "অ্যাকাউন্ট তৈরি করুন" : "লগইন করুন"}</Text></TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {!activeContact ? (
        <>
          <View style={styles.waHeader}><Text style={styles.waHeaderTitle}>SecureChat</Text><TouchableOpacity onPress={() => auth.signOut()}><Text style={{ color: '#ff3d00' }}>Logout</Text></TouchableOpacity></View>
          <ScrollView style={{ flex: 1 }}>
            {contacts.map((item) => (
              <TouchableOpacity key={item.id} style={styles.waChatRow} onPress={() => setActiveContact(item)}>
                <View style={styles.waAvatar}><Text style={styles.waAvatarText}>{item.avatar}</Text></View>
                <View style={styles.waChatRowDetails}>
                  <View style={styles.waRowTopLine}><Text style={styles.waProfileName}>{item.name}</Text><Text style={styles.waRowTime}>{item.time}</Text></View>
                  <Text style={styles.waRowPreview} numberOfLines={1}>{item.lastMessage}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.floatingButton} onPress={() => setIsModalVisible(true)}><Icons.Plus /></TouchableOpacity>
          
          <Modal visible={isModalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Add Contact</Text>
                <TextInput style={styles.inputField} placeholder="বন্ধুর ইমেইল" placeholderTextColor="#8696a0" value={searchEmail} onChangeText={setSearchEmail} autoCapitalize="none" />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity style={[styles.waButton, { flex: 1, backgroundColor: '#202c33', marginRight: 8 }]} onPress={() => setIsModalVisible(false)}><Text style={{ color: '#fff' }}>বাতিল</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.waButton, { flex: 1 }]} onPress={handleAddContact}><Text style={styles.waButtonText}>যোগ করুন</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.waChatHeader}>
            <TouchableOpacity onPress={() => setActiveContact(null)} style={{ flexDirection: 'row', alignItems: 'center' }}><Icons.Back /><View style={styles.waAvatarSmall}><Text style={{ color: '#fff' }}>{activeContact.avatar}</Text></View></TouchableOpacity>
            <Text style={styles.waProfileName}>{activeContact.name}</Text>
          </View>

          <ScrollView ref={messagesEndRef} style={{ flex: 1, padding: 12, backgroundColor: '#0b141a' }} onContentSizeChange={() => messagesEndRef.current?.scrollToEnd({ animated: true })}>
            {messages.map((msg) => (
              <View key={msg.id} style={[styles.waMsgBubble, msg.sent ? styles.waSentBubble : styles.waReceivedBubble]}>
                {msg.type === 'text' && <Text style={{ color: '#e9edef', fontSize: 15 }}>{msg.text}</Text>}
                {msg.type === 'image' && <Image source={{ uri: msg.image }} style={styles.chatRenderedImage} resizeMode="cover" />}
                {msg.type === 'audio' && (
                  <TouchableOpacity style={styles.audioPlayRow} onPress={() => playAudioMessage(msg.audio!)}>
                    <Icons.Play />
                    <Text style={{ color: '#fff', marginLeft: 8, fontSize: 14 }}>ভয়েস মেসেজ শুনুন</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.waMsgTime}>{msg.time}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.waInputBar}>
            <View style={styles.waInputMainBox}>
              <TouchableOpacity onPress={handleSendImage} style={{ marginRight: 10 }}><Icons.Camera /></TouchableOpacity>
              <TextInput style={styles.waTextInput} value={inputText} onChangeText={setInputText} placeholder="Message" placeholderTextColor="#8696a0" />
            </View>
            {inputText.trim().length > 0 ? (
              <TouchableOpacity style={styles.waSendCircle} onPress={handleSendText}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text></TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.waSendCircle, isRecording && { backgroundColor: '#ff3d00' }]} onPressIn={startRecording} onPressOut={stopRecording}><Icons.Mic color="#fff" /></TouchableOpacity>
            )}
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
  waAvatarSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#687c87', justifyContent: 'center', alignItems: 'center', marginLeft: 4, marginRight: 8 },
  waAvatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  waChatRowDetails: { flex: 1, marginLeft: 14, justifyContent: 'center' },
  waRowTopLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  waProfileName: { color: '#e9edef', fontSize: 16, fontWeight: '500' },
  waRowTime: { color: '#8696a0', fontSize: 12 },
  waRowPreview: { color: '#8696a0', fontSize: 14 },
  floatingButton: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#00a884', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '100%', maxWidth: 340, backgroundColor: '#222e35', padding: 20, borderRadius: 12 },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  waChatHeader: { height: 60, backgroundColor: '#202c33', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  waMsgBubble: { padding: 10, borderRadius: 10, marginBottom: 6, maxWidth: '85%' },
  waSentBubble: { backgroundColor: '#005c4b', alignSelf: 'flex-end' },
  waReceivedBubble: { backgroundColor: '#202c33', alignSelf: 'flex-start' },
  waMsgTime: { color: '#8696a0', fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
  waInputBar: { flexDirection: 'row', padding: 8, alignItems: 'center', backgroundColor: '#111b21' },
  waInputMainBox: { flex: 1, backgroundColor: '#202c33', borderRadius: 24, paddingHorizontal: 16, height: 44, flexDirection: 'row', alignItems: 'center' },
  waTextInput: { color: '#fff', fontSize: 16, flex: 1 },
  waSendCircle: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#00a884', justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
  chatRenderedImage: { width: 220, height: 160, borderRadius: 8, marginBottom: 4 },
  audioPlayRow: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#2a3942', borderRadius: 8, minWidth: 160 }
});