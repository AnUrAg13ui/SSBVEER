import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Trophy, BarChart3, PieChart, Calendar, ChevronRight,
    Loader2, Target, Zap, Activity, BrainCircuit, Shield, TrendingUp
} from 'lucide-react';
import api from '../api';

const GOLD_GRADIENT = 'linear-gradient(90deg, #f5a623, #e8963d)';
const CAT_COLORS = { OIR: '#f5a623', PPDT: '#e8963d', WAT: '#d9883a', SRT: '#c87a35', GTO: '#b86c30' };

const Progress = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        Promise.all([api.get('/dashboard/stats'), api.get('/dashboard/history')])
            .then(([s, h]) => { setStats(s.data); setHistory(h.data); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#000' }}>
            <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(245,166,35,0.15)', borderTopColor: '#f5a623' }} />
                <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6" style={{ color: '#f5a623' }} />
            </div>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#3a3a3a', fontFamily: 'Cinzel, serif' }}>Analyzing Career Trajectory...</p>
        </div>
    );

    const summary = stats?.summary || {};
    const categoryAverages = stats?.category_scores || {};

    return (
        <div className="min-h-screen pt-28 pb-24 px-6" style={{ background: '#000' }}>
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-14">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4" style={{ color: '#f5a623' }} />
                        <span className="text-xs font-black tracking-widest uppercase" style={{ color: '#f5a623' }}>Performance Analytics</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-1" style={{ fontFamily: 'Cinzel, serif' }}>YOUR PROGRESS</h1>
                    <p className="text-sm" style={{ color: '#5a5a5a' }}>Detailed breakdown of your SSB readiness and OLQ assessment.</p>
                </motion.div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    {[
                        { label: 'Overall Score', value: `${summary.overall_score || 0}%`, color: '#f5a623', sub: 'SSB Readiness', icon: Trophy },
                        { label: 'Tests Taken', value: summary.tests_attempted || 0, color: '#e8963d', sub: 'Lifetime sessions', icon: Zap },
                        { label: 'Interviews', value: summary.interviews_completed || 0, color: '#d9883a', sub: 'Mock sessions', icon: BrainCircuit },
                        { label: 'Active Days', value: `${summary.active_days_last_30 || 0}/30`, color: '#c87a35', sub: 'Last 30 days', icon: Activity },
                    ].map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07 }}
                                className="ssb-card rounded-2xl p-5"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}12`, border: `1px solid ${s.color}20` }}>
                                        <Icon className="w-4 h-4" style={{ color: s.color }} />
                                    </div>
                                    <span className="text-xs font-black tracking-widest uppercase" style={{ color: '#3a3a3a' }}>{s.label}</span>
                                </div>
                                <p className="text-3xl font-black mb-0.5" style={{ color: '#fff', fontFamily: 'Cinzel, serif' }}>{s.value}</p>
                                <p className="text-xs" style={{ color: '#4a4a4a' }}>{s.sub}</p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8">
                    {['overview', 'history', 'insights'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className="px-5 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                            style={activeTab === tab
                                ? { background: '#f5a623', color: '#000' }
                                : { background: 'rgba(245,166,35,0.06)', color: '#5a5a5a', border: '1px solid rgba(245,166,35,0.1)' }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[440px]">

                    {/* OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Category Breakdown */}
                            <div className="ssb-card rounded-2xl p-7">
                                <h2 className="font-black text-white text-base mb-7 flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
                                    <BarChart3 className="w-4 h-4" style={{ color: '#f5a623' }} /> Category Breakdown
                                </h2>
                                <div className="space-y-6">
                                    {Object.entries(categoryAverages).length === 0 ? (
                                        <div className="text-center py-14">
                                            <Activity className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(245,166,35,0.12)' }} />
                                            <p className="text-sm" style={{ color: '#3a3a3a' }}>No test data yet. Start practicing!</p>
                                        </div>
                                    ) : (
                                        Object.entries(categoryAverages).map(([cat, score]) => {
                                            const c = CAT_COLORS[cat] || '#f5a623';
                                            return (
                                                <div key={cat}>
                                                    <div className="flex justify-between mb-2">
                                                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#7a7a7a' }}>{cat}</span>
                                                        <span className="text-xs font-black" style={{ color: c }}>{score}%</span>
                                                    </div>
                                                    <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: '#1a1a1a' }}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${score}%` }}
                                                            transition={{ duration: 0.9, ease: 'easeOut' }}
                                                            className="h-full rounded-full"
                                                            style={{ background: `linear-gradient(90deg, ${c}, ${c}80)` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* OLQ Assessment */}
                            <div className="ssb-card rounded-2xl p-7">
                                <h2 className="font-black text-white text-base mb-7 flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
                                    <BrainCircuit className="w-4 h-4" style={{ color: '#f5a623' }} /> Officer Like Qualities
                                </h2>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Self Confidence', val: stats?.interview_stats?.avg_confidence || 0, color: '#f5a623' },
                                        { label: 'Power of Expression', val: stats?.interview_stats?.avg_clarity || 0, color: '#e8963d' },
                                        { label: 'Reasoning Ability', val: categoryAverages?.OIR ? (categoryAverages.OIR / 10).toFixed(1) : 0, color: '#d9883a' },
                                    ].map((olq, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-xl transition-all" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                            <span className="text-sm font-bold" style={{ color: '#9ca3af' }}>{olq.label}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1 w-20 rounded-full overflow-hidden" style={{ background: '#1a1a1a' }}>
                                                    <div className="h-full rounded-full" style={{ width: `${(olq.val / 10) * 100}%`, background: olq.color }} />
                                                </div>
                                                <span className="text-sm font-black w-10 text-right" style={{ color: olq.color }}>{olq.val}/10</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs mt-6 text-center italic" style={{ color: '#3a3a3a' }}>More data required for full 15-point OLQ mapping.</p>
                            </div>
                        </div>
                    )}

                    {/* HISTORY */}
                    {activeTab === 'history' && (
                        <div className="ssb-card rounded-2xl overflow-hidden">
                            {[
                                ...(history?.tests || []).map(t => ({ ...t, type: 'test' })),
                                ...(history?.interviews || []).map(i => ({ ...i, type: 'interview' }))
                            ].sort((a, b) => new Date(b.completed_at || b.created_at) - new Date(a.completed_at || a.created_at))
                             .length === 0 ? (
                                <div className="py-20 text-center">
                                    <Calendar className="w-10 h-10 mx-auto mb-4" style={{ color: 'rgba(245,166,35,0.12)' }} />
                                    <p className="text-sm font-bold" style={{ color: '#3a3a3a' }}>No activity history yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                                    {[
                                        ...(history?.tests || []).map(t => ({ ...t, type: 'test' })),
                                        ...(history?.interviews || []).map(i => ({ ...i, type: 'interview' }))
                                    ].sort((a, b) => new Date(b.completed_at || b.created_at) - new Date(a.completed_at || a.created_at))
                                     .map((item, i) => {
                                        const c = item.type === 'test' ? '#f5a623' : '#22c55e';
                                        const date = new Date(item.completed_at || item.created_at);
                                        return (
                                            <div key={i} className="flex items-center justify-between px-6 py-4 transition-all hover:bg-white/[0.02]">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${c}10`, border: `1px solid ${c}20` }}>
                                                        {item.type === 'test' ? <Target className="w-4 h-4" style={{ color: c }} /> : <BrainCircuit className="w-4 h-4" style={{ color: c }} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{item.type === 'test' ? (item.title || `${item.category} Practice`) : 'Mock Interview'}</p>
                                                        <p className="text-xs" style={{ color: '#4a4a4a' }}>{date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-base font-black" style={{ color: c }}>
                                                        {item.type === 'test' ? `${item.score}%` : `${item.confidence_score}/10`}
                                                    </p>
                                                    <p className="text-xs uppercase font-black" style={{ color: '#3a3a3a' }}>{item.type === 'test' ? 'Score' : 'Confidence'}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* INSIGHTS */}
                    {activeTab === 'insights' && (
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="ssb-card rounded-2xl p-7">
                                <div className="flex items-center gap-2 mb-4">
                                    <PieChart className="w-4 h-4" style={{ color: '#f5a623' }} />
                                    <h3 className="font-black text-white text-sm" style={{ fontFamily: 'Cinzel, serif' }}>Cognitive Pattern</h3>
                                </div>
                                <p className="text-sm leading-relaxed" style={{ color: '#7a7a7a' }}>
                                    Based on <span className="text-white font-bold">{summary.tests_attempted || 0}</span> tests completed, your responses show
                                    {(categoryAverages?.OIR || 0) > (categoryAverages?.WAT || 0)
                                        ? ' stronger performance in logical reasoning (OIR/SRT) vs rapid verbal association (WAT).'
                                        : ' balanced performance across test categories with room to improve in timed drills.'}
                                </p>
                                <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.1)' }}>
                                    <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#f5a623' }}>Top Category</p>
                                    <p className="text-lg font-black text-white" style={{ fontFamily: 'Cinzel, serif' }}>
                                        {Object.entries(categoryAverages).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div className="ssb-card rounded-2xl p-7">
                                <div className="flex items-center gap-2 mb-4">
                                    <Trophy className="w-4 h-4" style={{ color: '#22c55e' }} />
                                    <h3 className="font-black text-white text-sm" style={{ fontFamily: 'Cinzel, serif' }}>AI Recommendation</h3>
                                </div>
                                <p className="text-sm leading-relaxed" style={{ color: '#7a7a7a' }}>
                                    {(stats?.interview_stats?.avg_confidence || 0) < 6
                                        ? 'Focus on your self-confidence during mock interviews. Practice speaking clearly and maintaining eye contact with the camera.'
                                        : (categoryAverages?.WAT || 0) < 50
                                        ? 'Work on WAT speed — practice writing the first word that comes to mind for 60 random words daily without overthinking.'
                                        : 'You are tracking well across modules. Increase your test frequency to 2+ sessions per day to build consistency before selection.'}
                                </p>
                                <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)' }}>
                                    <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#22c55e' }}>Focus Area</p>
                                    <p className="text-lg font-black text-white" style={{ fontFamily: 'Cinzel, serif' }}>
                                        {Object.entries(categoryAverages).sort(([, a], [, b]) => a - b)[0]?.[0] || 'Interview'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Progress;
