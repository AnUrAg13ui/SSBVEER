import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Clock, LogOut, RefreshCw } from 'lucide-react';

/**
 * SessionWarningModal
 * Shows a countdown modal when the session is about to expire.
 * Props:
 *   visible      (bool)   – whether to show the modal
 *   secondsLeft  (number) – seconds until auto-logout
 *   onStayIn     (fn)     – called when user clicks "Stay Logged In"
 *   onLogout     (fn)     – called when user clicks "Log Out Now"
 */
export default function SessionWarningModal({ visible, secondsLeft, onStayIn, onLogout }) {
    const pct = Math.max(0, Math.min(100, (secondsLeft / 120) * 100)); // 120s = 2 min warning window
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;

    // Animated ring
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - pct / 100);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.75)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '1rem',
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.88, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 10 }}
                        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
                        style={{
                            background: 'linear-gradient(145deg, #0f0f0f, #181818)',
                            border: '1px solid rgba(245,166,35,0.25)',
                            borderRadius: '1.25rem',
                            boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(245,166,35,0.05)',
                            padding: '2.5rem 2rem',
                            maxWidth: '380px',
                            width: '100%',
                            textAlign: 'center',
                        }}
                    >
                        {/* Icon Badge */}
                        <div style={{
                            display: 'flex', justifyContent: 'center', marginBottom: '1.5rem',
                        }}>
                            <div style={{ position: 'relative', width: 88, height: 88 }}>
                                {/* SVG countdown ring */}
                                <svg width={88} height={88} style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
                                    <circle cx={44} cy={44} r={radius} fill="none" stroke="rgba(245,166,35,0.1)" strokeWidth={5} />
                                    <motion.circle
                                        cx={44} cy={44} r={radius}
                                        fill="none"
                                        stroke={secondsLeft <= 30 ? '#ef4444' : '#f5a623'}
                                        strokeWidth={5}
                                        strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        animate={{ strokeDashoffset: dashOffset }}
                                        transition={{ duration: 0.5, ease: 'linear' }}
                                    />
                                </svg>
                                {/* Center icon */}
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <div style={{
                                        background: secondsLeft <= 30 ? 'rgba(239,68,68,0.12)' : 'rgba(245,166,35,0.1)',
                                        borderRadius: '50%',
                                        width: 52, height: 52,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'background 0.4s',
                                    }}>
                                        <Clock style={{ color: secondsLeft <= 30 ? '#ef4444' : '#f5a623', width: 24, height: 24 }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Heading */}
                        <h2 style={{
                            fontFamily: 'Cinzel, Georgia, serif',
                            fontSize: '1.2rem',
                            fontWeight: 700,
                            color: '#fff',
                            marginBottom: '0.5rem',
                            letterSpacing: '0.05em',
                        }}>
                            Session Expiring Soon
                        </h2>

                        {/* Countdown */}
                        <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '0.75rem', lineHeight: 1.6 }}>
                            You will be automatically logged out in
                        </p>
                        <motion.div
                            key={secondsLeft}
                            initial={{ scale: 1.15, opacity: 0.6 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{
                                fontSize: '2.5rem',
                                fontWeight: 800,
                                color: secondsLeft <= 30 ? '#ef4444' : '#f5a623',
                                fontVariantNumeric: 'tabular-nums',
                                fontFamily: 'monospace',
                                marginBottom: '1.5rem',
                                transition: 'color 0.4s',
                            }}
                        >
                            {timeStr}
                        </motion.div>

                        {/* Reason note */}
                        <p style={{
                            color: '#6b7280',
                            fontSize: '0.78rem',
                            marginBottom: '1.75rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}>
                            <Shield style={{ width: 13, height: 13, color: '#374151' }} />
                            For your security, inactive sessions expire automatically.
                        </p>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                id="session-logout-btn"
                                onClick={onLogout}
                                style={{
                                    flex: 1,
                                    padding: '0.65rem 1rem',
                                    borderRadius: '0.65rem',
                                    border: '1px solid rgba(239,68,68,0.3)',
                                    background: 'rgba(239,68,68,0.08)',
                                    color: '#ef4444',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.16)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                            >
                                <LogOut style={{ width: 14, height: 14 }} />
                                Log Out
                            </button>
                            <button
                                id="session-stay-btn"
                                onClick={onStayIn}
                                style={{
                                    flex: 1.6,
                                    padding: '0.65rem 1rem',
                                    borderRadius: '0.65rem',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #f5a623, #e8920f)',
                                    color: '#000',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    boxShadow: '0 4px 14px rgba(245,166,35,0.35)',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <RefreshCw style={{ width: 14, height: 14 }} />
                                Stay Logged In
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
