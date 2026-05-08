import { motion } from 'framer-motion';
import { Shield, Target, Zap, Mic2, BrainCircuit, Users, ChevronRight, Award, Swords, Clock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MODULES = [
    {
        icon: Zap,
        badge: 'OIR',
        title: 'Intelligence Rating',
        desc: '500+ timed questions covering verbal & non-verbal reasoning. Mirrors actual SSB OIR patterns.',
        path: '/tests?category=OIR',
        color: '#f5a623',
    },
    {
        icon: Target,
        badge: 'PPDT',
        title: 'Picture Perception',
        desc: '30-second viewing + 4-minute narration cycles with AI psychological evaluation.',
        path: '/tests?category=PPDT',
        color: '#e8963d',
    },
    {
        icon: BrainCircuit,
        badge: 'WAT',
        title: 'Word Association',
        desc: 'Auto-advancing word prompts with 10-second timer — just like real SSB conditions.',
        path: '/tests?category=WAT',
        color: '#d9883a',
    },
    {
        icon: Shield,
        badge: 'SRT',
        title: 'Situation Reaction',
        desc: 'React to 60 situational prompts under real-time pressure. AI evaluates OLQ indicators.',
        path: '/tests?category=SRT',
        color: '#c87a35',
    },
    {
        icon: Swords,
        badge: 'GTO',
        title: 'Group Tasks',
        desc: 'Simulate Group Discussion, GPE, and Command tasks in a virtual GTO environment.',
        path: '/gto-simulator',
        color: '#b86c30',
    },
    {
        icon: Mic2,
        badge: 'PI',
        title: 'Mock Interview',
        desc: 'AI-powered Personal Interview with real-time voice analysis for confidence & clarity.',
        path: '/interview',
        color: '#a85e2b',
    },
];

const STATS = [
    { val: '10K+', label: 'Active Aspirants' },
    { val: '50K+', label: 'Mock Sessions' },
    { val: '6', label: 'Test Modules' },
    { val: '92%', label: 'Selection Rate' },
];

const ModuleCard = ({ mod, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.08 }}
        className="ssb-card rounded-2xl p-7 flex flex-col group cursor-pointer"
        whileHover={{ y: -6 }}
    >
        <div className="flex items-center justify-between mb-6">
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: `${mod.color}18`, border: `1px solid ${mod.color}30` }}
            >
                <mod.icon className="w-6 h-6" style={{ color: mod.color }} />
            </div>
            <span
                className="text-xs font-black tracking-widest px-3 py-1 rounded-full"
                style={{ background: `${mod.color}15`, color: mod.color, border: `1px solid ${mod.color}30` }}
            >
                {mod.badge}
            </span>
        </div>
        <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Cinzel, serif' }}>{mod.title}</h3>
        <p className="text-sm leading-relaxed flex-1 mb-6" style={{ color: '#7a7a7a' }}>{mod.desc}</p>
        <Link
            to={mod.path}
            className="flex items-center gap-2 text-sm font-bold transition-all group-hover:gap-3"
            style={{ color: mod.color }}
        >
            Start Practice <ChevronRight className="w-4 h-4" />
        </Link>
    </motion.div>
);

