import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    ChevronLeft, Map, Clock, Users, AlertTriangle, CheckCircle,
    Star, RotateCcw, Send, Eye, Lightbulb, Target, Award, Zap, FileText
} from 'lucide-react';

// ─── GPE Task Database ─────────────────────────────────────────────────────────
const GPE_TASKS = [
    {
        id: 1,
        title: 'The Riverside Crisis',
        difficulty: 'Medium',
        diffColor: '#f5a623',
        timeLimit: 10, // minutes to read + plan (for awareness)
        mapDescription: 'River flows East-West. Village Deer (your base) is South of River. Village Tiger is North-West. Village Lion has Police Post & PCO. Village Fox is East. Village Bear is connected by bus.',
        scenario: `You are 8 students from city Deer who have gone for boating on the riverside. You had parked yourself on the southern side of the river at point A. While your friends were boating, you were going to village Tiger to bring drinking water.

While crossing the Railway line, you notice that one fish plate of the Railway line has been found completely removed. A boy came running to inform you that he overheard 5 terrorists who planted a powerful road mine to kill the Chief Minister who will be passing in one hour. The terrorists were hiding in the nearby jungle.

At the same time, one villager came to inform you that a tigress has mauled 2 young girls and they are lying unconscious in the jungle. Just then another man informs that his haystack was on fire and wanted your help.

There is a Police post and a PCO in Village Lion. A messenger from PCO enquires your name and informs that your mother is seriously ill and your presence is immediately required.

When you start moving, you see a young beautiful daughter of Pradhan of Village Tiger, who was walking along with you, just slips and falls in the ground well. But you do not not know swimming. The Village Pradhan has got 5 guns with him. The train will pass through your location at 1600 hrs. A half an hour bus service is available between cities Deer and Bear. A number of carts are available in Village Fox. There is a motor boat that can travel at a speed of 10 KM per hr.

Time now is 1415 hrs. You have got a jeep with you. Being a young and brave student, what will you do?`,
        resources: [
            'Jeep (1)', 'Motor Boat — 10 km/hr', 'Bus — Deer ↔ Bear (every 30 min)',
            'Carts (in Vill Fox)', '5 Guns (Pradhan of Vill Tiger)', 'PCO in Vill Lion', 'Police Post in Vill Lion'
        ],
        problems: [
            { id: 'P1', label: 'Missing fish plate on railway line', priority: 'Critical', icon: '🚂', color: '#ef4444' },
            { id: 'P2', label: 'Road mine planted by terrorists (CM in 1 hr)', priority: 'Critical', icon: '💣', color: '#ef4444' },
            { id: 'P3', label: '2 girls mauled by tigress — unconscious', priority: 'High', icon: '🐯', color: '#f5a623' },
            { id: 'P4', label: 'Haystack on fire', priority: 'Medium', icon: '🔥', color: '#f97316' },
            { id: 'P5', label: 'Girl fell into ground well', priority: 'High', icon: '🕳️', color: '#f5a623' },
            { id: 'P6', label: 'Mother seriously ill', priority: 'Low', icon: '🏥', color: '#22c55e' },
        ],
        keyFacts: [
            'Time: 1415 hrs | Train at: 1600 hrs | CM passing in ~1 hour',
            'You have a jeep — fastest local resource',
            'PCO in Vill Lion to contact police/authorities',
            'You do NOT know swimming — cannot rescue girl from well alone',
            'Pradhan has 5 guns — can help with terrorist threat',
            'Motor boat for river crossing if needed',
        ],
        modelAnswer: `**Priority Classification:**
- P1 (Critical): Missing fish plate → Railway accident imminent at 1600 hrs
- P2 (Critical): Road mine + terrorists → CM's life at risk within 1 hr  
- P3 (High): 2 unconscious girls in jungle — need immediate medical help
- P5 (High): Girl in well — life-threatening
- P4 (Medium): Haystack fire — property loss, can spread
- P6 (Low): Mother's illness — personal, can be delegated

**Ideal Action Plan:**

**Immediate (1415–1420):**
1. Use PCO in Vill Lion — call police about terrorists + road mine + fish plate + CM's route simultaneously. This single call handles P1 & P2 efficiently.
2. Contact Railway department about fish plate via PCO.
3. Request Police to send armed unit + neutralize terrorists.

**Concurrent (Split team — jeep):**
4. Send 2 students in jeep to Vill Tiger to inform Pradhan — arm volunteers with 5 guns to establish a perimeter around the terrorist jungle area.
5. Send 2 students to rescue girls mauled by tigress — use carts from Vill Fox for transport to nearest medical facility.
6. Ask 2 locals to alert fire brigade / form bucket chain for haystack fire.

**Well Rescue (P5):**
7. Girl in well — inform Pradhan of Vill Tiger (nearest authority). Use rope/available means. Do NOT jump in — you cannot swim.

**Personal:**
8. Mother's illness — send message via PCO asking relatives to handle. You cannot leave during a crisis of this magnitude.

**Key OLQ Demonstrated:**
- Effective Intelligence: Prioritization and delegation
- Group Cohesion: Splitting team logically
- Initiative: Using available resources (jeep, PCO, guns, carts)
- Sense of Responsibility: Not abandoning the group for personal matters`,
        evaluationCriteria: [
            { criterion: 'Correct Priority Order', weight: 25 },
            { criterion: 'Use of Available Resources (Jeep, PCO, Boat, etc.)', weight: 20 },
            { criterion: 'Simultaneous/Parallel Action Planning', weight: 20 },
            { criterion: 'Team Delegation & Leadership', weight: 15 },
            { criterion: 'Handling Personal Issue (Mother) Correctly', weight: 10 },
            { criterion: 'Clarity & Structure of Plan', weight: 10 },
        ],
    },
];

