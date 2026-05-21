import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../lib/store';
import { MessageSquare, X, Send, AlertCircle, CheckCircle, HelpCircle, ShieldAlert } from 'lucide-react';
import { retrieveRAGContext } from '../lib/chatbotKnowledge';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: Date;
  escalateButton?: boolean;
}

const AiChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Escalation ticket states
  const [escalating, setEscalating] = useState(false);
  const [ticketPhone, setTicketPhone] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketCreated, setTicketCreated] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const { user } = useAppStore();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize with greeting
  useEffect(() => {
    const greetingText = user 
      ? `Hello ${user.name}! I am your FarmConnect RAG AI Assistant. How can I help you manage your ${user.role} operations today? Ask me about listings, bids, security, or tracking!`
      : `Hello! I am your FarmConnect RAG AI Assistant. How can I help you explore India's trusted direct agri-marketplace today?`;
      
    setMessages([
      {
        id: 'initial',
        sender: 'bot',
        text: greetingText,
        timestamp: new Date()
      }
    ]);
  }, [user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, escalating]);

  const isSeriousIssue = (text: string): boolean => {
    const keywords = ['scam', 'fraud', 'failed payment', 'payment failed', 'lost money', 'lost crop', 'stolen', 'cheated', 'illegal', 'robbed', 'chargeback', 'refund failed', 'broken transaction'];
    const lower = text.toLowerCase();
    return keywords.some(k => lower.includes(k));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input;
    setInput('');
    
    // Add user message
    const userMsgId = Math.random().toString();
    setMessages(prev => [...prev, {
      id: userMsgId,
      sender: 'user',
      text: userText,
      timestamp: new Date()
    }]);

    setIsTyping(true);

    // Retrieve RAG Context
    const ragContext = retrieveRAGContext(userText);

    // Simulate thinking/retrieval time
    setTimeout(async () => {
      let botReply = '';
      
      try {
        // Attempt to call node backend endpoint
        const response = await fetch('http://localhost:3000/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: userText,
            context: ragContext,
            userName: user?.name || 'Guest',
            userRole: user?.role || 'guest'
          })
        });
        const data = await response.json();
        if (data.success) {
          botReply = data.reply;
        }
      } catch (err) {
        console.log("Vite dev node-server fallback, launching semantic NLP processor...");
      }

      // Semantic Local RAG Solver fallback if backend key is missing or offline
      if (!botReply) {
        if (ragContext.startsWith('Baseline info:')) {
          botReply = `I understand you're asking about that! FarmConnect is an advanced farmer-to-retailer direct marketplace built on secure payment systems and verified profiles. Can you please describe your query in a bit more detail (e.g. asking about "crop listings", "bids", "payment", or "delivery tracking") so I can extract the specific guidelines from our database?`;
        } else {
          // Clean up formatting of RAG text to present beautifully
          const cleanContext = ragContext.replace(/\[Document:.*?\]/g, '•');
          botReply = `According to the official FarmConnect RAG documentation:\n\n${cleanContext}\n\nI hope this resolves your query! Is there anything else I can guide you on?`;
        }
      }

      setIsTyping(false);
      
      const botMsgId = Math.random().toString();
      const serious = isSeriousIssue(userText);

      setMessages(prev => [
        ...prev,
        {
          id: botMsgId,
          sender: 'bot',
          text: botReply,
          timestamp: new Date()
        }
      ]);

      // If serious issue, trigger escalation flow
      if (serious) {
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              id: Math.random().toString(),
              sender: 'system',
              text: `⚠️ I have detected a potentially high-priority issue regarding your transaction or platform security. For your safety, I can escalate this directly to the FarmConnect Administrator Team.`,
              timestamp: new Date(),
              escalateButton: true
            }
          ]);
        }, 600);
      }

    }, 1200);
  };

  const startEscalation = () => {
    setTicketDesc(`The user encountered a serious issue while using the platform. Chat Log Highlights:\n` + 
      messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n')
    );
    setEscalating(true);
    setTicketCreated(false);
  };

  const handleEscalationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketPhone.trim() || !ticketDesc.trim()) return;

    setIsTyping(true);
    try {
      // Direct Firestore write to 'support_tickets' collection
      const ticketRef = await addDoc(collection(db, 'support_tickets'), {
        userId: user?.id || 'guest',
        userName: user?.name || 'Guest User',
        userEmail: user?.email || 'guest@example.com',
        userRole: user?.role || 'guest',
        phone: ticketPhone,
        description: ticketDesc,
        chatHistory: messages.map(m => ({ sender: m.sender, text: m.text })),
        status: 'pending_admin',
        createdAt: new Date().toISOString()
      });

      setTicketId(ticketRef.id);
      setTicketCreated(true);
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'system',
          text: `✅ Success! Ticket #${ticketRef.id.slice(0, 8).toUpperCase()} has been created. An administrator will review your case details and contact you directly on priority.`,
          timestamp: new Date()
        }
      ]);
    } catch (err) {
      toast.error("Failed to register ticket. Please check connection.");
    } finally {
      setIsTyping(false);
      setEscalating(false);
      setTicketPhone('');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Floating Magic Chatbot Trigger Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-500 via-emerald-600 to-green-600 text-white flex items-center justify-center shadow-[0_10px_30px_rgba(4,120,87,0.4)] border border-white/20 cursor-pointer hover:scale-110 active:scale-95 transition-all duration-300 relative group animate-bounce"
        >
          <div className="absolute inset-0 rounded-full bg-yellow-400 opacity-20 blur-sm group-hover:opacity-40 transition-opacity duration-300" />
          <MessageSquare size={24} className="relative z-10" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-yellow-500"></span>
          </span>
        </button>
      )}

      {/* Main Chatbot Glassmorphic Panel */}
      {isOpen && (
        <div className="w-[360px] md:w-[400px] h-[550px] rounded-3xl bg-black/85 border border-white/10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 text-white">
          
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-green-950/40 via-emerald-950/20 to-black/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-400 to-emerald-500 flex items-center justify-center border border-white/15">
                <HelpCircle size={18} className="text-black font-bold animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black bg-gradient-to-r from-yellow-400 via-emerald-400 to-green-400 text-transparent bg-clip-text">FarmConnect AI Helper</h3>
                <span className="text-[10px] text-gray-400 flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> RAG Knowledge Active
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setEscalating(false);
              }}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer w-7 h-7 rounded-full bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>

          {/* Chat / Ticket Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Escalation Overlay Form */}
            {escalating ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4 animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center gap-2 text-yellow-400">
                  <ShieldAlert size={20} />
                  <h4 className="font-extrabold text-sm uppercase tracking-wider">Support Ticket Escalation</h4>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                  We'll create an official priority support ticket on your behalf. A FarmConnect admin will audit this transcript and reach out to you directly.
                </p>

                <form onSubmit={handleEscalationSubmit} className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-black text-gray-400">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={ticketPhone}
                      onChange={e => setTicketPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-yellow-400 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-black text-gray-400">Issue Details</label>
                    <textarea
                      required
                      rows={4}
                      value={ticketDesc}
                      onChange={e => setTicketDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-yellow-400 transition-colors resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEscalating(false)}
                      className="py-2.5 px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-all duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-black text-xs transition-all duration-300 shadow-md"
                    >
                      Submit Ticket
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                {/* Standard Message Stream */}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    {m.sender === 'system' ? (
                      <div className="w-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-2xl p-3.5 text-xs font-medium space-y-3">
                        <p className="flex items-start gap-2">
                          <AlertCircle size={16} className="shrink-0 mt-0.5" />
                          <span>{m.text}</span>
                        </p>
                        {m.escalateButton && (
                          <button
                            onClick={startEscalation}
                            className="w-full py-2 px-3 rounded-xl bg-yellow-500 text-black font-black text-xs text-center cursor-pointer hover:bg-yellow-400 transition-all duration-200"
                          >
                            Yes, Escalate to Admin
                          </button>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed font-medium whitespace-pre-line shadow-md border ${
                          m.sender === 'user'
                            ? 'bg-gradient-to-r from-yellow-500/20 to-amber-600/30 text-yellow-100 border-yellow-500/20 rounded-tr-none'
                            : 'bg-white/5 border-white/10 text-gray-100 rounded-tl-none'
                        }`}
                      >
                        {m.text}
                      </div>
                    )}
                    <span className="text-[9px] text-gray-500 mt-1 font-semibold px-1">
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-start gap-1.5 pl-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Message Form Footer */}
          {!escalating && (
            <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-white/5 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={isTyping}
                placeholder="Ask me how to negotiate, pay, or list..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-300"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-500 to-emerald-600 text-black flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50"
              >
                <Send size={15} className="text-black shrink-0" />
              </button>
            </form>
          )}

        </div>
      )}
    </div>
  );
};

export default AiChatbot;
