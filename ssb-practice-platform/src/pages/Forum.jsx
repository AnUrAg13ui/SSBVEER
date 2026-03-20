import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, ThumbsUp, BookmarkPlus, Shield,
    ChevronDown, Plus, Send, Users, X, Check
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const CATEGORIES = ['All', 'General', 'OIR Tips', 'PPDT Common Story', 'WAT Sets', 'SRT Reactions', 'Interview Exp'];

const MOCK_POSTS = [
    {
        id: 1,
        author: 'Capt. Aman Verma',
        role: 'Recommended • NDA 151',
        verified: true,
        text: "I cleared my SSB at Allahabad last week. For PPDT, make sure you don't argue with others. Just facilitate the discussion and build the common story. The IO values cooperative leadership.",
        likes: 124,
        replies: 12,
        category: 'PPDT Common Story',
        time: '3 hours ago',
    },
    {
        id: 2,
        author: 'Nisha Singh',
        role: 'Aspirant',
        verified: false,
        text: 'Does anyone have the latest OIR series questions? I heard they added some new cubical pattern questions recently. My batch centre is Bhopal this month.',
        likes: 45,
        replies: 28,
        category: 'OIR Tips',
        time: 'Yesterday',
    },
    {
        id: 3,
        author: 'Vikram Chaudhary',
        role: 'Officer Trainee • IMA',
        verified: true,
        text: 'Sharing my WAT response set for positive association. Remember — keep it short, positive, and action-oriented. Avoid abstract or negative words even if the stimulus word is negative.',
        likes: 89,
        replies: 5,
        category: 'WAT Sets',
        time: '2 days ago',
    },
    {
        id: 4,
        author: 'Rohit Meena',
        role: 'Aspirant • 2nd Conference',
        verified: false,
        text: "For SRT \u2014 always show initiative and use the resources around you. Don't wait for help. The assessors are looking for quick, proactive, OLQ-driven responses, not perfect plans.",
        likes: 67,
        replies: 9,
        category: 'SRT Reactions',
        time: '3 days ago',
    },
    {
        id: 5,
        author: 'Lt. Priya Nair',
        role: 'Recommended • SSC (W)',
        verified: true,
        text: 'My PI experience: The IO asked about family background, career plans, current affairs, and one situation-based question. Be genuine. They can spot rehearsed answers. Eye contact is everything.',
        likes: 211,
        replies: 34,
        category: 'Interview Exp',
        time: '4 days ago',
    },
];

