import { useState, useRef, useEffect } from 'react';
import api from '../services/api';

const QUICK_ACTIONS = [
  'Show daily fuel cost',
  'Who is absent today?',
  'Maintenance alerts',
  'Fleet status overview'
];

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "👋 Hello! I'm your BusMS intelligent assistant. I can help you with fleet analytics, fuel reports, and attendance tracking. How can I assist you today?", time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, loading]);

  const handleSend = async (text) => {
    const messageText = typeof text === 'string' ? text : input;
    if (!messageText.trim() || loading) return;

    const userMsg = { role: 'user', text: messageText, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    if (typeof text !== 'string') setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/chatbot/query', { message: messageText });
      const botMsg = { role: 'bot', text: data.reply, time: new Date() };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errMsg = { role: 'bot', text: "I'm having trouble connecting to the system right now. Please try again in a moment.", time: new Date() };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-500 overflow-hidden ${
          isOpen 
            ? 'bg-gray-900 rotate-180' 
            : 'bg-primary hover:scale-110 active:scale-95'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {isOpen ? (
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <div className="relative">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-primary rounded-full" />
          </div>
        )}
      </button>

      {/* Chat Interface */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[350px] sm:w-[420px] h-[600px] max-h-[80vh] flex flex-col bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/40 overflow-hidden animate-slide-up origin-bottom-right">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-2xl shadow-inner border border-white/10">🤖</div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-gray-900 rounded-full animate-pulse" />
              </div>
              <div>
                <h3 className="font-display font-black text-white text-lg leading-tight tracking-tight">BusMS Assistant</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em]">System Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div 
            ref={scrollRef} 
            className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50/30 scroll-smooth"
          >
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}
              >
                <div className={`group relative max-w-[85%] px-5 py-3.5 rounded-3xl shadow-sm text-sm leading-relaxed transition-all hover:shadow-md ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white rounded-tr-lg font-medium' 
                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-lg font-normal'
                }`}>
                  {msg.text}
                  <div className={`flex items-center gap-1 mt-2 text-[10px] opacity-0 group-hover:opacity-60 transition-opacity ${
                    msg.role === 'user' ? 'text-white' : 'text-slate-500'
                  }`}>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-2xl w-fit shadow-sm">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-duration:0.6s]" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.4s]" />
              </div>
            )}

            {/* Suggested Actions */}
            {!loading && messages.length === 1 && (
              <div className="pt-2 animate-fade-in [animation-delay:0.5s]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Suggested Inquiries</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_ACTIONS.map(action => (
                    <button
                      key={action}
                      onClick={() => handleSend(action)}
                      className="text-xs py-2 px-4 bg-slate-100 hover:bg-primary/10 hover:text-primary rounded-xl text-slate-600 transition-all border border-transparent hover:border-primary/20 active:scale-95 font-medium"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Input */}
          <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
            <form 
              onSubmit={handleSend}
              className="relative flex items-center gap-3 bg-slate-50 rounded-2xl p-2 pl-4 border border-slate-100 focus-within:border-primary/30 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-primary/5 transition-all"
            >
              <input
                type="text"
                placeholder="Message assistant..."
                className="flex-1 bg-transparent border-none py-2 text-sm text-slate-800 placeholder-slate-400 focus:ring-0 outline-none font-medium"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-10 h-10 bg-primary hover:bg-primary-dark text-white rounded-xl flex items-center justify-center transition-all shadow-md shadow-primary/20 disabled:grayscale disabled:opacity-30 active:scale-90"
              >
                <svg className="w-5 h-5 translate-x-0.5 -translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
            <p className="text-[9px] text-center text-slate-400 mt-4 font-bold uppercase tracking-wider">AI results may vary &bull; Fast Sync v2.4</p>
          </div>
        </div>
      )}
    </div>
  );
}

