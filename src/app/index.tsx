import React, { useState, useRef, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StatusBar,
  Animated,
  Dimensions
} from "react-native";
import { Svg, Rect, Path, Circle } from "react-native-svg";

const { width } = Dimensions.get("window");

const CONTACTS = [
  { id: 1, name: "রাফি আহমেদ", avatar: "RA", status: "online", lastSeen: "এখন", color: "#00e5ff" },
  { id: 2, name: "সাবরিনা ইসলাম", avatar: "SI", status: "online", lastSeen: "এখন", color: "#ff4081" },
  { id: 3, name: "তানভীর হোসেন", avatar: "TH", status: "offline", lastSeen: "৩০ মিনিট আগে", color: "#76ff03" },
  { id: 4, name: "নাফিসা রহমান", avatar: "NR", status: "offline", lastSeen: "২ ঘণ্টা আগে", color: "#ffab40" },
];

const INITIAL_MESSAGES = {
  1: [
    { id: 1, text: "হ্যালো! কেমন আছো?", sent: false, time: "১০:০০", encrypted: true },
    { id: 2, text: "ভালো আছি, তুমি কেমন?", sent: true, time: "১০:০২", encrypted: true },
    { id: 3, text: "এই অ্যাপটা দারুণ! সব মেসেজ এনক্রিপ্টেড 🔒", sent: false, time: "১০:০৫", encrypted: true },
  ],
  2: [
    { id: 1, text: "আজকের মিটিং কয়টায়?", sent: false, time: "০৯:৩০", encrypted: true },
    { id: 2, text: "বিকাল ৩টায়।", sent: true, time: "০৯:৩২", encrypted: true },
  ],
  3: [],
  4: [
    { id: 1, text: "প্রজেক্টের আপডেট পাঠাও", sent: true, time: "গতকাল", encrypted: true },
  ],
};

// Svg Icons converted for React Native SVG
function LockIcon() {
  return (
    <Svg width="10" height="12" viewBox="0 0 10 12" fill="none">
      <Rect x="1" y="5" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <Path d="M2.5 5V3.5a2.5 2.5 0 015 0V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <Circle cx="5" cy="8.5" r="1" fill="currentColor"/>
    </Svg>
  );
}

