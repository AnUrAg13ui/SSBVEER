import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Flag, ChevronLeft, ChevronRight, Users, Star, Shield,
    AlertTriangle, Clock, CheckCircle, XCircle, Zap, Trophy,
    RotateCcw, Eye, Lightbulb, Target, Award
} from 'lucide-react';

// ─── Obstacle Scenarios ────────────────────────────────────────────────────────
const OBSTACLES = [
    {
        id: 1,
        name: 'River of Death',
        difficulty: 'Medium',
        diffColor: '#f5a623',
        description: 'A 12-foot wide "electric" river (red zone). A single wooden plank (10 ft), one rope (15 ft), and a log (6 ft) are available. Start platform: 3 ft high. End platform: 4 ft high.',
        svg: 'river',
        rules: ['No touching the red zone', 'Plank must not bridge directly (too short)', 'Load (jerry can) must be carried across', 'All members must cross'],
        optimalPlan: 'Use log as fulcrum on start platform, extend plank across using log as lever. Rope to pull plank once members cross. Transport load first.',
        resources: ['Plank (10 ft)', 'Rope (15 ft)', 'Log (6 ft)', 'Jerry Can (load)'],
    },
    {
        id: 2,
        name: 'The Wall Breach',
        difficulty: 'Hard',
        diffColor: '#ef4444',
        description: 'A 10-foot black wall (cannot touch). A plank (12 ft), rope (20 ft), and a short post (3 ft) are given. The wall has a peg at 6 ft height on both sides.',
        svg: 'wall',
        rules: ['Cannot touch black surface', 'Post not allowed to be used in mid-air', 'One member must stay on start side until all equipment is across', 'No jumping from top'],
        optimalPlan: 'Use plank leaning at angle on near peg. Climb plank with rope tied. Helper hoists load. Second helper holds plank steady. Commander crosses last.',
        resources: ['Plank (12 ft)', 'Rope (20 ft)', 'Post (3 ft)', 'Sack (load)'],
    },
    {
        id: 3,
        name: 'Twin Pillars',
        difficulty: 'Easy',
        diffColor: '#22c55e',
        description: 'Two white pillars (white = safe) stand 6 ft apart in a yellow zone. A 14 ft plank and a rope are available. The far bank is 8 ft away from last pillar.',
        svg: 'pillars',
        rules: ['Yellow zone = out of bounds for feet', 'White pillars can be touched/stood on', 'Must use plank at least once', 'Load must not touch yellow zone'],
        optimalPlan: 'Bridge plank from Start → Pillar 1. Transfer load. Reposition plank to Pillar 2. Then to far bank. Use rope for load stabilization.',
        resources: ['Plank (14 ft)', 'Rope (18 ft)', 'Drum (load)'],
    },
    {
        id: 4,
        name: 'Trench Assault',
        difficulty: 'Medium',
        diffColor: '#f5a623',
        description: 'A 15-foot wide trench with a red zone at bottom. Far bank is 2 ft higher. A plank (13 ft), log (4 ft as fulcrum), and rope available. A barrel of "ammunition" must be taken across.',
        svg: 'trench',
        rules: ['Cannot jump across - must bridge', 'Log must stay on start bank', 'Barrel must arrive before last person', 'Rule of Infinity: log cannot extend over red zone floor'],
        optimalPlan: 'Wedge log at edge as stopper/support. Lay plank at angle using log wedge. Helper holds plank on near side. Commander and other helper carry barrel across, then rope used to pull the plank across.',
        resources: ['Plank (13 ft)', 'Log (4 ft)', 'Rope (15 ft)', 'Barrel (load)'],
    },
    {
        id: 5,
        name: 'SSB Command Task — Ground 1',
        difficulty: 'Hard',
        diffColor: '#8b5cf6',
        description: 'Real SSB Command Task layout (SSB Shastra model). Study the 3D ground: identify the start platform, obstacle structure, color zones, and available resources. Plan a crossing strategy using the interactive viewer.',
        sketchfabId: 'fbf17f62d7054f8eaf049e475895829c',
        rules: ['Color-coded zones apply: White (safe), Black/Yellow (no contact), Red (electric)', 'Rule of Infinity: no item may extend over a forbidden zone', 'Jump Rule: no jumping from a height exceeding your waist', 'Load must reach the far side before the last person'],
        optimalPlan: 'Study the 3D model carefully. Identify the closest safe supports, then build a bridge using plank+log. Ensure load moves first, helpers support structure, commander leads from front and crosses last.',
        resources: ['Plank', 'Rope', 'Log', 'Load (as assigned)'],
        is3D: true,
    },
    {
        id: 6,
        name: 'SSB Command Task — Ground 2',
        difficulty: 'Hard',
        diffColor: '#06b6d4',
        description: 'Second real SSB Command Task layout. A more complex obstacle with multiple color zones. Use the interactive 3D viewer to plan your approach from all angles before committing.',
        sketchfabId: '7efecd7cbfce4646909ef8a6c1a8c5f5',
        rules: ['All standard GTO rules apply', 'Helpers must obey only your instructions', 'Rule of Rigidity: flexible items may not be used as rigid supports', 'No body part of any person may touch a forbidden zone at any time'],
        optimalPlan: 'Rotate around the model to identify the nearest safe anchor points. Plan a two-phase crossing: setup bridge using plank, transfer load via rope, then guide helpers to follow using demonstrated technique.',
        resources: ['Plank', 'Rope', 'Log', 'Load (as assigned)'],
        is3D: true,
    },
];

