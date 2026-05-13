import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, UserPlus, AlertCircle, Eye, EyeOff, ArrowLeft, Shield, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';

const InputField = ({ label, icon: Icon, type = 'text', name, value, onChange, placeholder, extra }) => (
    <div>
        <label className="block text-xs font-black tracking-widest uppercase mb-2" style={{ color: '#5a5a5a' }}>{label}</label>
        <div className="relative">
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#4a4a4a' }} />
            <input
                type={type}
                name={name}
                required
                className="w-full py-3.5 pl-11 pr-4 rounded-xl text-white placeholder:text-gray-700 text-sm font-medium focus:outline-none transition-all"
                style={{ background: '#111', border: '1px solid rgba(245,166,35,0.15)', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = 'rgba(245,166,35,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(245,166,35,0.15)'}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />
            {extra}
        </div>
    </div>
);

const Signup = () => {
    const [formData, setFormData] = useState({
        username: '', email: '', full_name: '', password: '', confirm_password: '', institute_code: ''
    });
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signup, googleLogin, googleLoginCode } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const passStrength = () => {
        const p = formData.password;
        if (!p) return 0;
        let s = 0;
        if (p.length > 7) s += 25;
        if (/[A-Z]/.test(p)) s += 25;
        if (/[0-9]/.test(p)) s += 25;
        if (/[^A-Za-z0-9]/.test(p)) s += 25;
        return s;
    };

    const strengthColor = () => {
        const s = passStrength();
        if (s >= 75) return '#22c55e';
        if (s >= 50) return '#eab308';
        return '#ef4444';
    };
    const strengthLabel = () => {
        const s = passStrength();
        if (s >= 75) return 'Strong';
        if (s >= 50) return 'Medium';
        if (s > 0) return 'Weak';
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Client-side validation
        if (!formData.username.trim() || formData.username.length < 3) {
            setError('Username must be at least 3 characters.'); return;
        }
        if (formData.email && !/^[^@]+@[^@]+\.[^@]+$/.test(formData.email)) {
            setError('Please enter a valid email address.'); return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters.'); return;
        }
        if (passStrength() < 25) {
            setError('Please choose a stronger password.'); return;
        }
        if (formData.password !== formData.confirm_password) {
            setError('Passwords do not match.'); return;
        }

        setLoading(true);
        try {
            await signup({ 
                username: formData.username.trim(), 
                email: formData.email, 
                full_name: formData.full_name, 
                password: formData.password,
                institute_code: formData.institute_code ? formData.institute_code.trim().toUpperCase() : null
            });
            toast('Account created! Welcome to SSBPrep 🎖️', 'success', 3000);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = useGoogleLogin({
        onSuccess: async (codeResponse) => {
            try {
                setLoading(true);
                await googleLoginCode(codeResponse.code);
                toast('Welcome to SSBPrep! Redirecting...', 'success', 2000);
                navigate('/dashboard');
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

            {/* Left Panel */}
            <div className="hidden lg:flex w-2/5 relative overflow-hidden items-center justify-center p-16" style={{ background: 'linear-gradient(160deg, #0a0800 0%, #000 70%)' }}>
                <div className="absolute inset-0 dot-pattern opacity-80" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)' }} />

                <div className="relative z-10 text-center max-w-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9 }} className="floating">
                        <div className="w-20 h-20 rounded-2xl mx-auto mb-8 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f5a623, #c8841a)', boxShadow: '0 16px 50px rgba(245,166,35,0.28)' }}>
                            <ShieldCheck className="w-10 h-10 text-black" />
                        </div>
                        <h2 className="text-4xl font-black text-white mb-4" style={{ fontFamily: 'Cinzel, serif', lineHeight: 1.2 }}>
                            JOIN THE<br /><span className="gold-gradient-text">MISSION</span>
                        </h2>
                        <p className="text-sm leading-relaxed" style={{ color: '#5a5a5a' }}>
                            Join 10,000+ aspirants sharpening their skills to clear the SSB selection board.
                        </p>

                        <div className="mt-10 space-y-3 text-left">
                            {['AI-powered evaluation for all modules', '6 complete SSB test categories', 'Real-time performance analytics'].map(f => (
                                <div key={f} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)' }}>
                                        <div className="w-2 h-2 rounded-full" style={{ background: '#f5a623' }} />
                                    </div>
                                    <span className="text-sm" style={{ color: '#7a7a7a' }}>{f}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,166,35,0.3), transparent)' }} />
            </div>

            {/* Right Form Panel */}
            <div className="w-full lg:w-3/5 flex items-center justify-center p-8 overflow-y-auto" style={{ background: '#000' }}>
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md py-12"
                >
                    <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold mb-10 transition-colors hover:text-amber-400" style={{ color: '#5a5a5a' }}>
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Link>

                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-3">
                            <Shield className="w-4 h-4" style={{ color: '#f5a623' }} />
                            <span className="text-xs font-black tracking-widest uppercase" style={{ color: '#f5a623' }}>SSBPrep Platform</span>
                        </div>
                        <h1 className="text-3xl font-black text-white mb-1.5" style={{ fontFamily: 'Cinzel, serif' }}>Create Account</h1>
                        <p className="text-sm" style={{ color: '#5a5a5a' }}>Start your journey to the academy today.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-bold" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                            <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <InputField label="Full Name" icon={User} name="full_name" value={formData.full_name} onChange={handleChange} placeholder="e.g. Rahul Sharma" />

                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Username" icon={User} name="username" value={formData.username} onChange={handleChange} placeholder="coolaspirant" />
                            <InputField label="Email" icon={Mail} type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@email.com" />
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-black tracking-widest uppercase" style={{ color: '#5a5a5a' }}>Password</label>
                                {formData.password && <span className="text-xs font-black" style={{ color: strengthColor() }}>{strengthLabel()}</span>}
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#4a4a4a' }} />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    name="password"
                                    required
                                    className="w-full py-3.5 pl-11 pr-12 rounded-xl text-white placeholder:text-gray-700 text-sm font-medium focus:outline-none"
                                    style={{ background: '#111', border: '1px solid rgba(245,166,35,0.15)', transition: 'border-color 0.2s' }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(245,166,35,0.5)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(245,166,35,0.15)'}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: '#4a4a4a' }}>
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {/* Strength bar */}
                            <div className="h-1 w-full rounded-full mt-2.5 overflow-hidden" style={{ background: '#1a1a1a' }}>
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${passStrength()}%`, background: `linear-gradient(90deg, ${strengthColor()}, ${strengthColor()}88)` }} />
                            </div>
                        </div>

                        <InputField label="Confirm Password" icon={Lock} type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} placeholder="••••••••" />
                        <InputField label="Institute Code (Optional)" icon={ShieldCheck} name="institute_code" value={formData.institute_code} onChange={handleChange} placeholder="e.g. DEF123" />


                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 mt-3 rounded-xl font-black text-base text-black flex items-center justify-center gap-3 transition-all active:scale-97"
                            style={{ background: loading ? 'rgba(245,166,35,0.5)' : '#f5a623', fontFamily: 'Cinzel, serif', boxShadow: '0 8px 24px rgba(245,166,35,0.25)', cursor: loading ? 'not-allowed' : 'pointer' }}
                        >
                        {loading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><UserPlus className="w-5 h-5" /> Create Account</>}
                        </button>
                    </form>

                    <div className="my-6 flex items-center gap-4 text-center">
                        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
                        <span className="text-xs font-bold" style={{ color: '#4a4a4a' }}>OR</span>
                        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    </div>

                    <div className="flex justify-center w-full">
                        <button
                            type="button"
                            onClick={() => handleGoogleSignup()}
                            disabled={loading}
                            className="w-full py-4 rounded-xl font-bold text-sm bg-white text-black flex items-center justify-center gap-3 transition-colors hover:bg-gray-100 disabled:opacity-50"
                        >
                            <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-5 h-5" />
                            Sign up with Google
                        </button>
                    </div>

                    <p className="mt-8 text-center text-sm" style={{ color: '#4a4a4a' }}>
                        Already enlisted?{' '}
                        <Link to="/login" className="font-bold underline underline-offset-4 hover:text-amber-300 transition-colors" style={{ color: '#f5a623' }}>Sign In</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Signup;
