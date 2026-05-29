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
  Image,
} from "react-native";
import { Svg, Path, Rect, Circle } from "react-native-svg";

// Firebase Imports
import { auth } from "../config/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInAnonymously, 
  onAuthStateChanged, 
  signOut 
} from "firebase/auth";

// Types
interface Contact { id: number; name: string; avatar: string; lastMessage: string; time: string; unread: number; online: boolean; }
interface Message { id: number; text: string; sent: boolean; time: string; status: 'read' | 'sent'; }
interface MessagesState { [key: number]: Message[]; }

// SVG Icons Helper (WhatsApp Style)
const Icons = {
  Shield: () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#128C7E" strokeWidth="2.5">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  ),
  Search: () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b1b3b5" strokeWidth="2">
      <Circle cx="11" cy="11" r="8" /><Path d="M21 21l-4.3-4.3" />
    </Svg>
  ),
  Menu: () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b1b3b5" strokeWidth="2.5">
      <Circle cx="12" cy="5" r="1" fill="#b1b3b5" />
      <Circle cx="12" cy="12" r="1" fill="#b1b3b5" />
      <Circle cx="12" cy="19" r="1" fill="#b1b3b5" />
    </Svg>
  ),
  DoubleTick: ({ color = "#34b7f1" }) => (
    <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Path d="M17 5L9.5 12.5L6 9M22 5l-7.5 7.5" />
    </Svg>
  ),
  Camera: () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b1b3b5" strokeWidth="2">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <Circle cx="12" cy="13" r="4" />
    </Svg>
  ),
  Back: () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
      <Path d="M19 12H5M12 19l-7-7 7-7" />
    </Svg>
  )
};

// Dummy WhatsApp Data
const initialContacts: Contact[] = [
  { id: 1, name: "টপ সিক্রেট গ্রুপ", avatar: "TG", lastMessage: "কোড এখন পারফেক্ট!", time: "8:45 PM", unread: 2, online: true },
  { id: 2, name: "রকিব (Agent X)", avatar: "RX", lastMessage: "ভাই অ্যাপটা জোস হইছে", time: "Yesterday", unread: 0, online: false },
  { id: 3, name: "Nazmul Haque", avatar: "NH", lastMessage: "ফায়ারবেজ ডাটাবেজ চেক করুন।", time: "Monday", unread: 0, online: true },
];