const NewPostModal = ({ onClose, onPost }) => {
    const [text, setText] = useState('');
    const [category, setCategory] = useState('General');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.94, y: 24 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.94, y: 24 }}
                transition={{ type: 'spring', damping: 22 }}
                className="w-full max-w-lg rounded-2xl overflow-hidden"
                style={{ background: '#0e0e0e', border: '1px solid rgba(245,166,35,0.2)' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(245,166,35,0.1)' }}>
                    <h3 className="font-black text-white text-sm" style={{ fontFamily: 'Cinzel, serif' }}>New Discussion</h3>
                    <button onClick={onClose} style={{ color: '#5a5a5a' }}><X className="w-4 h-4" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full py-2.5 px-3 rounded-xl text-sm font-bold focus:outline-none bg-transparent"
                        style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.15)', color: '#f5a623' }}
                    >
                        {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c} style={{ background: '#111' }}>{c}</option>)}
                    </select>
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Share your SSB experience, tips, or question..."
                        rows={5}
                        className="w-full p-4 rounded-xl text-sm text-white focus:outline-none resize-none"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'white' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(245,166,35,0.35)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                    />
                    <button
                        onClick={() => { if (text.trim()) { onPost({ text, category }); onClose(); } }}
                        disabled={!text.trim()}
                        className="w-full py-3 rounded-xl font-black text-sm text-black flex items-center justify-center gap-2"
                        style={{ background: text.trim() ? '#f5a623' : 'rgba(245,166,35,0.25)', cursor: text.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Cinzel, serif' }}
                    >
                        <Send className="w-4 h-4" /> Post Discussion
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const Forum = () => {
    const toast = useToast();
    const [posts, setPosts] = useState(MOCK_POSTS);
    const [filter, setFilter] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [likedPosts, setLikedPosts] = useState(new Set());
    const [savedPosts, setSavedPosts] = useState(new Set());

    const filtered = filter === 'All' ? posts : posts.filter(p => p.category === filter);

    const handleLike = (id) => {
        setLikedPosts(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
                setPosts(p => p.map(post => post.id === id ? { ...post, likes: post.likes - 1 } : post));
            } else {
                next.add(id);
                setPosts(p => p.map(post => post.id === id ? { ...post, likes: post.likes + 1 } : post));
                toast('Post liked!', 'success', 2000);
            }
            return next;
        });
    };

    const handleSave = (id) => {
        setSavedPosts(prev => {
            const next = new Set(prev);
            if (next.has(id)) { next.delete(id); toast('Removed from saved', 'info', 2000); }
            else { next.add(id); toast('Post saved!', 'success', 2000); }
            return next;
        });
    };

    const handleNewPost = ({ text, category }) => {
        const newPost = {
            id: Date.now(),
            author: 'You',
            role: 'Aspirant',
            verified: false,
            text,
            likes: 0,
            replies: 0,
            category,
            time: 'Just now',
        };
        setPosts(prev => [newPost, ...prev]);
        toast('Discussion posted!', 'success');
    };

    return (
        <div className="min-h-screen pt-28 pb-24 px-6" style={{ background: '#000' }}>
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Users className="w-4 h-4" style={{ color: '#f5a623' }} />
                            <span className="text-xs font-black tracking-widest uppercase" style={{ color: '#f5a623' }}>Community</span>
                        </div>
                        <h1 className="text-4xl font-black text-white" style={{ fontFamily: 'Cinzel, serif' }}>FORUM</h1>
                        <p className="text-sm mt-1" style={{ color: '#5a5a5a' }}>Learn from recommended candidates. Share your journey.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl font-black text-sm text-black flex-shrink-0"
                        style={{ background: '#f5a623', fontFamily: 'Cinzel, serif', boxShadow: '0 6px 20px rgba(245,166,35,0.25)' }}
                    >
                        <Plus className="w-4 h-4" /> New Post
                    </button>
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className="whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex-shrink-0"
                            style={filter === cat
                                ? { background: '#f5a623', color: '#000' }
                                : { background: 'rgba(245,166,35,0.06)', color: '#5a5a5a', border: '1px solid rgba(245,166,35,0.1)' }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Posts */}
                <div className="space-y-4">
                    {filtered.map((post, i) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="rounded-2xl p-6 transition-all"
                            style={{ background: '#0e0e0e', border: '1px solid rgba(245,166,35,0.08)' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,166,35,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(245,166,35,0.08)'}
                        >
                            {/* Author Row */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-black text-sm"
                                        style={{ background: 'linear-gradient(135deg, #f5a623, #c8841a)', fontFamily: 'Cinzel, serif' }}>
                                        {post.author[0]}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-sm font-bold text-white">{post.author}</p>
                                            {post.verified && <Shield className="w-3.5 h-3.5" style={{ color: '#f5a623' }} />}
                                        </div>
                                        <p className="text-xs font-bold" style={{ color: '#f5a623', opacity: 0.7 }}>{post.role}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: 'rgba(245,166,35,0.08)', color: '#7a7a7a', border: '1px solid rgba(245,166,35,0.12)' }}>
                                        {post.category}
                                    </span>
                                    <span className="text-xs" style={{ color: '#4a4a4a' }}>{post.time}</span>
                                </div>
                            </div>

                            {/* Content */}
                            <p className="text-sm leading-relaxed mb-5 italic" style={{ color: '#9ca3af' }}>"{post.text}"</p>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => handleLike(post.id)}
                                        className="flex items-center gap-1.5 text-xs font-black transition-all"
                                        style={{ color: likedPosts.has(post.id) ? '#f5a623' : '#4a4a4a' }}
                                    >
                                        {likedPosts.has(post.id) ? <Check className="w-4 h-4" /> : <ThumbsUp className="w-4 h-4" />}
                                        {post.likes}
                                    </button>
                                    <button className="flex items-center gap-1.5 text-xs font-black transition-colors" style={{ color: '#4a4a4a' }}
                                        onMouseEnter={e => e.currentTarget.style.color = '#9ca3af'}
                                        onMouseLeave={e => e.currentTarget.style.color = '#4a4a4a'}>
                                        <MessageSquare className="w-4 h-4" /> {post.replies}
                                    </button>
                                </div>
                                <button
                                    onClick={() => handleSave(post.id)}
                                    className="p-2 rounded-lg transition-all"
                                    style={{
                                        color: savedPosts.has(post.id) ? '#f5a623' : '#4a4a4a',
                                        background: savedPosts.has(post.id) ? 'rgba(245,166,35,0.1)' : 'transparent',
                                    }}
                                >
                                    <BookmarkPlus className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="text-center py-20">
                            <MessageSquare className="w-10 h-10 mx-auto mb-4" style={{ color: 'rgba(245,166,35,0.12)' }} />
                            <p className="text-sm font-bold" style={{ color: '#3a3a3a' }}>No posts in this category yet.</p>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showModal && <NewPostModal onClose={() => setShowModal(false)} onPost={handleNewPost} />}
            </AnimatePresence>
        </div>
    );
};

export default Forum;
