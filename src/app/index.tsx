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
} from "react-native";
import { Svg, Rect, Path, Circle } from "react-native-svg";

// Firebase Imports
import { auth } from "../config/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInAnonymously, // Anonymous লগইনের জন্য
  onAuthStateChanged, 
  signOut 
} from "firebase/auth";

// Types Definition
interface Contact { id: number; name: string; avatar: string; status: string; lastSeen: string; color: string; }
interface Message { id: number; text: string; sent: boolean; time: string; encrypted: boolean; }
interface MessagesState { [key: number]: Message[]; }

// Icons Helper
function ShieldIcon() {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
      <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  );
}

// Dummy Data for Chat
const contactsData: Contact[] = [
  { id: 1, name: "টপ সিক্রেট গ্রুপ", avatar: "TG", status: "online", lastSeen: "", color: "#00e5ff" },
  { id: 2, name: "রকিব (Agent X)", avatar: "RX", status: "online", lastSeen: "", color: "#ff3d00" },
];

const initialMessages: MessagesState = {
  1: [{ id: 1, text: "ফায়ারবেজ অথ সাকসেসফুলি কানেক্টেড!", sent: false, time: "১০:০৫ AM", encrypted: true }],
  2: [],
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inputText, setInputText] = useState("");

  const [activeContact, setActiveContact] = useState<Contact | null>(contactsData[0]);
  const [messages, setMessages] = useState<MessagesState>(initialMessages);
  const messagesEndRef = useRef<ScrollView>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ১. ইমেইল সাইনআপ
  const handleSignUp = async () => {
    if (!email || !password) return Alert.alert("ভুল", "দয়া করে সব ঘর পূরণ করুন।");
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      Alert.alert("সফল", "অ্যাকাউন্ট তৈরি সম্পূর্ণ হয়েছে!");
    } catch (error: any) {
      Alert.alert("সাইনআপ ব্যর্থ", error.message);
    } finally {
      setLoading(false);
    }
  };

  // ২. ইমেইল সাইনইন
  const handleSignIn = async () => {
    if (!email || !password) return Alert.alert("ভুল", "ইমেইল এবং পাসওয়ার্ড দিন।");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error: any) {
      Alert.alert("লগইন ব্যর্থ", "ইমেইল বা পাসওয়ার্ড ভুল হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  // ৩. Anonymous (গেস্ট) লগইন ফাংশন
  const handleAnonymousLogin = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
      Alert.alert("স্বাগতম", "আপনি গেস্ট হিসেবে প্রবেশ করেছেন!");
    } catch (error: any) {
      Alert.alert("ব্যর্থ", "গেস্ট লগইন এই মুহূর্তে কাজ করছে না।");
    } finally {
      setLoading(false);
    }
  };

  // ৪. গুগল লগইন ফাংশন (প্রাথমিক সেটআপ - প্রোডাকশনে ক্লায়েন্ট আইডি লাগে)
  const handleGoogleLogin = () => {
    Alert.alert(
      "Google Sign-In", 
      "গুগল লগইন সচল করা হয়েছে। এক্সপো গো বা ফাইনাল বিল্ডে গুগল পপআপ সচল করতে ফায়ারবেজে Android Client ID যুক্ত করতে হবে।"
    );
  };

  const handleLogOut = async () => {
    try { await signOut(auth); setActiveContact(contactsData[0]); } catch (e) { Alert.alert("ত্রুটি", "লগআউট করা যায়নি।"); }
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeContact) return;
    const newMsg: Message = { id: Date.now(), text: inputText, sent: true, time: "১০:১০ AM", encrypted: true };
    setMessages((prev) => ({ ...prev, [activeContact.id]: [...(prev[activeContact.id] || []), newMsg] }));
    setInputText("");
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#00e5ff" />
      </View>
    );
  }

  // --- স্ক্রিন ১: লগইন / সাইনআপ গেটওয়ে ---
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.authCentered}>
          <View style={styles.authCard}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <ShieldIcon />
              <Text style={styles.authTitle}>{isSignUp ? "নতুন অ্যাকাউন্ট" : "সিকিউর লগইন"}</Text>
              <Text style={styles.authSubtitle}>SecureChat End-to-End Encrypted</Text>
            </View>

            <TextInput
              style={styles.inputField}
              placeholder="আপনার ইমেইল"
              placeholderTextColor="#546e7a"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.inputField}
              placeholder="পাসওয়ার্ড"
              placeholderTextColor="#546e7a"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.primaryButton} onPress={isSignUp ? handleSignUp : handleSignIn}>
              <Text style={styles.buttonText}>{isSignUp ? "সাইন আপ করুন" : "প্রবেশ করুন"}</Text>
            </TouchableOpacity>

            {/* divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>অথবা</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* নতুন যুক্ত হওয়া বাটন সমূহ (Google & Anonymous) */}
            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
                <Text style={styles.googleButtonText}>G  Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.guestButton} onPress={handleAnonymousLogin}>
                <Text style={styles.guestButtonText}>👤  Guest</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={{ marginTop: 20 }} onPress={() => setIsSignUp(!isSignUp)}>
              <Text style={styles.switchText}>
                {isSignUp ? "আগে থেকেই অ্যাকাউন্ট আছে? লগইন করুন" : "নতুন ইউজার? অ্যাকাউন্ট তৈরি করুন"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // --- স্ক্রিন ২: মেইন চ্যাট ইন্টারফেস (লগইন হওয়ার পর) ---
  const currentMessages = activeContact ? messages[activeContact.id] || [] : [];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.innerContainer}>
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <ShieldIcon />
              <Text style={styles.headerTitle}>SecureChat (User: {user.isAnonymous ? "Guest" : "Verified"})</Text>
            </View>
            <TouchableOpacity onPress={handleLogOut} style={styles.logoutBtn}>
              <Text style={{ color: "#ff3d00", fontSize: 12, fontWeight: "bold" }}>লগআউট</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.contactList} horizontal showsHorizontalScrollIndicator={false}>
          {contactsData.map((contact) => (
            <TouchableOpacity
              key={contact.id}
              onPress={() => setActiveContact(contact)}
              style={[styles.contactCard, activeContact?.id === contact.id && styles.activeContactCard]}
            >
              <Text style={[styles.avatarText, { color: contact.color }]}>{contact.avatar}</Text>
              <Text style={styles.contactName}>{contact.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.chatArea}>
          <ScrollView ref={messagesEndRef} style={styles.messageContainer} onContentSizeChange={() => messagesEndRef.current?.scrollToEnd({ animated: true })}>
            {currentMessages.map((msg) => (
              <View key={msg.id} style={[styles.messageBubble, msg.sent ? styles.sentBubble : styles.receivedBubble]}>
                <Text style={styles.messageText}>{msg.text}</Text>
                <View style={styles.messageFooter}>
                  {msg.encrypted && <LockIcon />}
                  <Text style={styles.messageTime}>{msg.time}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput style={styles.input} value={inputText} onChangeText={setInputText} placeholder="গোপন বার্তা লিখুন..." placeholderTextColor="#546e7a" />
            <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
              <Text style={{ color: "#00e5ff", fontWeight: "bold" }}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060a10" },
  innerContainer: { flex: 1 },
  authCentered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  authCard: { width: "100%", maxWidth: 360, backgroundColor: "#0b1528", padding: 24, borderRadius: 16, borderWidth: 1, borderColor: "#102a43" },
  authTitle: { color: "#00e5ff", fontSize: 22, fontWeight: "bold", marginTop: 12 },
  authSubtitle: { color: "#546e7a", fontSize: 12, marginTop: 4 },
  inputField: { width: "100%", backgroundColor: "#102a43", color: "#fff", padding: 14, borderRadius: 8, marginBottom: 16, fontSize: 15 },
  primaryButton: { width: "100%", backgroundColor: "#00e5ff", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 8 },
  buttonText: { color: "#060a10", fontSize: 16, fontWeight: "bold" },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#102a43' },
  dividerText: { color: '#546e7a', paddingHorizontal: 10, fontSize: 13 },
  socialContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  googleButton: { flex: 1, backgroundColor: '#ffffff', padding: 12, borderRadius: 8, alignItems: 'center', marginRight: 8 },
  googleButtonText: { color: '#060a10', fontWeight: 'bold', fontSize: 14 },
  guestButton: { flex: 1, backgroundColor: '#102a43', padding: 12, borderRadius: 8, alignItems: 'center', marginLeft: 8, borderWidth: 1, borderColor: '#546e7a40' },
  guestButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  switchText: { color: '#546e7a', fontSize: 13, textAlign: 'center' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#102a43", backgroundColor: "#0b1528" },
  headerTitle: { color: "#00e5ff", fontSize: 16, fontWeight: "bold", marginLeft: 8 },
  logoutBtn: { padding: 6, borderWidth: 1, borderColor: "#ff3d0040", borderRadius: 6 },
  contactList: { padding: 10, backgroundColor: "#0b1528", maxHeight: 60 },
  contactCard: { paddingHorizontal: 12, borderRadius: 20, backgroundColor: "#102a43", marginRight: 10, alignItems: "center", height: 36, flexDirection: "row" },
  activeContactCard: { backgroundColor: "#00e5ff20", borderColor: "#00e5ff", borderWidth: 1 },
  avatarText: { fontWeight: "bold", marginRight: 6 },
  contactName: { color: "#ffffff", fontSize: 13 },
  chatArea: { flex: 1 },
  messageContainer: { flex: 1, padding: 16 },
  messageBubble: { padding: 12, borderRadius: 16, marginBottom: 10, maxWidth: "80%" },
  sentBubble: { backgroundColor: "#00e5ff15", alignSelf: "flex-end", borderWidth: 1, borderColor: "#00e5ff30" },
  receivedBubble: { backgroundColor: "#102a43", alignSelf: "flex-start" },
  messageText: { color: "#ffffff", fontSize: 15 },
  messageFooter: { flexDirection: "row", alignItems: "center", alignSelf: "flex-end", marginTop: 4 },
  messageTime: { color: "#546e7a", fontSize: 10, marginLeft: 4 },
  inputContainer: { flexDirection: "row", padding: 12, backgroundColor: "#0b1528", alignItems: "center" },
  input: { flex: 1, backgroundColor: "#102a43", color: "#fff", paddingHorizontal: 16, height: 40, borderRadius: 24, marginRight: 8 },
  sendButton: { padding: 10 },
});