import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, WifiOff } from 'lucide-react';
import api from '../api';

const FRONTEND_BASE = `http://${window.location.hostname}:5173`;
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
const QRSessionPanel = ({ category }) => {
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
    const wsUrl = `ws://${window.location.hostname}:8000/api/session/ws/${sessionId}`;
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
                    setUploadedUrl(`http://${window.location.hostname}:8000${data.image_url}`);
                    closeSession();
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
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(tick);
    }, [uploadedUrl]);

    const isEnded = wsStatus === 'ended' && !uploadedUrl;
    const pct = countdown / UPLOAD_WINDOW_SECONDS;
    const r = 36;
    const circ = 2 * Math.PI * r;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 24, scale: 0.92 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-3xl overflow-hidden shadow-2xl"
                    style={{
                        background: '#0e0e0e',
                        border: uploadedUrl
                            ? '1px solid rgba(34,197,94,0.3)'
                            : isEnded
                                ? '1px solid rgba(255,255,255,0.08)'
                                : '1px solid rgba(239,68,68,0.35)',
                        width: '290px',
                        boxShadow: uploadedUrl
                            ? '0 20px 60px rgba(0,0,0,0.7)'
                            : isEnded
                                ? '0 20px 60px rgba(0,0,0,0.5)'
                                : '0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(239,68,68,0.12)',
                    }}
                >
                    {/* Top bar */}
                    <div className="h-1 w-full" style={{
                        background: uploadedUrl
                            ? 'linear-gradient(90deg, transparent, #22c55e, transparent)'
                            : isEnded
                                ? 'linear-gradient(90deg, transparent, #3a3a3a, transparent)'
                                : 'linear-gradient(90deg, transparent, #ef4444, transparent)',
                    }} />

                    <div className="p-5">

                        {/* ── SUCCESS ── */}
                        {uploadedUrl ? (
                            <div className="text-center">
                                <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: '#22c55e' }} />
                                <p className="font-black text-white text-base mb-1">Image Received!</p>
                                <p className="text-xs mb-4" style={{ color: '#5a5a5a' }}>
                                    Your handwritten answer has been sent to the evaluator.
                                </p>
                                <img
                                    src={uploadedUrl}
                                    alt="Uploaded answer"
                                    className="w-full rounded-2xl object-cover max-h-40"
                                    style={{ border: '1px solid rgba(34,197,94,0.2)' }}
                                />
                            </div>

                        /* ── WINDOW CLOSED ── */
                        ) : isEnded ? (
                            <div className="text-center py-3">
                                <WifiOff className="w-9 h-9 mx-auto mb-3" style={{ color: '#3a3a3a' }} />
                                <p className="font-black text-white text-sm mb-1">Upload Window Closed</p>
                                <p className="text-xs" style={{ color: '#4a4a4a' }}>
                                    The 30-second window has ended. Session disconnected.
                                </p>
                            </div>

                        /* ── ACTIVE COUNTDOWN + QR ── */
                        ) : (
                            <>
                                {/* Countdown ring + label */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="relative flex-shrink-0">
                                        <svg width={88} height={88} style={{ transform: 'rotate(-90deg)' }}>
                                            <circle cx={44} cy={44} r={r} fill="none"
                                                stroke="rgba(239,68,68,0.12)" strokeWidth="5" />
                                            <circle cx={44} cy={44} r={r} fill="none"
                                                stroke="#ef4444" strokeWidth="5"
                                                strokeDasharray={circ}
                                                strokeDashoffset={circ * (1 - pct)}
                                                strokeLinecap="round"
                                                style={{ transition: 'stroke-dashoffset 0.9s linear' }}
                                            />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center font-mono font-black text-2xl"
                                            style={{ color: '#ef4444' }}>{countdown}</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest mb-1"
                                            style={{ color: '#ef4444' }}>Upload Now!</p>
                                        <p className="text-xs leading-relaxed" style={{ color: '#5a5a5a' }}>
                                            Scan the QR code with your phone and upload your handwritten {category} answer.
                                        </p>
                                    </div>
                                </div>

                                {/* QR Code */}
                                <div className="flex justify-center mb-3">
                                    <div className="p-2.5 rounded-2xl" style={{ background: '#fff' }}>
                                        <QRCodeSVG
                                            value={mobileUrl}
                                            size={170}
                                            bgColor="#ffffff"
                                            fgColor="#000000"
                                            level="M"
                                        />
                                    </div>
                                </div>

                                {/* WS status */}
                                <div className="flex items-center justify-center gap-1.5 mb-2">
                                    <span className="w-1.5 h-1.5 rounded-full"
                                        style={{ background: wsStatus === 'open' ? '#22c55e' : '#f5a623' }} />
                                    <span className="text-xs" style={{ color: '#4a4a4a' }}>
                                        {wsStatus === 'open' ? 'Waiting for mobile upload…' : 'Connecting…'}
                                    </span>
                                </div>

                                <p className="text-center text-xs break-all" style={{ color: '#2a2a2a' }}>
                                    {mobileUrl}
                                </p>
                            </>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default QRSessionPanel;