// ─── Candidate pool ────────────────────────────────────────────────────────────
const CANDIDATES = [
    { id: 1, name: 'Cadet Arjun', strength: 'Physical', trait: 'Action-oriented, strongest physically but occasionally reckless.', score: 85, tag: 'Recommended', tagColor: '#22c55e', completes: true },
    { id: 2, name: 'Cadet Priya', strength: 'Strategic', trait: 'Calm under pressure, thinks clearly but sometimes slow to act.', score: 78, tag: 'Reliable', tagColor: '#f5a623', completes: true },
    { id: 3, name: 'Cadet Rahul', strength: 'Communication', trait: 'Great at following orders, good situational awareness.', score: 72, tag: 'Reliable', tagColor: '#f5a623', completes: true },
    { id: 4, name: 'Cadet Dev', strength: 'Leadership', trait: 'Tends to offer his own solutions instead of following orders. Competitive.', score: 61, tag: 'Risk', tagColor: '#ef4444', completes: false },
    { id: 5, name: 'Cadet Simran', strength: 'Agility', trait: 'Quick and nimble, great for technical crossing but nervous under observation.', score: 68, tag: 'Situational', tagColor: '#8b5cf6', completes: true },
    { id: 6, name: 'Cadet Vikram', strength: 'Strength', trait: 'Very strong but needs very explicit, step-by-step instructions.', score: 65, tag: 'Situational', tagColor: '#8b5cf6', completes: true },
];

// ─── Execution choices ─────────────────────────────────────────────────────────
const PLAN_CHOICES = [
    {
        id: 'A',
        text: 'Plan first silently, then explain entire plan to helpers, delegate each step, lead from front.',
        score: 10, olq: ['Decisiveness', 'Effective Intelligence', 'Ability to Influence'],
    },
    {
        id: 'B',
        text: 'Immediately start placing plank and tell helpers to follow your lead as you go.',
        score: 6, olq: ['Initiative', 'Physical Stamina'],
    },
    {
        id: 'C',
        text: 'Ask helpers for their ideas first, then combine and execute together.',
        score: 4, olq: ['Cooperation'],
        penalty: 'Helpers should follow, not lead. GTO notes loss of command authority.',
    },
    {
        id: 'D',
        text: 'Start issuing rapid, incomplete commands without fully planning. Try to figure it out mid-task.',
        score: 2, olq: [],
        penalty: 'Confusion in execution. Helpers make errors. GTO observes poor planning.',
    },
];

const EXECUTION_STEPS = [
    {
        id: 'step1',
        title: 'Communicating the Plan',
        prompt: 'Your helper Cadet Vikram is looking confused after your first instruction. What do you do?',
        choices: [
            { text: 'Calmly walk to him, physically demonstrate the task, and repeat the instruction clearly.', score: 10, feedback: '✦ Excellent. GTO notes composure and ability to teach under pressure.' },
            { text: 'Raise your voice and repeat the same instruction louder.', score: 3, feedback: '⚠ Yelling is a red flag. GTO notes loss of composure.' },
            { text: 'Skip him. Ask other helper to do both tasks.', score: 5, feedback: '↳ Neutral. Functional but misses delegation opportunity.' },
            { text: 'Stop, acknowledge the confusion, reassign the task and move on.', score: 8, feedback: '✦ Good recovery. Shows adaptability.' },
        ],
    },
    {
        id: 'step2',
        title: 'Rule Violation',
        prompt: 'Your helper accidentally touched the red zone with their foot. The GTO is watching. What do you do?',
        choices: [
            { text: 'Immediately acknowledge: "Stop. That\'s a rule violation. Let\'s redo from this position." and replan.', score: 10, feedback: '✦ Perfect. Integrity and composure. GTO is impressed.' },
            { text: 'Quietly wave helper back. Hope GTO didn\'t see it and continue.', score: 0, feedback: '✗ GTO saw it. Hiding violations is a serious mark against integrity.' },
            { text: 'Blame the helper in front of the GTO.', score: 1, feedback: '✗ Blaming subordinates shows poor leadership. Never do this.' },
            { text: 'Pause the task, inform GTO, ask for a restart from last valid position.', score: 9, feedback: '✦ Very good. Transparent, shows ownership of team\'s actions.' },
        ],
    },
    {
        id: 'step3',
        title: 'GTO Increases Difficulty',
        prompt: 'Mid-task, the GTO says: "The log is now out of bounds. You cannot use it." How do you respond?',
        choices: [
            { text: 'Pause, reassess quickly, reformulate plan using only remaining resources, communicate new plan.', score: 10, feedback: '✦ Outstanding adaptability. This is what the GTO wants to see.' },
            { text: 'Ask GTO: "Can we use a different item instead?"', score: 6, feedback: '↳ Shows resourcefulness but slight dependence on GTO. Better to find own solution.' },
            { text: 'Express frustration visibly and take a long time to restart.', score: 2, feedback: '⚠ GTO notes lack of composure under changed conditions.' },
            { text: 'Say "Yes sir" immediately and carry on — then figure it out as you go without informing helpers.', score: 4, feedback: '↳ Initiative is good but failing to rebrief helpers causes team confusion.' },
        ],
    },
];

// ─── Phase Enum ────────────────────────────────────────────────────────────────
const PHASE = { INTRO: 'intro', SELECT_OBSTACLE: 'select_obstacle', SELECT_HELPERS: 'select_helpers', PLANNING: 'planning', EXECUTION: 'execution', RESULT: 'result' };

