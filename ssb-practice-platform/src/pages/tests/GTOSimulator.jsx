import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Maximize2, Trophy, Users, Layers, Flag,
    BrainCircuit, MessageSquare, Swords, ChevronRight, Shield, Info, Pencil
} from 'lucide-react';
import { useState } from 'react';

// ─── Task catalog ─────────────────────────────────────────────────────────────
const TASKS = [
    {
        key: 'group',
        label: 'Group Obstacle Race',
        badge: 'GOR',
        sub: 'Snake Race 3D Simulation',
        icon: Users,
        color: '#f5a623',
        file: '/gto/group.html',
        detail: 'Experience the full GOR simulation where your team must coordinate to navigate obstacles as a unit. Tests leadership, coordination, and tactical thinking.',
        tips: ['Communicate clearly with your team', 'No touching the electric fence', 'Help weaker members cross first'],
        marks: 10,
    },
    {
        key: 'individual',
        label: 'Individual Obstacles',
        badge: 'IO',
        sub: '10-Obstacle 3D Ground Layout',
        icon: Layers,
        color: '#e8963d',
        file: '/gto/individual.html',
        detail: 'Authentic 3D layout of the 10 individual obstacles in the SSB ground. Learn clearance techniques, rules, and marking criteria.',
        tips: ['Attempt all obstacles even imperfectly', 'Know the rules for each obstacle', 'Stay calm — don\'t rush and fail'],
        marks: 40,
    },
    {
        key: 'command',
        label: 'Command Task',
        badge: 'CT',
        sub: 'Lead Your Team Across Obstacles',
        icon: Flag,
        color: '#d9883a',
        file: '/command-task',
        detail: 'Given subordinates and materials, you must get everyone across an obstacle. Tests your planning, leadership, and OLQ expression under observation.',
        tips: ['Plan before executing', 'Give clear, confident orders', 'Show initiative and resource management'],
        marks: 'Assessed',
    },
    {
        key: 'gpe',
        label: 'Group Planning Exercise',
        badge: 'GPE',
        sub: 'Tactical Decision Making',
        icon: BrainCircuit,
        color: '#c87a35',
        file: '/gpe-simulator',
        detail: 'Read a complex scenario and propose a tactical plan under time pressure. Your individual plan is discussed and debated in a leaderless group.',
        tips: ['Read the model carefully', 'Prioritize the most critical problem', 'Submit a confident individual plan'],
        marks: 'Assessed',
    },
    {
        key: 'lecturette',
        label: 'Lecturette',
        badge: 'LCT',
        sub: '3-Minute Talk on Random Topic',
        icon: MessageSquare,
        color: '#b86c30',
        file: '/lecturette',
        detail: 'Pick a card from 4 options and deliver a 3-minute structured talk. Tests confidence, knowledge, communication, and leadership presence.',
        tips: ['Choose topic you know best', 'Follow: Intro → Body → Conclusion', 'Maintain eye contact, speak slowly'],
        marks: 'Observed',
    },
    {
        key: 'sdt',
        label: 'Self Description Test',
        badge: 'SDT',
        sub: 'Describe From 5 Perspectives',
        icon: Pencil,
        color: '#8b5cf6',
        file: '/sdt',
        detail: 'Write about yourself from 5 perspectives: what your parents, teachers, friends, yourself, and your growth goals say about you. AI psychologist analyses your responses for OLQ traits.',
        tips: ['Be honest and balanced — avoid only positives', 'Include both strengths and areas to improve', 'Ensure consistency across all 5 perspectives'],
        marks: 'Assessed',
    },
];

