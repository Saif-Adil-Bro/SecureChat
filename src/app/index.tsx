import React, { useState, useRef } from "react";
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
  Dimensions,
} from "react-native";
import { Svg, Rect, Path, Circle } from "react-native-svg";

// Types Definition
interface Contact {
  id: number;
  name: string;
  avatar: string;
  status: string;
  lastSeen: string;
  color: string;
}

interface Message {
  id: number;
  text: string;
  sent: boolean;
  time: string;
  encrypted: boolean;
}

interface MessagesState {
  [key: number]: Message[];
}

// Icons
function ShieldIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
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

function SendIcon({ color }: { color: string }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Line x1="22" y1="2" x2="11" y2="13" />
      <Polygon points="22 2 15 22 11 13 2 9 22 2" />
    </Svg>
  );
}

// Dummy helper component for subline missing React Native elements
function Line(props: any) { return <Path d={`M${props.x1} ${props.y1} L${props.x2} ${props.y2}`} {...props} /> }
function Polygon(props: any) { return <Path d={`M ${props.points}`} {...props} /> }

const contactsData: Contact[] = [
  { id: 1, name: "টপ সিক্রেট গ্রুপ", avatar: "TG", status: "online", lastSeen: "", color: "#00e5ff" },
  { id: 2, name: "রকিব (Agent X)", avatar: "RX", status: "online", lastSeen: "", color: "#ff3d00" },
  { id: 3, name: "তাসনিম (HQ)", avatar: "TH", status: "offline", lastSeen: "১০ মিনিট আগে", color: "#00e676" },
  { id: 4, name: "বসের ফোন", avatar: "BP", status: "offline", lastSeen: "১ ঘণ্টা আগে", color: "#ffea00" },
];

const initialMessages: MessagesState = {
  1: [
    { id: 1, text: "নতুন সিকিউর মেসেঞ্জার কোডটি কি রেডি?", sent: false, time: "১০:০৫ AM", encrypted: true },
    { id: 2, text: "হ্যাঁ ভাই, UI এবং টাইপস্ক্রিপ্ট সব ফিক্স করা হয়েছে।", sent: true, time: "১০:০৬ AM", encrypted: true },
  ],
  2: [],
  3: [],
  4: [],
};

export default function SecureChat() {
  const [contacts] = useState<Contact[]>(contactsData);
  const [activeContact, setActiveContact] = useState<Contact | null>(contactsData[0]);
  const [messages, setMessages] = useState<MessagesState>(initialMessages);
  const [inputText, setInputText] = useState("");
  
  const messagesEndRef = useRef<ScrollView>(null);

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeContact) return;

    const newMsg: Message = {
      id: Date.now(),
      text: inputText,
      sent: true,
      time: "১০:১০ AM",
      encrypted: true,
    };

    setMessages((prev) => ({
      ...prev,
      [activeContact.id]: [...(prev[activeContact.id] || []), newMsg],
    }));

    setInputText("");
  };

  const currentMessages = activeContact ? messages[activeContact.id] || [] : [];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.innerContainer}>
        
        {/* Sidebar/Contact List if no active contact or full screen split */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ marginRight: 8 }}><ShieldIcon /></View>
            <Text style={styles.headerTitle}>SecureChat V2.8</Text>
          </View>
        </View>

        <ScrollView style={styles.contactList} horizontal showsHorizontalScrollIndicator={false}>
          {contacts.map((contact) => {
            const lastMsg = messages[contact.id]?.slice(-1)[0];
            return (
              <TouchableOpacity
                key={contact.id}
                onPress={() => setActiveContact(contact)}
                style={[styles.contactCard, activeContact?.id === contact.id && styles.activeContactCard]}
              >
                <Text style={[styles.avatarText, { color: contact.color }]}>{contact.avatar}</Text>
                <Text style={styles.contactName} numberOfLines={1}>{contact.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Chat Area */}
        {activeContact ? (
          <View style={styles.chatArea}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>{activeContact.name}</Text>
              <Text style={styles.chatStatus}>
                {activeContact.status === "online" ? "● অনলাইন" : `শেষ দেখা ${activeContact.lastSeen}`}
              </Text>
            </View>

            <ScrollView 
              ref={messagesEndRef}
              style={styles.messageContainer}
              onContentSizeChange={() => messagesEndRef.current?.scrollToEnd({ animated: true })}
            >
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
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="গোপন বার্তা লিখুন..."
                placeholderTextColor="#546e7a"
              />
              <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
                <SendIcon color="#00e5ff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.welcomeArea}>
            <Text style={styles.welcomeText}>চ্যাট শুরু করতে যেকোনো একটি কন্টাক্ট সিলেক্ট করুন</Text>
          </View>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060a10",
  },
  innerContainer: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#102a43",
    backgroundColor: "#0b1528",
  },
  headerTitle: {
    color: "#00e5ff",
    fontSize: 18,
    fontWeight: "bold",
  },
  contactList: {
    padding: 10,
    backgroundColor: "#0b1528",
    maxHeight: 80,
  },
  contactCard: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#102a43",
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    flexDirection: "row",
  },
  activeContactCard: {
    backgroundColor: "#00e5ff20",
    borderColor: "#00e5ff",
    borderWidth: 1,
  },
  avatarText: {
    fontWeight: "bold",
    marginRight: 6,
  },
  contactName: {
    color: "#ffffff",
    fontSize: 13,
  },
  chatArea: {
    flex: 1,
    backgroundColor: "#060a10",
  },
  chatHeader: {
    padding: 12,
    backgroundColor: "#0b1528",
    borderBottomWidth: 1,
    borderBottomColor: "#102a43",
  },
  chatTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  chatStatus: {
    color: "#00e676",
    fontSize: 12,
  },
  messageContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    maxWidth: "80%",
  },
  sentBubble: {
    backgroundColor: "#00e5ff15",
    alignSelf: "flex-end",
    borderWidth: 1,
    borderColor: "#00e5ff30",
  },
  receivedBubble: {
    backgroundColor: "#102a43",
    alignSelf: "flex-start",
  },
  messageText: {
    color: "#ffffff",
    fontSize: 15,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  messageTime: {
    color: "#546e7a",
    fontSize: 10,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#0b1528",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#102a43",
    color: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 8,
  },
  sendButton: {
    padding: 10,
  },
  welcomeArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeText: {
    color: "#546e7a",
  },
});