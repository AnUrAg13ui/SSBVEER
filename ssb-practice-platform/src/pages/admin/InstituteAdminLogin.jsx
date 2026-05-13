import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Eye, EyeOff, Lock, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const InstituteAdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
            navigate('/institute-dashboard');
        } catch (err) {
            setError(err?.response?.data?.detail || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, #0a0020 0%, #000 60%)' }}>
            <div className="fixed inset-0 pointer-events-none opacity-20"
                style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
                <div className="flex flex-col items-center mb-10">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
                        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.06))', border: '1px solid rgba(139,92,246,0.3)' }}>
                        <Building2 className="w-9 h-9" style={{ color: '#8b5cf6' }} />
                    </motion.div>
                    <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'Cinzel, serif' }}>
                        INSTITUTE <span style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ADMIN</span>
                    </h1>
                    <p className="text-xs font-bold uppercase tracking-widest mt-2" style={{ color: '#5a5a5a' }}>
                        SSB Practice Platform · Institute Management
                    </p>
                </div>

                <div className="p-8 rounded-3xl" style={{ background: 'rgba(13,13,13,0.95)', border: '1px solid rgba(139,92,246,0.15)', backdropFilter: 'blur(20px)' }}>
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#8b5cf6' }}>Username</label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#4a4a4a' }} />
                                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Admin username"
                                    className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                                    style={{ background: '#111', border: '1.5px solid rgba(255,255,255,0.07)', color: '#e5e5e5' }}
                                    onFocus={e => e.target.style.borderColor = '#8b5cf6'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'} required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#8b5cf6' }}>Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#4a4a4a' }} />
                                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Admin password"
                                    className="w-full pl-10 pr-12 py-3.5 rounded-xl text-sm outline-none transition-all"
                                    style={{ background: '#111', border: '1.5px solid rgba(255,255,255,0.07)', color: '#e5e5e5' }}
                                    onFocus={e => e.target.style.borderColor = '#8b5cf6'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'} required />
                                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1" style={{ color: '#4a4a4a' }}>
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 p-3 rounded-xl text-sm"
                                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                                <Lock className="w-4 h-4 flex-shrink-0" /> {error}
                            </motion.div>
                        )}
                        <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                            className="w-full py-4 rounded-xl font-black text-white text-sm disabled:opacity-60 mt-2"
                            style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', fontFamily: 'Cinzel, serif', letterSpacing: '0.08em' }}>
                            {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />Verifying...</span> : 'ACCESS DASHBOARD →'}
                        </motion.button>
                    </form>
                </div>
                <p className="text-center text-xs mt-6" style={{ color: '#2a2a2a' }}>Credentials provided by your Super Admin.</p>
            </motion.div>
        </div>
    );
};

export default InstituteAdminLogin;