function ShieldIcon() {
  return (
    <Svg width="16" height="18" viewBox="0 0 16 18" fill="none">
      <Path d="M8 1L2 3.5V8c0 3.5 2.5 6.5 6 7.5 3.5-1 6-4 6-7.5V3.5L8 1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <Path d="M5 9l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function SendIcon({ color }) {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <Path d="M16 2L8 10M16 2L11 16L8 10M16 2L2 7L8 10" stroke={color || "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function BackIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <Path d="M12 15L7 10L12 5" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

export default function index() {
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [showEncryptAnim, setShowEncryptAnim] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showEncryptAnim) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showEncryptAnim]);

  const sendMessage = () => {
    if (!input.trim() || !activeContact) return;
    const newMsg = {
      id: Date.now(),
      text: input.trim(),
      sent: true,
      time: new Date().toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" }),
      encrypted: true,
    };
    setMessages(prev => ({
      ...prev,
      [activeContact.id]: [...(prev[activeContact.id] || []), newMsg],
    }));
    setInput("");
    setShowEncryptAnim(true);
    setTimeout(() => setShowEncryptAnim(false), 1200);
  };

  const filtered = CONTACTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const currentMessages = activeContact ? messages[activeContact.id] || [] : [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#060a10" />
      
      {!activeContact ? (
        // Sidebar / Contact List View
        <View style={styles.innerContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={{ color: "#00e5ff" }}><ShieldIcon /></View>
              <Text style={styles.headerTitle}>SecureChat</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>E2E ENCRYPTED</Text>
              </View>
            </View>
            <TextInput
              placeholder="🔍  যোগাযোগ খুঁজুন..."
              placeholderTextColor="#2e4a5a"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
          </View>

          {/* Contact List */}
          <ScrollView style={styles.contactList}>
            {filtered.map(contact => {
              const lastMsg = messages[contact.id]?.slice(-1)[0];
              return (
                <TouchableOpacity
                  key={contact.id}
                  onClick={() => setActiveContact(contact)}
                  style={styles.contactItem}
                >
                  <View style={styles.avatarContainer}>
                    <View style={[styles.avatar, { backgroundColor: `${contact.color}20`, borderColor: `${contact.color}40` }]}>
                      <Text style={[styles.avatarText, { color: contact.color }]}>{contact.avatar}</Text>
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: contact.status === "online" ? "#00e676" : "#546e7a" }]} />
                  </View>
                  
                  <View style={styles.contactDetails}>
                    <View style={styles.contactRow}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      <Text style={styles.contactTime}>{lastMsg?.time || ""}</Text>
                    </View>
                    <View style={styles.msgRow}>
                      <Text style={styles.lockIconMini}><LockIcon /></Text>
                      <Text style={styles.lastMsgText} numberOfLines={1}>
                        {lastMsg ? lastMsg.text : "কোনো মেসেজ নেই"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer Badge */}
          <View style={styles.footerBadge}>
            <Text style={{ color: "#2e4a5a", marginRight: 6 }}><LockIcon /></Text>
            <Text style={styles.footerBadgeText}>সকল মেসেজ এন্ড-টু-এন্ড এনক্রিপ্টেড</Text>
          </View>
        </View>
      ) : (
        // Chat Panel View
        <View style={styles.innerContainer}>
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setActiveContact(null)} style={styles.backButton}>
              <BackIcon />
            </TouchableOpacity>
            
            <View style={styles.avatarContainer}>
              <View style={[styles.avatarSmall, { backgroundColor: `${activeContact.color}20`, borderColor: `${activeContact.color}50` }]}>
                <Text style={[styles.avatarTextSmall, { color: activeContact.color }]}>{activeContact.avatar}</Text>
              </View>
              <View style={[styles.statusDotSmall, { backgroundColor: activeContact.status === "online" ? "#00e676" : "#546e7a" }]} />
            </View>

            <View style={styles.chatHeaderDetails}>
              <Text style={styles.chatContactName}>{activeContact.name}</Text>
              <Text style={[styles.chatStatusText, { color: activeContact.status === "online" ? "#00e676" : "#546e7a" }]}>
                {activeContact.status === "online" ? "● অনলাইন" : `শেষ দেখা ${activeContact.lastSeen}`}
              </Text>
            </View>

            <View style={styles.chatEncryptedBadge}>
              <Text style={{ color: "#00e5ff", marginRight: 4 }}><LockIcon /></Text>
              <Text style={styles.chatEncryptedBadgeText}>এনক্রিপ্টেড</Text>
            </View>
          </View>

          {/* Encrypt Animation Bar */}
          {showEncryptAnim && (
            <Animated.View style={[styles.encryptBar, { opacity: fadeAnim }]}>
              <Text style={styles.encryptBarText}>🔐 মেসেজ এনক্রিপ্ট হচ্ছে...</Text>
            </Animated.View>
          )}

          {/* Messages Area */}
          <ScrollView 
            style={styles.messageArea}
            ref={messagesEndRef}
            onContentSizeChange={() => messagesEndRef.current?.scrollToEnd({ animated: true })}
          >
            {currentMessages.length === 0 && (
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatIcon}>🔒</Text>
                <Text style={styles.emptyChatText}>কথোপকথন শুরু করুন</Text>
                <Text style={styles.emptyChatSubText}>সব মেসেজ এন্ড-টু-এন্ড এনক্রিপ্টেড</Text>
              </View>
            )}
            
            {currentMessages.map((msg) => (
              <View key={msg.id} style={[styles.messageRowContainer, { justifyContent: msg.sent ? "flex-end" : "flex-start" }]}>
                <View style={[
                  styles.messageBubble, 
                  msg.sent ? styles.messageSent : styles.messageReceived
                ]}>
                  <Text style={styles.messageText}>{msg.text}</Text>
                  <View style={styles.msgTimeContainer}>
                    <Text style={styles.lockIconMicro}><LockIcon /></Text>
                    <Text style={styles.msgTimeText}>{msg.time}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Input Area */}
          <View style={styles.inputArea}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="মেসেজ লিখুন..."
              placeholderTextColor="#2e4a5a"
              style={styles.chatInput}
            />
            <TouchableOpacity 
              onPress={sendMessage} 
              disabled={!input.trim()}
              style={[
                styles.sendButton, 
                { backgroundColor: input.trim() ? "#00b8d4" : "rgba(0,229,255,0.05)" }
              ]}
            >
              <SendIcon color={input.trim() ? "#060a10" : "#1e3040"} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    background: "#060a10",
    backgroundColor: "#060a10",
  },
  innerContainer: {
    flex: 1,
    backgroundColor: "rgba(8,14,24,0.97)",
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,229,255,0.08)",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    color: "#00e5ff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 10,
    letterSpacing: 1,
  },
  badge: {
    marginLeft: "auto",
    backgroundColor: "rgba(0,229,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.2)",
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 9,
    color: "#00e5ff",
    letterSpacing: 1,
  },
  searchInput: {
    width: "100%",
    backgroundColor: "rgba(0,229,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.12)",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    color: "#b0c4d8",
    fontSize: 13,
  },
  contactList: {
    flex: 1,
    paddingVertical: 8,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.03)",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontWeight: "700",
    fontSize: 13,
  },
  statusDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#060a10",
  },
  contactDetails: {
    flex: 1,
    marginLeft: 12,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contactName: {
    color: "#dce9f5",
    fontWeight: "600",
    fontSize: 14,
  },
  contactTime: {
    color: "#546e7a",
    fontSize: 11,
  },
  msgRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  lockIconMini: {
    color: "#00e5ff",
    opacity: 0.5,
    marginRight: 4,
  },
  lastMsgText: {
    color: "#546e7a",
    fontSize: 12,
    flex: 1,
  },
  footerBadge: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,229,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  footerBadgeText: {
    color: "#2e4a5a",
    fontSize: 11,
  },
  chatHeader: {
    backgroundColor: "rgba(8,14,24,0.98)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,229,255,0.08)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  avatarSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTextSmall: {
    fontWeight: "700",
    fontSize: 12,
  },
  statusDotSmall: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 2,
    borderColor: "#060a10",
  },
  chatHeaderDetails: {
    flex: 1,
    marginLeft: 12,
  },
  chatContactName: {
    color: "#dce9f5",
    fontWeight: "600",
    fontSize: 15,
  },
  chatStatusText: {
    fontSize: 11,
    marginTop: 1,
  },
  chatEncryptedBadge: {
    backgroundColor: "rgba(0,229,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.15)",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  chatEncryptedBadgeText: {
    color: "#00e5ff",
    fontSize: 10,
    letterSpacing: 1,
  },
  encryptBar: {
    backgroundColor: "rgba(0,229,255,0.08)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,229,255,0.15)",
    paddingVertical: 6,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  encryptBarText: {
    color: "#00e5ff",
    fontSize: 11,
  },
  messageArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyChatIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyChatText: {
    fontSize: 13,
    color: "#1e3040",
    fontWeight: "600",
  },
  emptyChatSubText: {
    fontSize: 11,
    color: "#1a2a35",
    marginTop: 4,
  },
  messageRowContainer: {
    flexDirection: "row",
    marginVertical: 5,
    width: "100%",
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  messageSent: {
    backgroundColor: "#006778",
    borderColor: "rgba(0,229,255,0.2)",
    borderBottomRightRadius: 4,
  },
  messageReceived: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.06)",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: "#dce9f5",
    fontSize: 14,
    lineHeight: 20,
  },
  msgTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  lockIconMicro: {
    color: "#00e5ff",
    opacity: 0.5,
    fontSize: 9,
    marginRight: 4,
  },
  msgTimeText: {
    color: "#546e7a",
    fontSize: 10,
  },
  inputArea: {
    backgroundColor: "rgba(8,14,24,0.98)",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,229,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "rgba(0,229,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.12)",
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    color: "#dce9f5",
    fontSize: 14,
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});