import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    ChevronLeft, Flag, Target, Zap, AlertTriangle, Shield,
    Clock, Award, RotateCcw, Box, ArrowRightCircle, Plus, RotateCw, Lightbulb
} from 'lucide-react';
import confetti from 'canvas-confetti';

// ─── MATH UTILS ─────────────────────────────────────────────────────────────
const dist2 = (v, w) => Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
const distToSegmentSquared = (p, v, w) => {
    let l2 = dist2(v, w);
    if (l2 === 0) return dist2(p, v);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
};
const pointToSegmentDistance = (p, v, w) => Math.sqrt(distToSegmentSquared(p, v, w));

const onSegment = (p, q, r) => q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
const orientation = (p, q, r) => {
    let val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (val === 0) return 0;
    return (val > 0) ? 1 : 2;
};
const doIntersect = (p1, q1, p2, q2) => {
    let o1 = orientation(p1, q1, p2);
    let o2 = orientation(p1, q1, q2);
    let o3 = orientation(p2, q2, p1);
    let o4 = orientation(p2, q2, q1);
    if (o1 !== o2 && o3 !== o4) return true;
    if (o1 === 0 && onSegment(p1, p2, q1)) return true;
    if (o2 === 0 && onSegment(p1, q2, q1)) return true;
    if (o3 === 0 && onSegment(p2, p1, q2)) return true;
    if (o4 === 0 && onSegment(p2, q1, q2)) return true;
    return false;
};

const getEnds = (x, y, length, rot) => {
    const rad = rot * Math.PI / 180;
    return {
        end1: { x: x - (length / 2) * Math.cos(rad), y: y - (length / 2) * Math.sin(rad) },
        end2: { x: x + (length / 2) * Math.cos(rad), y: y + (length / 2) * Math.sin(rad) }
    };
};

// ─── CONFIG ─────────────────────────────────────────────────────────────────
const LEVELS = {
    Easy: {
        pillars: [{ x: 300, y: 250, r: 25 }, { x: 500, y: 250, r: 25 }],
        inventory: { plank: 2, balli: 1, rope: 1 },
        desc: "Two central pillars. Use planks to bridge the gaps."
    },
    Medium: {
        pillars: [{ x: 250, y: 150, r: 20 }, { x: 450, y: 350, r: 20 }],
        inventory: { plank: 1, balli: 2, rope: 1 },
        desc: "Staggered pillars. Requires connecting materials."
    },
    Hard: {
        pillars: [{ x: 380, y: 250, r: 15 }],
        inventory: { plank: 1, balli: 1, rope: 2 },
        desc: "Only one small pillar. Plan your cantilever carefully."
    },
    Expert: {
        pillars: [{ x: 320, y: 100, r: 20 }, { x: 480, y: 400, r: 20 }],
        inventory: { plank: 1, balli: 1, rope: 1 },
        desc: "Extreme gaps. Requires perfect utilization of all resources."
    }
};

const ITEM_CONFIG = {
    plank: { length: 220, width: 24, color: '#d97706', label: 'Wooden Plank' },
    balli: { length: 140, width: 16, color: '#b45309', label: 'Balli (Beam)' },
    rope: { length: 300, width: 6, color: '#e5e7eb', label: 'Rope' },
};

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

const HUD = ({ score, violations, time, level, setPhase }) => {
    const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    return (
        <div className="flex items-center justify-between p-4 rounded-2xl mb-6 bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-6">
                <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Level</p>
                    <p className="text-amber-500 font-black tracking-wide">{level}</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Score</p>
                    <p className="text-white font-black font-mono">{score}</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Violations</p>
                    <p className="text-red-400 font-black font-mono">{violations}</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Time</p>
                    <p className="text-white font-black font-mono flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" /> {formatTime(time)}
                    </p>
                </div>
            </div>
            <button 
                onClick={() => setPhase('intro')}
                className="px-5 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors font-bold text-sm"
            >
                Abort Task
            </button>
        </div>
    );
};

