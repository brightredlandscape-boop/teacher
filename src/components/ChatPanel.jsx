import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  MessageSquare, 
  Paperclip, 
  FileText, 
  Download, 
  Image as ImageIcon, 
  Loader2, 
  Check, 
  FileCheck 
} from 'lucide-react';

export default function ChatPanel({ isOpen, onClose, session, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const API_BASE = '/api';

  const getAuthHeaders = (extraHeaders = {}) => {
    const token = localStorage.getItem('eduvista_token');
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
      console.warn("Failed to fetch messages from server, using local fallback.", err);
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

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle file select and upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File size exceeds 20MB limit.');
      return;
    }

    setUploadError('');
    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const fileData = reader.result;
        try {
          const res = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              fileData
            })
          });

          if (res.ok) {
            const data = await res.json();
            setAttachment({
              fileUrl: data.url,
              fileName: data.fileName || file.name,
              fileType: data.fileType || file.type,
              fileSize: data.fileSize || file.size
            });
          } else {
            // Local fallback data URL
            setAttachment({
              fileUrl: fileData,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size
            });
          }
        } catch (netErr) {
          console.warn("Upload endpoint fallback to client data URL:", netErr);
          setAttachment({
            fileUrl: fileData,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size
          });
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File reading failed:', err);
      setUploadError('Failed to process selected file.');
      setIsUploading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !attachment) return;

    const payload = {
      sessionId: session.id,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.name || 'User',
      text: inputText.trim(),
      attachment: attachment || null
    };

    const currentAttachment = attachment;
    setInputText('');
    setAttachment(null);

    try {
      const response = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const newMessage = await response.json();
        setMessages(prev => [...prev, newMessage]);
      } else {
        throw new Error('Message send failed');
      }
    } catch (err) {
      console.error('Error sending message, persisting to local storage:', err);
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

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
        <div className="p-5 border-b border-brand-moss/10 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-moss/5 border border-brand-moss/10 flex items-center justify-center text-brand-moss">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-brand-moss text-base">Chat with {otherPartyName}</h3>
              <span className="font-sans text-[10px] text-brand-charcoal/50 block uppercase tracking-wide">
                Live Session & Homework Drop
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full flex items-center justify-center text-brand-moss/60 hover:text-brand-moss hover:bg-brand-moss/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message logs */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-brand-cream/40">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-brand-charcoal/40 space-y-3 p-8 font-sans">
              <div className="w-12 h-12 rounded-full bg-brand-moss/5 flex items-center justify-center text-brand-moss/40">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm text-brand-moss">Direct Session Channel</h4>
                <p className="text-xs text-brand-charcoal/60 mt-1">
                  Exchange real-time lesson notes, syllabus questions, and attach homework worksheets or exam past papers.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderId === currentUser.uid;
              const hasAttachment = Boolean(msg.attachment);
              const isImage = hasAttachment && (
                msg.attachment.fileType?.startsWith('image/') || 
                /\.(png|jpe?g|webp|gif)$/i.test(msg.attachment.fileName || '')
              );

              return (
                <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="font-mono text-[9px] text-brand-charcoal/45 mb-1 px-1">
                    {msg.senderName} · {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                  
                  <div className={`p-4 rounded-[1.5rem] max-w-[85%] font-sans text-xs leading-relaxed shadow-xs space-y-2 ${
                    isMe 
                      ? 'bg-brand-moss text-brand-cream rounded-tr-none' 
                      : 'bg-white text-brand-charcoal border border-brand-moss/10 rounded-tl-none'
                  }`}>
                    {msg.text && (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}

                    {/* Attachment preview / download badge */}
                    {hasAttachment && (
                      <div className="pt-1">
                        {isImage ? (
                          <a 
                            href={msg.attachment.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block rounded-xl overflow-hidden border border-brand-cream/20 hover:opacity-95 transition-opacity"
                          >
                            <img 
                              src={msg.attachment.fileUrl} 
                              alt={msg.attachment.fileName || 'Attachment'} 
                              className="max-h-48 w-full object-cover rounded-xl"
                            />
                            <span className="font-mono text-[9px] block p-1.5 truncate text-center opacity-75">
                              {msg.attachment.fileName}
                            </span>
                          </a>
                        ) : (
                          <a 
                            href={msg.attachment.fileUrl} 
                            download={msg.attachment.fileName}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors ${
                              isMe 
                                ? 'bg-white/10 border-white/20 hover:bg-white/15 text-brand-cream' 
                                : 'bg-brand-cream/40 border-brand-moss/15 hover:bg-brand-cream text-brand-moss'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-brand-clay/10 text-brand-clay flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-[11px] block truncate">{msg.attachment.fileName}</span>
                              <span className="font-mono text-[9px] opacity-60 block">
                                {formatFileSize(msg.attachment.fileSize) || 'Document'}
                              </span>
                            </div>
                            <Download className="w-4 h-4 shrink-0 opacity-70" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Staged attachment banner */}
        {attachment && (
          <div className="px-4 py-2.5 bg-brand-moss/5 border-t border-brand-moss/10 flex items-center justify-between text-xs font-sans">
            <div className="flex items-center gap-2 min-w-0">
              <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="font-bold text-brand-moss truncate block">{attachment.fileName}</span>
                <span className="font-mono text-[9px] text-brand-charcoal/50">{formatFileSize(attachment.fileSize)}</span>
              </div>
            </div>
            <button 
              onClick={() => setAttachment(null)}
              className="text-brand-charcoal/40 hover:text-brand-clay p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload error banner */}
        {uploadError && (
          <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 text-rose-700 text-[11px] font-mono">
            {uploadError}
          </div>
        )}

        {/* Footer input */}
        <form onSubmit={handleSend} className="p-4 border-t border-brand-moss/10 bg-white flex items-center gap-2">
          {/* Hidden file input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.zip" 
            className="hidden" 
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Attach past questions, worksheet, or homework (PDF/Images)"
            className="w-10 h-10 rounded-full border border-brand-moss/15 text-brand-moss hover:bg-brand-moss/5 flex items-center justify-center shrink-0 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand-clay" />
            ) : (
              <Paperclip className="w-4.5 h-4.5" />
            )}
          </button>

          <input
            type="text"
            placeholder={attachment ? "Add notes about this attachment..." : "Type your message..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-brand-cream/50 border border-brand-moss/15 rounded-full px-5 py-3 font-sans text-xs text-brand-charcoal focus:outline-none focus:border-brand-clay"
          />

          <button
            type="submit"
            disabled={(!inputText.trim() && !attachment) || isUploading}
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
