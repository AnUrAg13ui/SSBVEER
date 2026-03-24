import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Heart, BookOpen, User, Send, Tag, Loader2, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import api from '../api';

const CATEGORIES = ['All', 'General', 'OIR Tips', 'PPDT Common Story', 'WAT Sets', 'SRT Reactions', 'Interview Exp'];

const timeAgo = (iso) => {
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

const Forum = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');
    const [newPost, setNewPost] = useState('');
    const [newCategory, setNewCategory] = useState('General');
    const [posting, setPosting] = useState(false);
    const [showCompose, setShowCompose] = useState(false);

    // ── Fetch posts ──────────────────────────────────────────────────────────
    const fetchPosts = async (cat = activeCategory) => {
        setLoading(true);
        setError(null);
        try {
            const params = cat !== 'All' ? `?category=${encodeURIComponent(cat)}` : '';
            const res = await api.get(`/forum/posts${params}`);
            setPosts(res.data);
        } catch (err) {
            setError('Failed to load posts. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPosts(activeCategory); }, [activeCategory]);

    // ── Create post ──────────────────────────────────────────────────────────
    const handlePost = async () => {
        if (!newPost.trim()) return;
        setPosting(true);
        try {
            const res = await api.post('/forum/posts', { text: newPost.trim(), category: newCategory });
            setPosts(prev => [res.data, ...prev]);
            setNewPost('');
            setShowCompose(false);
        } catch {
            // no-op; toast left to global interceptor
        } finally {
            setPosting(false);
        }
    };

    // ── Toggle like ──────────────────────────────────────────────────────────
    const handleLike = async (postId) => {
        // Optimistic update
        setPosts(prev => prev.map(p =>
            p.id === postId
                ? { ...p, likes: p.liked_by_me ? p.likes - 1 : p.likes + 1, liked_by_me: !p.liked_by_me }
                : p
        ));
        try {
            await api.post(`/forum/posts/${postId}/like`);
        } catch {
            // Revert on failure
            setPosts(prev => prev.map(p =>
                p.id === postId
                    ? { ...p, likes: p.liked_by_me ? p.likes - 1 : p.likes + 1, liked_by_me: !p.liked_by_me }
                    : p
            ));
        }
    };

    return (
        <div className="min-h-screen" style={{ background: '#000', fontFamily: 'Inter, sans-serif' }}>
            <div className="max-w-3xl mx-auto px-4 pt-24 pb-24">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#f5a623' }}>Community</p>
                    <h1 className="text-4xl font-black text-white" style={{ fontFamily: 'Cinzel, serif' }}>
                        FORUM
                    </h1>
                    <p className="mt-2 text-sm" style={{ color: '#5a5a5a' }}>
                        Share tips, stories, and strategies with fellow aspirants.
                    </p>
                </motion.div>

                {/* Category Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-6 hide-scrollbar">
                    {CATEGORIES.map(cat => (
                        <button key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                            style={{
                                background: activeCategory === cat ? '#f5a623' : 'rgba(255,255,255,0.04)',
                                color: activeCategory === cat ? '#000' : '#5a5a5a',
                                border: activeCategory === cat ? 'none' : '1px solid rgba(255,255,255,0.07)',
                            }}>
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Compose Button */}
                <motion.button
                    onClick={() => setShowCompose(s => !s)}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    className="w-full mb-5 flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm transition-all"
                    style={{ background: 'rgba(245,166,35,0.06)', border: '1.5px dashed rgba(245,166,35,0.2)', color: '#5a5a5a' }}>
                    <MessageSquare className="w-4 h-4" style={{ color: '#f5a623' }} />
                    Share something with the community…
                </motion.button>

                {/* Compose Box */}
                <AnimatePresence>
                    {showCompose && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="mb-5 p-5 rounded-2xl overflow-hidden"
                            style={{ background: '#0e0e0e', border: '1px solid rgba(245,166,35,0.15)' }}>
                            <textarea
                                value={newPost}
                                onChange={e => setNewPost(e.target.value)}
                                placeholder="Share your experience, tips, or questions…"
                                rows={4}
                                maxLength={2000}
                                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-3"
                                style={{ background: '#111', border: '1.5px solid rgba(255,255,255,0.07)', color: '#e5e5e5' }}
                                onFocus={e => e.target.style.borderColor = '#f5a623'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                            />
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <Tag className="w-3.5 h-3.5" style={{ color: '#4a4a4a' }} />
                                    <select
                                        value={newCategory}
                                        onChange={e => setNewCategory(e.target.value)}
                                        className="text-xs py-1.5 px-2 rounded-lg outline-none"
                                        style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', color: '#a0a0a0' }}>
                                        {CATEGORIES.filter(c => c !== 'All').map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs" style={{ color: '#3a3a3a' }}>{newPost.length}/2000</span>
                                    <button onClick={handlePost} disabled={posting || !newPost.trim()}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all disabled:opacity-40"
                                        style={{ background: '#f5a623', color: '#000' }}>
                                        {posting ? <Loader2 className="w-3. h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                        Post
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Posts */}
                {loading ? (
                    <div className="flex flex-col items-center py-20 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#f5a623' }} />
                        <p className="text-sm" style={{ color: '#4a4a4a' }}>Loading posts…</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center py-20 gap-4">
                        <AlertCircle className="w-10 h-10" style={{ color: '#ef4444' }} />
                        <p className="text-sm" style={{ color: '#5a5a5a' }}>{error}</p>
                        <button onClick={() => fetchPosts(activeCategory)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
                            style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', color: '#f5a623' }}>
                            <RefreshCw className="w-3.5 h-3.5" /> Retry
                        </button>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-20">
                        <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: '#2a2a2a' }} />
                        <p className="text-sm" style={{ color: '#3a3a3a' }}>No posts in this category yet. Be the first!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.map((post, i) => (
                            <motion.div key={post.id}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="p-5 rounded-2xl"
                                style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)' }}>

                                {/* Author row */}
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                                        style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.2)' }}>
                                        <User className="w-4 h-4" style={{ color: '#f5a623' }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-xs font-black text-white truncate">{post.author_full_name || post.author}</p>
                                            {post.verified && (
                                                <CheckCircle className="w-3 h-3 flex-shrink-0" style={{ color: '#f5a623' }} />
                                            )}
                                        </div>
                                        <p className="text-xs" style={{ color: '#3a3a3a' }}>
                                            {post.created_at ? timeAgo(post.created_at) : ''} · {post.category}
                                        </p>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
                                        style={{ background: 'rgba(245,166,35,0.08)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.15)' }}>
                                        {post.category}
                                    </span>
                                </div>

                                {/* Text */}
                                <p className="text-sm leading-relaxed mb-4" style={{ color: '#c0c0c0', whiteSpace: 'pre-wrap' }}>{post.text}</p>

                                {/* Actions */}
                                <div className="flex items-center gap-4">
                                    <button onClick={() => handleLike(post.id)}
                                        className="flex items-center gap-1.5 text-xs font-bold transition-all"
                                        style={{ color: post.liked_by_me ? '#ef4444' : '#4a4a4a' }}>
                                        <Heart className="w-3.5 h-3.5" fill={post.liked_by_me ? '#ef4444' : 'none'} />
                                        {post.likes}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Forum;