// ─── Sketchfab 3D Viewer ───────────────────────────────────────────────────────
const Sketchfab3DViewer = ({ modelId, height = 280 }) => {
    const [loaded, setLoaded] = useState(false);
    return (
        <div className="relative w-full rounded-xl overflow-hidden" style={{ height, background: '#0d0d0d' }}>
            {!loaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)' }}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#4a4a4a' }}>Loading 3D Model…</p>
                </div>
            )}
            <iframe
                title="Sketchfab 3D Model"
                src={`https://sketchfab.com/models/${modelId}/embed?autospin=0&autostart=1&preload=1&ui_theme=dark&ui_controls=1&ui_infos=0&ui_watermark=0`}
                className="w-full h-full border-none"
                allow="autoplay; fullscreen; xr-spatial-tracking"
                allowFullScreen
                onLoad={() => setLoaded(true)}
                style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.5s ease' }}
            />
        </div>
    );
};

// ─── Combined Obstacle Preview (SVG or 3D) ─────────────────────────────────────
const ObstaclePreview = ({ obs, expanded = false }) => {
    const [show3D, setShow3D] = useState(false);

    if (obs.is3D) {
        return (
            <div>
                {show3D ? (
                    <Sketchfab3DViewer modelId={obs.sketchfabId} height={expanded ? 380 : 260} />
                ) : (
                    <div
                        className="relative flex flex-col items-center justify-center gap-3 cursor-pointer"
                        style={{ height: 160, background: 'linear-gradient(135deg, #0d0d0d, #150f2a)' }}
                        onClick={() => setShow3D(true)}
                    >
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                            style={{ background: `${obs.diffColor}18`, border: `1px solid ${obs.diffColor}35` }}>
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke={obs.diffColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest" style={{ color: obs.diffColor }}>Click to Launch 3D Viewer</p>
                        <div className="absolute top-3 right-3">
                            <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ background: `${obs.diffColor}20`, color: obs.diffColor, border: `1px solid ${obs.diffColor}35` }}>
                                3D
                            </span>
                        </div>
                    </div>
                )}
                {show3D && (
                    <button onClick={() => setShow3D(false)}
                        className="w-full py-2 text-xs font-bold transition-colors"
                        style={{ background: '#0d0d0d', color: '#5a5a5a', borderTop: '1px solid rgba(255,255,255,0.05)' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.color = '#5a5a5a'}>
                        ✕ Close 3D Viewer
                    </button>
                )}
            </div>
        );
    }
    return <ObstacleSVG type={obs.svg} />;
};

// ─── Obstacle SVG illustrations ────────────────────────────────────────────────
const ObstacleSVG = ({ type }) => {
    const common = { width: '100%', height: 160, viewBox: '0 0 400 160' };

    if (type === 'river') return (
        <svg {...common}>
            <rect width="400" height="160" fill="#0d0d0d" />
            <rect x="0" y="80" width="90" height="80" fill="#222" stroke="#f5a623" strokeWidth="1" />
            <text x="45" y="125" fill="#f5a623" fontSize="10" textAnchor="middle">START</text>
            <rect x="100" y="60" width="200" height="100" fill="#ef444430" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,3" />
            <text x="200" y="118" fill="#ef4444" fontSize="11" textAnchor="middle">⚡ RED ZONE</text>
            <rect x="310" y="70" width="90" height="90" fill="#222" stroke="#f5a623" strokeWidth="1" />
            <text x="355" y="120" fill="#f5a623" fontSize="10" textAnchor="middle">END</text>
            <rect x="110" y="115" width="100" height="10" fill="#c8841a" rx="2" opacity="0.9" />
            <text x="160" y="152" fill="#888" fontSize="9" textAnchor="middle">Plank</text>
            <line x1="220" y1="95" x2="300" y2="95" stroke="#aaa" strokeWidth="2" strokeDasharray="3,3" />
            <text x="260" y="88" fill="#888" fontSize="9" textAnchor="middle">Rope</text>
            <rect x="60" y="110" width="20" height="25" fill="#3b82f6" rx="2" />
            <text x="70" y="148" fill="#888" fontSize="9" textAnchor="middle">Load</text>
        </svg>
    );

    if (type === 'wall') return (
        <svg {...common}>
            <rect width="400" height="160" fill="#0d0d0d" />
            <rect x="0" y="80" width="130" height="80" fill="#222" stroke="#f5a623" strokeWidth="1" />
            <text x="65" y="128" fill="#f5a623" fontSize="10" textAnchor="middle">START</text>
            <rect x="180" y="20" width="40" height="140" fill="#333" stroke="#555" strokeWidth="2" />
            <text x="200" y="170" fill="#888" fontSize="9" textAnchor="middle">WALL</text>
            <circle cx="195" cy="75" r="4" fill="#aaa" />
            <circle cx="215" cy="75" r="4" fill="#aaa" />
            <text x="200" y="65" fill="#888" fontSize="8" textAnchor="middle">pegs</text>
            <rect x="240" y="60" width="160" height="100" fill="#222" stroke="#f5a623" strokeWidth="1" />
            <text x="320" y="120" fill="#f5a623" fontSize="10" textAnchor="middle">END</text>
            <line x1="130" y1="90" x2="200" y2="70" stroke="#c8841a" strokeWidth="8" strokeLinecap="round" opacity="0.7" />
        </svg>
    );

    if (type === 'pillars') return (
        <svg {...common}>
            <rect width="400" height="160" fill="#0d0d0d" />
            <rect x="0" y="80" width="80" height="80" fill="#222" stroke="#f5a623" strokeWidth="1" />
            <text x="40" y="128" fill="#f5a623" fontSize="10" textAnchor="middle">START</text>
            <rect x="80" y="40" width="240" height="120" fill="#f5a62310" stroke="#f5a623" strokeWidth="1" strokeDasharray="3,3" />
            <text x="200" y="55" fill="#f5a623" fontSize="10" textAnchor="middle">YELLOW ZONE</text>
            <rect x="155" y="70" width="20" height="90" fill="#fff" opacity="0.15" stroke="#fff" strokeWidth="1" />
            <rect x="225" y="70" width="20" height="90" fill="#fff" opacity="0.15" stroke="#fff" strokeWidth="1" />
            <text x="165" y="145" fill="#ccc" fontSize="8" textAnchor="middle">P1</text>
            <text x="235" y="145" fill="#ccc" fontSize="8" textAnchor="middle">P2</text>
            <rect x="320" y="60" width="80" height="100" fill="#222" stroke="#f5a623" strokeWidth="1" />
            <text x="360" y="118" fill="#f5a623" fontSize="10" textAnchor="middle">FAR BANK</text>
        </svg>
    );

    return (
        <svg {...common}>
            <rect width="400" height="160" fill="#0d0d0d" />
            <rect x="0" y="60" width="100" height="100" fill="#222" stroke="#f5a623" strokeWidth="1" />
            <text x="50" y="118" fill="#f5a623" fontSize="10" textAnchor="middle">START</text>
            <rect x="100" y="90" width="200" height="70" fill="#ef444420" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,3" />
            <text x="200" y="132" fill="#ef4444" fontSize="10" textAnchor="middle">TRENCH ⚡</text>
            <rect x="300" y="50" width="100" height="110" fill="#222" stroke="#f5a623" strokeWidth="1" />
            <text x="350" y="112" fill="#f5a623" fontSize="10" textAnchor="middle">FAR BANK</text>
            <rect x="105" y="80" width="180" height="10" fill="#c8841a" rx="2" opacity="0.8" />
        </svg>
    );
};

