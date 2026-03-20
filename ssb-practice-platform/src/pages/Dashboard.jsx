import { motion } from 'framer-motion';
import { Target, Zap, Mic2, Clock, Award, ChevronRight, TrendingUp, BrainCircuit, Activity, ArrowUpRight, Shield, Swords } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import api from '../api';

const QUICK_ACTIONS = [
    { label: 'OIR Test', path: '/tests?category=OIR', color: '#f5a623', icon: Zap },
    { label: 'PPDT', path: '/tests?category=PPDT', color: '#e8963d', icon: Target },
    { label: 'WAT', path: '/tests?category=WAT', color: '#d9883a', icon: BrainCircuit },
    { label: 'SRT', path: '/tests?category=SRT', color: '#c87a35', icon: Activity },
    { label: 'GTO Sim', path: '/gto-simulator', color: '#b86c30', icon: Swords },
    { label: 'Interview', path: '/interview', color: '#a85e2b', icon: Mic2 },
];

const StatCard = ({ icon: Icon, label, value, sub, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="ssb-card rounded-2xl p-6"
    >
        <div className="flex items-center justify-between mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#3a3a3a' }}>{label}</p>
        </div>
        <p className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Cinzel, serif' }}>{value}</p>
        <p className="text-xs" style={{ color: '#5a5a5a' }}>{sub}</p>
    </motion.div>
);

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        api.get('/dashboard/stats').then(r => setStats(r.data)).catch(console.error);
    }, []);

    const recentActivity = stats ? [
        ...(stats.recent_tests || []).map(t => ({
            type: `${t.category} Test`, score: `${t.score}/${t.total_questions || '?'}`,
            time: t.completed_at ? new Date(t.completed_at).toLocaleDateString() : 'N/A',
            status: (t.score || 0) > 14 ? 'Excellent' : 'Good'
        })),
        ...(stats.recent_interviews || []).map(i => ({
            type: 'Mock Interview', score: `${i.confidence_score}/10`,
            time: i.created_at ? new Date(i.created_at).toLocaleDateString() : 'N/A',
            status: i.confidence_score > 7 ? 'Confident' : 'Developing'
        }))
    ].slice(0, 6) : [];

    return (
        <div className="min-h-screen pt-28 pb-24 px-6" style={{ background: '#000' }}>
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-14">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Shield className="w-4 h-4" style={{ color: '#f5a623' }} />
                            <span className="text-xs font-black tracking-widest uppercase" style={{ color: '#f5a623' }}>Command Centre</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-1" style={{ fontFamily: 'Cinzel, serif' }}>DASHBOARD</h1>
                        <p className="text-sm" style={{ color: '#5a5a5a' }}>Welcome back, {user?.full_name || user?.username}</p>
                    </div>
                    <Link
                        to="/tests"
                        className="btn-gold flex items-center gap-2 px-7 py-3.5 rounded-xl font-black text-sm"
                        style={{ fontFamily: 'Cinzel, serif' }}
                    >
                        New Practice <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    <StatCard icon={Target} label="SSB Readiness" value={`${stats?.summary?.overall_score || 0}%`} sub="Overall weighted score" color="#f5a623" delay={0.1} />
                    <StatCard icon={Zap} label="Active Days" value={`${stats?.summary?.active_days_last_30 || 0}`} sub="Activity in last 30 days" color="#e8963d" delay={0.15} />
                    <StatCard icon={Mic2} label="Avg Confidence" value={`${stats?.interview_stats?.avg_confidence || 0}`} sub="Mock interview rating" color="#d9883a" delay={0.2} />
                    <StatCard icon={Activity} label="Tests Done" value={stats?.summary?.tests_attempted || 0} sub="Total practice sessions" color="#c87a35" delay={0.25} />
                </div>

                {/* Quick Launch */}
                <div className="mb-10">
                    <p className="text-xs font-black tracking-widest uppercase mb-4" style={{ color: '#3a3a3a' }}>Quick Launch</p>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {QUICK_ACTIONS.map((a, i) => (
                            <Link
                                key={a.label}
                                to={a.path}
                                className="flex flex-col items-center gap-2.5 p-4 rounded-2xl transition-all group"
                                style={{ background: `${a.color}0a`, border: `1px solid ${a.color}1a` }}
                                onMouseEnter={e => { e.currentTarget.style.background = `${a.color}18`; e.currentTarget.style.borderColor = `${a.color}40`; }}
                                onMouseLeave={e => { e.currentTarget.style.background = `${a.color}0a`; e.currentTarget.style.borderColor = `${a.color}1a`; }}
                            >
                                <a.icon className="w-5 h-5 transition-transform group-hover:scale-110" style={{ color: a.color }} />
                                <span className="text-xs font-black" style={{ color: a.color }}>{a.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid lg:grid-cols-3 gap-6">

                    {/* Performance Chart */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="ssb-card rounded-2xl p-7">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="font-black text-white text-lg flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
                                    <TrendingUp className="w-5 h-5" style={{ color: '#f5a623' }} />
                                    Category Scores
                                </h2>
                                <Link to="/progress" className="text-xs font-bold flex items-center gap-1 transition-colors hover:text-amber-400" style={{ color: '#5a5a5a' }}>
                                    Full Report <ArrowUpRight className="w-3 h-3" />
                                </Link>
                            </div>
                            <div className="h-48 flex items-end gap-4 px-2">
                                {Object.entries(stats?.category_scores || { OIR: 0, PPDT: 0, WAT: 0, SRT: 0, GTO: 0 }).map(([cat, score], i) => {
                                    const colors = ['#f5a623', '#e8963d', '#d9883a', '#c87a35', '#b86c30'];
                                    const c = colors[i % colors.length];
                                    return (
                                        <div key={cat} className="flex-1 flex flex-col items-center gap-2 group">
                                            <div className="relative w-full rounded-t-xl overflow-hidden" style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${Math.max(score, 4)}%` }}
                                                    transition={{ delay: 0.4 + i * 0.08, duration: 0.8 }}
                                                    className="w-full rounded-t-lg relative group"
                                                    style={{ background: `linear-gradient(to top, ${c}, ${c}60)`, minHeight: '8px' }}
                                                >
                                                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-black opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap" style={{ color: c }}>
                                                        {score}%
                                                    </span>
                                                </motion.div>
                                            </div>
                                            <span className="text-xs font-black uppercase" style={{ color: '#4a4a4a' }}>{cat}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="ssb-card rounded-2xl p-7">
                            <h2 className="font-black text-white text-lg mb-6 flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
                                <Clock className="w-5 h-5" style={{ color: '#f5a623' }} />
                                Recent Activity
                            </h2>
                            {recentActivity.length === 0 ? (
                                <div className="text-center py-10">
                                    <Activity className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(245,166,35,0.15)' }} />
                                    <p className="text-sm font-bold" style={{ color: '#3a3a3a' }}>No activity yet. Start a practice test!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentActivity.map((act, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-xl transition-all" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.08)' }}>
                                                    <BrainCircuit className="w-4 h-4" style={{ color: '#f5a623' }} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{act.type}</p>
                                                    <p className="text-xs" style={{ color: '#4a4a4a' }}>{act.time}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-white">{act.score}</p>
                                                <p className="text-xs font-black uppercase" style={{ color: act.status === 'Excellent' || act.status === 'Confident' ? '#22c55e' : '#eab308' }}>{act.status}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        {/* Rank Card */}
                        <div className="rounded-2xl p-7 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1000, #0d0800)', border: '1px solid rgba(245,166,35,0.25)', boxShadow: '0 0 40px rgba(245,166,35,0.06)' }}>
                            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, transparent, #f5a623, transparent)' }} />
                            <Award className="w-10 h-10 mb-4" style={{ color: '#f5a623' }} />
                            <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#5a5a5a' }}>National Rank</p>
                            <p className="text-5xl font-black mb-1" style={{ color: '#f5a623', fontFamily: 'Cinzel, serif' }}>#--</p>
                            <p className="text-xs mb-6" style={{ color: '#4a4a4a' }}>Complete more tests to rank</p>
                            <Link to="/leaderboard" className="block w-full text-center py-3.5 rounded-xl font-black text-sm transition-all" style={{ background: '#f5a623', color: '#000', fontFamily: 'Cinzel, serif' }}>
                                View Leaderboard
                            </Link>
                        </div>

                        {/* Expert Tips */}
                        <div className="ssb-card rounded-2xl p-7">
                            <h2 className="font-black text-white text-base mb-6" style={{ fontFamily: 'Cinzel, serif' }}>Expert Tips</h2>
                            <div className="space-y-5">
                                {[
                                    { title: 'PPDT Focus', text: 'Spend first 10s identifying all characters and their emotions before writing.' },
                                    { title: 'WAT Instinct', text: 'Be instinctive — choose the first word that comes to mind, not a logical phrase.' },
                                    { title: 'SRT: Show OLQs', text: 'Always demonstrate initiative and leadership in every situation response.' },
                                ].map((tip, i) => (
                                    <div key={i}>
                                        <p className="text-xs font-black uppercase mb-1.5" style={{ color: '#f5a623' }}>✦ {tip.title}</p>
                                        <p className="text-xs leading-relaxed" style={{ color: '#5a5a5a' }}>{tip.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
