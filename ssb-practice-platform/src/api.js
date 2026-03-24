import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

// ── Request interceptor — attach JWT token ───────────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('ssb_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response interceptor — handle session expiration ─────────────────────────
api.interceptors.response.use(
    (response) => {
        // If the response contains a new access token, save it with its expiry.
        // Covers login, signup, and google auth responses.
        const token = response.data?.access_token;
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.exp) {
                    localStorage.setItem('ssb_token_expiry', String(payload.exp * 1000));
                }
            } catch (_) { /* ignore malformed tokens */ }
        }
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('ssb_token');
            localStorage.removeItem('ssb_token_expiry');
            const path = window.location.pathname;
            if (path !== '/login' && path !== '/signup') {
                window.location.href = `/login?expired=1`;
            }
        }
        return Promise.reject(error);
    }
);

export default api;