// ─── Helper Info Tag ───────────────────────────────────────────────────────────
const CandidateCard = ({ c, selected, onToggle, disabled }) => (
    <motion.button
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => !disabled && onToggle(c.id)}
        className="w-full text-left p-4 rounded-2xl transition-all border"
        style={{
            background: selected ? `${c.tagColor}12` : '#0d0d0d',
            borderColor: selected ? c.tagColor : 'rgba(255,255,255,0.07)',
            opacity: disabled && !selected ? 0.45 : 1,
            cursor: disabled && !selected ? 'not-allowed' : 'pointer',
        }}
    >
        <div className="flex items-start justify-between mb-2">
            <div>
                <p className="text-sm font-black text-white">{c.name}</p>
                <p className="text-xs" style={{ color: '#5a5a5a' }}>Strength: {c.strength}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: `${c.tagColor}20`, color: c.tagColor }}>
                    {c.tag}
                </span>
                {selected && <CheckCircle className="w-4 h-4" style={{ color: c.tagColor }} />}
            </div>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: '#5a5a5a' }}>{c.trait}</p>
        <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full" style={{ background: '#1a1a1a' }}>
                <div className="h-1 rounded-full transition-all" style={{ width: `${c.score}%`, background: c.tagColor }} />
            </div>
            <span className="text-xs font-bold" style={{ color: c.tagColor }}>{c.score}</span>
        </div>
    </motion.button>
);

// ─── Scoring OLQ Badge ─────────────────────────────────────────────────────────
const OLQBadge = ({ label }) => (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full mr-1.5 mb-1.5 inline-block" style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.2)', color: '#f5a623' }}>
        {label}
    </span>
);