// ─── Phase Enum ────────────────────────────────────────────────────────────────
const PHASE = { INTRO: 'intro', TASK: 'task', ANSWER: 'answer', RESULT: 'result' };

// ─── OLQ Badge ─────────────────────────────────────────────────────────────────
const Badge = ({ label, color = '#f5a623' }) => (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full mr-1.5 mb-1.5 inline-block"
        style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
        {label}
    </span>
);

// ─── Priority Badge ─────────────────────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
    const map = { Critical: '#ef4444', High: '#f5a623', Medium: '#f97316', Low: '#22c55e' };
    const c = map[priority] || '#6b6b6b';
    return (
        <span className="text-xs font-black px-2 py-0.5 rounded-full ml-2"
            style={{ background: `${c}18`, color: c, border: `1px solid ${c}30` }}>
            {priority}
        </span>
    );
};

// ─── Score Meter ───────────────────────────────────────────────────────────────
const ScoreMeter = ({ score, max, label }) => {
    const pct = Math.min((score / max) * 100, 100);
    const color = pct >= 75 ? '#22c55e' : pct >= 50 ? '#f5a623' : '#ef4444';
    return (
        <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold" style={{ color: '#9a9a9a' }}>{label}</span>
                <span className="text-xs font-black" style={{ color }}>{score}/{max}</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: '#1a1a1a' }}>
                <motion.div className="h-1.5 rounded-full" initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.2 }}
                    style={{ background: color }} />
            </div>
        </div>
    );
};

