import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Loader2, Shield } from 'lucide-react';
import api from '../api';

const BADGE_STYLES = {
    Gold:   { bg: 'rgba(245,166,35,0.12)', color: '#f5a623', border: 'rgba(245,166,35,0.25)' },
    Silver: { bg: 'rgba(192,192,192,0.08)', color: '#c0c0c0', border: 'rgba(192,192,192,0.20)' },
    Bronze: { bg: 'rgba(176,115,56,0.10)', color: '#b07338', border: 'rgba(176,115,56,0.22)' },
};

const RankIcon = ({ rank }) => {
    if (rank === 1) return <Trophy className="w-5 h-5" style={{ color: '#f5a623' }} />;
    if (rank === 2) return <Medal className="w-5 h-5" style={{ color: '#c0c0c0' }} />;
    if (rank === 3) return <Medal className="w-5 h-5" style={{ color: '#b07338' }} />;
    return <span className="text-sm font-black w-5 text-center" style={{ color: '#3a3a3a' }}>{rank}</span>;
};

const Leaderboard = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('all');

    useEffect(() => { fetchLeaderboard(); }, [category]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/dashboard/leaderboard?category=${category}`);
            setPlayers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-28 pb-24 px-6" style={{ background: '#000' }}>
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-black uppercase tracking-widest" style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', color: '#f5a623' }}>
                        <Trophy className="w-3.5 h-3.5" /> Global Rankings
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white mb-5 section-title" style={{ fontFamily: 'Cinzel, serif' }}>
                        THE TOP <span className="gold-gradient-text">PERCENTILE</span>
                    </h1>
                    <p className="text-sm max-w-md mx-auto" style={{ color: '#5a5a5a' }}>
                        Compete with SSB aspirants nationwide. Earn your place among the recommended.
                    </p>
                </div>

                {/* Top 3 Podium */}
                {!loading && players.length >= 1 && (
                    <div className="flex items-end justify-center gap-4 mb-14">
                        {/* 2nd place — only if exists */}
                        {players.length >= 2 && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                className="flex flex-col items-center gap-3 w-36">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black" style={{ background: 'rgba(192,192,192,0.1)', border: '1px solid rgba(192,192,192,0.2)', color: '#c0c0c0', fontFamily: 'Cinzel,serif' }}>
                                    {players[1].name[0]}
                                </div>
                                <p className="text-sm font-black text-white text-center truncate w-full">{players[1].name}</p>
                                <div className="w-full h-20 rounded-t-xl flex items-center justify-center" style={{ background: 'rgba(192,192,192,0.06)', border: '1px solid rgba(192,192,192,0.12)' }}>
                                    <Medal className="w-6 h-6" style={{ color: '#c0c0c0' }} />
                                </div>
                            </motion.div>
                        )}
                        {/* 1st place */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center gap-3 w-40">
                            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black pulse-glow" style={{ background: 'rgba(245,166,35,0.12)', border: '2px solid rgba(245,166,35,0.35)', color: '#f5a623', fontFamily: 'Cinzel,serif' }}>
                                {players[0].name[0]}
                            </div>
                            <p className="text-base font-black text-white text-center truncate w-full">{players[0].name}</p>
                            <div className="w-full h-28 rounded-t-xl flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)' }}>
                                <Trophy className="w-7 h-7" style={{ color: '#f5a623' }} />
                            </div>
                        </motion.div>
                        {/* 3rd place — only if exists */}
                        {players.length >= 3 && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                className="flex flex-col items-center gap-3 w-36">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black" style={{ background: 'rgba(176,115,56,0.1)', border: '1px solid rgba(176,115,56,0.2)', color: '#b07338', fontFamily: 'Cinzel,serif' }}>
                                    {players[2].name[0]}
                                </div>
                                <p className="text-sm font-black text-white text-center truncate w-full">{players[2].name}</p>
                                <div className="w-full h-14 rounded-t-xl flex items-center justify-center" style={{ background: 'rgba(176,115,56,0.06)', border: '1px solid rgba(176,115,56,0.12)' }}>
                                    <Medal className="w-6 h-6" style={{ color: '#b07338' }} />
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}


                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {['all', 'OIR', 'PPDT', 'WAT', 'SRT', 'GTO'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                            style={category === cat
                                ? { background: '#f5a623', color: '#000' }
                                : { background: 'rgba(255,255,255,0.04)', color: '#5a5a5a', border: '1px solid rgba(255,255,255,0.07)' }}
                        >
                            {cat === 'all' ? 'All' : cat}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="ssb-card rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center gap-4">
                            <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#f5a623' }} />
                            <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#4a4a4a' }}>Fetching Rankings...</p>
                        </div>
                    ) : players.length === 0 ? (
                        <div className="py-20 text-center">
                            <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(245,166,35,0.15)' }} />
                            <p className="font-black text-white mb-1" style={{ fontFamily: 'Cinzel,serif' }}>No Rankings Yet</p>
                            <p className="text-xs" style={{ color: '#4a4a4a' }}>Complete tests to appear on the leaderboard.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(245,166,35,0.08)' }}>
                                    {['Rank', 'Candidate', 'Avg Score', 'Tests', 'Badge'].map(h => (
                                        <th key={h} className="px-6 py-4 text-xs font-black uppercase tracking-widest" style={{ color: '#3a3a3a' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {players.map((player, i) => {
                                    const bs = BADGE_STYLES[player.badge] || BADGE_STYLES.Bronze;
                                    return (
                                        <motion.tr
                                            key={player.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2"><RankIcon rank={player.rank} /></div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black" style={{ background: 'rgba(245,166,35,0.08)', color: '#f5a623', fontFamily: 'Cinzel,serif' }}>
                                                        {player.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{player.name}</p>
                                                        <p className="text-xs" style={{ color: '#4a4a4a' }}>@{player.username}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-1.5 w-20 rounded-full overflow-hidden" style={{ background: '#1a1a1a' }}>
                                                        <div className="h-full rounded-full" style={{ width: `${Math.min(player.score, 100)}%`, background: 'linear-gradient(90deg, #f5a623, #e8963d)' }} />
                                                    </div>
                                                    <span className="text-sm font-black text-white">{player.score}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold" style={{ color: '#6a6a6a' }}>{player.tests}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest" style={{ background: bs.bg, color: bs.color, border: `1px solid ${bs.border}` }}>
                                                    {player.badge}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="mt-10 p-6 rounded-2xl text-center" style={{ border: '1px dashed rgba(245,166,35,0.1)' }}>
                    <p className="text-xs italic" style={{ color: '#3a3a3a' }}>
                        "Rankings are updated based on recent performance across all psychological and intelligence modules."
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