export default function CommandTaskSimulator() {
    const [phase, setPhase] = useState('intro'); // intro, level, simulation, result
    const [level, setLevel] = useState('Medium');
    const [time, setTime] = useState(0);
    const [score, setScore] = useState(100);
    const [violations, setViolations] = useState(0);
    const [hint, setHint] = useState('Spawn materials from the inventory and drag them onto the field.');
    
    // Board state
    const boardRef = useRef(null);
    const [materials, setMaterials] = useState([]);
    const [inventory, setInventory] = useState({ plank: 0, balli: 0, rope: 0 });
    const [selectedMatId, setSelectedMatId] = useState(null);
    const [playerPos, setPlayerPos] = useState({ x: 75, y: 250 });

    const [alertMsg, setAlertMsg] = useState(null);

    useEffect(() => {
        let timer;
        if (phase === 'simulation') {
            timer = setInterval(() => setTime(t => t + 1), 1000);
        }
        return () => clearInterval(timer);
    }, [phase]);

    const triggerAlert = (msg, penalty = 5) => {
        setAlertMsg(msg);
        setViolations(v => v + 1);
        setScore(s => Math.max(0, s - penalty));
        setTimeout(() => setAlertMsg(null), 2500);
    };

    const startSimulation = (lvl) => {
        setLevel(lvl);
        setInventory(LEVELS[lvl].inventory);
        setMaterials([]);
        setPlayerPos({ x: 75, y: 250 });
        setScore(100);
        setViolations(0);
        setTime(0);
        setHint('Commander, study the layout. Anchor your first plank from the Start zone.');
        setPhase('simulation');
    };

    const spawnMaterial = (type) => {
        if (inventory[type] <= 0) return;
        setInventory(prev => ({ ...prev, [type]: prev[type] - 1 }));
        const id = `${type}-${Date.now()}`;
        setMaterials(prev => [...prev, {
            id, type, x: 75, y: Math.random() * 200 + 150, rot: 0, placed: true
        }]);
        setSelectedMatId(id);
    };

    const checkMaterialStability = (mId, mX, mY, mRot) => {
        const matConfig = materials.find(m => m.id === mId);
        if (!matConfig) return false;
        const config = ITEM_CONFIG[matConfig.type];
        const { end1, end2 } = getEnds(mX, mY, config.length, mRot);
        
        let supportsFound = new Set();
        
        // Check Zones
        if (end1.x <= 150) supportsFound.add('start_1');
        if (end2.x <= 150) supportsFound.add('start_2');
        if (end1.x >= 650) supportsFound.add('finish_1');
        if (end2.x >= 650) supportsFound.add('finish_2');
        
        // Check Pillars
        LEVELS[level].pillars.forEach((p, i) => {
            if (pointToSegmentDistance(p, end1, end2) <= p.r + 12) {
                supportsFound.add('pillar_' + i);
            }
        });
        
        // Check other materials
        materials.forEach(other => {
            if (other.id === mId) return;
            const oConfig = ITEM_CONFIG[other.type];
            const oEnds = getEnds(other.x, other.y, oConfig.length, other.rot);
            if (doIntersect(end1, end2, oEnds.end1, oEnds.end2) || 
                pointToSegmentDistance(end1, oEnds.end1, oEnds.end2) < 20 || 
                pointToSegmentDistance(end2, oEnds.end1, oEnds.end2) < 20 ||
                pointToSegmentDistance(oEnds.end1, end1, end2) < 20 ||
                pointToSegmentDistance(oEnds.end2, end1, end2) < 20) {
                supportsFound.add('mat_' + other.id);
            }
        });
        
        return supportsFound.size >= 2;
    };

    const handleMatDragEnd = (e, info, mat) => {
        if (!boardRef.current) return;
        const board = boardRef.current.getBoundingClientRect();
        const el = e.target.getBoundingClientRect();
        
        const mX = el.left + el.width/2 - board.left;
        const mY = el.top + el.height/2 - board.top;

        if (checkMaterialStability(mat.id, mX, mY, mat.rot)) {
            setMaterials(prev => prev.map(m => m.id === mat.id ? { ...m, x: mX, y: mY } : m));
            setHint('Good placement. Proceed cautiously.');
        } else {
            // Invalid placement
            triggerAlert('RULE BROKEN: Unsupported Material Dropped in Restricted Zone!');
            // Return to start
            setMaterials(prev => prev.map(m => m.id === mat.id ? { ...m, x: 75, y: 250, rot: 0 } : m));
        }
    };

    const handlePlayerDragEnd = (e, info) => {
        if (!boardRef.current) return;
        const board = boardRef.current.getBoundingClientRect();
        const el = e.target.getBoundingClientRect();
        const pX = el.left + el.width/2 - board.left;
        const pY = el.top + el.height/2 - board.top;

        // Check if player is safe
        let isSafe = false;
        
        if (pX <= 150) isSafe = true; // Start
        else if (pX >= 650) { // Finish
            isSafe = true;
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            setTimeout(() => setPhase('result'), 1500);
        } else {
            // Check pillars
            LEVELS[level].pillars.forEach(p => {
                if (Math.hypot(pX - p.x, pY - p.y) <= p.r + 15) isSafe = true;
            });
            // Check materials
            materials.forEach(m => {
                const conf = ITEM_CONFIG[m.type];
                const { end1, end2 } = getEnds(m.x, m.y, conf.length, m.rot);
                if (pointToSegmentDistance({x: pX, y: pY}, end1, end2) <= 25) isSafe = true;
            });
        }

        if (isSafe) {
            setPlayerPos({ x: pX, y: pY });
        } else {
            triggerAlert('RULE BROKEN: Commander stepped in Restricted Area!', 10);
            setPlayerPos({ x: 75, y: 250 }); // reset to start
        }
    };

    const rotateSelected = (deg) => {
        if (!selectedMatId) return;
        setMaterials(prev => prev.map(m => {
            if (m.id !== selectedMatId) return m;
            const newRot = m.rot + deg;
            // Temporarily ignore stability while rotating, or we could force it to return to start if invalid.
            // For better UX, let's allow rotation and check stability on drag drop.
            return { ...m, rot: newRot };
        }));
    };

    // ─── RENDERERS ──────────────────────────────────────────────────────────────

    if (phase === 'intro') return (
        <div className="min-h-screen pt-24 pb-20 px-4 bg-black flex flex-col items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl w-full text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 text-amber-500">
                    <Flag className="w-3.5 h-3.5" /> Interactive Tactical Simulator
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-white mb-6" style={{ fontFamily: 'Cinzel, serif' }}>
                    COMMAND <span className="text-amber-500">TASK</span>
                </h1>
                <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                    Step into the shoes of the Commander. Navigate complex obstacle courses using limited helping materials. Drag, drop, rotate, and build bridges to safely reach the finish line without touching the restricted Red Zone.
                </p>
                <div className="grid sm:grid-cols-3 gap-6 mb-12 text-left">
                    <div className="p-6 rounded-2xl bg-[#0d0d0d] border border-white/5">
                        <Target className="w-8 h-8 text-amber-500 mb-4" />
                        <h3 className="text-white font-bold mb-2">Immersive Obstacles</h3>
                        <p className="text-sm text-gray-500">Interact with pillars, red zones, and gaps just like the real GTO ground.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-[#0d0d0d] border border-white/5">
                        <Box className="w-8 h-8 text-amber-500 mb-4" />
                        <h3 className="text-white font-bold mb-2">Tactical Materials</h3>
                        <p className="text-sm text-gray-500">Utilize wooden planks, ballis, and ropes to engineer safe passages.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-[#0d0d0d] border border-white/5">
                        <Shield className="w-8 h-8 text-amber-500 mb-4" />
                        <h3 className="text-white font-bold mb-2">Strict SSB Rules</h3>
                        <p className="text-sm text-gray-500">Every move is evaluated. Touching restricted areas yields penalties.</p>
                    </div>
                </div>
                <button 
                    onClick={() => setPhase('level')}
                    className="px-12 py-5 rounded-2xl bg-amber-500 text-black font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(245,166,35,0.3)]"
                    style={{ fontFamily: 'Cinzel, serif' }}
                >
                    SELECT DIFFICULTY →
                </button>
            </motion.div>
        </div>
    );

    if (phase === 'level') return (
        <div className="min-h-screen pt-24 pb-20 px-4 bg-black flex flex-col items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl w-full">
                <button onClick={() => setPhase('intro')} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 text-sm font-bold">
                    <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <h2 className="text-3xl font-black text-white mb-8" style={{ fontFamily: 'Cinzel, serif' }}>Select Difficulty</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    {Object.entries(LEVELS).map(([lvl, data], i) => (
                        <motion.button
                            key={lvl}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            onClick={() => startSimulation(lvl)}
                            className="text-left p-8 rounded-3xl bg-[#0d0d0d] border border-white/10 hover:border-amber-500/50 hover:bg-white/[0.02] transition-all group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-black text-white group-hover:text-amber-500 transition-colors" style={{ fontFamily: 'Cinzel, serif' }}>{lvl}</h3>
                                <ArrowRightCircle className="w-6 h-6 text-gray-600 group-hover:text-amber-500 transition-colors" />
                            </div>
                            <p className="text-gray-400 text-sm mb-6">{data.desc}</p>
                            <div className="flex items-center gap-4">
                                {data.inventory.plank > 0 && <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">{data.inventory.plank} Plank</span>}
                                {data.inventory.balli > 0 && <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full">{data.inventory.balli} Balli</span>}
                                {data.inventory.rope > 0 && <span className="text-xs font-bold text-gray-300 bg-gray-500/20 px-3 py-1 rounded-full">{data.inventory.rope} Rope</span>}
                            </div>
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        </div>
    );

    if (phase === 'result') return (
        <div className="min-h-screen pt-24 pb-20 px-4 bg-black flex flex-col items-center justify-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl w-full text-center p-10 rounded-3xl bg-[#0d0d0d] border border-amber-500/30 shadow-[0_0_80px_rgba(245,166,35,0.1)]">
                <Award className="w-20 h-20 text-amber-500 mx-auto mb-6" />
                <h2 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Cinzel, serif' }}>TASK ACCOMPLISHED</h2>
                <p className="text-gray-400 mb-10">You have successfully navigated the obstacle course.</p>
                
                <div className="grid grid-cols-3 gap-6 mb-10">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Final Score</p>
                        <p className="text-3xl font-black text-amber-500">{score}/100</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Time</p>
                        <p className="text-3xl font-black text-white">{Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Violations</p>
                        <p className="text-3xl font-black text-red-400">{violations}</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button onClick={() => setPhase('level')} className="flex-1 py-4 rounded-xl font-black text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        Try Another Level
                    </button>
                    <Link to="/dashboard" className="flex-1 py-4 rounded-xl font-black text-black bg-amber-500 hover:bg-amber-400 transition-colors" style={{ fontFamily: 'Cinzel, serif' }}>
                        Return to Dashboard
                    </Link>
                </div>
            </motion.div>
        </div>
    );

    // ─── SIMULATION PHASE ───────────────────────────────────────────────────
    return (
        <div className="min-h-screen pt-24 pb-8 px-4 bg-black flex flex-col items-center select-none overflow-hidden">
            <div className="max-w-[1200px] w-full flex flex-col">
                <HUD score={score} violations={violations} time={time} level={level} setPhase={setPhase} />
                
                <div className="flex gap-6 items-start">
                    {/* Left: Board */}
                    <div className="relative flex-1 rounded-2xl overflow-hidden border-2 border-[#333] shadow-[0_0_60px_rgba(0,0,0,0.8)] bg-[#141414]" style={{ height: 500 }}>
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
                        
                        {/* Interactive Board Ref */}
                        <div ref={boardRef} className="absolute inset-0">
                            {/* Start Zone */}
                            <div className="absolute left-0 top-0 w-[150px] h-full bg-blue-500/10 border-r-2 border-blue-500/50 flex items-center justify-center pointer-events-none">
                                <span className="text-blue-500/30 font-black tracking-widest text-4xl -rotate-90">START</span>
                            </div>
                            
                            {/* Red Zone Warning */}
                            <div className="absolute left-[150px] right-[150px] top-0 h-full bg-red-900/10 flex items-end justify-center pb-6 pointer-events-none">
                                <span className="text-red-500/20 font-black tracking-widest text-2xl uppercase">Restricted Red Zone</span>
                            </div>
                            
                            {/* Finish Zone */}
                            <div className="absolute right-0 top-0 w-[150px] h-full bg-green-500/10 border-l-2 border-green-500/50 flex items-center justify-center pointer-events-none">
                                <span className="text-green-500/30 font-black tracking-widest text-4xl rotate-90">FINISH</span>
                            </div>

                            {/* Pillars */}
                            {LEVELS[level].pillars.map((p, i) => (
                                <div key={i} className="absolute rounded-full bg-gray-200 border-4 border-gray-400 shadow-xl pointer-events-none" 
                                    style={{ width: p.r*2, height: p.r*2, left: p.x - p.r, top: p.y - p.r }} />
                            ))}

                            {/* Materials */}
                            {materials.map(m => {
                                const conf = ITEM_CONFIG[m.type];
                                return (
                                    <motion.div
                                        key={m.id}
                                        drag
                                        dragMomentum={false}
                                        onDragStart={() => setSelectedMatId(m.id)}
                                        onDragEnd={(e, info) => handleMatDragEnd(e, info, m)}
                                        className={`absolute rounded-sm cursor-grab active:cursor-grabbing ${selectedMatId === m.id ? 'ring-2 ring-white ring-offset-2 ring-offset-black z-20' : 'z-10'}`}
                                        style={{
                                            width: conf.length,
                                            height: conf.width,
                                            backgroundColor: conf.color,
                                            left: m.x, top: m.y, x: '-50%', y: '-50%',
                                            rotate: m.rot,
                                            boxShadow: '0 10px 20px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.2)'
                                        }}
                                        whileHover={{ scale: 1.02 }}
                                        whileDrag={{ scale: 1.05, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
                                    />
                                );
                            })}

                            {/* Player Token */}
                            <motion.div
                                drag
                                dragMomentum={false}
                                onDragEnd={handlePlayerDragEnd}
                                className="absolute w-10 h-10 rounded-full bg-white border-4 border-amber-500 shadow-[0_0_20px_rgba(245,166,35,0.6)] cursor-grab active:cursor-grabbing z-30 flex items-center justify-center"
                                style={{ left: playerPos.x, top: playerPos.y, x: '-50%', y: '-50%' }}
                                whileHover={{ scale: 1.1 }}
                                whileDrag={{ scale: 1.2 }}
                            >
                                <span className="text-amber-500 font-black text-xs">YOU</span>
                            </motion.div>
                        </div>

                        {/* Rules Alert Overlay */}
                        <AnimatePresence>
                            {alertMsg && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -50, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute top-10 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-2xl border-2 border-red-400 flex items-center gap-3 whitespace-nowrap"
                                >
                                    <AlertTriangle className="w-6 h-6 text-white" /> {alertMsg}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right: Controls & Inventory */}
                    <div className="w-80 flex flex-col gap-6">
                        {/* Hint System */}
                        <div className="p-5 rounded-2xl bg-[#0d0d0d] border border-amber-500/20 shadow-[0_0_30px_rgba(245,166,35,0.05)]">
                            <div className="flex items-center gap-2 mb-3">
                                <Lightbulb className="w-5 h-5 text-amber-500" />
                                <h3 className="text-white font-black" style={{ fontFamily: 'Cinzel, serif' }}>Tactical Intel</h3>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed italic">{hint}</p>
                        </div>

                        {/* Selected Item Controls */}
                        <div className="p-5 rounded-2xl bg-[#0d0d0d] border border-white/10 transition-all" style={{ opacity: selectedMatId ? 1 : 0.5 }}>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">Object Controls</p>
                            <div className="flex gap-3">
                                <button onClick={() => rotateSelected(-15)} disabled={!selectedMatId} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-sm transition-colors disabled:opacity-50">
                                    <RotateCcw className="w-4 h-4" /> -15°
                                </button>
                                <button onClick={() => rotateSelected(15)} disabled={!selectedMatId} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-sm transition-colors disabled:opacity-50">
                                    <RotateCw className="w-4 h-4" /> +15°
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 text-center mt-3">Select a material to rotate</p>
                        </div>

                        {/* Inventory */}
                        <div className="p-5 rounded-2xl bg-[#0d0d0d] border border-white/10 flex-1">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">Helping Materials</p>
                            <div className="flex flex-col gap-3">
                                {Object.entries(inventory).map(([type, count]) => {
                                    const conf = ITEM_CONFIG[type];
                                    return (
                                        <button 
                                            key={type}
                                            onClick={() => spawnMaterial(type)}
                                            disabled={count <= 0}
                                            className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/50 hover:bg-white/10 transition-all disabled:opacity-30 disabled:hover:border-white/10 disabled:cursor-not-allowed group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: conf.color }}>
                                                    <Box className="w-4 h-4 text-white/50" />
                                                </div>
                                                <span className="font-bold text-white group-hover:text-amber-500 transition-colors">{conf.label}</span>
                                            </div>
                                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-amber-500 font-black text-sm">{count}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
