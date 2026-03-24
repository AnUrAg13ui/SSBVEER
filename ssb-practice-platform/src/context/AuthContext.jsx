import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../api';
import SessionWarningModal from '../components/SessionWarningModal';

const AuthContext = createContext();

// ── Session config ──────────────────────────────────────────────────────────
// These must match (or be less than) the backend JWT expiry.
const INACTIVITY_LIMIT_MS  = 30 * 60 * 1000;   // 30 minutes of inactivity → logout
const WARNING_BEFORE_MS    = 2  * 60 * 1000;    // Show warning 2 minutes before logout
const ACTIVITY_EVENTS      = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'click'];

// Keys stored in localStorage
const TOKEN_KEY  = 'ssb_token';
const EXPIRY_KEY = 'ssb_token_expiry';   // ISO timestamp of JWT exp claim

// ── Helpers ──────────────────────────────────────────────────────────────────
function decodeTokenExpiry(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp ? payload.exp * 1000 : null; // convert to ms
    } catch {
        return null;
    }
}

function saveToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
    const expMs = decodeTokenExpiry(token);
    if (expMs) localStorage.setItem(EXPIRY_KEY, String(expMs));
}

function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
}

// ─────────────────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
    const [user,    setUser]    = useState(null);
    const [isAuth,  setIsAuth]  = useState(false);
    const [loading, setLoading] = useState(true);

    // Session warning state
    const [showWarning,  setShowWarning]  = useState(false);
    const [secondsLeft,  setSecondsLeft]  = useState(120);

    // Refs so timers always see fresh values without re-registering listeners
    const inactivityTimerRef = useRef(null);
    const warningTimerRef    = useRef(null);
    const countdownRef       = useRef(null);
    const isAuthRef          = useRef(isAuth);
    isAuthRef.current = isAuth;

    // ── logout ────────────────────────────────────────────────────────────────
    const logout = useCallback(async (reason = 'manual') => {
        clearAllTimers();
        setShowWarning(false);
        // Attempt server-side token invalidation (fire-and-forget)
        try { await api.post('/auth/logout'); } catch (_) { /* ignore */ }
        clearSession();
        setUser(null);
        setIsAuth(false);
        const dest = reason === 'expired'
            ? '/login?expired=1'
            : reason === 'inactive'
            ? '/login?inactive=1'
            : '/';
        window.location.href = dest;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── clear all timers ─────────────────────────────────────────────────────
    function clearAllTimers() {
        clearTimeout(inactivityTimerRef.current);
        clearTimeout(warningTimerRef.current);
        clearInterval(countdownRef.current);
    }

    // ── start the warning countdown ───────────────────────────────────────────
    const startWarningCountdown = useCallback(() => {
        setSecondsLeft(Math.floor(WARNING_BEFORE_MS / 1000));
        setShowWarning(true);
        clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current);
                    logout('inactive');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [logout]);

    // ── reset inactivity timer (also resets on "Stay logged in") ─────────────
    const resetInactivityTimer = useCallback(() => {
        if (!isAuthRef.current) return;
        clearAllTimers();
        setShowWarning(false);

        // --- guard: also check if the JWT itself has expired ---
        const tokenExpiryMs = Number(localStorage.getItem(EXPIRY_KEY));
        if (tokenExpiryMs && Date.now() >= tokenExpiryMs) {
            logout('expired');
            return;
        }

        // Inactivity window shrinks if the JWT expires before INACTIVITY_LIMIT_MS
        const timeUntilJwtExpiry = tokenExpiryMs ? tokenExpiryMs - Date.now() : Infinity;
        const inactivityMs = Math.min(INACTIVITY_LIMIT_MS, timeUntilJwtExpiry);
        const warningMs    = Math.min(inactivityMs - WARNING_BEFORE_MS, inactivityMs - 10_000);

        if (warningMs <= 0) {
            // Less than WARNING_BEFORE_MS left — show warning immediately
            startWarningCountdown();
            return;
        }

        inactivityTimerRef.current = setTimeout(() => {
            logout('inactive');
        }, inactivityMs);

        warningTimerRef.current = setTimeout(() => {
            startWarningCountdown();
        }, warningMs);
    }, [logout, startWarningCountdown]);

    // ── attach / detach activity listeners ───────────────────────────────────
    useEffect(() => {
        if (!isAuth) return;

        const handler = () => {
            if (!showWarning) resetInactivityTimer();
            // If warning is visible, don't reset — force user to click "Stay in"
        };

        ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, handler, { passive: true }));
        resetInactivityTimer(); // kick off immediately after login

        return () => {
            ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, handler, { passive: true }));
            clearAllTimers();
        };
    }, [isAuth, showWarning, resetInactivityTimer]);

    // ── initial auth check ────────────────────────────────────────────────────
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem(TOKEN_KEY);
            if (!token) { setLoading(false); return; }

            // Proactively reject expired tokens before hitting the network
            const tokenExpiryMs = Number(localStorage.getItem(EXPIRY_KEY));
            if (tokenExpiryMs && Date.now() >= tokenExpiryMs) {
                clearSession();
                setLoading(false);
                return;
            }

            try {
                const res = await api.get('/auth/me');
                setUser(res.data);
                setIsAuth(true);
            } catch (err) {
                console.error('Auth check failed', err);
                clearSession();
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    // ── login ─────────────────────────────────────────────────────────────────
    const login = async (username, password) => {
        const res = await api.post('/auth/login/json', { username, password });
        saveToken(res.data.access_token);
        const userRes = await api.get('/auth/me');
        setUser(userRes.data);
        setIsAuth(true);
        return res.data;
    };

    // ── signup ────────────────────────────────────────────────────────────────
    const signup = async (data) => {
        const res = await api.post('/auth/signup', data);
        saveToken(res.data.access_token);
        const userRes = await api.get('/auth/me');
        setUser(userRes.data);
        setIsAuth(true);
        return res.data;
    };

    // ── google login ──────────────────────────────────────────────────────────
    const googleLogin = async (idToken) => {
        const res = await api.post('/auth/google', { token: idToken });
        saveToken(res.data.access_token);
        const userRes = await api.get('/auth/me');
        setUser(userRes.data);
        setIsAuth(true);
        return res.data;
    };

    // ── "Stay logged in" handler ──────────────────────────────────────────────
    const handleStayIn = useCallback(async () => {
        setShowWarning(false);
        clearAllTimers();
        // Refresh token by re-hitting /auth/me (extends nothing server-side,
        // but resets the *client-side* inactivity clock).
        // If you implement token refresh in the future, call it here.
        try {
            const res = await api.get('/auth/me');
            setUser(res.data);
            resetInactivityTimer();
        } catch {
            logout('expired');
        }
    }, [logout, resetInactivityTimer]);

    return (
        <AuthContext.Provider value={{ user, isAuth, loading, login, signup, googleLogin, logout }}>
            {children}
            {/* Session expiry warning modal — rendered at context level so it's always on top */}
            <SessionWarningModal
                visible={showWarning}
                secondsLeft={secondsLeft}
                onStayIn={handleStayIn}
                onLogout={() => logout('manual')}
            />
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
