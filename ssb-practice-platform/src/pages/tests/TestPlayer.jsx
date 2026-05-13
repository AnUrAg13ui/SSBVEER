    import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, ChevronRight, ChevronLeft, Loader2,
    AlertCircle, CheckCircle, Shield, Target, Upload,
    FileText, Zap, BrainCircuit, ImagePlus, PenLine, X,
    Eye, Smartphone, BookOpen, Lightbulb, Maximize2
} from 'lucide-react';
import api from '../../api';
import { useToast } from '../../context/ToastContext';
import QRSessionPanel from '../../components/QRSessionPanel';

// ─── Per-category test guides ─────────────────────────────────────────────────
const TEST_GUIDES = {
    PPDT: {
        color: '#e8963d',
        title: 'Picture Perception & Description Test',
        timeline: [
            { icon: Eye,        time: '30 sec', label: 'Observe the Picture',   desc: 'Study every detail — characters, mood, setting, background action.' },
            { icon: PenLine,    time: '4 min',  label: 'Write Your Story',      desc: 'One main hero, positive outcome. Past → Present → Future.' },
            { icon: Smartphone, time: '30 sec', label: 'Upload via Mobile',     desc: 'A QR code appears. Scan it to photograph your handwritten story.' },
        ],
        tips: [
            'Give your main character a name and clear role.',
            'Keep the theme positive — hero achieves the goal.',
            'Mention background characters to show social awareness.',
            'Write 60–80 words — quality beats quantity.',
            'Avoid supernatural or unrealistic endings.',
        ],
    },
    WAT: {
        color: '#d9883a',
        title: 'Word Association Test',
        timeline: [
            { icon: Clock, time: '10 sec / word', label: 'Per Word',  desc: 'Write the very first thought the word triggers in you.' },
        ],
        tips: [
            'Never leave a word blank — always write something.',
            'Write the first positive association that comes to mind.',
            'Avoid negative, violent, or dark responses.',
            'One word or a short phrase is perfectly fine.',
            'Your associations reflect your personality — stay optimistic!',
        ],
    },
    SRT: {
        color: '#c87a35',
        title: 'Situation Reaction Test',
        timeline: [
            { icon: Clock, time: '30 sec / situation', label: 'Per Situation', desc: 'React quickly — describe your immediate action.' },
        ],  
        tips: [
            'Begin with what YOU personally would do — use "I will..."',
            'Be action-oriented, decisive, and courageous.',
            'Show concern for others’ safety and well-being.',
            'Responses must be short, practical, and realistic.',
            'Trust your first instinct — it is usually the best answer.',
        ],
    },
    OIR: {
        color: '#f5a623',
        title: 'Officer Intelligence Rating',
        timeline: [
            { icon: Clock, time: '15 min total', label: '25 Questions', desc: 'Logical, verbal, and numerical reasoning under time pressure.' },
        ],
        tips: [
            'Attempt every question — no negative marking.',
            'Skip hard questions and return at the end.',
            'Spot patterns quickly in series and analogies.',
            'Eliminate the most wrong option first.',
            'Practise mental arithmetic to gain speed.',
        ],
    },
    GTO: {
        color: '#b86c30',
        title: 'Group Testing Officer Tasks',
        timeline: [
            { icon: Clock, time: '30–45 min', label: 'Per Task', desc: 'Group Discussion or Group Planning Exercise.' },
        ],
        tips: [
            'Open with a clear, well-structured point.',
            'Listen actively — build on others’ ideas.',
            'Steer the group back on track if it drifts.',
            'Summarise effectively and invite consensus.',
            'Demonstrate leadership while encouraging teamwork.',
        ],
    },
};

