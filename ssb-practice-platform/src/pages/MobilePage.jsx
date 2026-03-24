import { useState, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, CheckCircle, AlertCircle, Loader2, Shield } from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:8000`;

const MobilePage = () => {
    const { sessionId } = useParams();
    const [searchParams] = useSearchParams();
    const uploadToken = searchParams.get('token');
    const [status, setStatus] = useState('idle'); // idle | uploading | done | error
    const [preview, setPreview] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const fileRef = useRef(null);
    const cameraRef = useRef(null);

    const handleFile = async (file) => {
        if (!file) return;
        if (!uploadToken) {
            setStatus('error');
            setErrorMsg('Invalid session link. Please scan the QR code again.');
            return;
        }
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        setStatus('uploading');

        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch(
                `${API_BASE}/api/session/upload/${sessionId}?upload_token=${encodeURIComponent(uploadToken)}`,
                { method: 'POST', body: formData }
            );
            if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
            setStatus('done');
        } catch (err) {
            setStatus('error');
            setErrorMsg(err.message || 'Upload failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6"
            style={{ background: '#000', fontFamily: 'Inter, sans-serif' }}>

            {/* Logo */}
            <div className="flex items-center gap-2 mb-10">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #f5a623, #c8841a)' }}>
                    <Shield className="w-5 h-5 text-black" />
                </div>
                <span className="text-lg font-black tracking-widest text-white uppercase"
                    style={{ fontFamily: 'Cinzel, serif' }}>
                    SSB<span style={{ color: '#f5a623' }}>PREP</span>
                </span>
            </div>

            <AnimatePresence mode="wait">
                {/* ── DONE ── */}
                {status === 'done' && (
                    <motion.div key="done"
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-sm text-center rounded-3xl p-8"
                        style={{ background: '#0e0e0e', border: '1px solid rgba(34,197,94,0.25)' }}>
                        <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#22c55e' }} />
                        <h2 className="text-xl font-black text-white mb-2">Uploaded!</h2>
                        <p className="text-sm" style={{ color: '#5a5a5a' }}>
                            Your image has been sent to the laptop session. You can close this page.
                        </p>
                        {preview && (
                            <img src={preview} alt="Uploaded"
                                className="w-full mt-6 rounded-2xl object-cover max-h-48" />
                        )}
                    </motion.div>
                )}

                {/* ── ERROR ── */}
                {status === 'error' && (
                    <motion.div key="error"
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-sm text-center rounded-3xl p-8"
                        style={{ background: '#0e0e0e', border: '1px solid rgba(239,68,68,0.25)' }}>
                        <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#ef4444' }} />
                        <h2 className="text-xl font-black text-white mb-2">Upload Failed</h2>
                        <p className="text-sm mb-6" style={{ color: '#5a5a5a' }}>{errorMsg}</p>
                        <button onClick={() => { setStatus('idle'); setPreview(null); }}
                            className="w-full py-3 rounded-xl font-black text-sm text-black"
                            style={{ background: '#f5a623' }}>
                            Try Again
                        </button>
                    </motion.div>
                )}

                {/* ── UPLOADING ── */}
                {status === 'uploading' && (
                    <motion.div key="uploading"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="w-full max-w-sm text-center rounded-3xl p-8"
                        style={{ background: '#0e0e0e', border: '1px solid rgba(245,166,35,0.2)' }}>
                        <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: '#f5a623' }} />
                        <h2 className="text-lg font-black text-white mb-2">Sending…</h2>
                        {preview && (
                            <img src={preview} alt="Preview"
                                className="w-full mt-4 rounded-2xl object-cover max-h-48 opacity-50" />
                        )}
                    </motion.div>
                )}

                {/* ── IDLE ── */}
                {status === 'idle' && (
                    <motion.div key="idle"
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-sm rounded-3xl overflow-hidden"
                        style={{ background: '#0e0e0e', border: '1px solid rgba(245,166,35,0.18)', boxShadow: '0 0 60px rgba(245,166,35,0.06)' }}>

                        {/* Gold top accent */}
                        <div className="h-1 w-full"
                            style={{ background: 'linear-gradient(90deg, transparent, #f5a623, transparent)' }} />

                        <div className="p-8">
                            <h1 className="text-2xl font-black text-white mb-1 text-center"
                                style={{ fontFamily: 'Cinzel, serif' }}>
                                Upload Your Answer
                            </h1>
                            <p className="text-xs text-center mb-8" style={{ color: '#5a5a5a' }}>
                                Capture a photo or upload from gallery.
                            </p>

                            {/* Camera capture */}
                            <input ref={cameraRef} type="file" accept="image/*"
                                capture="environment" className="hidden"
                                onChange={e => handleFile(e.target.files?.[0])} />

                            <button onClick={() => cameraRef.current?.click()}
                                className="w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-black text-base mb-3 transition-all active:scale-95"
                                style={{ background: '#f5a623', boxShadow: '0 8px 24px rgba(245,166,35,0.3)' }}>
                                <Camera className="w-5 h-5" />
                                Take Photo
                            </button>

                            {/* File picker fallback */}
                            <input ref={fileRef} type="file" accept="image/*,application/pdf"
                                className="hidden"
                                onChange={e => handleFile(e.target.files?.[0])} />

                            <button onClick={() => fileRef.current?.click()}
                                className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-sm transition-all active:scale-95"
                                style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', color: '#f5a623' }}>
                                <Upload className="w-4 h-4" />
                                Choose from Gallery
                            </button>

                            <p className="text-center text-xs mt-5" style={{ color: '#3a3a3a' }}>
                                Session: <span style={{ color: '#5a5a5a' }}>{sessionId?.slice(0, 8)}…</span>
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MobilePage;