const initialMessages: MessagesState = {
  1: [
    { id: 1, text: "আসসালামু আলাইকুম, সিকিউর চ্যাট অ্যাপে স্বাগতম!", sent: false, time: "8:40 PM", status: 'read' },
    { id: 2, text: "কোড এখন পারফেক্ট!", sent: false, time: "8:45 PM", status: 'read' },
  ],
  2: [],
  3: []
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [currentTab, setCurrentTab] = useState<"chats" | "status" | "calls">("chats");

  // Inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inputText, setInputText] = useState("");

  // Chat Navigation
  const [activeContact, setActiveContact] = useState<Contact | null>(null); // null means chat list view
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [messages, setMessages] = useState<MessagesState>(initialMessages);
  const messagesEndRef = useRef<ScrollView>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSignUp = async () => {
    if (!email || !password) return Alert.alert("ভুল", "দয়া করে সব ঘর পূরণ করুন।");
    setLoading(true);
    try { await createUserWithEmailAndPassword(auth, email.trim(), password); } 
    catch (e: any) { Alert.alert("সাইনআপ ব্যর্থ", e.message); } finally { setLoading(false); }
  };

  const handleSignIn = async () => {
    if (!email || !password) return Alert.alert("ভুল", "ইমেইল এবং পাসওয়ার্ড দিন।");
    setLoading(true);
    try { await signInWithEmailAndPassword(auth, email.trim(), password); } 
    catch (e: any) { Alert.alert("লগইন ব্যর্থ", "ইমেইল বা পাসওয়ার্ড ভুল।"); } finally { setLoading(false); }
  };

  const handleAnonymousLogin = async () => {
    setLoading(true);
    try { await signInAnonymously(auth); } 
    catch (e) { Alert.alert("ব্যর্থ", "গেস্ট লগইন কাজ করছে না।"); } finally { setLoading(false); }
  };

  const handleLogOut = async () => {
    try { await signOut(auth); setActiveContact(null); } catch (e) { Alert.alert("ত্রুটি", "লগআউট করা যায়নি।"); }
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeContact) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newMsg: Message = {
      id: Date.now(),
      text: inputText,
      sent: true,
      time: timeStr,
      status: 'sent',
    };

    setMessages((prev) => ({
      ...prev,
      [activeContact.id]: [...(prev[activeContact.id] || []), newMsg],
    }));

    // Update List preview
    setContacts(prev => prev.map(c => c.id === activeContact.id ? { ...c, lastMessage: inputText, time: timeStr } : c));
    setInputText("");
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#075E54" />
      </View>
    );
  }

  // --- স্ক্রিন ১: হোয়াটসঅ্যাপ ম্যাচিং ডার্ক লগইন পেজ ---
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.authCentered}>
          <View style={styles.authCard}>
            <View style={{ alignItems: "center", marginBottom: 28 }}>
              <Icons.Shield />
              <Text style={styles.authTitle}>SecureChat WhatsApp</Text>
              <Text style={styles.authSubtitle}>End-to-End Encrypted</Text>
            </View>

            <TextInput style={styles.inputField} placeholder="আপনার ইমেইল" placeholderTextColor="#8696a0" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.inputField} placeholder="পাসওয়ার্ড" placeholderTextColor="#8696a0" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />

            <TouchableOpacity style={styles.waButton} onPress={isSignUp ? handleSignUp : handleSignIn}>
              <Text style={styles.waButtonText}>{isSignUp ? "সাইন আপ" : "লগইন"}</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#202c33' }} /><Text style={{ color: '#8696a0', paddingHorizontal: 10, fontSize: 12 }}>OR</Text><View style={{ flex: 1, height: 1, backgroundColor: '#202c33' }} />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity style={styles.waSocialBtn} onPress={handleAnonymousLogin}><Text style={{ color: '#00a884', fontWeight: 'bold' }}>👤 Guest Login</Text></TouchableOpacity>
            </View>

            <TouchableOpacity style={{ marginTop: 24 }} onPress={() => setIsSignUp(!isSignUp)}>
              <Text style={{ color: '#00a884', textAlign: 'center', fontSize: 14 }}>
                {isSignUp ? "আগে অ্যাকাউন্ট আছে? লগইন করুন" : "নতুন অ্যাকাউন্ট তৈরি করুন"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // --- স্ক্রিন ২: হোয়াটসঅ্যাপ মেইন ড্যাশবোর্ড (চ্যাট লিস্ট ভিউ) ---
  if (!activeContact) {
    return (
      <SafeAreaView style={styles.container}>
        {/* WhatsApp Main Top Header */}
        <View style={styles.waHeader}>
          <Text style={styles.waHeaderTitle}>SecureChat</Text>
          <View style={styles.waHeaderIcons}>
            <TouchableOpacity style={styles.iconPadding}><Icons.Camera /></TouchableOpacity>
            <TouchableOpacity style={styles.iconPadding}><Icons.Search /></TouchableOpacity>
            <TouchableOpacity onPress={handleLogOut} style={styles.iconPadding}><Icons.Menu /></TouchableOpacity>
          </View>
        </View>

        {/* WhatsApp Custom Top Tabs */}
        <View style={styles.waTabBar}>
          <TouchableOpacity onPress={() => setCurrentTab("chats")} style={[styles.waTab, currentTab === "chats" && styles.waActiveTab]}>
            <Text style={[styles.waTabText, currentTab === "chats" && styles.waActiveTabText]}>Chats</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentTab("status")} style={[styles.waTab, currentTab === "status" && styles.waActiveTab]}>
            <Text style={[styles.waTabText, currentTab === "status" && styles.waActiveTabText]}>Status</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentTab("calls")} style={[styles.waTab, currentTab === "calls" && styles.waActiveTab]}>
            <Text style={[styles.waTabText, currentTab === "calls" && styles.waActiveTabText]}>Calls</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Body */}
        {currentTab === "chats" ? (
          <ScrollView style={{ flex: 1 }}>
            {contacts.map((item) => (
              <TouchableOpacity key={item.id} style={styles.waChatRow} onPress={() => setActiveContact(item)}>
                {/* Profile Pic/Avatar */}
                <View style={styles.waAvatar}>
                  <Text style={styles.waAvatarText}>{item.avatar}</Text>
                  {item.online && <View style={styles.onlineDot} />}
                </View>
                {/* Names and texts */}
                <View style={styles.waChatRowDetails}>
                  <View style={styles.waRowTopLine}>
                    <Text style={styles.waProfileName}>{item.name}</Text>
                    <Text style={[styles.waRowTime, item.unread > 0 && { color: '#00a884' }]}>{item.time}</Text>
                  </View>
                  <View style={styles.waRowBottomLine}>
                    <Text style={styles.waRowPreview} numberOfLines={1}>{item.lastMessage}</Text>
                    {item.unread > 0 && (
                      <View style={styles.waUnreadBadge}><Text style={styles.waUnreadText}>{item.unread}</Text></View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#8696a0' }}>হোয়াটসঅ্যাপের এই ফিচারটি শীঘ্রই আসছে...</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // --- স্ক্রিন ৩: হোয়াটসঅ্যাপ রিয়েল চ্যাট স্ক্রিন (ইনসাইড চ্যাট) ---
  const activeMessages = messages[activeContact.id] || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* চ্যাট স্ক্রিন হেডার */}
      <View style={styles.waChatHeader}>
        <TouchableOpacity onPress={() => setActiveContact(null)} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icons.Back />
          <View style={[styles.waAvatar, { width: 36, height: 36, marginLeft: 4, marginRight: 8 }]}>
            <Text style={[styles.waAvatarText, { fontSize: 14 }]}>{activeContact.avatar}</Text>
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.waProfileName}>{activeContact.name}</Text>
          <Text style={{ color: '#8696a0', fontSize: 12 }}>{activeContact.online ? "online" : "offline"}</Text>
        </View>
        <View style={styles.waHeaderIcons}>
          <TouchableOpacity style={styles.iconPadding}><Icons.Menu /></TouchableOpacity>
        </View>
      </View>

      {/* হোয়াটসঅ্যাপ চ্যাট ওয়ালপেপার ব্যাকগ্রাউন্ড */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: '#0b141a' }}>
        <ScrollView 
          ref={messagesEndRef}
          style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 8 }}
          onContentSizeChange={() => messagesEndRef.current?.scrollToEnd({ animated: true })}
        >
          {activeMessages.map((msg) => (
            <View key={msg.id} style={[styles.waMsgBubble, msg.sent ? styles.waSentBubble : styles.waReceivedBubble]}>
              <Text style={{ color: '#e9edef', fontSize: 15 }}>{msg.text}</Text>
              <View style={styles.waMsgFooter}>
                <Text style={styles.waMsgTime}>{msg.time}</Text>
                {msg.sent && <Icons.DoubleTick color={msg.status === 'read' ? '#53bdeb' : '#8696a0'} />}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* হোয়াটসঅ্যাপ স্টাইল বটম ইনপুট বার */}
        <View style={styles.waInputBar}>
          <View style={styles.waInputMainBox}>
            <TextInput
              style={styles.waTextInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Message"
              placeholderTextColor="#8696a0"
              multiline
            />
          </View>
          <TouchableOpacity style={styles.waSendCircle} onPress={handleSendMessage}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// WhatsApp Original Dark Theme Colors
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111b21" },
  authCentered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  authCard: { width: "100%", maxWidth: 350, backgroundColor: "#222e35", padding: 24, borderRadius: 12 },
  authTitle: { color: "#e9edef", fontSize: 20, fontWeight: "bold", marginTop: 12 },
  authSubtitle: { color: "#8696a0", fontSize: 12, marginTop: 4 },
  inputField: { width: "100%", backgroundColor: "#2a3942", color: "#fff", padding: 14, borderRadius: 8, marginBottom: 16 },
  waButton: { width: "100%", backgroundColor: "#00a884", padding: 14, borderRadius: 24, alignItems: "center" },
  waButtonText: { color: "#111b21", fontSize: 16, fontWeight: "bold" },
  waSocialBtn: { flex: 1, backgroundColor: "#2a3942", padding: 12, borderRadius: 8, alignItems: "center" },
  
  // Custom Header
  waHeader: { height: 60, flexDirection: 'row', backgroundColor: '#202c33', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  waHeaderTitle: { color: '#e9edef', fontSize: 21, fontWeight: '600' },
  waHeaderIcons: { flexDirection: 'row', alignItems: 'center' },
  iconPadding: { paddingHorizontal: 12 },
  
  // Custom TabBar
  waTabBar: { height: 48, flexDirection: 'row', backgroundColor: '#202c33' },
  waTab: { flex: 1, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  waActiveTab: { borderBottomColor: '#00a884' },
  waTabText: { color: '#8696a0', fontSize: 14, fontWeight: 'bold' },
  waActiveTabText: { color: '#00a884' },
  
  // Chat Rows
  waChatRow: { flexDirection: 'row', height: 72, paddingHorizontal: 16, alignItems: 'center' },
  waAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#687c87', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  waAvatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  onlineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#00a884', position: 'absolute', bottom: 2, right: 2, borderWidth: 2, borderColor: '#111b21' },
  waChatRowDetails: { flex: 1, marginLeft: 14, height: '100%', justifyContent: 'center', borderBottomWidth: 0.5, borderBottomColor: '#202c33' },
  waRowTopLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  waProfileName: { color: '#e9edef', fontSize: 16, fontWeight: '500' },
  waRowTime: { color: '#8696a0', fontSize: 12 },
  waRowBottomLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  waRowPreview: { color: '#8696a0', fontSize: 14, flex: 1, paddingRight: 10 },
  waUnreadBadge: { backgroundColor: '#00a884', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  waUnreadText: { color: '#111b21', fontSize: 12, fontWeight: 'bold' },

  // Chat Interface Inside
  waChatHeader: { height: 60, backgroundColor: '#202c33', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  waMsgBubble: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginBottom: 6, maxWidth: '85%' },
  waSentBubble: { backgroundColor: '#005c4b', alignSelf: 'flex-end', borderTopRightRadius: 0 },
  waReceivedBubble: { backgroundColor: '#202c33', alignSelf: 'flex-start', borderTopLeftRadius: 0 },
  waMsgFooter: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 2 },
  waMsgTime: { color: '#8696a0', fontSize: 10, marginRight: 4 },

  // Bottom Input Bar
  waInputBar: { flexDirection: 'row', padding: 8, backgroundColor: 'transparent', alignItems: 'center' },
  waInputMainBox: { flex: 1, backgroundColor: '#202c33', borderRadius: 24, paddingHorizontal: 16, minHeight: 44, justifyContent: 'center' },
  waTextInput: { color: '#fff', fontSize: 16, paddingVertical: 6 },
  waSendCircle: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#00a884', justifyContent: 'center', alignItems: 'center', marginLeft: 6 }
});