const Home = () => {
    const { isAuth } = useAuth();

    return (
        <div className="pt-0 bg-black min-h-screen">

            {/* ── HERO ──────────────────────────────────────── */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
                {/* Hero Background Image */}
                <div className="absolute inset-0 z-0 opacity-40 mask-image-bottom" style={{ backgroundImage: 'url(/hero-soldier.jpg)', backgroundSize: 'cover', backgroundPosition: 'center 20%' }} />
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/40 via-black/80 to-black" />

                {/* Gold radial glows */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '700px', background: 'radial-gradient(ellipse, rgba(245,166,35,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: '10%', width: '400px', height: '300px', background: 'radial-gradient(ellipse, rgba(245,166,35,0.05) 0%, transparent 70%)', borderRadius: '50%' }} />
                </div>

                <div className="relative max-w-5xl mx-auto text-center z-10" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.9 }}
                    >
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-10"
                            style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', color: '#f5a623' }}
                        >
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="text-xs font-black tracking-widest uppercase">India's #1 AI-Powered SSB Prep Platform</span>
                        </motion.div>

                        {/* Heading */}
                        <h1
                            className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-none"
                            style={{ fontFamily: 'Cinzel, serif', letterSpacing: '-0.02em' }}
                        >
                            MASTER THE
                            <br />
                            <span className="gold-gradient-text">SELECTION BOARD</span>
                        </h1>

                        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed" style={{ color: '#8a8a8a' }}>
                            Complete SSB preparation — OIR, PPDT, WAT, SRT, GTO & AI Mock PI — all in one platform.
                            Train like a soldier. Think like an officer.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                to={isAuth ? "/dashboard" : "/signup"}
                                className="btn-gold px-10 py-4 rounded-xl font-black text-lg tracking-wide transition-all active:scale-95"
                                style={{ fontFamily: 'Cinzel, serif' }}
                            >
                                {isAuth ? "Go to Dashboard" : "Begin Training"} →
                            </Link>
                            <Link
                                to="/oir-guide"
                                className="btn-outline-gold px-10 py-4 rounded-xl font-black text-lg transition-all"
                            >
                                Study Guides
                            </Link>
                        </div>
                    </motion.div>

                    {/* Scroll hint */}
                    <motion.div
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                    >
                        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#444' }}></span>
                        <div className="w-px h-10 bg-gradient-to-b from-amber-500/40 to-transparent" />
                    </motion.div>
                </div>
            </section>

            {/* ── STATS ─────────────────────────────────────── */}
            <section style={{ borderTop: '1px solid rgba(245,166,35,0.12)', borderBottom: '1px solid rgba(245,166,35,0.12)', background: 'rgba(245,166,35,0.02)' }}>
                <div className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {STATS.map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="text-center"
                        >
                            <p className="text-4xl md:text-5xl font-black mb-2" style={{ fontFamily: 'Cinzel, serif', color: '#f5a623' }}>{s.val}</p>
                            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#5a5a5a' }}>{s.label}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── MODULES ───────────────────────────────────── */}
            <section className="py-28 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl md:text-5xl font-black text-white mb-5 section-title"
                            style={{ fontFamily: 'Cinzel, serif' }}
                        >
                            COMPLETE SSB ARSENAL
                        </motion.h2>
                        <p className="text-sm md:text-base max-w-lg mx-auto" style={{ color: '#6b6b6b' }}>
                            Every stage of the SSB selection process, simulated with military precision and AI-powered feedback.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {MODULES.map((mod, i) => <ModuleCard key={mod.badge} mod={mod} index={i} />)}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ──────────────────────────────── */}
            <section className="py-24 px-6" style={{ background: 'rgba(245,166,35,0.02)', borderTop: '1px solid rgba(245,166,35,0.10)' }}>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4" style={{ fontFamily: 'Cinzel, serif' }}>YOUR BATTLE PLAN</h2>
                        <div className="gold-divider max-w-xs mx-auto" />
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: '01', title: 'Create Account', desc: 'Sign up free and set up your SSB preparation profile in under a minute.' },
                            { step: '02', title: 'Choose Your Module', desc: 'Pick from OIR, PPDT, WAT, SRT, GTO, or AI Interview based on your weak areas.' },
                            { step: '03', title: 'Get AI Feedback', desc: 'Receive instant AI analysis on your responses, strengths, and areas to improve.' },
                        ].map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.12 }}
                                className="text-center p-8 rounded-2xl ssb-card"
                            >
                                <div className="text-5xl font-black mb-4" style={{ fontFamily: 'Cinzel, serif', color: 'rgba(245,166,35,0.2)' }}>{s.step}</div>
                                <h3 className="text-lg font-black text-white mb-3" style={{ fontFamily: 'Cinzel, serif' }}>{s.title}</h3>
                                <p className="text-sm leading-relaxed" style={{ color: '#6b6b6b' }}>{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA SECTION ───────────────────────────────── */}
            <section className="py-28 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative overflow-hidden rounded-3xl text-center p-16"
                        style={{ background: 'linear-gradient(135deg, #111 0%, #1a1400 50%, #111 100%)', border: '1px solid rgba(245,166,35,0.25)', boxShadow: '0 0 60px rgba(245,166,35,0.08)' }}
                    >
                        <div className="absolute inset-0 dot-pattern opacity-50 pointer-events-none" />
                        <div className="relative">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8" style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)', color: '#f5a623' }}>
                                <Award className="w-4 h-4" />
                                <span className="text-xs font-black tracking-widest">READY TO EARN YOUR STARS?</span>
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black text-white mb-6" style={{ fontFamily: 'Cinzel, serif' }}>
                                THE UNIFORM<br />
                                <span className="gold-gradient-text">AWAITS YOU</span>
                            </h2>
                            <p className="text-base max-w-md mx-auto mb-10" style={{ color: '#7a7a7a' }}>
                                Join thousands of aspirants who transformed their SSB performance with AI-guided training.
                            </p>
                            <Link
                                to={isAuth ? "/dashboard" : "/signup"}
                                className="btn-gold inline-block px-12 py-5 rounded-xl font-black text-xl transition-all active:scale-95"
                                style={{ fontFamily: 'Cinzel, serif' }}
                            >
                                {isAuth ? "Return to Dashboard" : "Join the Mission"}
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── FOOTER ────────────────────────────────────── */}
            <footer style={{ borderTop: '1px solid rgba(245,166,35,0.1)', background: '#000' }}>
                <div className="max-w-7xl mx-auto px-6 py-10">
                    <div className="text-center">
                        <p className="text-sm font-black tracking-[0.2em] uppercase italic mb-2" style={{ color: 'rgba(245,166,35,0.4)', fontFamily: 'Cinzel, serif' }}>
                            Built for <span style={{ color: '#f5a623' }}>Aspirants</span>
                        </p>
                        <p className="text-[10px] font-bold tracking-widest uppercase opacity-30" style={{ color: '#fff' }}>
                            © 2026 VeerSSB · All Rights Reserved
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
