import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Brain, Video, VideoOff, Mic, MicOff, Play, Clock,
    AlertCircle, CheckCircle, Shield, Award, RotateCcw, MessageSquare, Plus, Star,
    Loader2, Square, Activity
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';

export default function Lecturette() {
    const navigate = useNavigate();
    const [step, setStep] = useState('topics'); // topics | prepare | speak | analyze | report
    const [loading, setLoading] = useState(false);

    // Topics
    const [topicList, setTopicList] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState(null);

    // Media
    const [stream, setStream] = useState(null);
    const [camReady, setCamReady] = useState(false);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);
    const [permError, setPermError] = useState('');
    const videoRef = useRef(null);

    // Counters
    const [prepTimer, setPrepTimer] = useState(180); // 3 mins prep
    const [lectureTimer, setLectureTimer] = useState(0); // speak up to 180s
    const [speechText, setSpeechText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    // Report
    const [report, setReport] = useState(null);

    useEffect(() => {
        if (step === 'topics') {
            fetchTopics();
        }
    }, [step]);

    const fetchTopics = async () => {
        setLoading(true);
        try {
            const res = await api.get('/lecturette/topics');
            setTopicList(res.data.topics || []);
        } catch (e) {
            console.error("Failed to fetch topics", e);
        } finally {
            setLoading(false);
        }
    };

    // Media setup
    const startMedia = async () => {
        try {
            const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(s);
            setCamReady(true);
            setPermError('');
        } catch {
            setPermError('Camera or microphone access denied. Please allow permissions.');
        }
    };

    const stopMedia = useCallback(() => {
        if (stream) stream.getTracks().forEach(t => t.stop());
    }, [stream]);

    useEffect(() => {
        if (stream && videoRef.current) videoRef.current.srcObject = stream;
    }, [stream, step]);

    // Cleanup
    useEffect(() => {
        return () => {
            stopMedia();
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, [stopMedia]);

    // Timer hooks
    useEffect(() => {
        if (step !== 'prepare' || prepTimer <= 0) return;
        const t = setInterval(() => setPrepTimer(p => p - 1), 1000);
        return () => clearInterval(t);
    }, [step, prepTimer]);

    useEffect(() => {
        if (step !== 'speak') return;
        const t = setInterval(() => setLectureTimer(p => p + 1), 1000);
        return () => clearInterval(t);
    }, [step]);

    // Speech setup
    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) return;
        const r = new window.webkitSpeechRecognition();
        r.continuous = true; r.interimResults = true; r.lang = 'en-IN';
        r.onstart = () => setIsListening(true);
        r.onresult = (e) => {
            let final = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                if (e.results[i].isFinal) final += e.results[i][0].transcript;
            }
            if (final) setSpeechText(prev => (prev + ' ' + final).trim());
        };
        r.onerror = r.onend = () => setIsListening(false);
        recognitionRef.current = r;
        r.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) recognitionRef.current.stop();
        setIsListening(false);
    };

    // State Transitions
    const proceedToPrepare = (topic) => {
        setSelectedTopic(topic);
        setStep('prepare');
        setPrepTimer(180); // reset standard 3 min prep
    };

    const proceedToSpeak = async () => {
        setStep('speak');
        setLectureTimer(0);
        setSpeechText('');
        await startMedia();
        startListening();
    };

    const stopSpeakingAndAnalyze = async () => {
        stopListening();
        stopMedia();
        setStep('analyze');
        setLoading(true);
        try {
            const res = await api.post('/lecturette/evaluate', {
                topic: selectedTopic.topic,
                speech_text: speechText,
                duration: lectureTimer
            });
            setReport(res.data);
            setStep('report');
        } catch (e) {
            console.error(e);
            setStep('topics');
            alert("Evaluation failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Views
    if (step === 'topics') {
        return (
            <div className="min-h-screen bg-black text-white pt-24 px-6 flex flex-col items-center">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
                    <MessageSquare className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                    <h1 className="text-3xl font-black font-serif text-yellow-500">LECTURETTE GTO SIMULATOR</h1>
                    <p className="text-xs tracking-wider text-gray-500">Pick 1 topic out of 4 to deliver a 3-minute talk.</p>
                </motion.div>

                {loading ? <Loader2 className="animate-spin w-8 h-8 text-yellow-500 mt-10" /> : (
                    <div className="grid md:grid-cols-2 gap-5 w-full max-w-2xl">
                        {topicList.map((t, idx) => (
                            <motion.button key={t.id} whileHover={{ scale: 1.02 }} onClick={() => proceedToPrepare(t)}
                                className="p-6 rounded-2xl border border-gray-800 bg-gray-900/50 text-left relative group">
                                <div className="absolute top-4 right-4 text-xs bg-gray-800 text-yellow-500 px-2.5 py-1 rounded-full">{t.difficulty}</div>
                                <div className="text-gray-600 text-xs font-bold mb-2">OP-0{idx + 1}</div>
                                <h3 className="font-serif text-xl font-black mb-4 pr-16">{t.topic}</h3>
                                <ul className="space-y-1">
                                    {(t.hints || []).map((h, i) => <li key={i} className="text-xs text-gray-500 flex items-center gap-1.5"><span className="text-yellow-500/50">▸</span> {h}</li>)}
                                </ul>
                                <div className="absolute inset-0 border border-yellow-500/0 group-hover:border-yellow-500/20 transition-all rounded-2xl" />
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (step === 'prepare') {
        const mins = Math.floor(prepTimer / 60);
        const secs = (prepTimer % 60).toString().padStart(2, '0');
        const warning = prepTimer < 30;

        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
                <div className="max-w-lg w-full bg-gray-900 border border-gray-800 rounded-3xl p-8 text-center relative">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-yellow-500 text-black font-black flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm">
                        <Clock className="w-4 h-4"/>
                        {mins}:{secs}
                    </div>
                    <span className="text-xs text-gray-500 uppercase font-black">Preparation Phase</span>
                    <h2 className="text-2xl font-serif font-black text-yellow-500 mt-2 mb-4">"{selectedTopic.topic}"</h2>
                    
                    <div className="bg-black/40 border border-gray-800 rounded-2xl p-4 text-left mb-6 space-y-3">
                        <p className="text-xs font-black uppercase text-gray-600">Lecturette Structure Tips</p>
                        <div className="space-y-2">
                            <div>
                                <span className="text-yellow-500 text-xs font-bold">1. Introduction (30s)</span>
                                <p className="text-xs text-gray-400">Define the core subject and state why it matters.</p>
                            </div>
                            <div>
                                <span className="text-yellow-500 text-xs font-bold">2. Main Body (2 mins)</span>
                                <p className="text-xs text-gray-400">Break into 2-3 structured points (Cause/Effect or Pros/Cons).</p>
                            </div>
                            <div>
                                <span className="text-yellow-500 text-xs font-bold">3. Conclusion (30s)</span>
                                <p className="text-xs text-gray-400">Summarize the solution and give a mature, final judgment.</p>
                            </div>
                        </div>
                    </div>

                    <button onClick={proceedToSpeak} className="w-full font-black py-4 rounded-xl bg-yellow-500 text-black flex items-center justify-center gap-2 hover:bg-yellow-400">
                        <Play className="w-4 h-4" /> Start Delivering Talk
                    </button>
                    {warning && <p className="text-xs text-red-500 mt-2">Short on time! Prepare and start now.</p>}
                </div>
            </div>
        );
    }

    if (step === 'speak') {
        const minsSpeak = Math.floor(lectureTimer / 60);
        const secsSpeak = (lectureTimer % 60).toString().padStart(2, '0');
        const overWait = lectureTimer >= 180;
        const color = lectureTimer >= 150 ? 'text-red-500' : 'text-yellow-500'; // 150s is when bell rings in SSB usually For 30s remaining

        const toggleCam = () => { stream?.getVideoTracks().forEach(t => { t.enabled = !isCamOn; }); setIsCamOn(!isCamOn); };

        return (
            <div className="min-h-screen bg-black text-white pt-20 px-6 flex flex-col items-center">
                <div className="max-w-4xl w-full flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-yellow-500"/><span className="text-sm font-black uppercase font-serif">DELIVERING LECTURETTE</span></div>
                        <div className={`flex items-center gap-1 ${color} font-mono font-black text-xl`}><Clock className="w-4 h-4"/> {minsSpeak}:{secsSpeak} / 3:00</div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-5 flex-1 mb-6">
                        <div className="md:col-span-2 flex flex-col gap-4">
                            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col items-center justify-center flex-1 text-center relative">
                                <span className="text-gray-600 text-xs font-black uppercase">Chosen Topic</span>
                                <h1 className="text-2xl font-serif font-black text-white mb-2">"{selectedTopic.topic}"</h1>
                                <p className="text-xs text-gray-500 max-w-md italic mt-2">"Maintain confident eye posture directly on the lens, assume posture integrity, avoid shifting weight."</p>
                            </div>
                            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                                <p className="text-xs text-gray-400 uppercase font-bold mb-2">Live Transcript</p>
                                <p className={`min-h-[60px] text-sm ${speechText ? 'text-white' : 'text-gray-600 italic'}`}>
                                    {speechText || "Listening to your talk..."}
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden aspect-video relative">
                            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/70 border border-gray-800">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>
                                <span className="text-[10px] font-black">REC</span>
                            </div>
                            <button onClick={toggleCam} className="absolute bottom-3 right-3 p-2 rounded bg-black/60"><Video className="w-4 h-4"/></button>
                        </div>
                    </div>

                    <div className="sticky bottom-6 flex justify-center w-full">
                        <button onClick={stopSpeakingAndAnalyze} className="px-10 py-4 bg-red-500 hover:bg-red-400 text-white rounded-2xl font-black flex items-center gap-2">
                            <Square className="w-4 h-4 fill-white" /> Finish & Analyze
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'analyze') {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
                <h2 className="text-xl font-serif">Grading Lecturette...</h2>
                <p className="text-xs text-gray-500">Cross-comparing structure (Intro-Body-Conclusion) & Content accuracy</p>
            </div>
        );
    }

    if (step === 'report' && report) {
        return (
            <div className="min-h-screen bg-black text-white pt-24 px-6 pb-20 flex flex-col items-center">
                <div className="max-w-3xl w-full">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl text-center p-8 mb-6 relative">
                        <Award className="w-12 h-12 mx-auto text-yellow-500 mb-2" />
                        <h1 className="text-3xl font-serif font-black">ASSESSMENT</h1>
                        <p className={`text-xl font-black mt-1 ${report.recommendation==='Recommended'?'text-green-500':'text-gray-400'}`}>{report.recommendation}</p>
                        <p className="text-4xl font-black text-yellow-500 mt-4">{report.overall_score}<span className="text-xs text-gray-600">/100</span></p>
                        <p className="text-xs text-gray-500 absolute top-4 right-4">Talk length: {lectureTimer}s</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5 mb-6">
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                            <h3 className="text-yellow-500 font-bold uppercase text-xs mb-3 flex items-center gap-1.5"><Star className="w-3.5 h-3.5"/> Structure Quality</h3>
                            <div className="space-y-2 text-sm text-gray-300">
                                <div><span className="font-bold text-gray-400">Intro:</span> {report.structure?.intro}</div>
                                <div><span className="font-bold text-gray-400">Body:</span> {report.structure?.body}</div>
                                <div><span className="font-bold text-gray-400">Conclusion:</span> {report.structure?.conclusion}</div>
                            </div>
                        </div>

                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                            <h3 className="text-yellow-500 font-bold uppercase text-xs mb-3 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5"/> OLQ Module</h3>
                            <div className="space-y-1.5 text-xs text-gray-400">
                                {Object.entries(report.olq_scores || {}).map(([olq, score]) => (
                                    <div key={olq} className="flex justify-between border-b border-gray-800/50 pb-1">
                                        <span>{olq}</span>
                                        <span className="font-bold text-yellow-500">{score}/5</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
                        <h3 className="text-green-500 font-bold uppercase text-xs mb-2">Key Strengths</h3>
                        <ul className="space-y-1.5 text-sm text-gray-300">
                            {(report.strengths || []).map((s,i) => <li key={i} className="flex items-start gap-1"><span className="text-green-500 mt-1">▸</span>{s}</li>)}
                        </ul>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
                        <h3 className="text-red-500 font-bold uppercase text-xs mb-2">Gaps & Actionable Tips</h3>
                        <ul className="space-y-1 text-sm text-gray-300 mb-4">
                            {(report.gaps || []).map((g,i) => <li key={i} className="flex items-start gap-1"><span className="text-red-500 mt-1">▸</span>{g}</li>)}
                        </ul>
                        <div className="bg-black/50 p-4 rounded-xl border border-gray-800">
                            <p className="text-yellow-500 font-black text-xs mb-1">💡 Tips to improve next attempt</p>
                            <p className="text-xs text-gray-400">{(report.tips || []).join(" ")}</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => { setStep('topics'); setReport(null); }} className="flex-1 py-4 border border-gray-800 bg-gray-900 rounded-2xl font-black text-sm flex items-center justify-center gap-2"><RotateCcw className="w-4 h-4"/> Redo</button>
                        <button onClick={() => navigate('/gto-simulator')} className="flex-1 py-4 bg-yellow-500 text-black rounded-2xl font-black text-sm">Dashboard →</button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