// ─── Simple AI Evaluator ───────────────────────────────────────────────────────
function evaluateAnswer(answer, task) {
    const lc = answer.toLowerCase();
    let score = 0;
    const feedback = [];
    const tips = [];

    // Check priority keywords
    const criticalKeywords = ['railway', 'fish plate', 'train', 'terrorist', 'mine', 'chief minister', 'cm'];
    const highKeywords = ['girl', 'well', 'mauled', 'tigress', 'unconscious'];
    const resourceKeywords = ['jeep', 'pco', 'police', 'call', 'gun', 'boat', 'cart'];
    const delegateKeywords = ['send', 'assign', 'delegate', 'team', 'group', 'split', 'divide'];
    const motherKeywords = ['mother', 'personal', 'message', 'relative', 'later'];

    const critHits = criticalKeywords.filter(k => lc.includes(k)).length;
    const highHits = highKeywords.filter(k => lc.includes(k)).length;
    const resHits = resourceKeywords.filter(k => lc.includes(k)).length;
    const delHits = delegateKeywords.filter(k => lc.includes(k)).length;
    const motHits = motherKeywords.filter(k => lc.includes(k)).length;

    // Priority Score (0-25)
    const priScore = Math.min(Math.round((critHits / criticalKeywords.length) * 15 + (highHits / highKeywords.length) * 10), 25);
    score += priScore;
    if (priScore >= 18) feedback.push({ text: 'Excellent priority identification — critical threats addressed first.', good: true });
    else if (priScore >= 10) { feedback.push({ text: 'Partial prioritization — some critical items missed.', good: false }); tips.push('Railway fish plate and terrorist mine are Priority 1 — address them first.'); }
    else { feedback.push({ text: 'Poor prioritization — critical threats not highlighted.', good: false }); tips.push('Always classify: Critical → High → Medium → Low before planning.'); }

    // Resource Score (0-20)
    const resScore = Math.min(Math.round((resHits / resourceKeywords.length) * 20), 20);
    score += resScore;
    if (resScore >= 15) feedback.push({ text: 'Good resource utilization — PCO, jeep, and police mentioned.', good: true });
    else { feedback.push({ text: 'Underutilized resources — PCO and jeep are key tools.', good: false }); tips.push('Use PCO to contact police about ALL critical threats simultaneously. The jeep is your fastest asset.'); }

    // Parallel actions (0-20)
    const parScore = Math.min(Math.round((delHits / delegateKeywords.length) * 20), 20);
    score += parScore;
    if (parScore >= 15) feedback.push({ text: 'Good parallel tasking — team split effectively.', good: true });
    else { feedback.push({ text: 'Sequential thinking — GPE rewards parallel concurrent actions.', good: false }); tips.push('Split your 8-member team into sub-groups to handle multiple problems simultaneously.'); }

    // Delegation (0-15)
    const delScore = Math.min(Math.round((delHits / 3) * 15), 15);
    score += delScore;

    // Mother handling (0-10)
    const motScore = motHits > 0 ? Math.min(motHits * 5, 10) : 0;
    score += motScore;
    if (motScore === 0) tips.push('Address the "mother ill" issue — correct approach is to send a message via PCO and NOT abandon the crisis.');

    // Length/structure bonus (0-10)
    const wordCount = answer.trim().split(/\s+/).length;
    const structScore = wordCount > 150 ? 10 : wordCount > 80 ? 6 : wordCount > 40 ? 3 : 0;
    score += structScore;
    if (wordCount < 80) tips.push('Add more detail — a GPE solution should include reasoning, not just a list of actions.');

    const breakdown = [
        { label: 'Priority Identification', score: priScore, max: 25 },
        { label: 'Resource Utilization', score: resScore, max: 20 },
        { label: 'Parallel Action Planning', score: parScore, max: 20 },
        { label: 'Team Delegation', score: delScore, max: 15 },
        { label: 'Personal Issue Handling', score: motScore, max: 10 },
        { label: 'Detail & Clarity', score: structScore, max: 10 },
    ];

    return { score: Math.min(score, 100), breakdown, feedback, tips, wordCount };
}

