import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    ChevronLeft, Brain, Save, Send, CheckCircle, AlertTriangle,
    Star, RotateCcw, Eye, ChevronDown, ChevronUp, Lightbulb,
    Users, BookOpen, Heart, Compass, Sparkles, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API = 'http://localhost:8000/api';

// ─── SDT Sections config ──────────────────────────────────────────────────────
const SECTIONS = [
    {
        key: 'parents',
        number: 1,
        title: 'What do your parents think about you?',
        subtitle: 'Be honest and balanced. Include both positive aspects and areas your parents might want you to improve.',
        placeholder: 'Describe how your parents perceive you - your qualities, habits, behavior at home, responsibilities, their expectations of you, areas they appreciate and areas they suggest improvement...',
        recommended: '100-200 words',
        icon: Heart,
        color: '#ef4444',
        tip: 'Parents spot patterns others miss. Mention both praise and criticism they give you.',
    },
    {
        key: 'teachers',
        number: 2,
        title: 'What do your teachers/boss/manager think about you?',
        subtitle: 'Focus on professional and academic settings. Include feedback you\'ve received.',
        placeholder: 'Describe how your teachers, professors, or workplace supervisors perceive you - your academic/work performance, discipline, participation, leadership qualities, teamwork...',
        recommended: '100-200 words',
        icon: BookOpen,
        color: '#f5a623',
        tip: 'Mention specific feedback, academic/work performance, and how you interact in formal settings.',
    },
    {
        key: 'friends',
        number: 3,
        title: 'What do your friends think about you?',
        subtitle: "Think about what your friends would say about you when you're not around.",
        placeholder: "Describe how your friends see you - your role in the group, how you help them, what they come to you for, your social qualities, sense of humor, reliability...",
        recommended: '100-200 words',
        icon: Users,
        color: '#22c55e',
        tip: 'Friends reveal your true social personality. Be authentic — the psychologist knows if it\'s fabricated.',
    },
    {
        key: 'self_view',
        number: 4,
        title: 'What do you think about yourself?',
        subtitle: 'Be realistic and self-aware. Neither too humble nor too boastful.',
        placeholder: 'Describe your honest self-assessment - your strengths, weaknesses, values, beliefs, what drives you, your personality traits, how you handle challenges...',
        recommended: '100-200 words',
        icon: Compass,
        color: '#8b5cf6',
        tip: 'This is the most critical section. Show genuine self-awareness — acknowledge real weaknesses.',
    },
    {
        key: 'qualities_to_develop',
        number: 5,
        title: 'What qualities would you like to develop in yourself?',
        subtitle: 'Show self-awareness and growth mindset. Be specific about your development goals.',
        placeholder: 'Describe the qualities you aspire to develop - specific skills, personality traits, habits, or capabilities you want to improve and how you plan to work on them...',
        recommended: '100-200 words',
        icon: Sparkles,
        color: '#06b6d4',
        tip: 'Link your improvement areas to the weaknesses mentioned earlier. Show a concrete plan, not just wishes.',
    },
];

const MIN_WORDS = 20;

// ─── Word count helper ─────────────────────────────────────────────────────────
const wordCount = (text) => text.trim().split(/\s+/).filter(Boolean).length;

// ─── OLQ Star Rating display ──────────────────────────────────────────────────
const OLQRating = ({ label, score }) => {
    const color = score >= 4 ? '#22c55e' : score >= 3 ? '#f5a623' : '#ef4444';
    return (
        <div className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            <span className="text-sm font-bold" style={{ color: '#9a9a9a' }}>{label}</span>
            <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                        <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.07 }}
                            className="w-4 h-4 rounded-full"
                            style={{ background: i <= score ? color : 'rgba(255,255,255,0.08)' }} />
                    ))}
                </div>
                <span className="text-sm font-black w-6 text-right" style={{ color }}>{score}/5</span>
            </div>
        </div>
    );
};

