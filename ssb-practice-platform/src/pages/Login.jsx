import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, LogIn, AlertCircle, Eye, EyeOff, ArrowLeft, Shield, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, googleLogin, googleLoginCode } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const from = location.state?.from || '/dashboard';
    const sessionExpired  = new URLSearchParams(location.search).get('expired')  === '1';
    const sessionInactive = new URLSearchParams(location.search).get('inactive') === '1';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        // Client-side validation
        if (!username.trim()) { setError('Username is required.'); return; }
        if (!password.trim()) { setError('Password is required.'); return; }
        if (password.length < 4) { setError('Password must be at least 4 characters.'); return; }

        setLoading(true);
        try {
            await login(username.trim(), password);
            toast('Welcome back! Redirecting...', 'success', 2000);
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (codeResponse) => {
            try {
                setLoading(true);
                await googleLoginCode(codeResponse.code);
                toast('Welcome back! Redirecting...', 'success', 2000);
                navigate(from, { replace: true });
            } catch (err) {
                setError('Google Sign-In failed: ' + (err.response?.data?.detail || err.message));
            } finally {
                setLoading(false);
            }
        },
        onError: () => setError('Google Sign-In error.'),
        flow: 'auth-code',
    });

    return (
        <div className="min-h-screen flex" style={{ background: '#000' }}>

            {/* Left – Decorative Panel */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center p-20" style={{ background: 'linear-gradient(160deg, #0a0800 0%, #000 60%)' }}>
                {/* Dot grid */}
                <div className="absolute inset-0 dot-pattern opacity-80" />

                {/* Large gold glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.1) 0%, transparent 70%)' }} />

                {/* Content */}
                <div className="relative z-10 text-center max-w-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.88 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.9 }}
                        className="floating"
                    >
                        <div className="w-24 h-24 rounded-2xl mx-auto mb-10 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f5a623, #c8841a)', boxShadow: '0 20px 60px rgba(245,166,35,0.3)' }}>
                            <Shield className="w-12 h-12 text-black" />
                        </div>
                        <h2 className="text-5xl font-black text-white mb-5" style={{ fontFamily: 'Cinzel, serif', lineHeight: 1.15 }}>
                            WELCOME<br />
                            <span className="gold-gradient-text">BACK</span>
                        </h2>
                        <p className="text-base leading-relaxed italic" style={{ color: '#5a5a5a' }}>
                            "The uniform is not just a piece of cloth,<br />it is a responsibility."
                        </p>
                        <div className="mt-10 flex justify-center gap-6">
                            {['OIR', 'PPDT', 'WAT', 'SRT', 'GTO', 'PI'].map(tag => (
                                <span key={tag} className="text-xs font-black tracking-widest" style={{ color: 'rgba(245,166,35,0.35)' }}>{tag}</span>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Bottom ornament */}
                <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,166,35,0.3), transparent)' }} />
            </div>

            {/* Right – Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8" style={{ background: '#000' }}>
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    {/* Back link */}
                    <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold mb-12 transition-colors hover:text-amber-400" style={{ color: '#5a5a5a' }}>
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>

                    {/* Header */}
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Star className="w-4 h-4" style={{ color: '#f5a623' }} />
                            <span className="text-xs font-black tracking-widest uppercase" style={{ color: '#f5a623' }}>SSBPrep Platform</span>
                        </div>
                        <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Cinzel, serif' }}>Sign In</h1>
                        <p className="text-sm" style={{ color: '#5a5a5a' }}>Continue your journey to earn the uniform.</p>
                    </div>

                    {/* Alert banners */}
                    {sessionInactive && (
                        <div className="mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-bold" style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.25)', color: '#f5a623' }}>
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            You were logged out due to inactivity. Please sign in again.
                        </div>
                    )}
                    {!sessionInactive && sessionExpired && (
                        <div className="mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-bold" style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', color: '#eab308' }}>
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            Session expired. Please sign in again.
                        </div>
                    )}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-bold" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-black tracking-widest uppercase mb-2" style={{ color: '#5a5a5a' }}>Username</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#4a4a4a' }} />
                                <input
                                    type="text"
                                    required
                                    className="w-full py-4 pl-11 pr-4 rounded-xl text-white placeholder:text-gray-700 text-sm font-medium transition-all focus:outline-none"
                                    style={{ background: '#111', border: '1px solid rgba(245,166,35,0.15)', transition: 'border-color 0.2s' }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(245,166,35,0.5)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(245,166,35,0.15)'}
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black tracking-widest uppercase mb-2" style={{ color: '#5a5a5a' }}>Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#4a4a4a' }} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="w-full py-4 pl-11 pr-12 rounded-xl text-white placeholder:text-gray-700 text-sm font-medium transition-all focus:outline-none"
                                    style={{ background: '#111', border: '1px solid rgba(245,166,35,0.15)', transition: 'border-color 0.2s' }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(245,166,35,0.5)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(245,166,35,0.15)'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: '#4a4a4a' }}>
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-xl font-black text-base text-black flex items-center justify-center gap-3 transition-all active:scale-97"
                            style={{ background: loading ? 'rgba(245,166,35,0.5)' : '#f5a623', fontFamily: 'Cinzel, serif', boxShadow: '0 8px 24px rgba(245,166,35,0.25)', cursor: loading ? 'not-allowed' : 'pointer' }}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : (
                                <>Sign In <LogIn className="w-5 h-5" /></>
                            )}
                        </button>
                    </form>

                    <div className="my-6 flex items-center gap-4">
                        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
                        <span className="text-xs font-bold" style={{ color: '#4a4a4a' }}>OR</span>
                        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    </div>

                    <div className="flex justify-center w-full">
                        <button
                            type="button"
                            onClick={() => handleGoogleLogin()}
                            disabled={loading}
                            className="w-full py-4 rounded-xl font-bold text-sm bg-white text-black flex items-center justify-center gap-3 transition-colors hover:bg-gray-100 disabled:opacity-50"
                        >
                            <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-5 h-5" />
                            Sign in with Google
                        </button>
                    </div>

                    <p className="mt-8 text-center text-sm" style={{ color: '#4a4a4a' }}>
                        New aspirant?{' '}
                        <Link to="/signup" className="font-bold underline underline-offset-4 hover:text-amber-300 transition-colors" style={{ color: '#f5a623' }}>
                            Create Account
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
