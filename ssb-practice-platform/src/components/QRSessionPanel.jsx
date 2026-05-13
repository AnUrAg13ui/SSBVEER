import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, WifiOff } from 'lucide-react';
import api from '../api';

const FRONTEND_BASE = window.location.origin;
const UPLOAD_WINDOW_SECONDS = 30;

/**
 * QRSessionPanel — "Upload Window" mode
 * ───────────────────────────────────────
 * This component is ONLY mounted when the upload window is active
 * (i.e. after the 4-minute PPDT writing phase ends).
 *
 * On mount it:
 *  1. Connects the WebSocket
 *  2. Immediately starts the 30-second countdown
 *  3. Shows a full-screen urgent upload prompt with QR code
 *
 * After 30 seconds (or after a successful upload) it closes the WS.
 *
 * Props:
 *   category – 'PPDT' | 'WAT' | 'SRT'  (for labelling)
 */
const QRSessionPanel = ({ category, onUploadSuccess, onClose }) => {
    const [sessionId] = useState(() => crypto.randomUUID());
    const [uploadToken, setUploadToken] = useState(null);
    const [uploadedUrl, setUploadedUrl] = useState(null);
    const [countdown, setCountdown] = useState(UPLOAD_WINDOW_SECONDS);
    const [wsStatus, setWsStatus] = useState('connecting'); // connecting | open | closed | ended

    const wsRef = useRef(null);
    const closedRef = useRef(false);

    // mobileUrl will include the upload token once registered
    const mobileUrl = uploadToken
        ? `${FRONTEND_BASE}/mobile/${sessionId}?token=${uploadToken}`
        : `${FRONTEND_BASE}/mobile/${sessionId}`;

    // ── WebSocket URL Construction ─────────────────────────────────────────────
    const baseApi = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api`;
    const wsProto = baseApi.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = baseApi.replace(/^https?/, wsProto) + `/session/ws/${sessionId}`;
    const catColor = { PPDT: '#e8963d', WAT: '#d9883a', SRT: '#c87a35' }[category] || '#f5a623';

    const closeSession = () => {
        if (closedRef.current) return;
        closedRef.current = true;
        wsRef.current?.close();
        setWsStatus('ended');
    };

    // ── Register session to get upload token ───────────────────────────────────
    useEffect(() => {
        api.post(`/session/register/${sessionId}`)
            .then(res => setUploadToken(res.data.upload_token))
            .catch(() => {}); // non-fatal; QR code still works but upload will be rejected
    }, [sessionId]);

    // ── Connect WebSocket on mount ─────────────────────────────────────────────
    useEffect(() => {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => setWsStatus('open');
        ws.onclose = () => { if (!closedRef.current) setWsStatus('closed'); };
        ws.onerror = () => ws.close();
        ws.onmessage = (evt) => {
            try {
                const data = JSON.parse(evt.data);
                if (data.type === 'image_uploaded' && data.image_url) {
                    const backendBase = baseApi.replace('/api', '');
                    const fullUrl = `${backendBase}${data.image_url}`;
                    setUploadedUrl(fullUrl);
                    if (onUploadSuccess) onUploadSuccess(fullUrl, data.extracted_text || '');
                    closeSession();
                    
                    // Auto-close success panel after 2 seconds
                    setTimeout(() => {
                        if (onClose) onClose();
                    }, 2000);
                }
            } catch (_) {}
        };

        return () => {
            closedRef.current = true;
            ws.close();
        };
    }, []);

    // ── 30-second countdown — starts immediately on mount ─────────────────────
    useEffect(() => {
        if (uploadedUrl) return; // don't tick if already uploaded

        const tick = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(tick);
                    closeSession();
                    
                    // Auto-close expired panel after 1 second
                    setTimeout(() => {
                        if (onClose) onClose();
                    }, 1000);
                    
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(tick);
    }, [uploadedUrl, onClose]);

    const isEnded = wsStatus === 'ended' && !uploadedUrl;
    const pct = countdown / UPLOAD_WINDOW_SECONDS;
    const r = 36;
    const circ = 2 * Math.PI * r;

    return (
        <div className="fixed bottom-8 right-8 z-50">
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 40, scale: 0.9 }}
                    transition={{ type: "spring", damping: 20, stiffness: 100 }}
                    className="rounded-[32px] overflow-hidden"
                    style={{
                        background: 'rgba(15, 15, 15, 0.85)',
                        backdropFilter: 'blur(20px)',
                        border: uploadedUrl
                            ? '1px solid rgba(34,197,94,0.3)'
                            : isEnded
                                ? '1px solid rgba(255,255,255,0.1)'
                                : `1px solid ${catColor}40`,
                        width: '320px',
                        boxShadow: uploadedUrl
                            ? '0 20px 80px rgba(0,0,0,0.8), 0 0 30px rgba(34,197,94,0.1)'
                            : isEnded
                                ? '0 20px 80px rgba(0,0,0,0.6)'
                                : `0 20px 80px rgba(0,0,0,0.8), 0 0 40px ${catColor}15`,
                    }}
                >
                    {/* Top Accent Line */}
                    <div className="h-1.5 w-full" style={{
                        background: uploadedUrl
                            ? 'linear-gradient(90deg, #22c55e, #10b981)'
                            : isEnded
                                ? '#333'
                                : `linear-gradient(90deg, ${catColor}, #ff8c00)`,
                    }} />

                    <div className="p-7">
                        {/* ── SUCCESS STATE ── */}
                        {uploadedUrl ? (
                            <div className="text-center py-4">
                                <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </motion.div>
                                <h3 className="font-black text-white text-lg mb-2" style={{ fontFamily: 'Cinzel, serif' }}>RECEIVED</h3>
                                <p className="text-xs text-gray-500 mb-6 px-4 leading-relaxed">
                                    Your handwritten story is safely uploaded for evaluation.
                                </p>
                                <div className="relative rounded-2xl overflow-hidden border border-white/10 group">
                                    <img src={uploadedUrl} alt="Uploaded" className="w-full aspect-[4/3] object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                </div>
                            </div>

                        /* ── EXPIRED STATE ── */
                        ) : isEnded ? (
                            <div className="text-center py-6">
                                <WifiOff className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                                <h3 className="font-black text-white text-lg mb-2" style={{ fontFamily: 'Cinzel, serif' }}>WINDOW CLOSED</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    The 30-second window has expired. Please type your answer manually.
                                </p>
                            </div>

                        /* ── ACTIVE SCAN STATE ── */
                        ) : (
                            <>
                                <div className="flex items-center gap-5 mb-8">
                                    <div className="relative flex-shrink-0">
                                        <svg width={72} height={72} className="-rotate-90">
                                            <circle cx={36} cy={36} r={32} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                                            <motion.circle 
                                                cx={36} cy={36} r={32} fill="none" stroke={catColor} strokeWidth="4"
                                                strokeDasharray={201}
                                                strokeDashoffset={201 * (1 - pct)}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="font-black text-xl text-white font-mono">{countdown}</span>
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: catColor }}>Mobile Upload</h4>
                                        <p className="text-[11px] leading-tight text-gray-400 font-bold">Scan to submit handwritten story</p>
                                    </div>
                                </div>

                                <div className="relative flex justify-center mb-8">
                                    {/* QR Scanner Aesthetic */}
                                    <div className="absolute -inset-4 border border-white/5 rounded-[40px] pointer-events-none" />
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 rounded-tl-2xl pointer-events-none" style={{ borderColor: catColor }} />
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 rounded-tr-2xl pointer-events-none" style={{ borderColor: catColor }} />
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 rounded-bl-2xl pointer-events-none" style={{ borderColor: catColor }} />
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 rounded-br-2xl pointer-events-none" style={{ borderColor: catColor }} />

                                    <div className="p-3 bg-white rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.1)] group relative">
                                        <QRCodeSVG
                                            value={mobileUrl}
                                            size={160}
                                            level="H"
                                            includeMargin={false}
                                        />
                                        {/* Scanning line animation */}
                                        <motion.div 
                                            animate={{ top: ['0%', '100%', '0%'] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                            className="absolute left-0 right-0 h-0.5 bg-amber-500/50 shadow-[0_0_15px_rgba(245,166,35,0.8)] z-10 pointer-events-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <motion.div 
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="w-2 h-2 rounded-full" 
                                            style={{ background: wsStatus === 'open' ? '#22c55e' : '#f5a623' }} 
                                        />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                            {wsStatus === 'open' ? 'Ready for scan' : 'Connecting Link...'}
                                        </span>
                                    </div>
                                    <div className="w-full h-px bg-white/5" />
                                    <p className="text-[9px] text-gray-700 font-mono break-all text-center px-4">
                                        ID: {sessionId.slice(0, 8)}...
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default QRSessionPanel;
