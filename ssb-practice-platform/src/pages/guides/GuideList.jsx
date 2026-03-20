import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, ChevronRight, ChevronLeft, CheckCircle,
    Shield, Zap, Target, Brain, Activity, Swords, ArrowLeft
} from 'lucide-react';

const GUIDES = {
    oir: {
        title: 'OIR — Intelligence Rating',
        icon: Zap,
        color: '#f5a623',
        desc: 'Master verbal & non-verbal reasoning through timed psychological battery tests.',
        steps: [
            {
                title: 'Understanding Verbal Reasoning',
                content: 'Verbal reasoning tests your ability to find relationships between words, complete analogies, and classify items. The SSB uses series-based and classification patterns.',
                tips: ['Read questions twice — fast', 'Skip tough ones immediately', 'Return with left time', 'Pattern recognition beats logic here'],
            },
            {
                title: 'Non-Verbal Mastery',
                content: 'Figure-based questions test spatial intelligence — series completion, odd-one-out among diagrams, mirror images, and paper folding.',
                tips: ['Watch for rotation direction', 'Count edges and shapes', 'Mirror logic: flip vertically then horizontally', 'Elimination eliminates wrong options faster'],
            },
            {
                title: 'Speed & Accuracy Strategy',
                content: 'OIR has two parts: Verbal (VB) and Non-Verbal (NV) — each timed separately. You must answer accurately with speed. There is no negative marking.',
                tips: ['Attempt all questions even if unsure', 'Trust your first instinct', 'Practice daily 15-minute timed drills', 'Build muscle memory for pattern types'],
            },
        ],
    },
    ppdt: {
        title: 'PPDT — Picture Perception',
        icon: Target,
        color: '#e8963d',
        desc: 'Narrate and discuss a blurred picture while demonstrating leadership in group dynamics.',
        steps: [
            {
                title: 'The 30-Second Observation Phase',
                content: 'You get exactly 30 seconds to observe a hazy picture. Your goal: identify all characters (male/female/age), their mood, their activity, and the setting.',
                tips: ['Count all visible characters first', 'Note mood: positive → action-positive', 'Always write a positive, constructive story', 'The hero should be relatable and decisive'],
            },
            {
                title: 'Writing Your 4-Minute Story',
                content: 'Use all 4 minutes. Your story must include: past (what led to this), present (what is happening), and future (what will happen). One character = the lead (your OLQ vehicle).',
                tips: ['Follow: Past → Present → Future structure', 'Give your hero a name and realistic job', 'Show initiative and leadership in the story', 'Avoid conflicts, accidents, and negative endings'],
            },
            {
                title: 'Group Discussion Phase',
                content: 'You will discuss the picture in a leaderless group. The goal is to form a common story — not win the argument. Active facilitation is valued over dominance.',
                tips: ['Listen more than you speak', 'Acknowledge others\' ideas positively', 'Bring the group to consensus', 'Speak clearly, calmly, and confidently'],
            },
        ],
    },
    wat: {
        title: 'WAT — Word Association Test',
        icon: Brain,
        color: '#d9883a',
        desc: 'Associate 60 words in 10 seconds each — your instinctive responses reveal your personality.',
        steps: [
            {
                title: 'The 10-Second Rule',
                content: 'Each word appears for exactly 10 seconds. You must write the first meaningful sentence that comes to mind. There is no time to think analytically — that is the design.',
                tips: ['Write your FIRST thought always', 'Full sentences preferred over fragments', 'Never leave a blank — write anything', 'Practice daily with flash-card drills'],
            },
            {
                title: 'Positive Association Technique',
                content: 'Even for negative words (failure, fear, enemy), your response must reflect positive outlook and action. The psychologist is mapping your OLQs from 600 words.',
                tips: ['Failure → Learning / Resilience', 'Fear → Courage / Overcome', 'Conflict → Resolution / Leadership', 'Keep all sentences future-forward and active'],
            },
            {
                title: 'Practice & Speed Building',
                content: 'WAT is a speed test of your personality layer. The only way to bypass the analytical brain is repetition. You need 1000+ practice words before selection.',
                tips: ['Write 60 words daily for 2 weeks before SSB', 'Review your responses — are they group-positive?', 'Avoid "I" focus — think team and duty', 'Record your practice and review patterns'],
            },
        ],
    },
    srt: {
        title: 'SRT — Situation Reaction Test',
        icon: Activity,
        color: '#c87a35',
        desc: 'React to 60 real-life scenarios in 30 minutes — demonstrate OLQs in every response.',
        steps: [
            {
                title: 'Understanding the OLQ Framework',
                content: 'Every SRT scenario is designed to reveal Officer Like Qualities: initiative, decisiveness, cooperation, and resource management. Your reactions must show these naturally.',
                tips: ['Show immediate action — no dithering', 'Always involve and help others', 'Use available resources cleverly', 'Avoid violent or impractical responses'],
            },
            {
                title: 'The 30-Second Response Formula',
                content: 'You have approximately 30 seconds per situation. Use a consistent formula: assess → act → inform. Your response should show who you help, what you do, and why.',
                tips: ['Assess: 1 sec mental model', 'Act: physical, immediate action', 'Inform: notify relevant authorities', 'Keep it realistic and brief'],
            },
            {
                title: 'Common Situations & Ideal Responses',
                content: 'SRT scenarios cover: accidents, leadership failures, group conflicts, natural calamities, moral dilemmas. Prepare a mental library of responses for each category.',
                tips: ['Accident → first aid + call help + manage crowd', 'Leadership gap → take temporary charge appropriately', 'Moral dilemma → duty and integrity over convenience', 'Group conflict → listen, mediate, resolve peacefully'],
            },
        ],
    },
    gto: {
        title: 'GTO — Group Testing Officer',
        icon: Swords,
        color: '#b86c30',
        desc: 'Demonstrate leadership, coordination, and physical readiness across 10 outdoor tasks.',
        steps: [
            {
                title: 'Group Discussion (GD)',
                content: 'Two rounds: one with topic from slides, one leaderless. You must speak relevantly, listen, acknowledge others, and help the group reach consensus.',
                tips: ['Start a point, don\'t just react', 'Use names of fellow candidates', 'Bring quiet members into the conversation', 'No shouting — confidence through calmness'],
            },
            {
                title: 'Individual Obstacles',
                content: '10 obstacles scaled in difficulty (marks). You must attempt all 10 even if you fail some. Style, confidence, and attempt rate matter as much as success.',
                tips: ['Attempt all 10 regardless of fear', 'Higher-numered obstacles have more marks', 'Stumbling and recovering shows attitude', 'Help others after your turn if possible'],
            },
            {
                title: 'Command Task & Group Tasks',
                content: 'In Command Task, you get subordinates and props to achieve a goal. In PGT/HGT, the team solves problems together. Show coordinated leadership, not dictatorship.',
                tips: ['Plan 30 seconds before executing', 'Give clear, polite, confident orders', 'Involve all subordinates with defined roles', 'Improvise intelligently when plans fail'],
            },
        ],
    },
};