// ─── Score Ring ────────────────────────────────────────────────────────────────
const ScoreRing = ({ score }) => {
    const color = score >= 75 ? '#22c55e' : score >= 55 ? '#f5a623' : '#ef4444';
    const label = score >= 75 ? 'Excellent' : score >= 55 ? 'Good' : score >= 40 ? 'Average' : 'Needs Work';
    const circumference = 2 * Math.PI * 44;
    const dash = (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                    <motion.circle cx="50" cy="50" r="44" fill="none"
                        stroke={color} strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: circumference - dash }}
                        transition={{ duration: 1.2, ease: 'easeOut' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black" style={{ color }}>{score}</span>
                    <span className="text-xs" style={{ color: '#5a5a5a' }}>/ 100</span>
                </div>
            </div>
            <p className="text-sm font-black mt-2" style={{ color }}>{label}</p>
        </div>
    );
};

// ─── Section Card (write phase) ───────────────────────────────────────────────
const SectionCard = ({ section, value, onChange, feedback, active, onFocus }) => {
    const Icon = section.icon;
    const wc = wordCount(value);
    const enough = wc >= MIN_WORDS;
    const [showTip, setShowTip] = useState(false);

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: section.number * 0.08 }}
            className="rounded-2xl overflow-hidden mb-5"
            style={{ border: `1.5px solid ${active ? section.color + '55' : 'rgba(255,255,255,0.06)'}`, background: '#0a0a0a', transition: 'border-color 0.3s' }}>

            {/* Header */}
            <div className="flex items-start gap-4 p-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${section.color}15`, border: `1px solid ${section.color}25` }}>
                    <Icon className="w-5 h-5" style={{ color: section.color }} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-black" style={{ color: section.color }}>
                            {section.number}.
                        </span>
                        <p className="text-sm font-black text-white">{section.title}</p>
                        {enough && <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#22c55e' }} />}
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: '#5a5a5a' }}>{section.subtitle}</p>
                </div>
            </div>

            {/* Tip toggle */}
            <div className="px-5 pb-2">
                <button onClick={() => setShowTip(t => !t)}
                    className="flex items-center gap-1.5 text-xs font-bold transition-colors"
                    style={{ color: showTip ? section.color : '#3a3a3a' }}
                    onMouseEnter={e => e.currentTarget.style.color = section.color}
                    onMouseLeave={e => e.currentTarget.style.color = showTip ? section.color : '#3a3a3a'}>
                    <Lightbulb className="w-3.5 h-3.5" />
                    {showTip ? 'Hide tip' : 'Show SSB tip'}
                </button>
                <AnimatePresence>
                    {showTip && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="text-xs mt-2 py-2 px-3 rounded-xl" style={{ background: `${section.color}10`, color: section.color, border: `1px solid ${section.color}20` }}>
                            💡 {section.tip}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Textarea */}
            <div className="px-5 pb-4">
                <textarea
                    rows={6}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onFocus={onFocus}
                    placeholder={section.placeholder}
                    className="w-full p-3.5 rounded-xl text-sm outline-none resize-none transition-all"
                    style={{
                        background: '#111',
                        border: `1.5px solid ${active ? section.color + '55' : 'rgba(255,255,255,0.07)'}`,
                        color: '#e5e5e5',
                        fontFamily: 'Inter, sans-serif',
                        lineHeight: '1.75',
                        transition: 'border-color 0.2s',
                    }} />
                <div className="flex items-center justify-between mt-2">
                    <span className="text-xs" style={{ color: wc >= MIN_WORDS ? '#22c55e' : '#5a5a5a' }}>
                        {wc} words {wc < MIN_WORDS && `· min ${MIN_WORDS}`}
                    </span>
                    <span className="text-xs" style={{ color: '#3a3a3a' }}>Recommended: {section.recommended}</span>
                </div>
            </div>

            {/* AI Feedback inline (result phase) */}
            {feedback && (
                <div className="mx-5 mb-4 p-3 rounded-xl text-xs leading-relaxed"
                    style={{ background: `${section.color}08`, border: `1px solid ${section.color}18`, color: section.color }}>
                    <strong style={{ color: '#fff' }}>AI Feedback: </strong>{feedback}
                </div>
            )}
        </motion.div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SDTTest = () => {
    const topRef = useRef(null);
    const scrollTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth' });

    const [answers, setAnswers] = useState({ parents: '', teachers: '', friends: '', self_view: '', qualities_to_develop: '' });
    const [activeKey, setActiveKey] = useState('parents');
    const [phase, setPhase] = useState('write'); // write | analyzing | result
    const [result, setResult] = useState(null);
    const [saveMsg, setSaveMsg] = useState('');
    const [showModel, setShowModel] = useState(false);

    const totalWords = Object.values(answers).reduce((sum, v) => sum + wordCount(v), 0);
    const sectionsComplete = SECTIONS.filter(s => wordCount(answers[s.key]) >= MIN_WORDS).length;
    const allComplete = sectionsComplete === SECTIONS.length;

    // Load from localStorage draft
    useEffect(() => {
        const saved = localStorage.getItem('sdt_draft');
        if (saved) {
            try { setAnswers(JSON.parse(saved)); } catch (_) {}
        }
    }, []);

    const saveDraft = () => {
        localStorage.setItem('sdt_draft', JSON.stringify(answers));
        setSaveMsg('Draft saved!');
        setTimeout(() => setSaveMsg(''), 2000);
    };

    const analyze = async () => {
        if (!allComplete) return;
        scrollTop();
        setPhase('analyzing');
        try {
            const resp = await fetch(`${API}/tests/sdt/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('ssb_token')}` },
                body: JSON.stringify(answers),
            });
            if (resp.ok) {
                const data = await resp.json();
                setResult(data);
                setPhase('result');
            } else {
                setPhase('write');
                alert('Analysis failed. Please try again.');
            }
        } catch (e) {
            setPhase('write');
            alert('Network error. Please check your connection.');
        }
        scrollTop();
    };

    const restart = () => {
        setPhase('write');
        setResult(null);
        setShowModel(false);
        scrollTop();
    };

    // ── ANALYZING state ────────────────────────────────────────────────────────
    if (phase === 'analyzing') return (
        <div ref={topRef} className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#000' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 pulse-glow"
                    style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
                    <Brain className="w-9 h-9" style={{ color: '#8b5cf6' }} />
                </div>
                <h2 className="text-2xl font-black text-white mb-3" style={{ fontFamily: 'Cinzel, serif' }}>Analysing Your SDT</h2>
                <p className="text-sm leading-relaxed mb-6" style={{ color: '#5a5a5a' }}>
                    The AI psychologist is cross-referencing all 5 perspectives, scoring OLQs, and identifying patterns in your self-description...
                </p>
                <div className="flex flex-col gap-2">
                    {['Reading all 5 perspectives...', 'Cross-referencing consistency...', 'Scoring 8 OLQs...', 'Writing psychologist report...'].map((step, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.6 }}
                            className="flex items-center gap-2 text-xs" style={{ color: '#4a4a4a' }}>
                            <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: '#8b5cf6' }}
                                animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, delay: i * 0.6, repeat: Infinity }} />
                            {step}
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );

    // ── RESULT ─────────────────────────────────────────────────────────────────
    if (phase === 'result' && result) {
        const recColor = {
            'Highly Recommended': '#22c55e',
            'Recommended': '#f5a623',
            'Needs Improvement': '#f97316',
            'Not Recommended': '#ef4444',
        }[result.recommendation] || '#f5a623';

        return (
            <div ref={topRef} className="min-h-screen pt-24 pb-20 px-4" style={{ background: '#000' }}>
                <div className="max-w-3xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

                        {/* Hero score */}
                        <div className="text-center mb-8 p-8 rounded-3xl relative overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, #0d0d0d, #111)', border: `1.5px solid ${recColor}25` }}>
                            <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at 50% 50%, ${recColor}, transparent 70%)` }} />
                            <ScoreRing score={result.overall_score} />
                            <p className="text-xs font-black uppercase tracking-widest mt-4 mb-1" style={{ color: recColor }}>{result.recommendation}</p>
                            <h2 className="text-3xl font-black text-white" style={{ fontFamily: 'Cinzel, serif' }}>SDT Report</h2>
                            <p className="text-sm mt-2" style={{ color: '#5a5a5a' }}>AI Psychologist Analysis · {totalWords} words analysed</p>
                        </div>

                        {/* OLQ Scores */}
                        <div className="p-6 rounded-2xl mb-5" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#f5a623' }}>OLQ Profile</p>
                            {Object.entries(result.olq_scores || {}).map(([label, score]) => (
                                <OLQRating key={label} label={label} score={score} />
                            ))}
                        </div>

                        {/* Psychologist Summary */}
                        <div className="p-6 rounded-2xl mb-5" style={{ background: '#0d0d0d', border: '1px solid rgba(139,92,246,0.15)' }}>
                            <div className="flex items-center gap-2 mb-4">
                                <Brain className="w-4 h-4" style={{ color: '#8b5cf6' }} />
                                <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#8b5cf6' }}>Psychologist Summary</p>
                            </div>
                            <p className="text-sm leading-7 whitespace-pre-line" style={{ color: '#c5c5c5' }}>{result.psychologist_summary}</p>
                        </div>

                        {/* Consistency */}
                        <div className="p-5 rounded-2xl mb-5" style={{ background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.12)' }}>
                            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#f5a623' }}>Consistency Analysis</p>
                            <p className="text-sm leading-relaxed" style={{ color: '#9a9a9a' }}>{result.consistency_analysis}</p>
                        </div>

                        {/* Strengths + Red Flags */}
                        <div className="grid sm:grid-cols-2 gap-4 mb-5">
                            <div className="p-5 rounded-2xl" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)' }}>
                                <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#22c55e' }}>Strengths</p>
                                {(result.strengths || []).map((s, i) => (
                                    <div key={i} className="flex items-start gap-2 mb-2">
                                        <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#22c55e' }} />
                                        <p className="text-xs leading-relaxed" style={{ color: '#86efac' }}>{s}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="p-5 rounded-2xl" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)' }}>
                                <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#ef4444' }}>Red Flags</p>
                                {(result.red_flags || []).length === 0
                                    ? <p className="text-xs" style={{ color: '#4a4a4a' }}>No red flags detected.</p>
                                    : (result.red_flags || []).map((f, i) => (
                                        <div key={i} className="flex items-start gap-2 mb-2">
                                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }} />
                                            <p className="text-xs leading-relaxed" style={{ color: '#fca5a5' }}>{f}</p>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Section Feedback */}
                        <div className="p-6 rounded-2xl mb-5" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <p className="text-xs font-black uppercase tracking-widest mb-5" style={{ color: '#f5a623' }}>Section-by-Section Feedback</p>
                            {SECTIONS.map(s => (
                                <div key={s.key} className="mb-4 pb-4 border-b last:border-b-0 last:mb-0 last:pb-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <s.icon className="w-4 h-4" style={{ color: s.color }} />
                                        <p className="text-xs font-black" style={{ color: s.color }}>{s.number}. {s.title}</p>
                                    </div>
                                    <p className="text-xs leading-relaxed pl-6" style={{ color: '#7a7a7a' }}>
                                        {result.section_feedback?.[s.key] || '—'}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Tips */}
                        <div className="p-5 rounded-2xl mb-8" style={{ background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.12)' }}>
                            <div className="flex items-center gap-2 mb-3">
                                <Lightbulb className="w-4 h-4" style={{ color: '#06b6d4' }} />
                                <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#06b6d4' }}>Tips to Improve Your SDT</p>
                            </div>
                            {(result.tips || []).map((tip, i) => (
                                <p key={i} className="text-sm mb-2 flex items-start gap-2" style={{ color: '#9a9a9a' }}>
                                    <span style={{ color: '#06b6d4', marginTop: 2, flexShrink: 0 }}>→</span> {tip}
                                </p>
                            ))}
                        </div>

                        {/* Your Answers Review */}
                        <button onClick={() => setShowModel(m => !m)}
                            className="flex items-center gap-2 w-full text-xs font-bold mb-5 px-5 py-3.5 rounded-xl transition-all"
                            style={{ background: showModel ? 'rgba(245,166,35,0.12)' : '#0d0d0d', border: '1px solid rgba(245,166,35,0.15)', color: '#f5a623' }}>
                            <Eye className="w-4 h-4" /> {showModel ? 'Hide' : 'Review'} Your Answers
                        </button>
                        <AnimatePresence>
                            {showModel && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    className="mb-8 space-y-4">
                                    {SECTIONS.map(s => (
                                        <div key={s.key} className="p-5 rounded-2xl" style={{ background: '#0d0d0d', border: `1px solid ${s.color}18` }}>
                                            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: s.color }}>{s.number}. {s.title}</p>
                                            <p className="text-sm leading-7 whitespace-pre-line" style={{ color: '#6a6a6a' }}>{answers[s.key]}</p>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Actions */}
                        <div className="grid sm:grid-cols-2 gap-3">
                            <button onClick={restart}
                                className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm btn-outline-gold">
                                <RotateCcw className="w-4 h-4" /> Redo SDT
                            </button>
                            <Link to="/gto-simulator"
                                className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm text-black btn-gold">
                                <Shield className="w-4 h-4" /> Back to GTO Hub
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    // ── WRITE PHASE ────────────────────────────────────────────────────────────
    return (
        <div ref={topRef} className="min-h-screen pt-24 pb-20 px-4" style={{ background: '#000' }}>
            <div className="max-w-3xl mx-auto">
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <Link to="/gto-simulator" className="p-2 rounded-xl" style={{ background: '#111', color: '#5a5a5a' }}>
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#8b5cf6' }}>GTO · Psychological Battery</p>
                            <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Cinzel, serif' }}>Self Description Test</h1>
                        </div>
                    </div>

                    {/* Instructions banner */}
                    <div className="p-5 rounded-2xl mb-6" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
                        <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#8b5cf6' }}>Instructions</p>
                        <p className="text-sm leading-relaxed" style={{ color: '#7a7a7a' }}>
                            Describe yourself from <strong className="text-white">5 perspectives</strong>. Take your time — this is <strong className="text-white">not timed</strong>.
                            Be honest and balanced. The SSB psychologist looks for self-awareness, consistency, and authenticity across all sections.
                        </p>
                        <div className="mt-3 flex items-center gap-4 flex-wrap">
                            <span className="text-xs font-bold" style={{ color: '#8b5cf6' }}>
                                ✦ Fill at least {MIN_WORDS} words per section
                            </span>
                            <span className="text-xs font-bold" style={{ color: '#4a4a4a' }}>
                                Total: {totalWords} words
                            </span>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold" style={{ color: '#5a5a5a' }}>{sectionsComplete} / {SECTIONS.length} sections complete</span>
                            <span className="text-xs font-bold" style={{ color: sectionsComplete === SECTIONS.length ? '#22c55e' : '#5a5a5a' }}>
                                {Math.round((sectionsComplete / SECTIONS.length) * 100)}%
                            </span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: '#1a1a1a' }}>
                            <motion.div className="h-1.5 rounded-full transition-all"
                                style={{ width: `${(sectionsComplete / SECTIONS.length) * 100}%`, background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)' }} />
                        </div>
                    </div>

                    {/* Section Cards */}
                    {SECTIONS.map(section => (
                        <SectionCard
                            key={section.key}
                            section={section}
                            value={answers[section.key]}
                            onChange={v => setAnswers(a => ({ ...a, [section.key]: v }))}
                            active={activeKey === section.key}
                            onFocus={() => setActiveKey(section.key)}
                            feedback={result?.section_feedback?.[section.key]}
                        />
                    ))}

                    {/* Bottom action bar */}
                    <div className="sticky bottom-4 z-30 mt-6">
                        <div className="flex gap-3 p-4 rounded-2xl" style={{ background: 'rgba(0,0,0,0.95)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
                            <button onClick={saveDraft}
                                className="flex items-center gap-2 px-4 py-3 rounded-xl font-black text-sm flex-shrink-0 transition-all btn-outline-gold">
                                <Save className="w-4 h-4" />
                                {saveMsg || 'Save Draft'}
                            </button>
                            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                                onClick={analyze} disabled={!allComplete}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm text-black transition-all btn-gold disabled:opacity-40"
                                style={{ fontFamily: 'Cinzel, serif' }}>
                                <Brain className="w-4 h-4" />
                                {allComplete ? 'Save & Analyse SDT →' : `Complete ${SECTIONS.length - sectionsComplete} more section(s)`}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SDTTest;
