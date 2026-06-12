import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';

export default function ChatPanel({ isOpen, onClose, session, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const API_BASE = '/api';

  const getAuthHeaders = (extraHeaders = {}) => {
    const token = localStorage.getItem('edubridge_token');
    return {
      'Content-Type': 'application/json',
      ...extraHeaders,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  const fetchMessages = async () => {
    if (!session) return;
    try {
      const response = await fetch(`${API_BASE}/messages/${session.id}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (err) {
      console.warn("Failed to fetch messages from server, using local storage simulation.", err);
      // Local storage fallback
      const localKey = `messages_${session.id}`;
      const saved = localStorage.getItem(localKey);
      if (saved) {
        setMessages(JSON.parse(saved));
      }
    }
  };

  // Poll for new messages every 3 seconds while open
  useEffect(() => {
    if (!session) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [session?.id]);

  // Scroll to bottom when messages load
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const payload = {
      sessionId: session.id,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.name || 'User',
      text: inputText
    };

    setInputText('');

    try {
      const response = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const newMessage = await response.json();
        setMessages(prev => [...prev, newMessage]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // Fallback local storage mock
      const mockMsg = {
        id: `msg_${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString()
      };
      const updated = [...messages, mockMsg];
      setMessages(updated);
      const localKey = `messages_${session.id}`;
      localStorage.setItem(localKey, JSON.stringify(updated));
    }
  };

  const otherPartyName = currentUser?.role === 'Parent' ? session?.teacherName : session?.studentName || 'Parent';

  if (!isOpen || !session) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-brand-charcoal/40 backdrop-blur-2xs" onClick={onClose} />
      
      {/* Chat Container */}
      <div className="relative w-full max-w-md bg-brand-cream border-l border-brand-moss/10 h-full flex flex-col justify-between shadow-2xl z-10 animate-slide-in">
        
        {/* Header */}
        <div className="p-6 border-b border-brand-moss/10 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-moss/5 border border-brand-moss/10 flex items-center justify-center text-brand-moss">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-brand-moss text-base">Chat with {otherPartyName}</h3>
              <span className="font-sans text-[10px] text-brand-charcoal/50 block uppercase tracking-wide">
                Class Session Chat Registry
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-brand-moss/60 hover:text-brand-moss">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message logs */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-brand-cream/40">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-brand-charcoal/40 space-y-2 p-8 font-sans">
              <MessageSquare className="w-8 h-8 text-brand-moss/10" />
              <p className="text-xs">No messages yet. Say hello to begin scheduling or coordination details!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderId === currentUser.uid;
              return (
                <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="font-mono text-[9px] text-brand-charcoal/40 mb-1">{msg.senderName}</span>
                  <div className={`p-4 rounded-[1.5rem] max-w-[85%] font-sans text-xs leading-relaxed shadow-xs ${
                    isMe 
                      ? 'bg-brand-moss text-brand-cream rounded-tr-none'
                      : 'bg-white text-brand-charcoal border border-brand-moss/10 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Footer input */}
        <form onSubmit={handleSend} className="p-4 border-t border-brand-moss/10 bg-white flex items-center gap-3">
          <input
            type="text"
            placeholder="Type your message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-brand-cream/50 border border-brand-moss/15 rounded-full px-5 py-3 font-sans text-xs text-brand-charcoal focus:outline-none focus:border-brand-clay"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white flex items-center justify-center shrink-0 shadow-md shadow-brand-clay/10 transition-colors disabled:opacity-40 disabled:shadow-none"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>

      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
}