// ─── Step Viewer ──────────────────────────────────────────────────────────────
const GuidePlayer = ({ guide, guideId }) => {
    const [step, setStep] = useState(0);
    const current = guide.steps[step];
    const Icon = guide.icon;

    return (
        <div className="min-h-screen pt-28 pb-24 px-6" style={{ background: '#000' }}>
            <div className="max-w-3xl mx-auto">

                {/* Back */}
                <Link to="/oir-guide" className="inline-flex items-center gap-2 text-sm font-bold mb-10 transition-colors hover:text-white" style={{ color: '#5a5a5a' }}>
                    <ArrowLeft className="w-4 h-4" /> Back to Guides
                </Link>

                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${guide.color}18`, border: `1px solid ${guide.color}30` }}>
                        <Icon className="w-7 h-7" style={{ color: guide.color }} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'Cinzel, serif' }}>{guide.title}</h1>
                        <p className="text-sm" style={{ color: '#5a5a5a' }}>{guide.desc}</p>
                    </div>
                </div>

                {/* Step Progress */}
                <div className="flex gap-2 mb-10">
                    {guide.steps.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => setStep(i)}
                            className="flex-1 h-1.5 rounded-full transition-all"
                            style={{ background: i <= step ? guide.color : 'rgba(255,255,255,0.08)' }}
                        />
                    ))}
                </div>

                {/* Step Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                        className="rounded-2xl p-8 mb-6"
                        style={{ background: '#0e0e0e', border: `1px solid ${guide.color}20` }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-black uppercase tracking-widest" style={{ color: guide.color }}>Step {step + 1} of {guide.steps.length}</span>
                        </div>
                        <h2 className="text-xl font-black text-white mb-4" style={{ fontFamily: 'Cinzel, serif' }}>{current.title}</h2>
                        <p className="text-sm leading-relaxed mb-7" style={{ color: '#8a8a8a' }}>{current.content}</p>

                        <div className="p-5 rounded-xl" style={{ background: `${guide.color}08`, border: `1px solid ${guide.color}15` }}>
                            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: guide.color }}>Key Tips</p>
                            <ul className="space-y-2">
                                {current.tips.map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#7a7a7a' }}>
                                        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: guide.color }} />
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex gap-3">
                    <button
                        onClick={() => setStep(s => Math.max(0, s - 1))}
                        disabled={step === 0}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', color: step === 0 ? '#2a2a2a' : '#9ca3af', border: '1px solid rgba(255,255,255,0.06)', cursor: step === 0 ? 'not-allowed' : 'pointer' }}
                    >
                        <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    {step < guide.steps.length - 1 ? (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm text-black"
                            style={{ background: guide.color, fontFamily: 'Cinzel, serif', boxShadow: `0 8px 24px ${guide.color}30` }}
                        >
                            Next Step <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <Link
                            to="/oir-guide"
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm text-black"
                            style={{ background: '#22c55e', fontFamily: 'Cinzel, serif', boxShadow: '0 8px 24px rgba(34,197,94,0.25)' }}
                        >
                            <CheckCircle className="w-4 h-4" /> Module Complete!
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Guide List (landing) ─────────────────────────────────────────────────────
const GuideList = () => {
    const { id } = useParams();

    // If a guide ID is in the URL, render the step player
    if (id && GUIDES[id]) {
        return <GuidePlayer guide={GUIDES[id]} guideId={id} />;
    }

    return (
        <div className="min-h-screen pt-28 pb-24 px-6" style={{ background: '#000' }}>
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-black uppercase tracking-widest" style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', color: '#f5a623' }}>
                        <BookOpen className="w-3.5 h-3.5" /> Learning Hub
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white mb-5 section-title" style={{ fontFamily: 'Cinzel, serif' }}>
                        PREP <span className="gold-gradient-text">GUIDES</span>
                    </h1>
                    <p className="text-sm max-w-md mx-auto mt-6" style={{ color: '#5a5a5a' }}>
                        Master the techniques and strategies required to clear the SSB with expert step-by-step walkthroughs.
                    </p>
                </div>

                {/* Guide Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Object.entries(GUIDES).map(([id, guide], i) => {
                        const Icon = guide.icon;
                        return (
                            <motion.div
                                key={id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07 }}
                                whileHover={{ y: -5 }}
                                className="rounded-2xl p-6 flex flex-col transition-all"
                                style={{ background: '#0e0e0e', border: '1px solid rgba(245,166,35,0.08)' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = `${guide.color}40`; e.currentTarget.style.boxShadow = `0 8px 30px ${guide.color}10`; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(245,166,35,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: `${guide.color}18`, border: `1px solid ${guide.color}25` }}>
                                    <Icon className="w-6 h-6" style={{ color: guide.color }} />
                                </div>
                                <h2 className="font-black text-white text-base mb-2" style={{ fontFamily: 'Cinzel, serif' }}>{guide.title}</h2>
                                <p className="text-xs leading-relaxed mb-6 flex-1" style={{ color: '#5a5a5a' }}>{guide.desc}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold" style={{ color: '#3a3a3a' }}>{guide.steps.length} steps</span>
                                    <Link
                                        to={`/oir-guide/${id}`}
                                        className="flex items-center gap-1.5 text-xs font-black transition-all hover:gap-2"
                                        style={{ color: guide.color }}
                                    >
                                        Start Module <ChevronRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default GuideList;
