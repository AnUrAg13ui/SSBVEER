import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, MicOff, Video, VideoOff, MessageSquare, AlertCircle,
    Loader2, Play, Square, ChevronRight, Award, BrainCircuit,
    CheckCircle, Clock, Shield, Activity, Star, Eye, ChevronDown, Plus
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:8000/api';

const OLQRadar = ({ data, keys }) => {
    // simplified radar or simple bar chart
    return (
        <div className="space-y-2">
            {keys.map(k => (
                <div key={k}>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">{k}</span>
                        <span className="text-yellow-500 font-bold">{data[k] || 3}/5</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full">
                        <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${((data[k] || 3)/5)*100}%` }}></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default function Interview() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState('gate'); // gate | preflight | session | report
    const [loading, setLoading] = useState(true);
    
    // Status
    const [piqData, setPiqData] = useState(null);
    const [sdtData, setSdtData] = useState(null);
    const [hasCheckedPrereqs, setHasCheckedPrereqs] = useState(false);

    // Media
    const [stream, setStream] = useState(null);
    const [camReady, setCamReady] = useState(false);
    const [micReady, setMicReady] = useState(false);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);
    const [permError, setPermError] = useState('');
    const videoRef = useRef(null);

    // Interview
    const [questions, setQuestions] = useState([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [followUpDepth, setFollowUpDepth] = useState(0);
    const [currentQuestionText, setCurrentQuestionText] = useState('');
    
    const [answer, setAnswer] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [history, setHistory] = useState([]);
    const [timer, setTimer] = useState(0);
    const [finalReport, setFinalReport] = useState(null);

    const recognitionRef = useRef(null);

    // Check pre-requisites
    useEffect(() => {
        const checkPrereqs = async () => {
            setLoading(true);
            try {
                const piqRes = await api.get('/piq/me');
                if (piqRes.data.exists) setPiqData(piqRes.data.data);
                
                const sdtLocal = localStorage.getItem('sdt_draft');
                if (sdtLocal) {
                    try {
                        const parsed = JSON.parse(sdtLocal);
                        if (parsed.parents && parsed.teachers && parsed.friends && parsed.self_view && parsed.qualities_to_develop) {
                            setSdtData(parsed);
                        }
                    } catch (e) {}
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
                setHasCheckedPrereqs(true);
            }
        };
        checkPrereqs();
    }, []);

    // Timer
    useEffect(() => {
        if (step !== 'session') return;
        const t = setInterval(() => setTimer(p => p + 1), 1000);
        return () => clearInterval(t);
    }, [step]);

    // Speech synthesis
    const speak = (text) => {
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.onend = () => startListening();
        window.speechSynthesis.speak(msg);
    };

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
            if (final) setAnswer(prev => (prev + ' ' + final).trim());
        };
        r.onerror = r.onend = () => setIsListening(false);
        recognitionRef.current = r;
        r.start();
    };

    const stopListening = () => recognitionRef.current?.stop();

    const startMedia = async () => {
        try {
            const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(s);
            setCamReady(true);
            setMicReady(true); // Simplified mic detection
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

    useEffect(() => {
        return () => stopMedia();
    }, [stopMedia]);

    // Actions
    const generateQuestionsAndStart = async () => {
        setStep('preflight');
        setLoading(true);
        try {
            const res = await api.post('/interview/generate-questions', {
                piq: piqData || {},
                sdt: sdtData || {},
                count: 10 // keeping it to 10 for reasonable length
            });
            setQuestions(res.data.questions);
            setCurrentQuestionText(res.data.questions[0]?.question || "Tell me about yourself.");
        } catch (e) {
            console.error(e);
            // Fallback
            setQuestions([{ question: "Tell me about yourself." }]);
            setCurrentQuestionText("Tell me about yourself.");
        } finally {
            setLoading(false);
        }
    };

    const enterSession = () => {
        setStep('session');
        speak(currentQuestionText);
    };

    const captureFrame = () => {
        if (!videoRef.current) return '';
        const c = document.createElement('canvas');
        c.width = videoRef.current.videoWidth;
        c.height = videoRef.current.videoHeight;
        c.getContext('2d').drawImage(videoRef.current, 0, 0);
        return c.toDataURL('image/jpeg').split(',')[1];
    };

    const submitAnswer = async () => {
        stopListening();
        setLoading(true);
        try {
            // Analyze current answer
            const analysis = await api.post('/interview/analyze', {
                question: currentQuestionText, answer, history, facial_image_b64: captureFrame()
            });
            const newHistoryItem = { ...analysis.data, question: currentQuestionText, answer };
            const updatedHistory = [...history, newHistoryItem];
            setHistory(updatedHistory);
            setAnswer('');

            // Follow-up logic (up to 2 follow-ups)
            if (followUpDepth < 2) {
                const fwRes = await api.post('/interview/follow-up', {
                    question: currentQuestionText,
                    answer: answer,
                    depth: followUpDepth + 1
                });
                setFollowUpDepth(prev => prev + 1);
                setCurrentQuestionText(fwRes.data.question);
                speak(fwRes.data.question);
            } else {
                // Next base question
                if (currentQIndex + 1 < questions.length) {
                    const nextQ = questions[currentQIndex + 1].question;
                    setCurrentQIndex(currentQIndex + 1);
                    setFollowUpDepth(0);
                    setCurrentQuestionText(nextQ);
                    speak(nextQ);
                } else {
                    endInterview(updatedHistory);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const endInterview = async (finalHistory = history) => {
        window.speechSynthesis.cancel();
        stopListening();
        stopMedia();
        setStep('report');
        setLoading(true);
        try {
            const res = await api.post('/interview/report', { history: finalHistory });
            setFinalReport(res.data);
            await api.post('/dashboard/save-interview', {
                confidence_score: (res.data.olq_summary?.['Self Confidence'] || 0) * 20,
                clarity_score: (res.data.olq_summary?.['Power of Expression'] || 0) * 20,
                transcript: JSON.stringify(finalHistory),
                feedback: res.data.final_verdict
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // UI Renders
    if (step === 'gate') {
        if (loading || !hasCheckedPrereqs) return <div className="min-h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin w-8 h-8 text-yellow-500"/></div>;
        
        return (
            <div className="min-h-screen pt-24 px-6 bg-black text-white">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-black mb-4 text-center text-yellow-500 font-serif">Your Personal Interview Simulator</h1>
                    <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
                        Experience a realistic SSB interview powered by AI. Questions are crafted specifically for YOU based on your life experiences, just like a real Interviewing Officer would ask.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                        {/* Status Cards */}
                        <div className={`p-6 rounded-2xl border ${piqData ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-lg">PIQ (Personal Information Questionnaire)</h3>
                                {piqData ? <CheckCircle className="text-green-500 w-5 h-5"/> : <AlertCircle className="text-red-500 w-5 h-5" />}
                            </div>
                            <p className="text-sm text-gray-400 mb-4">Your background, achievements, experiences.</p>
                            {!piqData && <Link to="/piq" className="text-red-400 font-bold text-sm hover:underline">Complete PIQ →</Link>}
                        </div>

                        <div className={`p-6 rounded-2xl border ${sdtData ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-lg">SDT (Self Description Test)</h3>
                                {sdtData ? <CheckCircle className="text-green-500 w-5 h-5"/> : <AlertCircle className="text-red-500 w-5 h-5" />}
                            </div>
                            <p className="text-sm text-gray-400 mb-4">How you and others see you.</p>
                            {!sdtData && <Link to="/sdt" className="text-red-400 font-bold text-sm hover:underline">Complete SDT →</Link>}
                        </div>
                    </div>

                    <div className="text-center">
                        <button 
                            disabled={!piqData || !sdtData}
                            onClick={generateQuestionsAndStart}
                            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${piqData && sdtData ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                        >
                            {!piqData || !sdtData ? 'Complete Prerequisites First' : 'Generate Interview & Start →'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'preflight') {
        const waitingForQuestions = questions.length === 0;
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white">
                <div className="w-full max-w-lg rounded-2xl border border-yellow-500/30 bg-gray-900 p-8">
                    <h2 className="text-2xl font-black mb-2 text-yellow-500 font-serif">DEVICE CHECK & PREPARATION</h2>
                    <p className="text-sm text-gray-400 mb-6">We are setting up your interview environment.</p>

                    {waitingForQuestions ? (
                        <div className="py-8 text-center border border-gray-800 rounded-xl mb-6">
                            <BrainCircuit className="w-8 h-8 text-yellow-500 mx-auto animate-pulse mb-3"/>
                            <p className="font-bold text-sm text-gray-300">AI is crafting your personalized questions...</p>
                            <p className="text-xs text-gray-500 mt-1">Based on your PIQ and SDT</p>
                        </div>
                    ) : (
                        <div className="mb-6 space-y-4">
                            <div className="p-4 bg-black rounded-xl border border-gray-800">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-bold">Camera & Mic</span>
                                    {camReady && micReady ? <CheckCircle className="w-4 h-4 text-green-500"/> : <button onClick={startMedia} className="text-sm text-yellow-500 font-bold">Allow Access</button>}
                                </div>
                                <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative">
                                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                                    {!camReady && <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">No Signal</div>}
                                </div>
                                {permError && <p className="text-xs text-red-500 mt-2">{permError}</p>}
                            </div>
                        </div>
                    )}

                    <button 
                        disabled={waitingForQuestions || !camReady || !micReady}
                        onClick={enterSession}
                        className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${(waitingForQuestions || !camReady || !micReady) ? 'bg-gray-800 text-gray-500' : 'bg-yellow-500 text-black'}`}
                    >
                        <Play className="w-4 h-4"/> Start Interview
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'session') {
        const toggleMic = () => { stream?.getAudioTracks().forEach(t => t.enabled = !isMicOn); setIsMicOn(!isMicOn); };
        const toggleCam = () => { stream?.getVideoTracks().forEach(t => t.enabled = !isCamOn); setIsCamOn(!isCamOn); };

        return (
            <div className="min-h-screen bg-black pt-20 px-4 text-white flex flex-col">
                <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-yellow-500"/>
                            <span className="font-bold font-serif">LIVE INTERVIEW</span>
                            {followUpDepth > 0 && <span className="text-xs ml-2 bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">Follow-up {followUpDepth}</span>}
                        </div>
                        <div className="flex gap-4 items-center">
                            <span className="text-yellow-500 font-mono text-lg">{Math.floor(timer/60)}:{(timer%60).toString().padStart(2,'0')}</span>
                            <button onClick={() => endInterview(history)} className="text-red-500 text-sm font-bold border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10">End Early</button>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6 flex-1 mb-6">
                        {/* Question Area */}
                        <div className="lg:col-span-2 flex flex-col gap-4">
                            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 flex-1 flex flex-col justify-center text-center relative">
                                {loading && (
                                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-3xl">
                                        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mb-2"/>
                                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Processing...</p>
                                    </div>
                                )}
                                <MessageSquare className="w-8 h-8 text-yellow-500/30 mx-auto mb-4"/>
                                <h2 className="text-2xl md:text-3xl font-serif text-white">{currentQuestionText}</h2>
                            </div>

                            <div className="bg-black border border-gray-800 rounded-2xl p-6">
                                <p className={`min-h-[80px] text-lg ${answer ? 'text-white' : 'text-gray-500 italic'}`}>
                                    {answer || 'Your answer will appear here...'}
                                    {isListening && <span className="inline-block w-2 h-4 bg-yellow-500 animate-pulse ml-2"/>}
                                </p>
                                <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                                    <button onClick={isListening ? stopListening : startListening}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white' : 'bg-gray-800 text-yellow-500'}`}>
                                        {isListening ? <Square className="w-4 h-4"/> : <Mic className="w-4 h-4"/>}
                                        <span className="font-bold text-sm">{isListening ? 'Stop Listening' : 'Push to Speak'}</span>
                                    </button>

                                    <button onClick={submitAnswer} disabled={!answer.trim() || loading}
                                        className={`px-6 py-2 rounded-xl font-bold flex items-center gap-2 ${(!answer.trim() || loading) ? 'bg-gray-800 text-gray-500' : 'bg-yellow-500 text-black'}`}>
                                        Submit <ChevronRight className="w-4 h-4"/>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Camera Area */}
                        <div className="flex flex-col gap-4">
                            <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video border border-gray-800">
                                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                                <div className="absolute bottom-3 right-3 flex gap-2">
                                    <button onClick={toggleMic} className={`p-2 rounded-lg ${isMicOn ? 'bg-black/60 text-white' : 'bg-red-500 text-white'}`}>
                                        {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                                    </button>
                                    <button onClick={toggleCam} className={`p-2 rounded-lg ${isCamOn ? 'bg-black/60 text-white' : 'bg-red-500 text-white'}`}>
                                        {isCamOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="bg-gray-900 rounded-2xl p-6 flex-1 border border-gray-800">
                                <h3 className="text-yellow-500 font-bold uppercase tracking-wider text-xs mb-4 flex items-center gap-2"><Activity className="w-4 h-4"/> Live Analysis</h3>
                                {history.length > 0 ? (
                                    <OLQRadar data={history[history.length-1]?.olq_ratings || {}} keys={['Self Confidence', 'Power of Expression', 'Reasoning Ability', 'Determination']} />
                                ) : (
                                    <p className="text-xs text-gray-500 text-center mt-10">Awaiting first response...</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'report') {
        if (loading || !finalReport) {
            return (
                <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white space-y-4">
                    <Loader2 className="w-10 h-10 text-yellow-500 animate-spin"/>
                    <h2 className="text-xl font-serif">Compiling Board Report...</h2>
                    <p className="text-gray-500 text-sm">Evaluating {history.length} responses across 15 OLQs.</p>
                </div>
            );
        }

        const recColor = finalReport.recommendation?.includes('Not') ? 'text-red-500' : 'text-green-500';

        return (
            <div className="min-h-screen bg-black pt-24 px-6 pb-20 text-white">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-10 text-center">
                        <Award className="w-12 h-12 text-yellow-500 mx-auto mb-4"/>
                        <h1 className="text-4xl font-serif mb-2">FINAL ASSESSMENT</h1>
                        <p className={`text-2xl font-black ${recColor} mb-6`}>{finalReport.recommendation}</p>
                        
                        <div className="flex justify-center gap-12">
                            <div>
                                <p className="text-5xl font-black text-yellow-500">{finalReport.overall_score}</p>
                                <p className="text-xs text-gray-500 uppercase mt-1">Overall Score</p>
                            </div>
                            <div className="w-px bg-gray-800"></div>
                            <div className="text-left flex flex-col justify-center">
                                <p className="text-sm text-gray-300"><span className="text-gray-500">Duration:</span> {Math.floor(timer/60)}m {(timer%60).toString().padStart(2,'0')}s</p>
                                <p className="text-sm text-gray-300"><span className="text-gray-500">Questions:</span> {history.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                            <h3 className="font-bold text-green-500 mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Main Strengths</h3>
                            <ul className="space-y-2 text-sm text-gray-300">
                                {finalReport.strengths?.map((s,i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                            <h3 className="font-bold text-red-500 mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Areas for Improvement</h3>
                            <ul className="space-y-2 text-sm text-gray-300">
                                {finalReport.weaknesses?.map((w,i) => <li key={i}>{w}</li>)}
                            </ul>
                        </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl mb-6">
                        <h3 className="font-bold text-yellow-500 mb-4 flex flex-col">Psychologist & IO Remarks</h3>
                        <p className="text-sm text-gray-300 italic mb-4">"{finalReport.io_remarks}"</p>
                        <p className="text-sm text-gray-300 italic">"{finalReport.psychologist_remarks}"</p>
                        <p className="text-sm text-gray-300 italic">"{finalReport.appearance_remarks}"</p>
                        <div className="mt-4 pt-4 border-t border-gray-800 text-sm text-gray-400">
                            {finalReport.final_verdict}
                        </div>
                    </div>

                    <div className="flex justify-center mt-8">
                         <button onClick={() => navigate('/dashboard')} className="bg-yellow-500 text-black px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-yellow-400">
                            Back to Dashboard <ChevronRight className="w-4 h-4"/>
                         </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
