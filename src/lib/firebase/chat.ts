import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, updateDoc, onSnapshot, arrayUnion } from "firebase/firestore";

export interface ChatMessage {
  id: string;
  senderWallet: string;
  text: string;
  createdAt: number;
}

export async function sendMessage(contractId: string, senderWallet: string, text: string) {
  if (!text.trim()) return;
  
  const docRef = doc(db, "chats", contractId);
  const newMsg: ChatMessage = {
    id: "msg_" + Math.random().toString(36).substring(2, 11),
    senderWallet,
    text: text.trim(),
    createdAt: Date.now(),
  };

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, {
        messages: arrayUnion(newMsg)
      });
    } else {
      await setDoc(docRef, {
        messages: [newMsg]
      });
    }
  } catch (e) {
    console.error("Firestore sendMessage failed:", e);
  }
}

export function subscribeToMessages(contractId: string, callback: (messages: ChatMessage[]) => void) {
  const docRef = doc(db, "chats", contractId);
  
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback(data.messages || []);
    } else {
      callback([]);
    }
  }, (err) => {
    console.error("Firestore chat subscription failed:", err);
    callback([]);
  });

  return unsubscribe;
}