// ─── Test Guide Screen ────────────────────────────────────────────────────────
const TestGuide = ({ category, testTitle, mode, onStart }) => {
    const guide = TEST_GUIDES[category] || TEST_GUIDES.OIR;
    const { color, title, timeline, tips } = guide;

    return (
        <div className="min-h-screen flex items-center justify-center p-6 pt-28" style={{ background: '#000' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-xl rounded-3xl overflow-hidden"
                style={{ background: '#0e0e0e', border: `1px solid ${color}25`, boxShadow: `0 0 80px ${color}08` }}
            >
                {/* Accent bar */}
                <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

                <div className="p-8">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                            <BookOpen className="w-5 h-5" style={{ color }} />
                        </div>
                        <div>
                            <p className="text-xs font-black tracking-widest uppercase mb-0.5" style={{ color }}>{category}</p>
                            <h2 className="text-lg font-black text-white leading-tight" style={{ fontFamily: 'Cinzel, serif' }}>{title}</h2>
                        </div>
                    </div>
                    <p className="text-xs ml-13 mb-6 mt-2" style={{ color: '#4a4a4a' }}>
                        Mode: <span className="font-bold" style={{ color: '#6a6a6a' }}>{mode === 'timed' ? '⏱ Timed' : '🧘 Practice'}</span>
                    </p>

                    {/* Timeline */}
                    <div className="mb-6">
                        <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#4a4a4a' }}>Session Timeline</p>
                        <div className="flex flex-col gap-3">
                            {timeline.map((step, i) => (
                                <div key={i} className="flex items-start gap-4">
                                    {/* Step icon + connector */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                                            <step.icon className="w-4 h-4" style={{ color }} />
                                        </div>
                                        {i < timeline.length - 1 && (
                                            <div className="w-px h-5 mt-1" style={{ background: `${color}20` }} />
                                        )}
                                    </div>
                                    <div className="pb-2">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-sm font-black text-white">{step.label}</span>
                                            <span className="px-2 py-0.5 rounded-full text-xs font-black"
                                                style={{ background: `${color}12`, color }}>{step.time}</span>
                                        </div>
                                        <p className="text-xs" style={{ color: '#5a5a5a' }}>{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="rounded-2xl p-5 mb-6" style={{ background: `${color}06`, border: `1px solid ${color}15` }}>
                        <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="w-4 h-4" style={{ color }} />
                            <p className="text-xs font-black uppercase tracking-widest" style={{ color }}>Approach & Tips</p>
                        </div>
                        <ul className="flex flex-col gap-2">
                            {tips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs" style={{ color: '#7a7a7a' }}>
                                    <span className="mt-0.5 flex-shrink-0 font-black" style={{ color }}>{i + 1}.</span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* CTA */}
                    <button
                        onClick={onStart}
                        className="w-full py-4 rounded-2xl font-black text-base text-black transition-all active:scale-95 flex items-center justify-center gap-3"
                        style={{ background: color, boxShadow: `0 8px 24px ${color}35`, fontFamily: 'Cinzel, serif' }}
                    >
                        I Understand — Start Test <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};


// ─── Circular Countdown ────────────────────────────────────────────────────────
const CircularTimer = ({ initialTime, onTimeUp, size = 56, color = '#f5a623' }) => {
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const radius = (size / 2) - 5;
    const circ = 2 * Math.PI * radius;
    const progress = timeLeft / initialTime;
    const isWarning = timeLeft <= Math.floor(initialTime * 0.25);

    useEffect(() => {
        if (timeLeft <= 0) { onTimeUp(); return; }
        const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
        return () => clearInterval(t);
    }, [timeLeft]);

    const format = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const activeColor = isWarning ? '#ef4444' : color;

    return (
        <div className="flex items-center gap-2.5">
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
                <circle
                    cx={size / 2} cy={size / 2} r={radius} fill="none"
                    stroke={activeColor} strokeWidth="3.5"
                    strokeDasharray={circ}
                    strokeDashoffset={circ * (1 - progress)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease' }}
                />
            </svg>
            <span className="font-mono font-black text-xl tabular-nums" style={{ color: activeColor }}>
                {format(timeLeft)}
            </span>
        </div>
    );
};

// ─── Flat bar timer for WAT (small, per-question) ─────────────────────────────
const WATTimer = ({ onTimeUp, totalTime = 10 }) => {
    const [timeLeft, setTimeLeft] = useState(totalTime);

    useEffect(() => {
        setTimeLeft(totalTime);
    }, [totalTime]);

    useEffect(() => {
        if (timeLeft <= 0) { onTimeUp(); return; }
        const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
        return () => clearInterval(t);
    }, [timeLeft]);

    const pct = (timeLeft / totalTime) * 100;
    const isWarning = timeLeft <= 3;

    return (
        <div className="flex items-center gap-3">
            <div className="w-28 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                    className="h-full rounded-full"
                    animate={{ width: `${pct}%` }}
                    style={{ background: isWarning ? '#ef4444' : '#f5a623', transition: 'background 0.3s' }}
                />
            </div>
            <span className="font-mono font-black text-sm tabular-nums" style={{ color: isWarning ? '#ef4444' : '#f5a623' }}>
                {timeLeft}s
            </span>
        </div>
    );
};

// ─── Mode Selector ─────────────────────────────────────────────────────────────
const ModeSelector = ({ onSelect }) => (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#000' }}>
        <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-3xl p-10 text-center relative overflow-hidden"
            style={{ background: '#0e0e0e', border: '1px solid rgba(245,166,35,0.2)', boxShadow: '0 0 60px rgba(245,166,35,0.06)' }}
        >
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, transparent, #f5a623, transparent)' }} />
            <Shield className="w-12 h-12 mx-auto mb-6" style={{ color: '#f5a623' }} />
            <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'Cinzel, serif' }}>SELECT MODE</h2>
            <p className="text-sm mb-8" style={{ color: '#5a5a5a' }}>Choose how you want to attempt this test.</p>
            <div className="flex flex-col gap-4">
                {[
                    { mode: 'practice', label: 'Practice Mode', desc: 'No time limits. Learn at your own pace.', color: '#f5a623' },
                    { mode: 'timed', label: 'Timed Mode', desc: 'Realistic time pressure. Real SSB conditions.', color: '#ef4444' },
                ].map(m => (
                    <button
                        key={m.mode}
                        onClick={() => onSelect(m.mode)}
                        className="p-5 rounded-2xl text-left transition-all flex items-center justify-between group"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = `${m.color}40`; e.currentTarget.style.background = `${m.color}08`; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    >
                        <div>
                            <h4 className="font-black text-white text-base mb-1" style={{ fontFamily: 'Cinzel, serif' }}>{m.label}</h4>
                            <p className="text-xs" style={{ color: '#5a5a5a' }}>{m.desc}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 flex-shrink-0 transition-transform group-hover:translate-x-1" style={{ color: m.color }} />
                    </button>
                ))}
            </div>
        </motion.div>
    </div>
);

// ─── Upload Handwritten Copy Screen (for WAT / SRT after all questions done) ──
const UploadHandwrittenScreen = ({ category, onSkip, onUpload }) => {
    const [preview, setPreview] = useState(null);
    const [fileName, setFileName] = useState('');
    const fileRef = useRef(null);

    const handleFile = (file) => {
        if (!file) return;
        setFileName(file.name);
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(file);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 pt-28" style={{ background: '#000' }}>
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg rounded-3xl overflow-hidden relative"
                style={{ background: '#0e0e0e', border: '1px solid rgba(245,166,35,0.2)', boxShadow: '0 0 80px rgba(245,166,35,0.06)' }}
            >
                {/* Gold top bar */}
                <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, transparent, #f5a623, transparent)' }} />

                <div className="p-8 md:p-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                            style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)' }}>
                            <PenLine className="w-8 h-8" style={{ color: '#f5a623' }} />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
                            {category} COMPLETE
                        </h2>
                        <p className="text-sm leading-relaxed" style={{ color: '#5a5a5a' }}>
                            Did you also attempt this test in your <strong className="text-white">physical booklet</strong>? Upload a photo of your handwritten answers for AI evaluation.
                        </p>
                    </div>

                    {/* Upload Zone */}
                    <div
                        className="relative rounded-2xl mb-6 overflow-hidden cursor-pointer transition-all"
                        style={{ border: '2px dashed rgba(245,166,35,0.2)', background: 'rgba(245,166,35,0.03)', minHeight: '160px' }}
                        onClick={() => fileRef.current?.click()}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,166,35,0.45)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(245,166,35,0.2)'}
                        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#f5a623'; }}
                        onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(245,166,35,0.2)'; handleFile(e.dataTransfer.files[0]); }}
                    >
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={e => handleFile(e.target.files[0])}
                        />

                        {preview ? (
                            <div className="p-4">
                                <img src={preview} alt="Preview" className="w-full rounded-xl object-cover max-h-48" />
                                <p className="text-center text-xs mt-3 font-bold" style={{ color: '#f5a623' }}>{fileName}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-3 py-10">
                                <ImagePlus className="w-10 h-10" style={{ color: 'rgba(245,166,35,0.3)' }} />
                                <div className="text-center">
                                    <p className="text-sm font-bold text-white mb-1">Tap to upload or drag & drop</p>
                                    <p className="text-xs" style={{ color: '#4a4a4a' }}>JPG, PNG, HEIC, PDF supported</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => preview ? onUpload(preview) : fileRef.current?.click()}
                            disabled={!preview}
                            className="w-full py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2"
                            style={{
                                background: preview ? '#f5a623' : 'rgba(245,166,35,0.15)',
                                color: preview ? '#000' : 'rgba(245,166,35,0.4)',
                                fontFamily: 'Cinzel, serif',
                                cursor: preview ? 'pointer' : 'not-allowed',
                                boxShadow: preview ? '0 8px 24px rgba(245,166,35,0.25)' : 'none',
                            }}
                        >
                            <Upload className="w-4 h-4" />
                            {preview ? 'Submit for AI Evaluation' : 'Select Image First'}
                        </button>

                        <button
                            onClick={onSkip}
                            className="w-full py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2"
                            style={{ background: 'rgba(255,255,255,0.04)', color: '#5a5a5a', border: '1px solid rgba(255,255,255,0.07)', fontFamily: 'Cinzel, serif' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#5a5a5a'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
                        >
                            Skip — Show Results Only
                        </button>
                    </div>

                    {/* Info note */}
                    <p className="text-center text-xs mt-5 italic" style={{ color: '#3a3a3a' }}>
                        Uploading your handwritten copy enables deeper AI analysis of your responses compared to typed-only answers.
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Test Result ───────────────────────────────────────────────────────────────
const TestResult = ({ test, responses, onRestart, evaluation, evaluating }) => {
    let score = 0;
    if (test.category === 'OIR') {
        test.questions.forEach(q => { if (responses[q.id] === q.correct_answer) score++; });
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 pt-28" style={{ background: '#000' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl rounded-3xl p-10 text-center relative overflow-hidden"
                style={{ background: '#0e0e0e', border: '1px solid rgba(245,166,35,0.2)', boxShadow: '0 0 80px rgba(245,166,35,0.06)' }}
            >
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, transparent, #f5a623, transparent)' }} />

                <CheckCircle className="w-16 h-16 mx-auto mb-6" style={{ color: '#22c55e' }} />
                <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Cinzel, serif' }}>TEST COMPLETE</h1>
                <p className="text-sm mb-10" style={{ color: '#5a5a5a' }}>Your performance has been recorded.</p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-5 rounded-2xl" style={{ background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.15)' }}>
                        <p className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: '#5a5a5a' }}>Score</p>
                        <p className="text-3xl font-black" style={{ color: '#f5a623', fontFamily: 'Cinzel, serif' }}>
                            {test.category === 'OIR' ? `${score}/${test.questions.length}` : '--'}
                        </p>
                    </div>
                    <div className="p-5 rounded-2xl" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)' }}>
                        <p className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: '#5a5a5a' }}>Status</p>
                        <p className="text-3xl font-black text-green-400" style={{ fontFamily: 'Cinzel, serif' }}>DONE</p>
                    </div>
                </div>

                {evaluating ? (
                    <div className="p-6 rounded-2xl mb-8 flex flex-col items-center gap-3" style={{ background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.12)' }}>
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#f5a623' }} />
                        <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#5a5a5a' }}>Generating AI Insights...</p>
                    </div>
                ) : evaluation && (
                    <div className="text-left p-6 rounded-2xl mb-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <h3 className="font-black text-white mb-3 text-base" style={{ fontFamily: 'Cinzel, serif' }}>Psychological Insights</h3>
                        <p className="text-sm leading-relaxed mb-5" style={{ color: '#8a8a8a' }}>{evaluation.overall_feedback}</p>
                        <div className="grid grid-cols-2 gap-4">
                            {evaluation.strengths?.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#22c55e' }}>Strengths</h4>
                                    <ul className="space-y-1.5">
                                        {evaluation.strengths.map((s, i) => <li key={i} className="text-xs" style={{ color: '#6a6a6a' }}>• {s}</li>)}
                                    </ul>
                                </div>
                            )}
                            {evaluation.suggestions?.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#eab308' }}>Suggestions</h4>
                                    <ul className="space-y-1.5">
                                        {evaluation.suggestions.map((s, i) => <li key={i} className="text-xs" style={{ color: '#6a6a6a' }}>• {s}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={onRestart} className="btn-gold flex-1 py-4 rounded-xl font-black text-base" style={{ fontFamily: 'Cinzel, serif' }}>
                        Browse More Tests
                    </button>
                    <Link to="/dashboard" className="flex-1 py-4 rounded-xl font-black text-base text-white text-center transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        Analytics →
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Main TestPlayer ───────────────────────────────────────────────────────────
const TestPlayer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [responses, setResponses] = useState({});
    const [phase, setPhase] = useState('test');    // 'test' | 'upload_prompt' | 'done'
    const [error, setError] = useState('');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    }, []);
    const [ppdtPhase, setPpdtPhase] = useState('viewing'); // 'viewing' | 'writing'
    const [ppdtInputMode, setPpdtInputMode] = useState('type'); // 'type' | 'upload'
    const [ppdtImage, setPpdtImage] = useState('');
    const [mode, setMode] = useState(null);
    const [guideAcknowledged, setGuideAcknowledged] = useState(false);
    const [evaluation, setEvaluation] = useState(null);
    const [evaluating, setEvaluating] = useState(false);
    const [watKey, setWatKey] = useState(0); // forces WATTimer remount on advance
    const [ppdtUploadWindow, setPpdtUploadWindow] = useState(false); // triggers 30s upload window after PPDT writing
    const [markedForReview, setMarkedForReview] = useState(new Set());
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [showFullScreen, setShowFullScreen] = useState(false);
    const [showPPDTConfirm, setShowPPDTConfirm] = useState(false);

    useEffect(() => { fetchTest(); }, [id]);

    useEffect(() => {
        if (test && test.category.toUpperCase() === 'PPDT') {
            const randomId = Math.floor(Math.random() * 10) + 1;
            setPpdtImage(`/ppdt/ppdt-${randomId}.webp`);
            setPpdtPhase('viewing');
        }
    }, [test, currentIdx]);

    const fetchTest = async () => {
        try {
            const res = await api.get(`/tests/${id}`);
            setTest(res.data);
        } catch (err) {
            setError('Failed to load test data.');
        } finally {
            setLoading(false);
        }
    };

    const handleResponse = (val) => setResponses(prev => ({ ...prev, [test.questions[currentIdx].id]: val }));

    const next = () => {
        if (currentIdx < test.questions.length - 1) {
            setCurrentIdx(idx => idx + 1);
            setWatKey(k => k + 1); // reset WAT timer
        } else {
            // All questions done — decide what to do next
            const cat = test.category.toUpperCase();
            if (cat === 'WAT' || cat === 'SRT') {
                setPhase('upload_prompt'); // show handwritten upload screen
            } else {
                setShowSubmitModal(true);
            }
        }
    };

    const prev = () => {
        if (currentIdx > 0) {
            setCurrentIdx(idx => idx - 1);
            setWatKey(k => k + 1);
        }
    };

    const toggleMarkForReview = () => {
        setMarkedForReview(prev => {
            const next = new Set(prev);
            if (next.has(currentIdx)) next.delete(currentIdx);
            else next.add(currentIdx);
            return next;
        });
    };

    const finish = async (handwrittenImage = null) => {
        setPhase('done');
        setEvaluating(true);
        try {
            let score = 0;
            if (test.category === 'OIR') {
                test.questions.forEach(q => { if (responses[q.id] === q.correct_answer) score++; });
            }
            await api.post('/dashboard/save-test', {
                test_id: test.id, score, total_questions: test.questions.length, time_taken: 300, category: test.category
            });
            if (test.category !== 'OIR') {
                const payload = { category: test.category, responses };
                if (handwrittenImage) payload.handwritten_image = handwrittenImage;
                const evalRes = await api.post(`/tests/${test.id}/evaluate-all`, payload);
                setEvaluation(evalRes.data);
            }
        } catch (err) {
            console.error('Save/Eval failed', err);
        } finally {
            setEvaluating(false);
        }
    };

    const handleFileUpload = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => handleResponse(reader.result);
        reader.readAsDataURL(file);
    };

    // ── Loading / Error states ─────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
            <Loader2 className="w-12 h-12 animate-spin" style={{ color: '#f5a623' }} />
        </div>
    );
    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center" style={{ background: '#000' }}>
            <AlertCircle className="w-16 h-16" style={{ color: '#ef4444' }} />
            <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cinzel, serif' }}>Load Error</h2>
            <p className="text-sm" style={{ color: '#5a5a5a' }}>{error}</p>
        </div>
    );
    if (!test?.questions?.length) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center" style={{ background: '#000' }}>
            <AlertCircle className="w-16 h-16" style={{ color: '#eab308' }} />
            <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cinzel, serif' }}>Empty Test</h2>
            <p className="text-sm" style={{ color: '#5a5a5a' }}>This test contains no questions.</p>
        </div>
    );

    // ── Phase routing ──────────────────────────────────────────────────────────
    if (phase === 'done') return <TestResult test={test} responses={responses} onRestart={() => navigate('/tests')} evaluation={evaluation} evaluating={evaluating} />;
    if (!mode) return <ModeSelector onSelect={setMode} />;
    if (!guideAcknowledged) return (
        <TestGuide
            category={test.category.toUpperCase()}
            testTitle={test.title}
            mode={mode}
            onStart={() => setGuideAcknowledged(true)}
        />
    );

    // ── Upload Prompt (WAT / SRT after all questions) ──────────────────────────
    if (phase === 'upload_prompt') {
        return (
            <UploadHandwrittenScreen
                category={test.category.toUpperCase()}
                onSkip={() => finish(null)}
                onUpload={(img) => finish(img)}
            />
        );
    }

    // ── Active test ────────────────────────────────────────────────────────────
    const q = test.questions[currentIdx];
    const category = test.category.toUpperCase();
    const progress = ((currentIdx + 1) / test.questions.length) * 100;
    const CAT_COLORS = { OIR: '#f5a623', PPDT: '#e8963d', WAT: '#d9883a', SRT: '#c87a35', GTO: '#b86c30' };
    const catColor = CAT_COLORS[category] || '#f5a623';
    const isLast = currentIdx === test.questions.length - 1;
    const showQR = ['PPDT', 'WAT', 'SRT'].includes(category);

    return (
        <div className="min-h-screen pt-24 pb-20 px-6 flex justify-center" style={{ background: '#000' }}>
            <div className="w-full max-w-[1200px] flex flex-col lg:flex-row gap-10" style={{ minHeight: 'calc(100vh - 160px)' }}>

                {/* QR Upload Window — only mounts for PPDT after writing phase ends */}
                {category === 'PPDT' && ppdtUploadWindow && (
                    <QRSessionPanel 
                        category={category} 
                        onUploadSuccess={(url, text) => {
                            if (text) {
                                const qId = test.questions[currentIdx].id;
                                setResponses(prev => ({ ...prev, [qId]: text }));
                            }
                        }}
                        onClose={() => setPpdtUploadWindow(false)}
                    />
                )}

                {/* ── Exit Confirmation Modal ────────────────────────────── */}
                <AnimatePresence>
                    {showExitModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full max-w-sm rounded-3xl p-8 text-center" style={{ background: '#0e0e0e', border: '1px solid rgba(239,68,68,0.2)', boxShadow: '0 0 60px rgba(239,68,68,0.06)' }}>
                                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                                <h3 className="text-xl font-black text-white mb-2" style={{ fontFamily: 'Cinzel, serif' }}>EXIT TEST?</h3>
                                <p className="text-sm text-gray-500 mb-8">Your progress will be lost. Are you sure you want to quit this session?</p>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowExitModal(false)} className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-white/5 border border-white/10 text-white">Cancel</button>
                                    <button onClick={() => navigate('/tests')} className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-red-500 text-white shadow-lg shadow-red-500/20">Exit Session</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ── Submit Confirmation Modal ──────────────────────────── */}
                <AnimatePresence>
                    {showSubmitModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full max-w-sm rounded-3xl p-8 text-center" style={{ background: '#0e0e0e', border: '1px solid rgba(34,197,94,0.2)', boxShadow: '0 0 60px rgba(34,197,94,0.06)' }}>
                                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                                <h3 className="text-xl font-black text-white mb-2" style={{ fontFamily: 'Cinzel, serif' }}>FINISH TEST?</h3>
                                <p className="text-sm text-gray-500 mb-8">You have answered {Object.keys(responses).length} of {test.questions.length} questions. Submit for final evaluation?</p>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowSubmitModal(false)} className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-white/5 border border-white/10 text-white">Review</button>
                                    <button onClick={() => { setShowSubmitModal(false); finish(); }} className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-green-500 text-white shadow-lg shadow-green-500/20">Submit Now</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ── PPDT Observation Confirmation Modal ────────────────── */}
                <AnimatePresence>
                    {showPPDTConfirm && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full max-w-sm rounded-3xl p-8 text-center" style={{ background: '#0e0e0e', border: '1px solid rgba(245,166,35,0.2)', boxShadow: '0 0 60px rgba(245,166,35,0.06)' }}>
                                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                                <h3 className="text-xl font-black text-white mb-2" style={{ fontFamily: 'Cinzel, serif' }}>GO TO WRITING?</h3>
                                <p className="text-sm text-gray-500 mb-8">Observation time is still remaining. Are you sure you want to start writing your story now?</p>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowPPDTConfirm(false)} className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-white/5 border border-white/10 text-white">Continue Observing</button>
                                    <button onClick={() => { setShowPPDTConfirm(false); setPpdtPhase('writing'); }} className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-amber-500 text-white shadow-lg shadow-amber-500/20">Start Writing</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ── Full Screen Image Modal ────────────────────────────── */}
                <AnimatePresence>
                    {showFullScreen && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 p-4 lg:p-10" onClick={() => setShowFullScreen(false)}>
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative max-w-full max-h-full">
                                <button className="absolute -top-12 right-0 p-2 text-white/60 hover:text-white transition-colors" onClick={() => setShowFullScreen(false)}><X className="w-8 h-8" /></button>
                                <img src={ppdtImage} alt="PPDT Scenario Full Screen" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
                {/* ── Main Left Column ────────────────────────────────────── */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* ── Header ───────────────────────────────────────────────── */}
                    <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowExitModal(true)}
                            className="p-2.5 rounded-xl transition-all"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                        >
                            <ChevronLeft className="w-5 h-5" style={{ color: '#5a5a5a' }} />
                        </button>
                        <div>
                            <h2 className="text-lg font-black text-white" style={{ fontFamily: 'Cinzel, serif' }}>{test.title}</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-black uppercase tracking-widest" style={{ color: catColor }}>{category}</span>
                                <span className="text-xs" style={{ color: '#3a3a3a' }}>•</span>
                                <span className="text-xs font-bold" style={{ color: '#4a4a4a' }}>
                                    {category === 'PPDT' ? (ppdtPhase === 'viewing' ? 'Observation Phase' : 'Writing Phase') : `Q${currentIdx + 1}/${test.questions.length}`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Timer */}
                    {mode === 'practice' ? (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black" style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.15)', color: '#f5a623' }}>
                            <Clock className="w-4 h-4" /> Practice
                        </div>
                    ) : category === 'WAT' ? (
                        <WATTimer key={watKey} onTimeUp={next} totalTime={10} />
                    ) : category === 'PPDT' ? (
                        <CircularTimer
                            key={`ppdt-${ppdtPhase}`}
                            initialTime={ppdtPhase === 'viewing' ? 30 : 240}
                            onTimeUp={ppdtPhase === 'viewing'
                                ? () => setPpdtPhase('writing')
                                : () => {
                                    if (isMobile) {
                                        setPhase('upload_prompt');
                                    } else {
                                        setPpdtUploadWindow(true);
                                    }
                                }}
                            color={catColor}
                        />
                    ) : (
                        <CircularTimer
                            key="main"
                            initialTime={test.duration_seconds}
                            onTimeUp={finish}
                            color={catColor}
                        />
                    )}
                </div>



                {/* ── Progress Bar ─────────────────────────────────────────── */}
                <div className="h-1 w-full rounded-full mb-10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <motion.div
                        animate={{ width: `${progress}%` }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${catColor}, ${catColor}88)` }}
                    />
                </div>

                {/* ── Question Area ─────────────────────────────────────────── */}
                <div className="flex-1 flex flex-col">
                    <AnimatePresence mode="wait">

                        {/* ── PPDT Phase: Viewing ──────────────────────────── */}
                        {category === 'PPDT' && ppdtPhase === 'viewing' && (
                            <motion.div
                                key="ppdt-view"
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="rounded-3xl p-8 flex-1 flex flex-col items-center justify-center text-center"
                                style={{ background: '#0e0e0e', border: '1px solid rgba(245,166,35,0.12)' }}
                            >
                                <p className="text-xs font-black tracking-widest uppercase mb-6" style={{ color: catColor }}>
                                    👁️ Observe carefully — 30 seconds
                                </p>
                                <div className="relative group/img max-w-full">
                                    <img
                                        src={ppdtImage}
                                        alt="PPDT scenario"
                                        className="max-h-[420px] w-auto rounded-2xl object-cover transition-all duration-300 group-hover/img:scale-[1.01]"
                                        style={{ border: '1px solid rgba(245,166,35,0.15)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
                                        onError={e => { e.target.style.display = 'none'; }}
                                    />
                                    <button 
                                        onClick={() => setShowFullScreen(true)}
                                        className="absolute bottom-4 right-4 p-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover/img:opacity-100 transition-all flex items-center gap-2 text-xs font-black"
                                    >
                                        <Maximize2 className="w-4 h-4" /> Full Screen
                                    </button>
                                </div>
                                <p className="mt-6 text-xs italic" style={{ color: '#4a4a4a' }}>
                                    Note characters, mood, action, setting. Story writing begins automatically.
                                </p>
                            </motion.div>
                        )}

                        {/* ── PPDT Phase: Writing (textarea only — upload via QR after) ── */}
                        {category === 'PPDT' && ppdtPhase === 'writing' && (
                            <motion.div
                                key="ppdt-write"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-3xl flex-1 flex flex-col overflow-hidden"
                                style={{ background: '#0e0e0e', border: '1px solid rgba(245,166,35,0.15)' }}
                            >
                                <div className="p-7 flex-1 flex flex-col">
                                    <h3 className="text-lg font-black text-white mb-1" style={{ fontFamily: 'Cinzel, serif' }}>
                                        Write Your 4-Minute Story
                                    </h3>
                                    <p className="text-xs mb-5" style={{ color: '#5a5a5a' }}>
                                        Include: past context → present action → future outcome. One main character.
                                    </p>
                                    <textarea
                                        className="flex-1 w-full rounded-2xl p-5 text-white text-sm placeholder:text-gray-700 resize-none focus:outline-none"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,166,35,0.1)', minHeight: '220px', transition: 'border-color 0.2s' }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(245,166,35,0.4)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(245,166,35,0.1)'}
                                        placeholder="Describe the main character, what is happening, and how it ends. Be positive and decisive..."
                                        value={responses[q.id] || ''}
                                        onChange={e => handleResponse(e.target.value)}
                                        autoFocus
                                    />
                                    <p className="text-xs mt-3 text-center italic" style={{ color: '#3a3a3a' }}>
                                        After you submit, a QR code will appear for 30 seconds to upload your handwritten copy.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* ── WAT Question ──────────────────────────────────── */}
                        {category === 'WAT' && (
                            <motion.div
                                key={`wat-${currentIdx}`}
                                initial={{ opacity: 0, scale: 0.94 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.15 }}
                                className="rounded-3xl flex-1 flex flex-col items-center justify-center text-center p-10"
                                style={{ background: '#0e0e0e', border: '1px solid rgba(245,166,35,0.12)' }}
                            >
                                <span className="text-xs font-black tracking-widest uppercase mb-6 px-3 py-1 rounded-full" style={{ color: catColor, background: `${catColor}12`, border: `1px solid ${catColor}25` }}>
                                    WAT · Word {currentIdx + 1} of {test.questions.length}
                                </span>

                                <h2 className="text-5xl md:text-7xl font-black text-white mb-10" style={{ fontFamily: 'Cinzel, serif', letterSpacing: '-0.02em' }}>
                                    {q.text}
                                </h2>

                                <div className="w-full max-w-md">
                                    <input
                                        type="text"
                                        className="w-full py-4 px-6 rounded-2xl text-white text-center text-lg font-bold placeholder:text-gray-700 focus:outline-none"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,166,35,0.15)', transition: 'border-color 0.2s' }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(245,166,35,0.5)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(245,166,35,0.15)'}
                                        placeholder="Your association..."
                                        value={responses[q.id] || ''}
                                        onChange={e => handleResponse(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') next(); }}
                                        autoFocus
                                    />
                                    <p className="text-xs mt-3 italic" style={{ color: '#4a4a4a' }}>
                                        Press Enter or wait for the timer to advance.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* ── SRT Question ──────────────────────────────────── */}
                        {category === 'SRT' && (
                            <motion.div
                                key={`srt-${currentIdx}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="rounded-3xl p-8 md:p-10 flex-1 flex flex-col"
                                style={{ background: '#0e0e0e', border: '1px solid rgba(245,166,35,0.12)' }}
                            >
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-5 w-fit" style={{ background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}25` }}>
                                    <BrainCircuit className="w-3 h-3" /> SRT · Situation {currentIdx + 1}/{test.questions.length}
                                </span>
                                <div className="p-5 rounded-2xl mb-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <h3 className="text-xl md:text-2xl font-bold text-white leading-relaxed">{q.text}</h3>
                                </div>
                                <textarea
                                    className="flex-1 w-full rounded-2xl p-5 text-white text-sm placeholder:text-gray-700 resize-none focus:outline-none"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,166,35,0.1)', minHeight: '160px', transition: 'border-color 0.2s' }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(245,166,35,0.35)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(245,166,35,0.1)'}
                                    placeholder="Describe what you would do immediately. Be concise and action-oriented..."
                                    value={responses[q.id] || ''}
                                    onChange={e => handleResponse(e.target.value)}
                                    autoFocus
                                />
                            </motion.div>
                        )}

                        {/* ── OIR / Other ───────────────────────────────────── */}
                        {category !== 'PPDT' && category !== 'WAT' && category !== 'SRT' && (
                            <motion.div
                                key={currentIdx}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="rounded-3xl p-6 md:p-8 flex flex-col"
                                style={{ background: '#0e0e0e', border: '1px solid rgba(245,166,35,0.12)' }}
                            >
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4 w-fit" style={{ background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}25` }}>
                                    <Target className="w-3 h-3" /> {category}
                                </span>
                                <h3 className="text-lg md:text-xl font-black text-white mb-5 leading-snug">{q.text}</h3>
                                <div className="grid gap-2">
                                    {(Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]')).map((opt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleResponse(opt)}
                                            className="p-4 rounded-xl text-left font-bold text-sm flex items-center justify-between transition-all"
                                            style={responses[q.id] === opt ? {
                                                background: 'rgba(245,166,35,0.1)',
                                                border: `1.5px solid ${catColor}`,
                                                color: '#fff'
                                            } : {
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.07)',
                                                color: '#8a8a8a'
                                            }}
                                        >
                                            <span>{opt}</span>
                                            {responses[q.id] === opt && <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: catColor }} />}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Next / Finish Button ──────────────────────────────── */}
                    {/* Hide for WAT (timer auto-advances) but show manual Next */}
                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
                        <div className="flex gap-3">
                            <button
                                onClick={prev}
                                disabled={currentIdx === 0}
                                className="p-4 rounded-2xl transition-all bg-white/5 border border-white/10 text-gray-400 disabled:opacity-20"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            
                            {category !== 'PPDT' && category !== 'WAT' && (
                                <button
                                    onClick={toggleMarkForReview}
                                    className={`px-6 py-4 rounded-2xl font-black text-sm transition-all flex items-center gap-2 ${
                                        markedForReview.has(currentIdx) 
                                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' 
                                            : 'bg-white/5 border border-white/10 text-purple-400 hover:bg-purple-500/10'
                                    }`}
                                    style={{ fontFamily: 'Cinzel, serif' }}
                                >
                                    <Target className="w-4 h-4" />
                                    {markedForReview.has(currentIdx) ? 'Marked' : 'Mark Review'}
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                // For OIR and other question-based tests, ensure an answer is provided before next
                                if (!['PPDT', 'WAT', 'SRT'].includes(category) && !responses[q.id]) {
                                    toast('Please provide an answer before proceeding.', 'info');
                                    return;
                                }

                                if (category === 'PPDT') {
                                    if (ppdtPhase === 'viewing') {
                                        setShowPPDTConfirm(true);
                                    } else if (ppdtPhase === 'writing') {
                                        if (!ppdtUploadWindow) {
                                            if (isMobile) {
                                                setPhase('upload_prompt');
                                            } else {
                                                setPpdtUploadWindow(true);
                                            }
                                        } else {
                                            setShowSubmitModal(true);
                                        }
                                    }
                                } else {
                                    next();
                                }
                            }}
                            className="flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-lg text-black transition-all active:scale-95"
                            style={{ background: catColor, boxShadow: `0 8px 24px ${catColor}35`, fontFamily: 'Cinzel, serif' }}
                        >
                            {category === 'PPDT' ? (
                                ppdtPhase === 'viewing' ? 'Go to Writing' :
                                !ppdtUploadWindow ? 'Click to Upload' : 'Finish Test'
                            ) : isLast ? (
                                (category === 'WAT' || category === 'SRT') ? 'Finish & Upload' : 'Finish Test'
                            ) : 'Next'}
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div> {/* End Left Column */}

            {/* ── Right Column: Question Palette ──────────────────────── */}
            {category !== 'PPDT' && (
                <div className="w-full lg:w-80 flex-shrink-0">
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 sticky top-28">
                        <p className="text-sm font-black uppercase tracking-widest mb-6 text-gray-400">Question Palette</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
                                <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500"></div> Answered
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
                                <div className="w-3 h-3 rounded bg-white/5 border border-white/10"></div> Unanswered
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
                                <div className="w-3 h-3 rounded bg-purple-500/20 border border-purple-500"></div> Marked
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
                                <div className="w-3 h-3 rounded bg-amber-500 border border-amber-500"></div> Current
                            </div>
                        </div>

                        <div className="grid grid-cols-5 gap-3">
                            {test.questions.map((_, i) => {
                                const isAnswered = !!responses[test.questions[i].id];
                                const isMarked = markedForReview.has(i);
                                const isCurrent = currentIdx === i;
                                
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentIdx(i)}
                                        className={`aspect-square rounded-xl text-sm font-black transition-all flex items-center justify-center border hover:scale-105 active:scale-95 ${
                                            isCurrent ? 'ring-2 ring-offset-2 ring-offset-[#0e0e0e] ring-amber-500 border-amber-500 bg-amber-500 text-black shadow-lg shadow-amber-500/20' :
                                            isMarked ? 'bg-purple-500/20 border-purple-500 text-purple-400' :
                                            isAnswered ? 'bg-blue-500/20 border-blue-500 text-blue-400' :
                                            'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            
            </div> {/* End Main Row */}
        </div>
    );
};

// ─── PPDT Upload Zone (sub-component) ─────────────────────────────────────────
const PPDTUploadZone = ({ value, onChange, catColor }) => {
    const fileRef = useRef(null);
    const [preview, setPreview] = useState(value && value.startsWith('data:') ? value : null);

    const handleFile = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => { setPreview(reader.result); onChange(reader.result); };
        reader.readAsDataURL(file);
    };

    return (
        <div
            className="flex-1 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all"
            style={{ border: `2px dashed rgba(245,166,35,0.2)`, background: 'rgba(245,166,35,0.03)', minHeight: '200px' }}
            onClick={() => fileRef.current?.click()}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,166,35,0.45)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(245,166,35,0.2)'}
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = catColor; }}
            onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(245,166,35,0.2)'; handleFile(e.dataTransfer.files[0]); }}
        >
            <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            {preview ? (
                <div className="p-4 w-full">
                    <img src={preview} alt="Handwritten story" className="w-full max-h-48 object-cover rounded-xl" />
                    <p className="text-center text-xs mt-2 font-bold" style={{ color: catColor }}>✓ Uploaded — tap to change</p>
                </div>
            ) : (
                <>
                    <ImagePlus className="w-10 h-10 mb-3" style={{ color: 'rgba(245,166,35,0.3)' }} />
                    <p className="text-sm font-bold text-white mb-1">Upload your handwritten story</p>
                    <p className="text-xs" style={{ color: '#4a4a4a' }}>Photo of your booklet page · JPG, PNG, HEIC</p>
                </>
            )}
        </div>
    );
};

export default TestPlayer;
