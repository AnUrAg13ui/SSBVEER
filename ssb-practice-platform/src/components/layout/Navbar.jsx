import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import {
    Menu, X, Shield, LayoutDashboard, LogOut, ChevronDown,
    Swords, Target, Brain, Mic2, Users, Trophy, BookOpen,
    Zap, BrainCircuit, Activity, Layers, MessageSquare, Flag, FileText,
    Sun, Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// ─── GTO Task types shown in the dropdown ─────────────────────────────────────
const GTO_TASKS = [
    {
        key: 'group',
        label: 'Group Obstacle Race',
        sub: 'Snake Race 3D simulation',
        icon: Users,
        color: '#f5a623',
        path: '/gto-simulator?type=group',
    },
    {
        key: 'individual',
        label: 'Individual Obstacles',
        sub: '10-obstacle 3D ground layout',
        icon: Layers,
        color: '#e8963d',
        path: '/gto-simulator?type=individual',
    },
    {
        key: 'command',
        label: 'Command Task',
        sub: 'Lead your team to success',
        icon: Flag,
        color: '#d9883a',
        path: '/gto-simulator?type=command',
    },
    {
        key: 'gpe',
        label: 'Group Planning Exercise',
        sub: 'Tactical decision-making under pressure',
        icon: BrainCircuit,
        color: '#c87a35',
        path: '/gto-simulator?type=gpe',
    },
    {
        key: 'lecturette',
        label: 'Lecturette',
        sub: '3-min talk on a random topic',
        icon: MessageSquare,
        color: '#b86c30',
        path: '/gto-simulator?type=lecturette',
    },
    {
        key: 'sdt',
        label: 'Self Description',
        sub: 'Describe yourself',
        icon: MessageSquare,
        color: '#b86c30',
        path: '/gto-simulator?type=sdt',
    },
];

// ─── Test sub-menu ────────────────────────────────────────────────────────────
const TEST_ITEMS = [
    { name: 'OIR – Intelligence Rating', path: '/tests?category=OIR', desc: 'Verbal & non-verbal reasoning', icon: Zap, color: '#f5a623' },
    { name: 'PPDT – Picture Perception', path: '/tests?category=PPDT', desc: '30-second image narration', icon: Target, color: '#e8963d' },
    { name: 'WAT – Word Association', path: '/tests?category=WAT', desc: '10-second timed word prompts', icon: Brain, color: '#d9883a' },
    { name: 'SRT – Situation Reaction', path: '/tests?category=SRT', desc: 'React to 60 real-life scenarios', icon: Activity, color: '#c87a35' },
];

const RESOURCE_ITEMS = [
    { name: 'Guides', path: '/oir-guide', desc: 'Step-by-step preparation guides', icon: BookOpen, color: '#f5a623' },
    { name: 'Community', path: '/forum', desc: 'Forum discussions & queries', icon: Users, color: '#e8963d' },
    { name: 'Leaderboard', path: '/leaderboard', desc: 'View globally ranked metrics', icon: Trophy, color: '#d9883a' },
];

// ─── Regular nav links ────────────────────────────────────────────────────────
const NAV_SIMPLE = [
    { name: 'Interview', path: '/interview', icon: Mic2 },
    { name: 'PIQ', path: '/piq', icon: FileText },
];

// ─── Dropdown wrapper ─────────────────────────────────────────────────────────
const NavDropdown = ({ trigger, children, open, onOpen, onClose }) => {
    const ref = useRef(null);
    const { theme } = useTheme();

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
            {trigger}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.16 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-50 rounded-2xl overflow-hidden"
                        style={{
                            background: theme === 'dark' ? '#0e0e0e' : '#ffffff',
                            border: theme === 'dark' ? '1px solid rgba(245,166,35,0.18)' : '1px solid rgba(245,166,35,0.25)',
                            boxShadow: theme === 'dark' ? '0 16px 50px rgba(0,0,0,0.75)' : '0 16px 30px rgba(0,0,0,0.08)',
                        }}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Tests dropdown content ───────────────────────────────────────────────────
const TestsDropdown = ({ onClose }) => (
    <div className="py-3 w-72">
        <p className="px-5 py-2 text-xs font-black uppercase tracking-widest" style={{ color: 'rgba(245,166,35,0.35)' }}>Psychological Tests</p>
        {TEST_ITEMS.map(item => (
            <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all group"
                style={{ color: '#9ca3af' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,166,35,0.06)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
            >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}18` }}>
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div>
                    <p className="text-sm font-bold leading-tight">{item.name.split('–')[0].trim()}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#4a4a4a' }}>{item.desc}</p>
                </div>
            </Link>
        ))}
    </div>
);

// ─── GTO dropdown content ─────────────────────────────────────────────────────
const GTODropdown = ({ onClose }) => (
    <div className="py-3 w-80">
        <div className="px-5 pb-3 mb-1" style={{ borderBottom: '1px solid rgba(245,166,35,0.1)' }}>
            <div className="flex items-center gap-2">
                <Swords className="w-4 h-4" style={{ color: '#f5a623' }} />
                <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#f5a623' }}>GTO Exercises</p>
            </div>
            <p className="text-xs mt-1" style={{ color: '#4a4a4a' }}>Select a Group Testing Officer task to simulate</p>
        </div>

        {GTO_TASKS.map((task, i) => (
            <Link
                key={task.key}
                to={task.path}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all group"
                style={{ color: '#9ca3af' }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = `${task.color}10`;
                    e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                }}
            >
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                    style={{ background: `${task.color}18`, border: `1px solid ${task.color}28` }}
                >
                    <task.icon className="w-4 h-4" style={{ color: task.color }} />
                </div>
                <div>
                    <p className="text-sm font-bold leading-tight">{task.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#4a4a4a' }}>{task.sub}</p>
                </div>
                <div className="ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: task.color }} />
                </div>
            </Link>
        ))}
    </div>
);
// ─── Resources dropdown content ───────────────────────────────────────────────
const ResourcesDropdown = ({ onClose }) => (
    <div className="py-3 w-72">
        <p className="px-5 py-2 text-xs font-black uppercase tracking-widest" style={{ color: 'rgba(245,166,35,0.35)' }}>Knowledge & Community</p>
        {RESOURCE_ITEMS.map(item => (
            <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all group"
                style={{ color: '#9ca3af' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,166,35,0.06)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
            >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}18` }}>
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div>
                    <p className="text-sm font-bold leading-tight">{item.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#4a4a4a' }}>{item.desc}</p>
                </div>
            </Link>
        ))}
    </div>
);

// ─── Main Navbar ──────────────────────────────────────────────────────────────
const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [mobileSection, setMobileSection] = useState(null);

    const { isAuth, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        setIsOpen(false);
        setMobileSection(null);
        setActiveDropdown(null);
    }, [location.pathname]);

    return (
        <nav
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
                transition: 'all 0.3s ease',
                background: scrolled ? (theme === 'dark' ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)') : 'transparent',
                backdropFilter: scrolled ? 'blur(18px)' : 'none',
                borderBottom: scrolled ? (theme === 'dark' ? '1px solid rgba(245,166,35,0.1)' : '1px solid rgba(0,0,0,0.05)') : '1px solid transparent',
                padding: scrolled ? '10px 0' : '18px 0',
            }}
        >
            <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between">

                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 group z-10 flex-shrink-0">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden"
                        style={{ border: '1px solid rgba(245,166,35,0.2)', boxShadow: '0 4px 14px rgba(245,166,35,0.15)' }}>
                        <img src="/logo.png" alt="VeerSSB" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xl font-black tracking-widest uppercase" style={{ fontFamily: 'Cinzel, serif', color: theme === 'dark' ? '#fff' : '#111' }}>
                        Veer<span style={{ color: '#f5a623' }}>SSB</span>
                    </span>
                </Link>

                {/* ── Desktop Nav ────────────────────────────── */}
                <div className="hidden lg:flex items-center gap-1">
                    <NavDropdown
                        open={activeDropdown === 'tests'}
                        onOpen={() => setActiveDropdown('tests')}
                        onClose={() => setActiveDropdown(null)}
                        trigger={
                            <button
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                                style={{ color: activeDropdown === 'tests' ? '#f5a623' : '#9ca3af' }}
                            >
                                <Target className="w-4 h-4" /> Tests <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'tests' ? 'rotate-180' : ''}`} />
                            </button>
                        }
                    >
                        <TestsDropdown onClose={() => setActiveDropdown(null)} />
                    </NavDropdown>

                    <NavDropdown
                        open={activeDropdown === 'gto'}
                        onOpen={() => setActiveDropdown('gto')}
                        onClose={() => setActiveDropdown(null)}
                        trigger={
                            <button
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                                style={{ color: activeDropdown === 'gto' ? '#f5a623' : '#9ca3af' }}
                            >
                                <Swords className="w-4 h-4" /> GTO <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'gto' ? 'rotate-180' : ''}`} />
                            </button>
                        }
                    >
                        <GTODropdown onClose={() => setActiveDropdown(null)} />
                    </NavDropdown>

                    <NavDropdown
                        open={activeDropdown === 'resources'}
                        onOpen={() => setActiveDropdown('resources')}
                        onClose={() => setActiveDropdown(null)}
                        trigger={
                            <button
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                                style={{ color: activeDropdown === 'resources' ? '#f5a623' : '#9ca3af' }}
                            >
                                <BookOpen className="w-4 h-4" /> Resources <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'resources' ? 'rotate-180' : ''}`} />
                            </button>
                        }
                    >
                        <ResourcesDropdown onClose={() => setActiveDropdown(null)} />
                    </NavDropdown>

                    {NAV_SIMPLE.map(item => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                                style={{ color: isActive ? '#f5a623' : '#9ca3af' }}
                            >
                                <item.icon className="w-4 h-4" /> {item.name}
                            </Link>
                        );
                    })}
                </div>

                {/* ── Auth Buttons ───────────────────────────── */}
                <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
                        style={{
                            background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                            border: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                            color: '#9ca3af'
                        }}
                        title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                    </button>

                    {isAuth ? (
                        <div className="flex items-center gap-3">
                            <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all" style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)', color: '#f5a623' }}>
                                <LayoutDashboard className="w-4 h-4" /> Dashboard
                            </Link>
                            <button onClick={logout} className="p-2.5 rounded-xl transition-all" style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)', color: '#6b6b6b' }}>
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link to="/login" className="text-sm font-bold transition-colors" style={{ color: theme === 'dark' ? '#9ca3af' : '#4b5563' }}>Sign In</Link>
                            <Link to="/signup" className="btn-gold px-6 py-2.5 rounded-xl font-bold text-sm text-black">Get Started</Link>
                        </div>
                    )}
                </div>

                <button className="lg:hidden p-2 rounded-xl transition-colors" style={{ color: '#9ca3af', background: 'rgba(255,255,255,0.05)' }} onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden overflow-hidden"
                        style={{ background: theme === 'dark' ? '#080808' : '#ffffff', borderBottom: theme === 'dark' ? '1px solid rgba(245,166,35,0.12)' : '1px solid rgba(0,0,0,0.06)' }}
                    >
                        <div className="px-6 py-6 flex flex-col gap-2 max-h-[75vh] overflow-y-auto">
                            <button onClick={() => setMobileSection(mobileSection === 'tests' ? null : 'tests')} className="flex items-center justify-between px-3 py-3 rounded-xl text-base font-bold w-full text-left" style={{ color: '#f5a623' }}>
                                <div className="flex items-center gap-3"><Target className="w-5 h-5" /> Tests</div>
                                <ChevronDown className={`w-4 h-4 transition-transform ${mobileSection === 'tests' ? 'rotate-180' : ''}`} />
                            </button>
                            {mobileSection === 'tests' && (
                                <div className="flex flex-col">
                                    {TEST_ITEMS.map(item => (
                                        <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-3 ml-4 rounded-xl text-sm font-semibold" style={{ color: '#9ca3af' }}>
                                            <item.icon className="w-4 h-4" style={{ color: item.color }} /> {item.name.split('–')[0].trim()}
                                        </Link>
                                    ))}
                                </div>
                            )}

                            <button onClick={() => setMobileSection(mobileSection === 'gto' ? null : 'gto')} className="flex items-center justify-between px-3 py-3 rounded-xl text-base font-bold w-full text-left" style={{ color: '#f5a623' }}>
                                <div className="flex items-center gap-3"><Swords className="w-5 h-5" /> GTO Tasks</div>
                                <ChevronDown className={`w-4 h-4 transition-transform ${mobileSection === 'gto' ? 'rotate-180' : ''}`} />
                            </button>
                            {mobileSection === 'gto' && (
                                <div className="flex flex-col">
                                    {GTO_TASKS.map(task => (
                                        <Link key={task.key} to={task.path} onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-3 ml-4 rounded-xl text-sm font-semibold" style={{ color: '#9ca3af' }}>
                                            <task.icon className="w-4 h-4" style={{ color: task.color }} /> {task.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                            <button onClick={() => setMobileSection(mobileSection === 'resources' ? null : 'resources')} className="flex items-center justify-between px-3 py-3 rounded-xl text-base font-bold w-full text-left" style={{ color: '#f5a623' }}>
                                <div className="flex items-center gap-3"><BookOpen className="w-5 h-5" /> Resources</div>
                                <ChevronDown className={`w-4 h-4 transition-transform ${mobileSection === 'resources' ? 'rotate-180' : ''}`} />
                            </button>
                            {mobileSection === 'resources' && (
                                <div className="flex flex-col">
                                    {RESOURCE_ITEMS.map(item => (
                                        <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-3 ml-4 rounded-xl text-sm font-semibold" style={{ color: '#9ca3af' }}>
                                            <item.icon className="w-4 h-4" style={{ color: item.color }} /> {item.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                            {NAV_SIMPLE.map(item => (
                                <Link key={item.name} to={item.path} onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-base font-bold" style={{ color: location.pathname === item.path ? '#f5a623' : '#9ca3af' }}>
                                    <item.icon className="w-5 h-5" /> {item.name}
                                </Link>
                            ))}

                            <div className="mt-4 pt-4 flex flex-col gap-3" style={{ borderTop: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}>
                                <div className="flex items-center justify-between px-3 py-2">
                                    <span className="text-sm font-semibold" style={{ color: theme === 'dark' ? '#9ca3af' : '#4b5563' }}>Appearance</span>
                                    <button onClick={toggleTheme} className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: theme === 'dark' ? '#f5a623' : '#111' }}>
                                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                        <span className="text-xs font-bold">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                                    </button>
                                </div>

                                {isAuth ? (
                                    <div className="flex flex-col gap-3">
                                        <Link to="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm text-center justify-center" style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)', color: '#f5a623' }}>
                                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                                        </Link>
                                        <button onClick={logout} className="w-full py-3.5 rounded-xl font-bold text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#ef4444' }}>Sign Out</button>
                                    </div>
                                ) : (
                                    <Link to="/signup" onClick={() => setIsOpen(false)} className="btn-gold block w-full py-3.5 rounded-xl font-bold text-sm text-center text-black">Get Started →</Link>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
