import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
    success: <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />,
    error: <AlertCircle className="w-4 h-4" style={{ color: '#ef4444' }} />,
    info: <Info className="w-4 h-4" style={{ color: '#f5a623' }} />,
};

const BORDERS = {
    success: 'rgba(34,197,94,0.3)',
    error: 'rgba(239,68,68,0.3)',
    info: 'rgba(245,166,35,0.3)',
};

let toastId = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const toast = useCallback((message, type = 'info', duration = 3500) => {
        setToasts(prev => {
            if (prev.some(t => t.message === message)) return prev;
            const id = ++toastId;
            setTimeout(() => setToasts(curr => curr.filter(t => t.id !== id)), duration);
            return [...prev, { id, message, type }];
        });
    }, []);

    const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none" style={{ minWidth: '280px', maxWidth: '420px' }}>
                <AnimatePresence>
                    {toasts.map(t => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 16, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl pointer-events-auto"
                            style={{
                                background: '#111',
                                border: `1px solid ${BORDERS[t.type]}`,
                                boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                            }}
                        >
                            {ICONS[t.type]}
                            <span className="text-sm font-semibold text-white flex-1">{t.message}</span>
                            <button onClick={() => remove(t.id)} className="p-0.5 rounded-lg transition-colors" style={{ color: '#5a5a5a' }}>
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};