// ─── Main Component ─────────────────────────────────────────────────────────────
const GPESimulator = () => {
    const [phase, setPhase] = useState(PHASE.INTRO);
    const [task] = useState(GPE_TASKS[0]);
    const [answer, setAnswer] = useState('');
    const [result, setResult] = useState(null);
    const [showModel, setShowModel] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const topRef = useRef(null);
    const scrollTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth' });

    const submitAnswer = () => {
        if (answer.trim().length < 20) return;
        const res = evaluateAnswer(answer, task);
        setResult(res);
        setPhase(PHASE.RESULT);
        scrollTop();
    };

    const restart = () => {
        setPhase(PHASE.INTRO);
        setAnswer('');
        setResult(null);
        setShowModel(false);
        setShowMap(false);
        scrollTop();
    };

    const getGrade = (s) => {
        if (s >= 85) return { label: 'Outstanding', color: '#f5a623', sub: 'Exceptional GPE candidate' };
        if (s >= 70) return { label: 'Commendable', color: '#22c55e', sub: 'Above average performance' };
        if (s >= 50) return { label: 'Average', color: '#8b5cf6', sub: 'Needs improvement in key areas' };
        return { label: 'Needs Work', color: '#ef4444', sub: 'Significant gaps to address' };
    };

    // ── INTRO ──────────────────────────────────────────────────────────────────
    if (phase === PHASE.INTRO) return (
        <div ref={topRef} className="min-h-screen pt-24 pb-20 px-4" style={{ background: '#000' }}>
            <div className="max-w-3xl mx-auto">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Link to="/gto-simulator" className="inline-flex items-center gap-2 text-xs font-bold mb-8 transition-colors"
                        style={{ color: '#4a4a4a' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#f5a623'}
                        onMouseLeave={e => e.currentTarget.style.color = '#4a4a4a'}>
                        <ChevronLeft className="w-4 h-4" /> Back to GTO
                    </Link>

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-black uppercase tracking-widest"
                        style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', color: '#f5a623' }}>
                        <Map className="w-3.5 h-3.5" /> Group Planning Exercise
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black text-white mb-4" style={{ fontFamily: 'Cinzel, serif' }}>
                        GROUP<br /><span className="gold-gradient-text">PLANNING</span>
                    </h1>

                    <p className="text-base leading-relaxed mb-10" style={{ color: '#6b6b6b', maxWidth: 520 }}>
                        Read the situation carefully, identify problems by priority, allocate resources, and submit your group plan. Your solution is analysed against SSB GPE parameters and OLQ criteria.
                    </p>

                    {/* What is GPE */}
                    <div className="p-5 rounded-2xl mb-6" style={{ background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.1)' }}>
                        <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#f5a623' }}>What is GPE?</p>
                        <p className="text-sm leading-relaxed" style={{ color: '#8a8a8a' }}>
                            In the SSB GTO, the Group Planning Exercise presents a complex situation with multiple simultaneous problems. You must collectively discuss, prioritize, and present a workable plan using available resources under time pressure. It tests your <strong style={{ color: '#e5e5e5' }}>Effective Intelligence, Initiative, Group Cohesion,</strong> and <strong style={{ color: '#e5e5e5' }}>Sense of Responsibility</strong>.
                        </p>
                    </div>

                    {/* OLQs */}
                    <div className="p-5 rounded-2xl mb-10" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#f5a623' }}>OLQs Assessed</p>
                        <div className="flex flex-wrap">
                            {['Effective Intelligence', 'Initiative', 'Sense of Responsibility', 'Group Cohesion', 'Decisiveness', 'Ability to Influence', 'Power of Expression'].map(o => (
                                <Badge key={o} label={o} />
                            ))}
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="grid sm:grid-cols-4 gap-3 mb-12">
                        {[
                            { icon: FileText, step: '01', label: 'Read Situation', desc: 'Study all problems & resources' },
                            { icon: Target, step: '02', label: 'Prioritize', desc: 'Rank problems Critical → Low' },
                            { icon: Users, step: '03', label: 'Plan & Delegate', desc: 'Allocate resources to problems' },
                            { icon: Send, step: '04', label: 'Submit', desc: 'Get AI feedback & score' },
                        ].map(s => (
                            <div key={s.step} className="p-4 rounded-xl text-center" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(245,166,35,0.1)' }}>
                                    <s.icon className="w-5 h-5" style={{ color: '#f5a623' }} />
                                </div>
                                <p className="text-xs font-black text-white mb-1">{s.label}</p>
                                <p className="text-xs" style={{ color: '#4a4a4a' }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>

                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => { scrollTop(); setPhase(PHASE.TASK); }}
                        className="w-full py-5 rounded-2xl font-black text-black text-base btn-gold"
                        style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.05em' }}>
                        BEGIN GPE →
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );

    // ── TASK + ANSWER ──────────────────────────────────────────────────────────
    if (phase === PHASE.TASK || phase === PHASE.ANSWER) return (
        <div ref={topRef} className="min-h-screen pt-24 pb-20 px-4" style={{ background: '#000' }}>
            <div className="max-w-3xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-8">
                        <button onClick={() => setPhase(PHASE.INTRO)} className="p-2 rounded-xl" style={{ background: '#111', color: '#5a5a5a' }}>
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#f5a623' }}>GPE — {task.difficulty}</p>
                            <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cinzel, serif' }}>{task.title}</h2>
                        </div>
                    </div>

                    {/* Key Facts Strip */}
                    <div className="flex items-center gap-3 p-4 rounded-2xl mb-6 overflow-x-auto" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                        <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#ef4444' }} />
                        <div className="flex gap-4">
                            {task.keyFacts.map((f, i) => (
                                <span key={i} className="text-xs font-bold whitespace-nowrap" style={{ color: '#ef4444' }}>{f}</span>
                            ))}
                        </div>
                    </div>

                    {/* Map toggle */}
                    <button onClick={() => setShowMap(m => !m)}
                        className="flex items-center gap-2 text-xs font-bold mb-4 px-4 py-2.5 rounded-xl transition-all"
                        style={{ background: showMap ? 'rgba(245,166,35,0.12)' : '#111', border: '1px solid rgba(245,166,35,0.15)', color: '#f5a623' }}>
                        <Map className="w-4 h-4" /> {showMap ? 'Hide' : 'Show'} Map Layout
                    </button>
                    <AnimatePresence>
                        {showMap && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="mb-6 p-4 rounded-2xl" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}>
                                {/* Simple SVG map */}
                                <svg width="100%" viewBox="0 0 500 220" style={{ maxHeight: 200 }}>
                                    <rect width="500" height="220" fill="#0d0d0d" />
                                    {/* River */}
                                    <rect x="0" y="90" width="500" height="35" fill="#1e3a5f" opacity="0.7" />
                                    <text x="250" y="113" fill="#3b82f6" fontSize="11" textAnchor="middle" fontWeight="bold">~ ~ ~ RIVER ~ ~ ~</text>
                                    {/* Railway line */}
                                    <line x1="0" y1="160" x2="500" y2="160" stroke="#888" strokeWidth="3" strokeDasharray="8,4" />
                                    <text x="400" y="155" fill="#888" fontSize="9">Railway Line</text>
                                    {/* Villages */}
                                    <rect x="50" y="170" width="70" height="30" rx="6" fill="#1a1a1a" stroke="#f5a623" strokeWidth="1" />
                                    <text x="85" y="190" fill="#f5a623" fontSize="10" textAnchor="middle" fontWeight="bold">Vill DEER</text>
                                    <text x="85" y="200" fill="#888" fontSize="8" textAnchor="middle">(Base/South)</text>

                                    <rect x="60" y="20" width="70" height="30" rx="6" fill="#1a1a1a" stroke="#22c55e" strokeWidth="1" />
                                    <text x="95" y="40" fill="#22c55e" fontSize="10" textAnchor="middle" fontWeight="bold">Vill TIGER</text>
                                    <text x="95" y="50" fill="#888" fontSize="8" textAnchor="middle">(North-West)</text>

                                    <rect x="200" y="20" width="70" height="30" rx="6" fill="#1a1a1a" stroke="#8b5cf6" strokeWidth="1" />
                                    <text x="235" y="37" fill="#8b5cf6" fontSize="10" textAnchor="middle" fontWeight="bold">Vill LION</text>
                                    <text x="235" y="48" fill="#888" fontSize="8" textAnchor="middle">PCO + Police</text>

                                    <rect x="370" y="20" width="70" height="30" rx="6" fill="#1a1a1a" stroke="#f97316" strokeWidth="1" />
                                    <text x="405" y="37" fill="#f97316" fontSize="10" textAnchor="middle" fontWeight="bold">Vill FOX</text>
                                    <text x="405" y="48" fill="#888" fontSize="8" textAnchor="middle">(Carts)</text>

                                    <rect x="380" y="170" width="70" height="30" rx="6" fill="#1a1a1a" stroke="#06b6d4" strokeWidth="1" />
                                    <text x="415" y="188" fill="#06b6d4" fontSize="10" textAnchor="middle" fontWeight="bold">City BEAR</text>
                                    <text x="415" y="200" fill="#888" fontSize="8" textAnchor="middle">(Bus 30min)</text>

                                    {/* Point A */}
                                    <circle cx="150" cy="135" r="6" fill="#ef4444" />
                                    <text x="162" y="132" fill="#ef4444" fontSize="10" fontWeight="bold">Point A (You)</text>

                                    {/* Jungle */}
                                    <text x="310" y="60" fill="#22c55e" fontSize="10" opacity="0.7">🌿 Jungle</text>
                                </svg>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Scenario text */}
                    <div className="p-6 rounded-2xl mb-6" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#f5a623' }}>Situation</p>
                        <p className="text-sm leading-7 whitespace-pre-line" style={{ color: '#c5c5c5' }}>{task.scenario}</p>
                    </div>

                    {/* Problems at a glance */}
                    <div className="p-5 rounded-2xl mb-6" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#f5a623' }}>Problems Identified</p>
                        <div className="grid sm:grid-cols-2 gap-2">
                            {task.problems.map(p => (
                                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#111' }}>
                                    <span className="text-lg">{p.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-white">{p.id}: {p.label}</p>
                                    </div>
                                    <PriorityBadge priority={p.priority} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resources */}
                    <div className="p-5 rounded-2xl mb-8" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#f5a623' }}>Available Resources</p>
                        <div className="flex flex-wrap gap-2">
                            {task.resources.map(r => (
                                <span key={r} className="text-xs px-3 py-1.5 rounded-full font-bold"
                                    style={{ background: 'rgba(245,166,35,0.08)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.15)' }}>
                                    {r}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Answer Box */}
                    <div className="mb-6">
                        <label className="block text-sm font-black text-white mb-3">
                            ✍ Your Plan <span style={{ color: '#5a5a5a', fontWeight: 400 }}>(Write your complete solution below)</span>
                        </label>
                        <textarea
                            value={answer}
                            onChange={e => setAnswer(e.target.value)}
                            rows={12}
                            placeholder="Start by classifying problems by priority (Critical → High → Medium → Low). Then describe your action plan — who does what, using which resources. Mention how you handle each problem including your mother's illness..."
                            className="w-full p-4 rounded-2xl text-sm resize-none outline-none transition-all"
                            style={{
                                background: '#0d0d0d',
                                border: '1.5px solid rgba(255,255,255,0.08)',
                                color: '#e5e5e5',
                                fontFamily: 'Inter, sans-serif',
                                lineHeight: '1.75',
                            }}
                            onFocus={e => e.target.style.borderColor = '#f5a623'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                        />
                        <div className="flex justify-between mt-2">
                            <span className="text-xs" style={{ color: '#4a4a4a' }}>
                                {answer.trim().split(/\s+/).filter(Boolean).length} words
                                <span style={{ color: '#2a2a2a' }}> · aim for 150+</span>
                            </span>
                            {answer.trim().length < 20 && (
                                <span className="text-xs" style={{ color: '#ef4444' }}>Write your plan to continue</span>
                            )}
                        </div>
                    </div>

                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={submitAnswer}
                        disabled={answer.trim().length < 20}
                        className="w-full py-5 rounded-2xl font-black text-black text-base btn-gold disabled:opacity-40"
                        style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.05em' }}>
                        <Send className="w-5 h-5 inline mr-2" />
                        SUBMIT PLAN & GET ANALYSIS →
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );

    // ── RESULT ─────────────────────────────────────────────────────────────────
    if (phase === PHASE.RESULT && result) {
        const grade = getGrade(result.score);
        return (
            <div ref={topRef} className="min-h-screen pt-24 pb-20 px-4" style={{ background: '#000' }}>
                <div className="max-w-3xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

                        {/* Score Hero */}
                        <div className="text-center mb-10 p-8 rounded-3xl relative overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, #0d0d0d, #111)', border: `1.5px solid ${grade.color}30` }}>
                            <div className="absolute inset-0 opacity-5"
                                style={{ background: `radial-gradient(circle at 50% 50%, ${grade.color}, transparent 70%)` }} />
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
                                style={{ background: `${grade.color}15`, border: `3px solid ${grade.color}40` }}>
                                <span className="text-4xl font-black" style={{ color: grade.color }}>{result.score}</span>
                            </motion.div>
                            <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: grade.color }}>{grade.label}</p>
                            <p className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Cinzel, serif' }}>GPE Score</p>
                            <p className="text-sm" style={{ color: '#6b6b6b' }}>{grade.sub} · {result.wordCount} words written</p>
                        </div>

                        {/* Score Breakdown */}
                        <div className="p-6 rounded-2xl mb-6" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <p className="text-xs font-black uppercase tracking-widest mb-5" style={{ color: '#f5a623' }}>Score Breakdown</p>
                            {result.breakdown.map((item, i) => (
                                <ScoreMeter key={i} score={item.score} max={item.max} label={item.label} />
                            ))}
                        </div>

                        {/* Feedback */}
                        <div className="p-6 rounded-2xl mb-6" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#f5a623' }}>Assessor Observations</p>
                            <div className="space-y-3">
                                {result.feedback.map((f, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                                        style={{ background: f.good ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${f.good ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
                                        {f.good
                                            ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
                                            : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />}
                                        <p className="text-sm" style={{ color: f.good ? '#86efac' : '#fca5a5' }}>{f.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Improvement Tips */}
                        {result.tips.length > 0 && (
                            <div className="p-6 rounded-2xl mb-6" style={{ background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.12)' }}>
                                <div className="flex items-center gap-2 mb-4">
                                    <Lightbulb className="w-4 h-4" style={{ color: '#f5a623' }} />
                                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#f5a623' }}>Improvement Tips</p>
                                </div>
                                <ul className="space-y-2">
                                    {result.tips.map((tip, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#9a9a9a' }}>
                                            <span style={{ color: '#f5a623', marginTop: 2 }}>→</span> {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Your Answer */}
                        <div className="p-6 rounded-2xl mb-6" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#5a5a5a' }}>Your Submitted Plan</p>
                            <p className="text-sm leading-7 whitespace-pre-line" style={{ color: '#7a7a7a' }}>{answer}</p>
                        </div>

                        {/* Model Answer */}
                        <button onClick={() => setShowModel(m => !m)}
                            className="flex items-center gap-2 w-full text-xs font-bold mb-6 px-5 py-3.5 rounded-xl transition-all"
                            style={{ background: showModel ? 'rgba(245,166,35,0.12)' : '#0d0d0d', border: '1px solid rgba(245,166,35,0.2)', color: '#f5a623' }}>
                            <Eye className="w-4 h-4" /> {showModel ? 'Hide' : 'View'} Model Answer (Study & Compare)
                        </button>
                        <AnimatePresence>
                            {showModel && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    className="mb-8 p-6 rounded-2xl" style={{ background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.15)' }}>
                                    <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#f5a623' }}>⭐ Model Answer</p>
                                    <div className="text-sm leading-7 whitespace-pre-line" style={{ color: '#c8841a' }}
                                        dangerouslySetInnerHTML={{ __html: task.modelAnswer.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fff">$1</strong>') }} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Actions */}
                        <div className="grid sm:grid-cols-2 gap-3">
                            <button onClick={restart}
                                className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm transition-all btn-outline-gold">
                                <RotateCcw className="w-4 h-4" /> Try Again
                            </button>
                            <Link to="/gto-simulator"
                                className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-black text-sm btn-gold">
                                <Zap className="w-4 h-4" /> Back to GTO Hub
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return null;
};

export default GPESimulator;
