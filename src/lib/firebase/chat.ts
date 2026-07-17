export interface ChatMessage {
  id: string;
  senderWallet: string;
  text: string;
  createdAt: number;
}

export async function sendMessage(contractId: string, senderWallet: string, text: string) {
  if (!text.trim()) return;
  
  const key = `trustlance_mock_chat_${contractId}`;
  let messages: ChatMessage[] = [];
  try {
    const stored = localStorage.getItem(key);
    if (stored) messages = JSON.parse(stored);
  } catch {}
  
  const newMsg: ChatMessage = {
    id: "msg_" + Math.random().toString(36).substring(2, 11),
    senderWallet,
    text: text.trim(),
    createdAt: Date.now(),
  };
  
  messages.push(newMsg);
  try {
    localStorage.setItem(key, JSON.stringify(messages));
    window.dispatchEvent(new CustomEvent(`chat-update-${contractId}`));
  } catch {}
}

export function subscribeToMessages(contractId: string, callback: (messages: ChatMessage[]) => void) {
  const key = `trustlance_mock_chat_${contractId}`;
  
  const readAndCallback = () => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        callback(JSON.parse(stored));
      } else {
        callback([]);
      }
    } catch {
      callback([]);
    }
  };
  
  readAndCallback();
  
  const handleUpdate = () => {
    readAndCallback();
  };
  
  if (typeof window !== "undefined") {
    window.addEventListener(`chat-update-${contractId}`, handleUpdate);
  }
  
  const interval = setInterval(readAndCallback, 2000);
  
  return () => {
    clearInterval(interval);
    if (typeof window !== "undefined") {
      window.removeEventListener(`chat-update-${contractId}`, handleUpdate);
    }
  };
}