// ─── Task Selection Card ──────────────────────────────────────────────────────
const TaskCard = ({ task, onSelect, index }) => {
    const Icon = task.icon;
    return (
        <motion.button
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * index, duration: 0.45 }}
            whileHover={{ y: -5 }}
            onClick={() => onSelect(task)}
            className="w-full text-left rounded-2xl p-6 group transition-all flex flex-col"
            style={{
                background: '#0e0e0e',
                border: '1px solid rgba(245,166,35,0.1)',
                transition: 'all 0.25s ease',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = `${task.color}55`;
                e.currentTarget.style.boxShadow = `0 8px 32px ${task.color}15`;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(245,166,35,0.1)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            {/* Top row */}
            <div className="flex items-start justify-between mb-5">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `${task.color}18`, border: `1px solid ${task.color}30` }}
                >
                    <Icon className="w-6 h-6" style={{ color: task.color }} />
                </div>
                <span
                    className="text-xs font-black tracking-widest px-3 py-1 rounded-full"
                    style={{ background: `${task.color}12`, color: task.color, border: `1px solid ${task.color}28` }}
                >
                    {task.badge}
                </span>
            </div>

            {/* Title */}
            <h3 className="font-black text-white text-base mb-1" style={{ fontFamily: 'Cinzel, serif' }}>{task.label}</h3>
            <p className="text-xs mb-5" style={{ color: '#5a5a5a' }}>{task.sub}</p>

            {/* Marks badge */}
            <div className="flex items-center gap-1.5 mb-5">
                <Trophy className="w-3.5 h-3.5" style={{ color: task.color }} />
                <span className="text-xs font-bold" style={{ color: task.color }}>
                    {typeof task.marks === 'number' ? `${task.marks} marks` : task.marks}
                </span>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-1.5 text-xs font-black mt-auto transition-all group-hover:gap-2.5" style={{ color: task.color }}>
                {task.file ? 'Enter Simulation' : 'View Exercise'}
                <ChevronRight className="w-4 h-4" />
            </div>
        </motion.button>
    );
};

