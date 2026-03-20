import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Target, BrainCircuit, Activity, Plus, ChevronRight, Loader2, Sparkles, Clock, Users, Trash2, Shield, Swords } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api';

const CAT_CONFIG = {
    OIR: { color: '#f5a623', icon: Zap, label: 'Officer Intelligence Rating', desc: '500+ logic & reasoning questions under real time pressure' },
    PPDT: { color: '#e8963d', icon: Target, label: 'Picture Perception & Discussion', desc: '30-second viewing with 4-minute narration and AI evaluation' },
    WAT: { color: '#d9883a', icon: BrainCircuit, label: 'Word Association Test', desc: 'Auto-advance prompts with 10-second timer per word' },
    SRT: { color: '#c87a35', icon: Activity, label: 'Situation Reaction Test', desc: 'React to 60 real-life scenarios under time pressure' },
    // GTO: { color: '#b86c30', icon: Swords, label: 'Group Testing Officer Tasks', desc: 'GD, GPE, and Command task simulations' },
};

const ALL_CATS = ['OIR', 'PPDT', 'WAT', 'SRT'];

const TestCard = ({ test, onDelete, index }) => {
    const cfg = CAT_CONFIG[test.category.toUpperCase()] || { color: '#f5a623', icon: Sparkles };
    const Icon = cfg.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="ssb-card rounded-2xl p-7 flex flex-col group"
            whileHover={{ y: -4 }}
        >
            <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}28` }}>
                    <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                </div>
                <span className="text-xs font-black tracking-widest px-3 py-1 rounded-full" style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}25` }}>
                    {test.category.toUpperCase()}
                </span>
            </div>

            <h3 className="text-base font-bold text-white mb-1.5 leading-snug" style={{ fontFamily: 'Cinzel, serif' }}>{test.title}</h3>
            <p className="text-xs leading-relaxed flex-1 mb-6" style={{ color: '#5a5a5a' }}>{test.description}</p>

            <div className="flex items-center justify-between pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-1.5" style={{ color: '#4a4a4a' }}>
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-bold">{Math.floor(test.duration_seconds / 60)}m</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onDelete(test.id)}
                        className="p-2 rounded-lg transition-all"
                        style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}
                        title="Delete"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <Link
                        to={`/tests/${test.id}`}
                        className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-black text-black transition-all"
                        style={{ background: cfg.color }}
                    >
                        Start <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

