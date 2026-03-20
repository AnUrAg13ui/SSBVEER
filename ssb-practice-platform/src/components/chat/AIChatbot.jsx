import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Loader2, Shield, Sparkles } from 'lucide-react';
import api from '../../api';

const QUICK_SUGGESTIONS = [
    'How to crack PPDT?',
    'What are OLQs?',
    'WAT tips?',
    'SRT best practices',
    'Interview prep guide',
];

const TypingDots = () => (
    <div className="flex items-center gap-1 px-1 py-1">
        {[0, 0.2, 0.4].map((d, i) => (
            <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#f5a623' }}
                animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
                transition={{ duration: 0.9, delay: d, repeat: Infinity }}
            />
        ))}
    </div>
);

const AIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState([
        { role: 'bot', text: '🎖️ Jai Hind! I\'m your SSB AI Advisor. Ask me anything about OIR, PPDT, WAT, SRT, GTO, or Personal Interview preparation.' }
    ]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);
    const inputRef = useRef(null);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chat, loading]);

    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
    }, [isOpen]);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const sendMessage = async (text) => {
        const userMsg = text.trim();
        if (!userMsg || loading) return;
        setMessage('');
        setChat(p => [...p, { role: 'user', text: userMsg }]);
        setLoading(true);
        try {
            const res = await api.post('/chatbot/ask', {
                message: userMsg,
                history: chat.slice(-6).map(m => m.text),
            });
            setChat(p => [...p, { role: 'bot', text: res.data.reply }]);
        } catch {
            setChat(p => [...p, { role: 'bot', text: "I'm having trouble connecting right now. Focus on your OLQs and try again shortly!" }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(message);
    };

    return (
        <div className="fixed bottom-7 right-7 z-[60] flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.94 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                        className="flex flex-col overflow-hidden"
                        style={isMobile ? {
                            // Full-screen on mobile
                            position: 'fixed', inset: 0, width: '100vw', height: '100dvh',
                            background: '#0e0e0e', border: 'none', borderRadius: 0,
                            boxShadow: 'none', zIndex: 999,
                        } : {
                            // Floating panel on desktop
                            width: '360px', height: '540px',
                            background: '#0e0e0e',
                            border: '1px solid rgba(245,166,35,0.2)',
                            borderRadius: '1rem',
                            boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 40px rgba(245,166,35,0.06)',
                        }}
                    >
                        {/* ── Header ─────────────────────────────── */}
                        <div
                            className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                            style={{
                                background: 'linear-gradient(135deg, #1a1000, #0d0800)',
                                borderBottom: '1px solid rgba(245,166,35,0.15)',
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ background: 'linear-gradient(135deg, #f5a623, #c8841a)', boxShadow: '0 4px 12px rgba(245,166,35,0.3)' }}
                                >
                                    <Shield className="w-5 h-5 text-black" />
                                </div>
                                <div>
                                    <h4 className="font-black text-white text-sm" style={{ fontFamily: 'Cinzel, serif' }}>SSB Advisor</h4>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                        <span className="text-xs font-bold" style={{ color: '#5a5a5a' }}>AI-Powered · Always Ready</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-lg transition-all"
                                style={{ color: '#5a5a5a' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                                onMouseLeave={e => e.currentTarget.style.color = '#5a5a5a'}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* ── Chat Area ──────────────────────────── */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                            {chat.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
                                >
                                    {m.role === 'bot' && (
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mb-0.5"
                                            style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)' }}>
                                            <Bot className="w-4 h-4" style={{ color: '#f5a623' }} />
                                        </div>
                                    )}
                                    <div
                                        className="max-w-[78%] px-4 py-3 text-sm leading-relaxed"
                                        style={m.role === 'user' ? {
                                            background: 'linear-gradient(135deg, #f5a623, #c8841a)',
                                            color: '#000',
                                            fontWeight: 700,
                                            borderRadius: '18px 18px 4px 18px',
                                            boxShadow: '0 4px 12px rgba(245,166,35,0.25)',
                                        } : {
                                            background: 'rgba(255,255,255,0.04)',
                                            color: '#c0c0c0',
                                            border: '1px solid rgba(255,255,255,0.07)',
                                            borderRadius: '18px 18px 18px 4px',
                                        }}
                                    >
                                        {m.text}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing indicator */}
                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-end gap-2 justify-start"
                                >
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                        style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)' }}>
                                        <Bot className="w-4 h-4" style={{ color: '#f5a623' }} />
                                    </div>
                                    <div className="px-4 py-3 rounded-[18px] rounded-tl-[4px]"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                        <TypingDots />
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* ── Quick Suggestions ──────────────────── */}
                        {chat.length <= 2 && !loading && (
                            <div className="px-4 pb-3 flex flex-wrap gap-2 flex-shrink-0">
                                {QUICK_SUGGESTIONS.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => sendMessage(s)}
                                        className="text-xs font-bold px-3 py-1.5 rounded-full transition-all"
                                        style={{
                                            background: 'rgba(245,166,35,0.08)',
                                            border: '1px solid rgba(245,166,35,0.2)',
                                            color: '#f5a623',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,166,35,0.18)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,166,35,0.08)'}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* ── Input ──────────────────────────────── */}
                        <form
                            onSubmit={handleSubmit}
                            className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
                            style={{ borderTop: '1px solid rgba(245,166,35,0.1)', background: '#0a0a0a' }}
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Ask about PPDT, OIR, WAT, SRT…"
                                className="flex-1 py-3 px-4 rounded-xl text-sm text-white placeholder:text-gray-700 focus:outline-none transition-all"
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(245,166,35,0.12)',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={e => e.target.style.borderColor = 'rgba(245,166,35,0.4)'}
                                onBlur={e => e.target.style.borderColor = 'rgba(245,166,35,0.12)'}
                            />
                            <button
                                type="submit"
                                disabled={!message.trim() || loading}
                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                                style={{
                                    background: (!message.trim() || loading) ? 'rgba(245,166,35,0.2)' : '#f5a623',
                                    cursor: (!message.trim() || loading) ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {loading
                                    ? <Loader2 className="w-4 h-4 animate-spin text-black" />
                                    : <Send className="w-4 h-4 text-black" />
                                }
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── FAB Button ──────────────────────────────────── */}
            <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all"
                style={isOpen ? {
                    background: '#0e0e0e',
                    border: '1px solid rgba(245,166,35,0.3)',
                    color: '#f5a623',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                } : {
                    background: 'linear-gradient(135deg, #f5a623, #c8841a)',
                    boxShadow: '0 8px 28px rgba(245,166,35,0.4)',
                }}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                            <X className="w-6 h-6" style={{ color: '#f5a623' }} />
                        </motion.div>
                    ) : (
                        <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                            <MessageSquare className="w-6 h-6 text-black" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Notification dot */}
                {!isOpen && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-black"
                        style={{ background: '#22c55e' }}
                    />
                )}
            </motion.button>
        </div>
    );
};

export default AIChatbot;