// ─── Main Simulation Component ─────────────────────────────────────────────────
const CommandTaskSimulator = () => {
    const [phase, setPhase] = useState(PHASE.INTRO);
    const [obstacle, setObstacle] = useState(null);
    const [helpers, setHelpers] = useState([]);
    const [planChoice, setPlanChoice] = useState(null);
    const [execAnswers, setExecAnswers] = useState({});
    const [execStep, setExecStep] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [scoreBreakdown, setScoreBreakdown] = useState([]);
    const [helperError, setHelperError] = useState('');
    const [revealed, setRevealed] = useState({});
    const topRef = useRef(null);

    const scrollTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth' });

    const toggleHelper = (id) => {
        setHelperError('');
        if (helpers.includes(id)) {
            setHelpers(helpers.filter(h => h !== id));
        } else {
            if (helpers.length >= 2) {
                setHelperError('You can select a maximum of 2 helpers.');
                return;
            }
            setHelpers([...helpers, id]);
        }
    };

    const confirmHelpers = () => {
        if (helpers.length === 0) { setHelperError('Select at least 1 helper.'); return; }
        scrollTop();
        setPhase(PHASE.PLANNING);
    };

    const confirmPlan = () => {
        if (!planChoice) return;
        scrollTop();
        setPhase(PHASE.EXECUTION);
    };

    const answerExecStep = (choiceIdx) => {
        const step = EXECUTION_STEPS[execStep];
        setExecAnswers(prev => ({ ...prev, [step.id]: choiceIdx }));
    };

    const nextExecStep = () => {
        const step = EXECUTION_STEPS[execStep];
        const answered = execAnswers[step.id];
        if (answered === undefined) return;
        if (execStep < EXECUTION_STEPS.length - 1) {
            setExecStep(execStep + 1);
            scrollTop();
        } else {
            calculateResult();
        }
    };

    const calculateResult = () => {
        let score = 0;
        const breakdown = [];

        // Helper selection score (0-10)
        const selectedCandidates = CANDIDATES.filter(c => helpers.includes(c.id));
        const goodHelpers = selectedCandidates.filter(c => c.completes);
        const helperScore = goodHelpers.length === selectedCandidates.length
            ? (helpers.length === 2 ? 10 : 7)
            : goodHelpers.length === 1 ? 5 : 2;
        score += helperScore;
        breakdown.push({ label: 'Helper Selection', score: helperScore, max: 10 });

        // Plan score (0-10)
        const plan = PLAN_CHOICES.find(p => p.id === planChoice);
        score += plan.score;
        breakdown.push({ label: 'Planning Approach', score: plan.score, max: 10, olqs: plan.olq, penalty: plan.penalty });

        // Execution steps (0-30 total)
        EXECUTION_STEPS.forEach((step, i) => {
            const choiceIdx = execAnswers[step.id];
            const choice = step.choices[choiceIdx];
            const s = choice?.score ?? 0;
            score += s;
            breakdown.push({ label: step.title, score: s, max: 10, feedback: choice?.feedback });
        });

        setTotalScore(Math.min(score, 50));
        setScoreBreakdown(breakdown);
        setPhase(PHASE.RESULT);
        scrollTop();
    };

    const restart = () => {
        setPhase(PHASE.INTRO);
        setObstacle(null);
        setHelpers([]);
        setPlanChoice(null);
        setExecAnswers({});
        setExecStep(0);
        setTotalScore(0);
        setScoreBreakdown([]);
        setHelperError('');
        setRevealed({});
        scrollTop();
    };

    const getGrade = (s) => {
        if (s >= 45) return { label: 'Outstanding', color: '#f5a623', icon: Trophy };
        if (s >= 38) return { label: 'Commendable', color: '#22c55e', icon: Star };
        if (s >= 28) return { label: 'Average', color: '#8b5cf6', icon: Shield };
        return { label: 'Needs Work', color: '#ef4444', icon: AlertTriangle };
    };

    // ── INTRO ──────────────────────────────────────────────────────────────────
    if (phase === PHASE.INTRO) return (
        <div ref={topRef} className="min-h-screen pt-24 pb-20 px-4" style={{ background: '#000' }}>
            <div className="max-w-3xl mx-auto">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Link to="/gto-simulator" className="inline-flex items-center gap-2 text-xs font-bold mb-8 transition-colors" style={{ color: '#4a4a4a' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#f5a623'} onMouseLeave={e => e.currentTarget.style.color = '#4a4a4a'}>
                        <ChevronLeft className="w-4 h-4" /> Back to GTO
                    </Link>

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-black uppercase tracking-widest"
                        style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', color: '#f5a623' }}>
                        <Flag className="w-3.5 h-3.5" /> Command Task Simulator
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black text-white mb-4" style={{ fontFamily: 'Cinzel, serif' }}>
                        COMMAND<br /><span className="gold-gradient-text">TASK</span>
                    </h1>

                    <p className="text-base leading-relaxed mb-10" style={{ color: '#6b6b6b', maxWidth: 520 }}>
                        You are the Commander. Select helpers from your group, plan your crossing strategy, execute under GTO observation, and handle real complications mid-task. Every decision is scored.
                    </p>

                    {/* OLQs assessed */}
                    <div className="p-5 rounded-2xl mb-10" style={{ background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.1)' }}>
                        <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#f5a623' }}>OLQs Being Assessed</p>
                        <div className="flex flex-wrap">
                            {['Effective Intelligence', 'Sense of Responsibility', 'Initiative', 'Decisiveness', 'Ability to Influence', 'Cooperation', 'Stamina', 'Communication Courage'].map(olq => (
                                <OLQBadge key={olq} label={olq} />
                            ))}
                        </div>
                    </div>

                    {/* How it works */}
                    <div className="grid sm:grid-cols-4 gap-3 mb-12">
                        {[
                            { icon: Target, step: '01', label: 'Study Obstacle', desc: 'Examine the scenario and rules' },
                            { icon: Users, step: '02', label: 'Pick Helpers', desc: 'Choose 1–2 candidates wisely' },
                            { icon: Lightbulb, step: '03', label: 'Plan', desc: 'Decide your strategy' },
                            { icon: Zap, step: '04', label: 'Execute', desc: 'Handle real complications' },
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

                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => { scrollTop(); setPhase(PHASE.SELECT_OBSTACLE); }}
                        className="w-full py-5 rounded-2xl font-black text-black text-base btn-gold"
                        style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.05em' }}
                    >
                        BEGIN COMMAND TASK →
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );

    // ── SELECT OBSTACLE ────────────────────────────────────────────────────────
    if (phase === PHASE.SELECT_OBSTACLE) return (
        <div ref={topRef} className="min-h-screen pt-24 pb-20 px-4" style={{ background: '#000' }}>
            <div className="max-w-3xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-3 mb-8">
                        <button onClick={() => setPhase(PHASE.INTRO)} className="p-2 rounded-xl" style={{ background: '#111', color: '#5a5a5a' }}><ChevronLeft className="w-5 h-5" /></button>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#f5a623' }}>Phase 1 of 4</p>
                            <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cinzel, serif' }}>Select Your Obstacle</h2>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {OBSTACLES.map((obs, i) => (
                            <motion.button
                                key={obs.id}
                                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                                whileHover={{ y: -2 }}
                                onClick={() => { setObstacle(obs); setPhase(PHASE.SELECT_HELPERS); scrollTop(); }}
                                className="w-full text-left rounded-2xl overflow-hidden"
                                style={{ border: '1px solid rgba(255,255,255,0.07)', background: '#0d0d0d' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = obs.diffColor + '55'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
                            >
                                {/* For 3D obstacles, use the interactive preview component */}
                                {obs.is3D ? (
                                    <div onClick={e => e.stopPropagation()}>
                                        <ObstaclePreview obs={obs} />
                                    </div>
                                ) : (
                                    <ObstacleSVG type={obs.svg} />
                                )}
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="text-lg font-black text-white" style={{ fontFamily: 'Cinzel, serif' }}>{obs.name}</h3>
                                        <div className="flex gap-2 flex-shrink-0">
                                            {obs.is3D && (
                                                <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.3)' }}>3D Model</span>
                                            )}
                                            <span className="text-xs font-black px-3 py-1 rounded-full" style={{ background: `${obs.diffColor}18`, color: obs.diffColor }}>
                                                {obs.difficulty}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm leading-relaxed mb-3" style={{ color: '#6b6b6b' }}>{obs.description}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {obs.resources.map(r => (
                                            <span key={r} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(245,166,35,0.08)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.15)' }}>{r}</span>
                                        ))}
                                    </div>
                                    {obs.is3D && (
                                        <p className="mt-3 text-xs" style={{ color: '#5a5a5a' }}>
                                            ✦ Click the 3D preview above to explore the obstacle interactively, then tap this card to select it.
                                        </p>
                                    )}
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );

    // ── SELECT HELPERS ─────────────────────────────────────────────────────────
    if (phase === PHASE.SELECT_HELPERS) return (
        <div ref={topRef} className="min-h-screen pt-24 pb-20 px-4" style={{ background: '#000' }}>
            <div className="max-w-3xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => setPhase(PHASE.SELECT_OBSTACLE)} className="p-2 rounded-xl" style={{ background: '#111', color: '#5a5a5a' }}><ChevronLeft className="w-5 h-5" /></button>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#f5a623' }}>Phase 2 of 4</p>
                            <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cinzel, serif' }}>Choose Your Helpers</h2>
                        </div>
                    </div>

                    {/* Obstacle reminder */}
                    <div className="p-4 rounded-2xl mb-7" style={{ background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.12)' }}>
                        <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#f5a623' }}>Your Obstacle: {obstacle?.name}</p>
                        <div className="grid sm:grid-cols-2 gap-1.5">
                            {obstacle?.rules.map((r, i) => (
                                <p key={i} className="text-xs flex items-start gap-1.5" style={{ color: '#6b6b6b' }}>
                                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#f5a623' }} /> {r}
                                </p>
                            ))}
                        </div>
                    </div>

                    <p className="text-sm mb-6" style={{ color: '#5a5a5a' }}>Select <strong style={{ color: '#fff' }}>1 or 2 helpers</strong>. Pay attention to their traits — your choice affects execution.</p>

                    {helperError && (
                        <div className="flex items-center gap-2 p-3 rounded-xl mb-5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> <span className="text-sm">{helperError}</span>
                        </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-3 mb-8">
                        {CANDIDATES.map(c => (
                            <CandidateCard
                                key={c.id} c={c}
                                selected={helpers.includes(c.id)}
                                onToggle={toggleHelper}
                                disabled={helpers.length >= 2 && !helpers.includes(c.id)}
                            />
                        ))}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm" style={{ color: '#5a5a5a' }}>Selected: <strong style={{ color: '#fff' }}>{helpers.length}/2 helpers</strong></p>
                    </div>
                    <button onClick={confirmHelpers} className="w-full py-4 rounded-2xl font-black text-black btn-gold" style={{ fontFamily: 'Cinzel, serif' }}>
                        Confirm Helpers & Plan →
                    </button>
                </motion.div>
            </div>
        </div>
    );

    // ── PLANNING ───────────────────────────────────────────────────────────────
    if (phase === PHASE.PLANNING) return (
        <div ref={topRef} className="min-h-screen pt-24 pb-20 px-4" style={{ background: '#000' }}>
            <div className="max-w-3xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => setPhase(PHASE.SELECT_HELPERS)} className="p-2 rounded-xl" style={{ background: '#111', color: '#5a5a5a' }}><ChevronLeft className="w-5 h-5" /></button>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#f5a623' }}>Phase 3 of 4</p>
                            <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cinzel, serif' }}>Plan Your Approach</h2>
                        </div>
                    </div>

                    {/* Obstacle + helpers summary */}
                    <div className="rounded-2xl overflow-hidden mb-6" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                        {obstacle?.is3D ? (
                            <ObstaclePreview obs={obstacle} expanded />
                        ) : (
                            <ObstacleSVG type={obstacle?.svg} />
                        )}
                        <div className="p-5 grid sm:grid-cols-2 gap-4" style={{ background: '#0d0d0d' }}>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#f5a623' }}>Resources</p>
                                {obstacle?.resources.map(r => <p key={r} className="text-sm text-white mb-1">• {r}</p>)}
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#f5a623' }}>Your Helpers</p>
                                {CANDIDATES.filter(c => helpers.includes(c.id)).map(c => (
                                    <div key={c.id} className="mb-2">
                                        <p className="text-sm font-bold text-white">{c.name}</p>
                                        <p className="text-xs" style={{ color: '#5a5a5a' }}>Strength: {c.strength}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Reveal optimal plan toggle */}
                    <button
                        onClick={() => setRevealed(r => ({ ...r, plan: !r.plan }))}
                        className="flex items-center gap-2 text-xs font-bold mb-6 px-4 py-2.5 rounded-xl transition-all"
                        style={{ background: revealed.plan ? 'rgba(245,166,35,0.12)' : '#111', border: '1px solid rgba(245,166,35,0.15)', color: '#f5a623' }}
                    >
                        <Eye className="w-4 h-4" /> {revealed.plan ? 'Hide' : 'Reveal'} Optimal Plan (for study)
                    </button>
                    <AnimatePresence>
                        {revealed.plan && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="mb-6 p-4 rounded-2xl text-sm leading-relaxed" style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.2)', color: '#c8841a' }}>
                                <strong className="text-white">Optimal Plan: </strong>{obstacle?.optimalPlan}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <p className="text-sm font-bold mb-4 text-white">You approach the obstacle with your helpers. The GTO is watching. How do you proceed?</p>

                    <div className="grid gap-3 mb-8">
                        {PLAN_CHOICES.map(choice => (
                            <button key={choice.id}
                                onClick={() => setPlanChoice(choice.id)}
                                className="w-full text-left p-4 rounded-2xl text-sm transition-all"
                                style={{
                                    background: planChoice === choice.id ? 'rgba(245,166,35,0.1)' : '#0d0d0d',
                                    border: planChoice === choice.id ? '1.5px solid #f5a623' : '1px solid rgba(255,255,255,0.07)',
                                    color: '#e5e5e5'
                                }}
                            >
                                <span className="font-black mr-2" style={{ color: '#f5a623' }}>{choice.id}.</span> {choice.text}
                            </button>
                        ))}
                    </div>

                    <button onClick={confirmPlan} disabled={!planChoice}
                        className="w-full py-4 rounded-2xl font-black text-black btn-gold disabled:opacity-40"
                        style={{ fontFamily: 'Cinzel, serif' }}>
                        Begin Execution →
                    </button>
                </motion.div>
            </div>
        </div>
    );

    // ── EXECUTION ──────────────────────────────────────────────────────────────
    if (phase === PHASE.EXECUTION) {
        const step = EXECUTION_STEPS[execStep];
        const answered = execAnswers[step.id];

        return (
            <div ref={topRef} className="min-h-screen pt-24 pb-20 px-4" style={{ background: '#000' }}>
                <div className="max-w-3xl mx-auto">
                    <motion.div key={execStep} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
                        {/* Progress */}
                        <div className="flex items-center gap-3 mb-8">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#f5a623' }}>Phase 4 of 4 — Execution</p>
                                <h2 className="text-xl font-black text-white" style={{ fontFamily: 'Cinzel, serif' }}>{step.title}</h2>
                            </div>
                        </div>

                        {/* Progress dots */}
                        <div className="flex items-center gap-2 mb-8">
                            {EXECUTION_STEPS.map((s, i) => (
                                <div key={i} className="flex-1 h-1.5 rounded-full transition-all" style={{ background: i <= execStep ? '#f5a623' : '#1a1a1a' }} />
                            ))}
                        </div>

                        {/* GTO observation banner */}
                        <div className="flex items-center gap-3 p-4 rounded-2xl mb-6" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                            <Eye className="w-5 h-5 flex-shrink-0" style={{ color: '#ef4444' }} />
                            <p className="text-sm font-bold" style={{ color: '#ef4444' }}>GTO is observing. Every decision matters.</p>
                        </div>

                        {/* Scenario */}
                        <div className="p-6 rounded-2xl mb-8" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle className="w-5 h-5" style={{ color: '#f5a623' }} />
                                <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#f5a623' }}>Situation</p>
                            </div>
                            <p className="text-base text-white leading-relaxed">{step.prompt}</p>
                        </div>

                        {/* Choices */}
                        <div className="grid gap-3 mb-6">
                            {step.choices.map((choice, i) => {
                                const isSelected = answered === i;
                                return (
                                    <button key={i} onClick={() => answerExecStep(i)}
                                        className="w-full text-left p-4 rounded-2xl text-sm transition-all"
                                        style={{
                                            background: isSelected ? 'rgba(245,166,35,0.08)' : '#0d0d0d',
                                            border: isSelected ? '1.5px solid #f5a623' : '1px solid rgba(255,255,255,0.06)',
                                            color: '#e5e5e5'
                                        }}
                                    >
                                        <span className="font-black mr-2" style={{ color: '#f5a623' }}>{String.fromCharCode(65 + i)}.</span>{choice.text}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Feedback on answered */}
                        <AnimatePresence>
                            {answered !== undefined && (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    className="p-4 rounded-2xl mb-6 text-sm" style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.15)', color: '#c8841a' }}>
                                    <strong className="text-white">GTO Notes: </strong>{step.choices[answered]?.feedback}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button onClick={nextExecStep} disabled={answered === undefined}
                            className="w-full py-4 rounded-2xl font-black text-black btn-gold disabled:opacity-40"
                            style={{ fontFamily: 'Cinzel, serif' }}>
                            {execStep < EXECUTION_STEPS.length - 1 ? 'Next Situation →' : 'Complete Task & See Report →'}
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    // ── RESULT ─────────────────────────────────────────────────────────────────
    if (phase === PHASE.RESULT) {
        const grade = getGrade(totalScore);
        const GradeIcon = grade.icon;
        const selectedCandidates = CANDIDATES.filter(c => helpers.includes(c.id));
        const hadRiskyHelper = selectedCandidates.some(c => !c.completes);

        return (
            <div ref={topRef} className="min-h-screen pt-24 pb-20 px-4" style={{ background: '#000' }}>
                <div className="max-w-3xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
                        {/* Grade banner */}
                        <div className="rounded-3xl p-8 mb-8 text-center relative overflow-hidden"
                            style={{ background: `linear-gradient(135deg, #0d0d0d, rgba(245,166,35,0.04))`, border: `1px solid ${grade.color}35` }}>
                            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${grade.color}, transparent)` }} />
                            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
                                style={{ background: `${grade.color}18`, border: `1px solid ${grade.color}35` }}>
                                <GradeIcon className="w-10 h-10" style={{ color: grade.color }} />
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: grade.color }}>GTO Assessment</p>
                            <h2 className="text-5xl font-black text-white mb-1" style={{ fontFamily: 'Cinzel, serif' }}>{totalScore}<span className="text-2xl" style={{ color: '#4a4a4a' }}>/50</span></h2>
                            <p className="text-2xl font-black mt-2" style={{ color: grade.color }}>{grade.label}</p>
                        </div>

                        {/* Breakdown */}
                        <div className="rounded-2xl overflow-hidden mb-6" style={{ border: '1px solid rgba(255,255,255,0.07)', background: '#0d0d0d' }}>
                            <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#f5a623' }}>Score Breakdown</p>
                            </div>
                            {scoreBreakdown.map((item, i) => (
                                <div key={i} className="px-6 py-4" style={{ borderBottom: i < scoreBreakdown.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <p className="text-sm font-bold text-white">{item.label}</p>
                                        <span className="text-sm font-black" style={{ color: item.score >= 8 ? '#22c55e' : item.score >= 5 ? '#f5a623' : '#ef4444' }}>
                                            {item.score}/{item.max}
                                        </span>
                                    </div>
                                    <div className="h-1.5 rounded-full mb-2" style={{ background: '#1a1a1a' }}>
                                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${(item.score / item.max) * 100}%`, background: item.score >= 8 ? '#22c55e' : item.score >= 5 ? '#f5a623' : '#ef4444' }} />
                                    </div>
                                    {item.penalty && <p className="text-xs" style={{ color: '#ef4444' }}>⚠ {item.penalty}</p>}
                                    {item.feedback && <p className="text-xs" style={{ color: '#6b6b6b' }}>{item.feedback}</p>}
                                    {item.olqs && item.olqs.length > 0 && (
                                        <div className="mt-2 flex flex-wrap">{item.olqs.map(o => <OLQBadge key={o} label={o} />)}</div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Helper assessment */}
                        {hadRiskyHelper && (
                            <div className="p-5 rounded-2xl mb-6" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <XCircle className="w-5 h-5" style={{ color: '#ef4444' }} />
                                    <p className="text-sm font-black text-white">Helper Selection Warning</p>
                                </div>
                                <p className="text-sm" style={{ color: '#ef4444' }}>
                                    You selected Cadet Dev who tends to override your commands. During execution, he suggested a different approach in front of the GTO, undermining your authority. In real SSBs, avoid selecting helpers who challenge your command.
                                </p>
                            </div>
                        )}

                        {/* General feedback */}
                        <div className="p-6 rounded-2xl mb-8" style={{ background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.12)' }}>
                            <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#f5a623' }}>GTO's Overall Remarks</p>
                            {totalScore >= 45 && <p className="text-sm leading-relaxed" style={{ color: '#9ca3af' }}>Exceptional command. You demonstrated decisive planning, clear communication, integrity, and composure. The GTO was clearly impressed. This is the standard of a future officer.</p>}
                            {totalScore >= 38 && totalScore < 45 && <p className="text-sm leading-relaxed" style={{ color: '#9ca3af' }}>Solid performance. Your planning was logical and your composure adequate. Minor lapses in clarity of instruction or adaptation. Keep refining your briefing technique and the ability to handle complications without visible stress.</p>}
                            {totalScore >= 28 && totalScore < 38 && <p className="text-sm leading-relaxed" style={{ color: '#9ca3af' }}>Average performance. You showed some leadership qualities but struggled with composure or helper management at key moments. Focus on planning more thoroughly before execution and handling rule violations with integrity.</p>}
                            {totalScore < 28 && <p className="text-sm leading-relaxed" style={{ color: '#9ca3af' }}>Significant areas for improvement. The command task requires strong planning, clear delegation, and composure under pressure. Practice giving structured orders and reviewing the rules of GTO obstacles before attempting again.</p>}
                        </div>

                        {/* Pro tips */}
                        <div className="p-5 rounded-2xl mb-8" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#f5a623' }}>Key Takeaways</p>
                            {[
                                'Always study the obstacle for 30 seconds before speaking — planning first is a sign of Effective Intelligence.',
                                'Helpers are your hands, not your brain — steer them to follow YOUR plan, not suggest their own.',
                                'Never hide rule violations. Acknowledge and correct immediately — integrity is heavily observed.',
                                'When GTO raises difficulty, stay composed. Quick adaptation is the hallmark of a good commander.',
                                'Blaming helpers or yelling is an immediate red flag. Own the team\'s success and failure.',
                            ].map((tip, i) => (
                                <p key={i} className="text-xs flex items-start gap-2 mb-2.5" style={{ color: '#6b6b6b' }}>
                                    <span style={{ color: '#f5a623', flexShrink: 0 }}>✦</span> {tip}
                                </p>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button onClick={restart}
                                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all"
                                style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', color: '#9ca3af' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
                                <RotateCcw className="w-4 h-4" /> Try Again
                            </button>
                            <Link to="/gto-simulator"
                                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm btn-gold"
                                style={{ fontFamily: 'Cinzel, serif' }}>
                                <Award className="w-4 h-4" /> Back to GTO
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return null;
};

export default CommandTaskSimulator;