const TestList = () => {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(null);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const filterCategory = searchParams.get('category');

    useEffect(() => { fetchTests(); }, [filterCategory]);

    const fetchTests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tests');
            const all = res.data;
            setTests(filterCategory
                ? all.filter(t => t.category.toUpperCase() === filterCategory.toUpperCase())
                : all
            );
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (cat) => {
        setGenerating(cat);
        try {
            await api.post('/tests/generate', { category: cat });
            await fetchTests();
        } catch (err) {
            console.error(err);
        } finally {
            setGenerating(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this test?')) return;
        try {
            await api.delete(`/tests/${id}`);
            setTests(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const activeCats = filterCategory ? [filterCategory.toUpperCase()] : ALL_CATS;

    return (
        <div className="min-h-screen pt-28 pb-24 px-6" style={{ background: '#000' }}>
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-14">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-4 h-4" style={{ color: '#f5a623' }} />
                        <span className="text-xs font-black tracking-widest uppercase" style={{ color: '#f5a623' }}>Practice Arsenal</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-3" style={{ fontFamily: 'Cinzel, serif' }}>
                        {filterCategory ? `${filterCategory.toUpperCase()} TESTS` : 'PRACTICE TESTS'}
                    </h1>
                    <p className="text-sm" style={{ color: '#5a5a5a' }}>
                        Generate AI-powered tests or start existing ones. Select your weapon.
                    </p>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex flex-wrap gap-3 mb-10">
                    <button
                        onClick={() => navigate('/tests')}
                        className="px-5 py-2 rounded-xl text-sm font-black tracking-wide transition-all"
                        style={!filterCategory ? { background: '#f5a623', color: '#000' } : { background: 'rgba(255,255,255,0.05)', color: '#5a5a5a', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        All Tests
                    </button>
                    {ALL_CATS.map(cat => {
                        const cfg = CAT_CONFIG[cat];
                        const active = filterCategory?.toUpperCase() === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => navigate(`/tests?category=${cat}`)}
                                className="px-5 py-2 rounded-xl text-sm font-black tracking-wide transition-all"
                                style={active
                                    ? { background: cfg.color, color: '#000' }
                                    : { background: 'rgba(255,255,255,0.04)', color: '#5a5a5a', border: `1px solid rgba(255,255,255,0.07)` }
                                }
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>

                {/* AI Generate Buttons */}
                <div className="mb-10">
                    <p className="text-xs font-black tracking-widest uppercase mb-4" style={{ color: '#3a3a3a' }}>Generate with AI</p>
                    <div className="flex flex-wrap gap-3">
                        {activeCats.map(cat => {
                            const cfg = CAT_CONFIG[cat] || {};
                            const isGen = generating === cat;
                            return (
                                <button
                                    key={cat}
                                    disabled={!!generating}
                                    onClick={() => handleGenerate(cat)}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all"
                                    style={{ background: isGen ? `${cfg.color}25` : `${cfg.color}12`, color: cfg.color, border: `1px solid ${cfg.color}25`, opacity: generating && !isGen ? 0.5 : 1 }}
                                >
                                    {isGen ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    New {cat} Test
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* GTO Simulator cards (if GTO filter) */}
                {/* {filterCategory?.toUpperCase() === 'GTO' && (
                    <div className="grid md:grid-cols-2 gap-6 mb-10">
                        {[
                            { type: 'group', title: 'Snake Race (Group Activity)', desc: 'Full 3D simulation of the Group Obstacle Race. Practice coordination and rules.', meta: 'Group Task' },
                            { type: 'individual', title: 'Individual Obstacles', desc: 'Authentic 3D layout of 10 obstacles. Learn clearance techniques and scoring.', meta: '10 Obstacles' },
                        ].map((sim, i) => (
                            <motion.div
                                key={sim.type}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className="ssb-card rounded-2xl p-7 flex flex-col"
                                style={{ borderColor: 'rgba(245,166,35,0.2)' }}
                            >
                                <div className="flex items-start justify-between mb-5">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.22)' }}>
                                        <Swords className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <span className="text-xs font-black tracking-widest px-3 py-1 rounded-full" style={{ background: 'rgba(245,166,35,0.1)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.2)' }}>3D SIM</span>
                                </div>
                                <h3 className="text-base font-bold text-white mb-1.5" style={{ fontFamily: 'Cinzel, serif' }}>{sim.title}</h3>
                                <p className="text-xs flex-1 mb-6" style={{ color: '#5a5a5a' }}>{sim.desc}</p>
                                <div className="flex items-center justify-between pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span className="text-xs font-bold" style={{ color: '#4a4a4a' }}>{sim.meta}</span>
                                    <Link to={`/gto-simulator?type=${sim.type}`} className="flex items-center gap-1.5 px-5 py-2 rounded-lg font-black text-sm text-black" style={{ background: '#f5a623' }}>
                                        Enter <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )} */}

                {/* Loading */}
                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#f5a623' }} />
                    </div>
                ) : tests.length === 0 && filterCategory?.toUpperCase() !== 'GTO' ? (
                    <div className="text-center py-24 rounded-2xl" style={{ background: 'rgba(245,166,35,0.02)', border: '1px dashed rgba(245,166,35,0.15)' }}>
                        <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(245,166,35,0.3)' }} />
                        <p className="font-bold text-white mb-2 text-lg" style={{ fontFamily: 'Cinzel, serif' }}>No Tests Found</p>
                        <p className="text-sm mb-8" style={{ color: '#4a4a4a' }}>Generate an AI-powered test to get started.</p>
                        <button onClick={() => handleGenerate(filterCategory || 'OIR')} className="btn-gold px-8 py-3 rounded-xl font-black text-sm">
                            ✦ Generate First Test
                        </button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {tests.map((test, i) => (
                                <TestCard key={test.id} test={test} onDelete={handleDelete} index={i} />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestList;
