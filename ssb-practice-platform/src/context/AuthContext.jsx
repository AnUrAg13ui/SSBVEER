import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuth, setIsAuth] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('ssb_token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await api.get('/auth/me');
                setUser(res.data);
                setIsAuth(true);
            } catch (err) {
                console.error("Auth check failed", err);
                localStorage.removeItem('ssb_token');
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (username, password) => {
        const res = await api.post('/auth/login/json', { username, password });
        localStorage.setItem('ssb_token', res.data.access_token);
        const userRes = await api.get('/auth/me');
        setUser(userRes.data);
        setIsAuth(true);
        return res.data;
    };

    const signup = async (data) => {
        const res = await api.post('/auth/signup', data);
        localStorage.setItem('ssb_token', res.data.access_token);
        const userRes = await api.get('/auth/me');
        setUser(userRes.data);
        setIsAuth(true);
        return res.data;
    };

    const googleLogin = async (idToken) => {
        const res = await api.post('/auth/google', { token: idToken });
        localStorage.setItem('ssb_token', res.data.access_token);
        const userRes = await api.get('/auth/me');
        setUser(userRes.data);
        setIsAuth(true);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('ssb_token');
        setUser(null);
        setIsAuth(false);
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ user, isAuth, loading, login, signup, googleLogin, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
