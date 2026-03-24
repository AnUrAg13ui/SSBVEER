import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Lock, User } from 'lucide-react';

const API = 'http://localhost:8000/api';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'Invalid admin credentials. Access denied.');
            }
            const data = await res.json();
            sessionStorage.setItem('admin_token', data.access_token);
            navigate('/admin/panel');
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, #1a0a00 0%, #000 60%)' }}>

            {/* Background grid */}
            <div className="fixed inset-0 pointer-events-none opacity-20"
                style={{ backgroundImage: 'linear-gradient(rgba(245,166,35,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(245,166,35,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="w-full max-w-md">

                {/* Shield logo */}
                <div className="flex flex-col items-center mb-10">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4 pulse-glow"
                        style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.2), rgba(245,166,35,0.06))', border: '1px solid rgba(245,166,35,0.3)' }}>
                        <Shield className="w-9 h-9" style={{ color: '#f5a623' }} />
                    </motion.div>
                    <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'Cinzel, serif' }}>
                        ADMIN <span className="gold-gradient-text">PORTAL</span>
                    </h1>
                    <p className="text-xs font-bold uppercase tracking-widest mt-2" style={{ color: '#5a5a5a' }}>
                        SSB Practice Platform · Restricted Access
                    </p>
                </div>

                {/* Form card */}
                <div className="p-8 rounded-3xl" style={{ background: 'rgba(13,13,13,0.95)', border: '1px solid rgba(245,166,35,0.15)', backdropFilter: 'blur(20px)' }}>
                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Username */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#f5a623' }}>
                                Username
                            </label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#4a4a4a' }} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="Admin username"
                                    autoComplete="username"
                                    className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                                    style={{ background: '#111', border: '1.5px solid rgba(255,255,255,0.07)', color: '#e5e5e5' }}
                                    onFocus={e => e.target.style.borderColor = '#f5a623'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#f5a623' }}>
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#4a4a4a' }} />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Admin password"
                                    autoComplete="current-password"
                                    className="w-full pl-10 pr-12 py-3.5 rounded-xl text-sm outline-none transition-all"
                                    style={{ background: '#111', border: '1.5px solid rgba(255,255,255,0.07)', color: '#e5e5e5' }}
                                    onFocus={e => e.target.style.borderColor = '#f5a623'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                                    required
                                />
                                <button type="button" onClick={() => setShowPass(s => !s)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 transition-colors"
                                    style={{ color: '#4a4a4a' }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#f5a623'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#4a4a4a'}>
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 p-3 rounded-xl text-sm"
                                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                                <Lock className="w-4 h-4 flex-shrink-0" /> {error}
                            </motion.div>
                        )}

                        <motion.button type="submit" disabled={loading}
                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                            className="w-full py-4 rounded-xl font-black text-black text-sm btn-gold disabled:opacity-60 mt-2"
                            style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.08em' }}>
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                    Verifying...
                                </span>
                            ) : 'ACCESS ADMIN PANEL →'}
                        </motion.button>
                    </form>
                </div>

                <p className="text-center text-xs mt-6" style={{ color: '#2a2a2a' }}>
                    Unauthorized access attempts are logged.
                </p>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
