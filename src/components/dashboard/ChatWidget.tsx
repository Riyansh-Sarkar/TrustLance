"use client";

import React, { useEffect, useState, useRef } from "react";
import { Send, MessageSquare } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { subscribeToMessages, sendMessage, ChatMessage } from "@/lib/firebase/chat";
import { toast } from "sonner";

interface ChatWidgetProps {
  contractId: string;
}

export function ChatWidget({ contractId }: ChatWidgetProps) {
  const { publicKey } = useWallet();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(contractId, (msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [contractId]);

  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    
    // Check if we are near the bottom (within 100px)
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    if (isInitialLoad.current || isNearBottom) {
      containerRef.current.scrollTop = scrollHeight;
      isInitialLoad.current = false;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !newMessage.trim() || isSending) return;
    
    const text = newMessage;
    setNewMessage(""); // Optimistic clear
    setIsSending(true);
    try {
      await sendMessage(contractId, publicKey, text);
    } catch {
      // Restore the message so the user can retry
      setNewMessage(text);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-bg-base border border-edge-neutral shadow-neopop flex flex-col h-[500px]">
      {/* Header */}
      <div className="p-4 border-b-2 border-edge-neutral flex items-center gap-3 bg-bg-interactive">
        <MessageSquare className="w-5 h-5 text-ink-primary" />
        <h3 className="font-ui-label text-sm uppercase tracking-widest font-bold text-ink-primary">Contract Chat</h3>
      </div>

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-ink-tertiary">
            <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
            <p className="font-ui-label text-xs uppercase tracking-widest">No messages yet.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderWallet === publicKey;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className="flex items-end gap-2 mb-1">
                  <span className="font-mono-data text-[10px] uppercase tracking-wider text-ink-tertiary">
                    {isMe ? "You" : msg.senderWallet.substring(0, 6) + "..."}
                  </span>
                  <span className="font-mono-data text-[10px] text-ink-tertiary/50">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={`p-3 max-w-[80%] font-ui-label text-sm break-words border-2 ${
                  isMe 
                    ? "bg-accent/10 border-accent/30 text-ink-primary rounded-l-xl rounded-tr-xl" 
                    : "bg-black/5 border-edge-neutral text-ink-primary rounded-r-xl rounded-tl-xl"
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t-2 border-edge-neutral bg-bg-base">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={!publicKey || isSending}
            placeholder={publicKey ? "Type a message..." : "Connect wallet to chat"}
            className="flex-1 bg-transparent border-2 border-edge-neutral focus:border-accent outline-none px-4 py-3 font-ui-label text-sm transition-colors placeholder:text-ink-tertiary"
          />
          <button
            type="submit"
            disabled={!publicKey || !newMessage.trim() || isSending}
            className="bg-ink-primary hover:bg-ink-primary/90 text-bg-base px-6 py-3 border-2 border-ink-primary transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
