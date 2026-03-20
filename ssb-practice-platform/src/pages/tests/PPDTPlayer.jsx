import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Eye, Edit3, CheckCircle, ChevronLeft, Loader2, Info } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';

// PPDT Images (Mock or using backend sequence)
// In a real app, these would come from the assets folder or CDN
const MOCK_PPDT_IMG = "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=1200";

const PPDTPlayer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [phase, setPhase] = useState('view'); // 'view' or 'write' or 'done'
    const [timeLeft, setTimeLeft] = useState(30);
    const [story, setStory] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTest = async () => {
            try {
                const res = await api.get(`/tests/${id}`);
                setTest(res.data);
                // Ensure this is a PPDT test
                if (res.data.category !== 'PPDT') {
                    navigate(`/tests/${id}`); // fallback to general player
                }
            } catch (err) {
                setError("Failed to load PPDT session.");
            } finally {
                setLoading(false);
            }
        };
        fetchTest();
    }, [id]);

    useEffect(() => {
        if (loading || phase === 'done') return;

        if (timeLeft <= 0) {
            if (phase === 'view') {
                setPhase('write');
                setTimeLeft(240); // 4 minutes
            } else {
                setPhase('done');
            }
            return;
        }

        const timer = setInterval(() => setTimeLeft(p => p - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, phase, loading]);

    const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
    );

    if (phase === 'done') {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-2xl bg-[#0d1322] border border-white/10 rounded-[3rem] p-12 text-center"
                >
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-8" />
                    <h1 className="text-4xl font-black text-white mb-6 font-outfit uppercase tracking-tight">STORY SUBMITTED</h1>
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/5 mb-12 text-left">
                        <p className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4">Your Contribution</p>
                        <p className="text-gray-300 font-medium italic leading-relaxed">"{story}"</p>
                    </div>
                    <button 
                        onClick={() => navigate('/tests')}
                        className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xl shadow-2xl shadow-blue-500/20 transition-all"
                    >
                        Finish Session
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-12 pb-20 px-6 max-w-5xl mx-auto flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/tests')} className="p-2.5 rounded-xl bg-white/5 text-gray-400">
                        <ChevronLeft />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-white uppercase tracking-tight">PPDT SESSION</h2>
                        <p className="text-xs text-blue-500 font-black uppercase tracking-widest">
                            {phase === 'view' ? 'Phase 1: Observation (30s)' : 'Phase 2: Story Writing (4m)'}
                        </p>
                    </div>
                </div>
                <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-mono font-black text-2xl border ${
                    timeLeft < 30 ? 'bg-red-500/10 border-red-500/50 text-red-500 animate-pulse' : 'bg-blue-500/10 border-blue-500/50 text-blue-500'
                }`}>
                    <Clock className="w-6 h-6" />
                    {formatTime(timeLeft)}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {phase === 'view' ? (
                    <motion.div
                        key="view"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        className="relative flex-1 rounded-[3rem] overflow-hidden bg-black/50 border border-white/10 group"
                    >
                        <img 
                            src={test?.questions?.[0]?.options?.[0] || MOCK_PPDT_IMG} 
                            alt="Observe carefully" 
                            className="w-full h-full object-cover opacity-100"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="px-8 py-4 bg-black/60 backdrop-blur-md rounded-2xl border border-white/20 flex items-center gap-3 text-white font-bold">
                                <Eye className="w-6 h-6 text-blue-500" />
                                Observe characters, mood, and setting
                            </div>
                        </div>
                        <div className="absolute bottom-10 left-10 right-10 flex justify-center">
                             <div className="w-full max-w-md h-2 bg-white/10 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: "100%" }}
                                    animate={{ width: "0%" }}
                                    transition={{ duration: 30, ease: "linear" }}
                                    className="h-full bg-blue-500"
                                />
                             </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="write"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex-1 flex flex-col gap-6"
                    >
                        <div className="p-6 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-start gap-4">
                            <Info className="w-6 h-6 text-blue-500 mt-1" />
                            <div>
                                <h4 className="text-white font-bold mb-1 uppercase text-sm">Writing Instructions</h4>
                                <p className="text-blue-100/70 text-sm leading-relaxed">
                                    Describe what led to the situation, what is happening now, and what the likely outcome will be. 
                                    Do not just describe the picture.
                                </p>
                            </div>
                        </div>

                        <textarea
                            className="flex-1 w-full bg-white/5 border-2 border-white/10 rounded-[2.5rem] p-10 text-white text-xl placeholder:text-gray-700 focus:outline-none focus:border-blue-500/50 transition-all font-medium resize-none shadow-inner"
                            placeholder="Begin your story here..."
                            value={story}
                            onChange={(e) => setStory(e.target.value)}
                            autoFocus
                        />

                        <div className="flex justify-between items-center">
                             <div className="text-gray-500 font-bold ml-4">
                                Word Count: {story.trim().split(/\s+/).filter(Boolean).length}
                             </div>
                             <button
                                onClick={() => setPhase('done')}
                                className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xl shadow-2xl shadow-blue-500/20 transition-all flex items-center gap-3 active:scale-95"
                            >
                                Finalize Story <Edit3 className="w-6 h-6" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PPDTPlayer;