// ─── Task Detail Modal ────────────────────────────────────────────────────────
const TaskModal = ({ task, onClose, onEnter }) => {
    const Icon = task.icon;
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 24 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 24 }}
                transition={{ type: 'spring', damping: 22 }}
                className="w-full max-w-lg rounded-3xl overflow-hidden"
                style={{ background: '#0e0e0e', border: `1px solid ${task.color}35`, boxShadow: `0 32px 80px rgba(0,0,0,0.8)` }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative h-2" style={{ background: `linear-gradient(90deg, transparent, ${task.color}, transparent)` }} />

                <div className="p-8">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${task.color}18`, border: `1px solid ${task.color}30` }}>
                            <Icon className="w-7 h-7" style={{ color: task.color }} />
                        </div>
                        <div>
                            <span className="text-xs font-black tracking-widest uppercase" style={{ color: task.color }}>{task.badge}</span>
                            <h2 className="text-2xl font-black text-white mt-1" style={{ fontFamily: 'Cinzel, serif' }}>{task.label}</h2>
                            <p className="text-sm" style={{ color: '#5a5a5a' }}>{task.sub}</p>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm leading-relaxed mb-6" style={{ color: '#8a8a8a' }}>{task.detail}</p>

                    {/* Tips */}
                    <div className="mb-8 p-5 rounded-2xl" style={{ background: `${task.color}08`, border: `1px solid ${task.color}15` }}>
                        <div className="flex items-center gap-2 mb-3">
                            <Info className="w-4 h-4" style={{ color: task.color }} />
                            <p className="text-xs font-black uppercase tracking-widest" style={{ color: task.color }}>Key Tips</p>
                        </div>
                        <ul className="space-y-2">
                            {task.tips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#7a7a7a' }}>
                                    <span className="font-black mt-0.5" style={{ color: `${task.color}80` }}>✦</span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 py-4 rounded-xl font-bold text-sm transition-all" style={{ background: 'rgba(255,255,255,0.04)', color: '#6a6a6a', border: '1px solid rgba(255,255,255,0.07)' }}>
                            Back
                        </button>
                        <button
                            onClick={onEnter}
                            className="flex-1 py-4 rounded-xl font-black text-sm text-black flex items-center justify-center gap-2 transition-all"
                            style={{ background: task.color, fontFamily: 'Cinzel, serif', boxShadow: `0 8px 24px ${task.color}35` }}
                        >
                            {task.file ? 'Launch Simulation' : 'Start Exercise'}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ─── Simulator view (iframe) ──────────────────────────────────────────────────
const SimulatorView = ({ task, onBack }) => {
    const [fullscreen, setFullscreen] = useState(false);
    const iframeRef = useState(null);

    const handleFullscreen = () => {
        const el = document.getElementById('gto-iframe');
        if (el?.requestFullscreen) el.requestFullscreen();
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ background: '#000' }}>
            {/* Slim Header */}
            <div
                className="h-14 flex items-center justify-between px-6 flex-shrink-0"
                style={{ background: '#080808', borderBottom: '1px solid rgba(245,166,35,0.1)' }}
            >
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-lg transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#6a6a6a' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.color = '#6a6a6a'}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${task.color}18` }}>
                            <task.icon className="w-4 h-4" style={{ color: task.color }} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-white">{task.label}</p>
                            <p className="text-xs font-bold" style={{ color: '#4a4a4a' }}>3D Simulation · Interactive</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: `${task.color}12`, border: `1px solid ${task.color}22` }}>
                        <Trophy className="w-3.5 h-3.5" style={{ color: task.color }} />
                        <span className="text-xs font-black uppercase" style={{ color: task.color }}>GTO Exercise</span>
                    </div>
                    <button
                        onClick={handleFullscreen}
                        className="p-2 rounded-lg transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#6a6a6a' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.color = '#6a6a6a'}
                        title="Fullscreen"
                    >
                        <Maximize2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* iframe */}
            <div className="flex-1 relative" style={{ background: '#000' }}>
                <iframe
                    id="gto-iframe"
                    src={task.file}
                    className="absolute inset-0 w-full h-full border-none"
                    title={task.label}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                    allowFullScreen
                />
                {/* fallback bg */}
                <div className="absolute inset-0 -z-10 flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${task.color}18` }}>
                        <task.icon className="w-8 h-8" style={{ color: task.color }} />
                    </div>
                    <p className="text-sm font-black uppercase tracking-widest" style={{ color: '#3a3a3a' }}>Loading 3D Environment...</p>
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const GTOSimulator = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const typeParam = searchParams.get('type');

    const [selectedTask, setSelectedTask] = useState(null);

    // If a valid task type is passed AND it has a file, go straight to simulator
    const initialTask = typeParam ? TASKS.find(t => t.key === typeParam) : null;

    const handleSelect = (task) => {
        setSelectedTask(task);
    };

    const handleEnter = () => {
        if (selectedTask?.file) {
            if (selectedTask.file.startsWith('/')) {
                navigate(selectedTask.file);
                setSelectedTask(null);
            } else {
                navigate(`/gto-simulator?type=${selectedTask.key}`);
                setSelectedTask(null);
            }
        } else {
            setSelectedTask(null);
        }
    };

    // ── Simulator active ──────────────────────────────────────────────────────
    if (initialTask && initialTask.file) {
        return (
            <SimulatorView 
                task={initialTask} 
                onBack={() => navigate('/gto-simulator')} 
            />
        );
    }

    // ── Landing / Selection ───────────────────────────────────────────────────
    return (
        <div className="min-h-screen pt-28 pb-24 px-6" style={{ background: '#000' }}>
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="text-center mb-16">
                    <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-black uppercase tracking-widest"
                            style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', color: '#f5a623' }}>
                            <Swords className="w-3.5 h-3.5" /> Group Testing Officer
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-white mb-5 section-title" style={{ fontFamily: 'Cinzel, serif' }}>
                            GTO <span className="gold-gradient-text">EXERCISES</span>
                        </h1>
                        <p className="text-sm md:text-base max-w-xl mx-auto mt-6" style={{ color: '#5a5a5a' }}>
                            Choose your GTO exercise. Each task is designed to evaluate specific Officer Like Qualities under real group dynamics and pressure.
                        </p>
                    </motion.div>
                </div>

                {/* Task Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {TASKS.map((task, i) => (
                        <TaskCard key={task.key} task={task} onSelect={handleSelect} index={i} />
                    ))}
                </div>

                {/* Info bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-12 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4"
                    style={{ background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.1)' }}
                >
                    <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5" style={{ color: '#f5a623' }} />
                        <p className="text-sm font-bold" style={{ color: '#7a7a7a' }}>
                            GTO comprises <span className="text-white">10 tasks</span> across 2 days, contributing ~30% to SSB selection weightage.
                        </p>
                    </div>
                    <Link to="/tests" className="text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors hover:text-white" style={{ color: '#f5a623' }}>
                        Back to Tests →
                    </Link>
                </motion.div>
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedTask && (
                    <TaskModal
                        task={selectedTask}
                        onClose={() => setSelectedTask(null)}
                        onEnter={handleEnter}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default GTOSimulator;
